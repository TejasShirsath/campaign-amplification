import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Modal, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronRight, X } from 'lucide-react-native';
import { Button } from '../../components/common/button';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';
import { formatINR } from '../../components/campaign/campaign-cards';
import { Config } from '../../constants/config';

export default function ContributionSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contributionId?: string;
    campaignId?: string;
    amount?: string;
    amountINR?: string;
    campaignTitle?: string;
    coverImageUrl?: string;
  }>();

  const [receiptVisible, setReceiptVisible] = useState(false);

  const amountNumber = parseInt(params.amount || '25', 10);
  const inrAmount = params.amountINR ? parseInt(params.amountINR, 10) : Config.CURRENCY.toINR(amountNumber);
  const adSpendUSD = Math.round(amountNumber * 0.95);
  const platformFeeUSD = Math.round(amountNumber * 0.05);
  const adSpendINR = Math.round(inrAmount * 0.95);
  const platformFeeINR = Math.round(inrAmount * 0.05);

  const title = params.campaignTitle || 'Clean Rivers Brighter Futures';
  const coverUrl =
    params.coverImageUrl ||
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400';

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Large Emerald Checkmark Circle matching reference */}
        <View style={styles.checkmarkCircle}>
          <Check size={40} color="#FFFFFF" strokeWidth={3} />
        </View>

        <Text style={styles.heading}>Contribution Successful!</Text>
        <Text style={styles.subheading}>
          Thank you for creating a ripple. Small contributions power wide, lasting impact.
        </Text>

        {/* Campaign Summary Card matching reference */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (params.campaignId) {
              router.replace(`/campaign/${params.campaignId}` as any);
            }
          }}
          style={styles.campaignCard}
        >
          <Image source={{ uri: coverUrl }} style={styles.thumbnail} />
          <View style={styles.cardDetails}>
            <Text numberOfLines={1} style={styles.campaignTitle}>
              {title}
            </Text>
            <Text style={styles.metaText}>
              ${amountNumber.toLocaleString('en-US')} (₹{inrAmount.toLocaleString('en-IN')}) · {dateStr}
            </Text>
          </View>
          <ChevronRight size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Buttons matching reference */}
      <View style={styles.actions}>
        <Button
          title="View Receipt"
          variant="secondary"
          onPress={() => setReceiptVisible(true)}
          style={styles.receiptBtn}
        />
        <Button
          title="Back to Campaign"
          onPress={() => {
            if (params.campaignId) {
              router.replace(`/campaign/${params.campaignId}` as any);
            } else {
              router.replace('/(tabs)' as any);
            }
          }}
          style={styles.backBtn}
        />
      </View>

      {/* Receipt Modal */}
      <Modal
        visible={receiptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReceiptVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contribution Receipt</Text>
              <TouchableOpacity onPress={() => setReceiptVisible(false)}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Transaction ID</Text>
              <Text style={styles.receiptValue}>
                {params.contributionId ? params.contributionId.substring(0, 18) + '...' : 'TXN-' + Date.now()}
              </Text>
            </View>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Date & Time</Text>
              <Text style={styles.receiptValue}>{new Date().toLocaleString()}</Text>
            </View>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Campaign</Text>
              <Text style={styles.receiptValue} numberOfLines={1}>
                {title}
              </Text>
            </View>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Exchange Rate</Text>
              <Text style={styles.receiptValue}>1 USD ≈ ₹86.00 INR</Text>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Ad Distribution (95%)</Text>
              <Text style={styles.receiptValue}>${adSpendUSD} (≈ ₹{adSpendINR.toLocaleString('en-IN')})</Text>
            </View>
            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Platform Fee (5%)</Text>
              <Text style={styles.receiptValue}>${platformFeeUSD} (≈ ₹{platformFeeINR.toLocaleString('en-IN')})</Text>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptLine}>
              <Text style={styles.totalLabel}>Total Processed</Text>
              <Text style={styles.totalValue}>₹{inrAmount.toLocaleString('en-IN')} (${amountNumber} USD)</Text>
            </View>

            <Button
              title="Close"
              variant="secondary"
              onPress={() => setReceiptVisible(false)}
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.xl,
    paddingTop: 100,
    paddingBottom: Spacing.xxl,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.elevated,
  },
  heading: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subheading: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    marginBottom: Spacing.xxl,
  },
  campaignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    ...Shadows.card,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceAlt,
  },
  cardDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  campaignTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  metaText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actions: {
    gap: Spacing.sm,
  },
  receiptBtn: {
    width: '100%',
  },
  backBtn: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  receiptLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  receiptValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  totalValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extrabold,
    color: Colors.primaryDark,
  },
});
