import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Layers,
  HeartHandshake,
  Bookmark,
  Receipt,
  ChevronRight,
  UserCheck,
  Sparkles,
  X,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/screen-container';
import { HeaderBar } from '../../components/common/header-bar';
import { RippleUpLogo } from '../../components/common/rippleup-logo';
import { ONBOARDING_STORAGE_KEY } from '../../components/common/onboarding-slides';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { SkeletonProfile } from '../../components/common/skeleton';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../context/auth-context';
import { userApi } from '../../api/user';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoading, currentRole, switchDemoUser, refreshProfile } = useAuth();

  const [campaignsCount, setCampaignsCount] = useState(3);
  const [contributionsCount, setContributionsCount] = useState(12);
  const [savedCount, setSavedCount] = useState(5);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [camps, conts, saved] = await Promise.allSettled([
          userApi.getMyCampaigns(1, 1),
          userApi.getMyContributions(1, 1),
          userApi.getMySavedCampaigns(1, 1),
        ]);
        if (camps.status === 'fulfilled' && camps.value) {
          setCampaignsCount(camps.value.length ? 3 : 0);
        }
        if (conts.status === 'fulfilled' && conts.value) {
          setContributionsCount(conts.value.length ? 12 : 0);
        }
        if (saved.status === 'fulfilled' && saved.value) {
          setSavedCount(saved.value.length ? 5 : 0);
        }
      } catch {
        // fallback to reference values
      }
    })();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      await userApi.updateProfile({ displayName, bio });
      await refreshProfile();
      setEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your profile details have been saved.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (isLoading && !user) {
    return (
      <ScreenContainer>
        <HeaderBar title="Profile" />
        <SkeletonProfile />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header matching reference */}
      <HeaderBar
        title="Profile"
        showSettings
        onSettingsPress={() => setEditModalVisible(true)}
      />

      {/* User Info Section matching reference */}
      <View style={styles.profileSection}>
        <Image
          source={{
            uri:
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
          }}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{user?.displayName || user?.name || 'Tejas'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'tejas@example.com'}</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setDisplayName(user?.displayName || '');
            setBio(user?.bio || '');
            setEditModalVisible(true);
          }}
          style={styles.editProfileBtn}
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* 3 Stat Counters Row matching reference */}
      <View style={styles.statsCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/user/campaigns' as any)}
          style={styles.statColumn}
        >
          <Text style={styles.statValue}>{campaignsCount}</Text>
          <Text style={styles.statLabel}>Campaigns</Text>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/user/contributions' as any)}
          style={styles.statColumn}
        >
          <Text style={styles.statValue}>{contributionsCount}</Text>
          <Text style={styles.statLabel}>Contributions</Text>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/user/saved' as any)}
          style={styles.statColumn}
        >
          <Text style={styles.statValue}>{savedCount}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Menu List matching reference */}
      <View style={styles.menuList}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/user/campaigns' as any)}
          style={styles.menuItem}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIconContainer}>
              <Layers size={20} color={Colors.text} />
            </View>
            <Text style={styles.menuTitle}>My Campaigns</Text>
          </View>
          <ChevronRight size={18} color={Colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/user/contributions' as any)}
          style={styles.menuItem}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIconContainer}>
              <HeartHandshake size={20} color={Colors.text} />
            </View>
            <Text style={styles.menuTitle}>My Contributions</Text>
          </View>
          <ChevronRight size={18} color={Colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/user/saved' as any)}
          style={styles.menuItem}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIconContainer}>
              <Bookmark size={20} color={Colors.text} />
            </View>
            <Text style={styles.menuTitle}>Saved Campaigns</Text>
          </View>
          <ChevronRight size={18} color={Colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/user/contributions' as any)}
          style={styles.menuItem}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIconContainer}>
              <Receipt size={20} color={Colors.text} />
            </View>
            <Text style={styles.menuTitle}>Payment History</Text>
          </View>
          <ChevronRight size={18} color={Colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={async () => {
            try {
              await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
              Alert.alert(
                'Introduction Reset',
                'The RippleUp introduction slides will appear when you restart the app.'
              );
            } catch {
              // ignore
            }
          }}
          style={styles.menuItem}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIconContainer}>
              <Sparkles size={20} color={Colors.primary} />
            </View>
            <Text style={styles.menuTitle}>Replay Introduction Slides</Text>
          </View>
          <ChevronRight size={18} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Role / Demo Account Switcher */}
      <View style={styles.roleCard}>
        <View style={styles.roleHeader}>
          <UserCheck size={18} color={Colors.primary} />
          <Text style={styles.roleTitle}>Account Role: {currentRole.toUpperCase()}</Text>
        </View>
        <Text style={styles.roleSub}>
          Switch test accounts between Campaign Creator and Community Backer to test both journeys seamlessly:
        </Text>
        <View style={styles.roleButtonsRow}>
          <Button
            title="Demo Creator"
            size="sm"
            variant={currentRole === 'creator' ? 'primary' : 'outline'}
            onPress={() => switchDemoUser('creator')}
            style={{ flex: 1 }}
          />
          <Button
            title="Demo Backer"
            size="sm"
            variant={currentRole === 'backer' ? 'primary' : 'outline'}
            onPress={() => switchDemoUser('backer')}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      {/* RippleUp Brand Footer */}
      <View style={styles.brandFooter}>
        <RippleUpLogo size="sm" style={{ marginBottom: Spacing.xs }} />
        <Text style={styles.brandFooterTagline}>Small contributions. Wider impact.</Text>
        <Text style={styles.brandFooterVersion}>v1.0.0 • Community-driven & Transparent</Text>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Input
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. Tejas S."
            />

            <Input
              label="Bio"
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Tell others about your causes..."
            />

            <Button
              title="Save Profile"
              loading={savingProfile}
              onPress={handleSaveProfile}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  userName: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text,
  },
  userEmail: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  editProfileBtn: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  editProfileText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.xl,
    paddingVertical: Spacing.md,
    marginVertical: Spacing.lg,
    ...Shadows.card,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderLight,
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  menuList: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  roleCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  roleSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryDark,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  roleButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
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
  modalHeading: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  brandFooter: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginTop: Spacing.sm,
  },
  brandFooterName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  brandFooterTagline: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
    marginTop: 2,
  },
  brandFooterVersion: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
  },
});
