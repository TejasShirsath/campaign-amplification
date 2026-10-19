import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck, Info, Megaphone } from 'lucide-react-native';
import { HeaderBar } from '../../components/common/header-bar';
import { CampaignCardMini } from '../../components/campaign/campaign-cards';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { SkeletonContribute } from '../../components/common/skeleton';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';
import { CampaignDetail, campaignsApi } from '../../api/campaigns';
import { contributionsApi } from '../../api/contributions';

const PRESET_AMOUNTS = [250, 500, 1000, 2500, 5000];

export default function ContributeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await campaignsApi.getById(id);
        setCampaign(data);
      } catch (err) {
        console.warn('Failed to load campaign for contribution:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const activeAmount = isCustom ? parseInt(customInput.replace(/[^0-9]/g, '') || '0', 10) : selectedAmount;

  // 95% ad spend, 5% fee calculation
  const adSpend = Math.round(activeAmount * 0.95);
  const platformFee = Math.round(activeAmount * 0.05);

  // Amplification reach estimate (~25 people per rupee)
  const estReach = activeAmount * 25;

  const handlePayment = async () => {
    if (!id || !campaign) return;
    if (activeAmount < 50) {
      Alert.alert('Invalid Amount', 'Minimum contribution is ₹50.');
      return;
    }
    if (!agreed) {
      Alert.alert('Acknowledgment Required', 'Please confirm you understand contributions fund digital distribution.');
      return;
    }

    try {
      setSubmitting(true);
      const amountPaise = activeAmount * 100;

      // 1. Create contribution order on backend
      const orderRes = await contributionsApi.createOrder(id, amountPaise, false);

      // 2. Process payment (Backend demo mode handles instant verification)
      const verifyRes = await contributionsApi.verifyPayment({
        razorpayOrderId: orderRes.orderId,
        razorpayPaymentId: `pay_demo_${Date.now()}`,
        razorpaySignature: 'simulated_signature_verified',
      });

      // 3. Navigate to Success Confirmation screen
      router.replace({
        pathname: '/campaign/success' as any,
        params: {
          contributionId: orderRes.contributionId,
          campaignId: id,
          amount: activeAmount,
          campaignTitle: campaign.title,
          coverImageUrl: campaign.coverImageUrl,
        },
      });
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message || 'Unable to process payment at this time.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !campaign) {
    return (
      <View style={styles.container}>
        <HeaderBar
          title="Contribute"
          subtitle="Secure payment via Razorpay"
          showBack
          showBell
          showAvatar
          style={styles.header}
        />
        <SkeletonContribute />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header matching reference */}
      <HeaderBar
        title="Contribute"
        subtitle="Secure payment via Razorpay"
        showBack
        showBell
        showAvatar
        style={styles.header}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Campaign Mini Summary Card matching reference */}
        <CampaignCardMini
          title={campaign.title}
          subtitle={`by ${campaign.creatorName || campaign.creator?.displayName || 'GreenEarth Collective'}`}
          imageUrl={campaign.coverImageUrl}
        />

        {/* Amplification Reach Estimate Card matching reference */}
        <View style={styles.reachCard}>
          <Text style={styles.reachCardHeading}>Amplification reach estimate</Text>
          <View style={styles.reachCardRow}>
            <View style={styles.reachIconBox}>
              <Megaphone size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reachNumber}>
                ~ {estReach.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.reachLabel}>people may see this message</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowInfo(!showInfo)}
              style={styles.infoBtn}
            >
              <Info size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {showInfo && (
            <Text style={styles.reachInfoTooltip}>
              Estimated impressions based on current programmatic digital ad auction rates across social media. Actual reach varies depending on engagement and targeting.
            </Text>
          )}
        </View>

        {/* Contribution Amount Selection Grid matching reference */}
        <Text style={styles.sectionLabel}>Select contribution amount</Text>
        <View style={styles.presetGrid}>
          {PRESET_AMOUNTS.map((amt) => {
            const isSelected = !isCustom && selectedAmount === amt;
            return (
              <TouchableOpacity
                key={amt}
                activeOpacity={0.8}
                onPress={() => {
                  setIsCustom(false);
                  setSelectedAmount(amt);
                }}
                style={[
                  styles.presetBtn,
                  isSelected && styles.presetBtnSelected,
                ]}
              >
                <Text
                  style={[
                    styles.presetText,
                    isSelected && styles.presetTextSelected,
                  ]}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Custom option */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setIsCustom(true);
            }}
            style={[
              styles.presetBtn,
              isCustom && styles.presetBtnSelected,
            ]}
          >
            <Text
              style={[
                styles.presetText,
                isCustom && styles.presetTextSelected,
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>

        {isCustom && (
          <Input
            placeholder="Enter custom amount in ₹"
            keyboardType="numeric"
            value={customInput}
            onChangeText={setCustomInput}
            containerStyle={{ marginTop: Spacing.sm }}
          />
        )}

        {/* Fee Breakdown Text matching reference */}
        <View style={styles.breakdownBox}>
          <Text style={styles.breakdownText}>
            95% goes to digital ad distribution (₹{adSpend.toLocaleString('en-IN')})
          </Text>
          <Text style={styles.breakdownTextSub}>
            5% verification & platform fee (₹{platformFee.toLocaleString('en-IN')})
          </Text>
        </View>

        {/* Legal Non-Donation Disclaimer Checkbox matching reference */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setAgreed(!agreed)}
          style={styles.disclaimerRow}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.disclaimerText}>
            I understand this is not a donation to a cause. It funds digital distribution and message amplification.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Fixed Bottom CTA matching reference */}
      <View style={styles.fixedBottomBar}>
        <Button
          title="Continue to Payment"
          showArrow
          loading={submitting}
          onPress={handlePayment}
          style={styles.payBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 110,
  },
  reachCard: {
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  reachCardHeading: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryDark,
    marginBottom: Spacing.sm,
  },
  reachCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reachIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  reachNumber: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text,
  },
  reachLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoBtn: {
    padding: Spacing.xs,
  },
  reachInfoTooltip: {
    fontSize: 11,
    color: Colors.primaryDark,
    lineHeight: 16,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.primaryBorder,
  },
  sectionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  presetBtn: {
    width: '31%',
    height: 52,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnSelected: {
    backgroundColor: Colors.darkPrimary,
    borderColor: Colors.darkPrimary,
  },
  presetText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  presetTextSelected: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.bold,
  },
  breakdownBox: {
    marginVertical: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  breakdownText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  breakdownTextSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  disclaimerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  payBtn: {
    width: '100%',
  },
});
