import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Config } from '../constants/config';
import { contributionsApi } from '../api/contributions';

export interface RazorpayCheckoutOptions {
  keyId: string;
  orderId: string;
  contributionId?: string;
  amountPaise: number;
  currency?: string;
  campaignTitle: string;
  usdAmount?: number;
  userName?: string | null;
  userEmail?: string | null;
  userContact?: string | null;
}

export interface RazorpayPaymentResult {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

/**
 * Dynamically loads the official Razorpay Checkout SDK on web
 */
function loadRazorpayWebScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(false);
    }
    if ((window as any).Razorpay) {
      return resolve(true);
    }
    const existing = document.getElementById('razorpay-checkout-script');
    if (existing) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay Checkout in test mode across Web and Native platforms
 */
export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions
): Promise<RazorpayPaymentResult> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const loaded = await loadRazorpayWebScript();
    if (!loaded || !(window as any).Razorpay) {
      throw new Error('Razorpay Checkout SDK could not be loaded.');
    }

    return new Promise((resolve, reject) => {
      const isRealRazorpayOrder =
        Boolean(options.orderId) &&
        options.orderId.startsWith('order_') &&
        !options.orderId.startsWith('order_demo_');

      const rzpOptions: any = {
        key: options.keyId || Config.RAZORPAY.keyId,
        amount: options.amountPaise,
        currency: options.currency || 'INR',
        name: 'RippleUp',
        description: options.usdAmount
          ? `Contribution of $${options.usdAmount} to ${options.campaignTitle}`
          : `Contribution to ${options.campaignTitle}`,
        prefill: {
          name: options.userName || '',
          email: options.userEmail || '',
          contact: options.userContact || '',
        },
        theme: {
          color: '#249770',
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment was cancelled by the user.'));
          },
          confirm_close: true,
        },
        handler: (response: any) => {
          if (!response.razorpay_payment_id) {
            reject(new Error('Invalid payment response from Razorpay.'));
            return;
          }
          resolve({
            razorpayOrderId: response.razorpay_order_id || options.orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature:
              response.razorpay_signature ||
              (options.orderId.startsWith('order_demo_') ? 'simulated_signature_verified' : ''),
          });
        },
      };

      // Only attach order_id if it's a real Razorpay order created via Orders API
      if (isRealRazorpayOrder) {
        rzpOptions.order_id = options.orderId;
      }

      try {
        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.on('payment.failed', (resp: any) => {
          console.warn('[Razorpay Payment Failed]', resp?.error);
          reject(new Error(resp?.error?.description || resp?.error?.reason || 'Payment failed'));
        });
        rzp.open();
      } catch (err: any) {
        console.error('[Razorpay Open Error]', err);
        reject(new Error(err?.message || 'Failed to open Razorpay modal'));
      }
    });
  } else {
    // Native Mobile (iOS/Android): Open hosted checkout in WebBrowser
    let base = Config.API_BASE_URL.replace(/\/+$/, '');
    if (!base.endsWith('/api/v1')) {
      base = `${base}/api/v1`;
    }
    const redirectUrl = 'rippleup://payment-callback';
    const checkoutUrl = `${base}/payments/razorpay/checkout/${options.orderId}?redirect_url=${encodeURIComponent(redirectUrl)}`;

    let authResult: WebBrowser.WebBrowserAuthSessionResult;
    try {
      authResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, redirectUrl);
    } catch (e: any) {
      console.warn('[Razorpay WebBrowser Open Error]', e);
      authResult = { type: WebBrowser.WebBrowserResultType.CANCEL };
    }

    let orderId: string | null = null;
    let paymentId: string | null = null;
    let signature: string | null = null;
    let statusParam: string | null = null;

    if (authResult.type === 'success' && authResult.url) {
      try {
        const urlObj = new URL(authResult.url);
        orderId = urlObj.searchParams.get('razorpay_order_id');
        paymentId = urlObj.searchParams.get('razorpay_payment_id');
        signature = urlObj.searchParams.get('razorpay_signature');
        statusParam = urlObj.searchParams.get('status');
      } catch {}
    }

    if (statusParam === 'cancelled') {
      throw new Error('Payment was cancelled');
    }

    // On Android, Custom Tabs can dismiss when opening the custom return scheme.
    // Check with the backend if the contribution was already captured!
    if (!paymentId && options.contributionId) {
      await new Promise((r) => setTimeout(r, 600));
      try {
        const contribution = await contributionsApi.getById(options.contributionId);
        if (contribution && contribution.status === 'CONFIRMED') {
          return {
            razorpayOrderId: options.orderId,
            razorpayPaymentId: contribution.id,
            razorpaySignature: 'verified_by_backend',
          };
        }
      } catch (checkErr) {
        console.warn('[Contribution Status Check Error]', checkErr);
      }
    }

    if (authResult.type !== 'success' && !paymentId) {
      throw new Error('Payment was cancelled');
    }

    if (!paymentId) {
      throw new Error('Payment completion was not confirmed.');
    }

    return {
      razorpayOrderId: orderId || options.orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature || 'simulated_signature_verified',
    };
  }
}
