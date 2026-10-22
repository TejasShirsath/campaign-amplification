import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

import {
  Layers,
  HeartHandshake,
  Bookmark,
  Receipt,
  ChevronRight,
  Sparkles,
  X,
  LogIn,
  LogOut,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/screen-container';
import { HeaderBar } from '../../components/common/header-bar';
import { RippleUpLogo } from '../../components/common/rippleup-logo';
import { UserAvatar } from '../../components/common/user-avatar';

import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { SkeletonProfile } from '../../components/common/skeleton';
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../context/auth-context';
import { userApi } from '../../api/user';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isAuthenticating, signIn, signUp, logout, refreshProfile } = useAuth();

  const [stats, setStats] = useState({
    campaignsCount: 0,
    contributionsCount: 0,
    savedCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setStatsLoading(true);
      const data = await userApi.getMyStats();
      setStats({
        campaignsCount: data.campaignsCount ?? 0,
        contributionsCount: data.contributionsCount ?? 0,
        savedCount: data.savedCount ?? 0,
      });
    } catch (err) {
      console.warn('Failed to fetch user stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      setDisplayName(user?.displayName || user?.name || '');
      setBio(user?.bio || '');
    }
  }, [isAuthenticated, user, fetchStats]);

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

  const handleLogout = async () => {
    const executeLogout = async () => {
      try {
        setEditModalVisible(false);
        await logout();
      } catch (err) {
        console.warn('Logout execution failed:', err);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out of RippleUp?');
      if (confirmed) {
        await executeLogout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out of RippleUp?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: executeLogout,
        },
      ]);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <HeaderBar title="Profile" />
        <SkeletonProfile />
      </ScreenContainer>
    );
  }

  // ─── GUEST STATE ─────────────────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <ScreenContainer>
        <HeaderBar title="Profile" />

        <View style={styles.guestContainer}>
          <UserAvatar size="xl" style={styles.guestAvatar} />

          <Text style={styles.guestTitle}>Welcome to RippleUp</Text>
          <Text style={styles.guestSubtitle}>
            Sign in or create an account to launch campaigns, bookmark causes, and track your contribution history.
          </Text>

          <View style={styles.guestActionButtons}>
            <Button
              title="Sign In with Auth0"
              icon={<LogIn size={18} color="#FFFFFF" />}
              loading={isAuthenticating}
              onPress={async () => {
                try {
                  await signIn();
                } catch {
                  // silent
                }
              }}
              style={{ width: '100%' }}
            />
          </View>

          {/* Benefits Cards */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsHeading}>Why Join RippleUp?</Text>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Sparkles size={18} color={Colors.primary} />
              </View>
              <View style={styles.benefitTextGroup}>
                <Text style={styles.benefitTitle}>Create Campaigns</Text>
                <Text style={styles.benefitDesc}>
                  Amplify verified civic, health, and environmental messages through targeted digital distribution.
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Bookmark size={18} color={Colors.primary} />
              </View>
              <View style={styles.benefitTextGroup}>
                <Text style={styles.benefitTitle}>Save Causes</Text>
                <Text style={styles.benefitDesc}>
                  Keep track of impactful initiatives and receive real-time updates as milestones are reached.
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Receipt size={18} color={Colors.primary} />
              </View>
              <View style={styles.benefitTextGroup}>
                <Text style={styles.benefitTitle}>Contribution History</Text>
                <Text style={styles.benefitDesc}>
                  Review your contributions, access distribution reports, and inspect exact programmatic ad spend.
                </Text>
              </View>
            </View>
          </View>

          {/* RippleUp Brand Footer */}
          <View style={styles.brandFooter}>
            <RippleUpLogo size="sm" style={{ marginBottom: Spacing.xs }} />
            <Text style={styles.brandFooterTagline}>Small contributions. Wider impact.</Text>
            <Text style={styles.brandFooterVersion}>v1.0.0 • Community-driven & Transparent</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ─── AUTHENTICATED STATE ─────────────────────────────────────────────────────
  return (
    <ScreenContainer>
      <HeaderBar
        title="Profile"
        showSettings
        onSettingsPress={() => setEditModalVisible(true)}
      />

      {/* User Info Section */}
      <View style={styles.profileSection}>
        <UserAvatar
          avatarUrl={user.avatarUrl}
          displayName={user.displayName}
          name={user.name}
          email={user.email}
          size="xl"
          style={styles.avatar}
        />
        <Text style={styles.userName}>{user.displayName || user.name || 'RippleUp User'}</Text>
        <Text style={styles.userEmail}>{user.email || ''}</Text>

        {user.bio ? <Text style={styles.userBio}>{user.bio}</Text> : null}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setDisplayName(user.displayName || user.name || '');
            setBio(user.bio || '');
            setEditModalVisible(true);
          }}
          style={styles.editProfileBtn}
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* 3 Stat Counters Row - Fully Dynamic from Backend */}
      <View style={styles.statsCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/user/campaigns' as any)}
          style={styles.statColumn}
        >
          <Text style={styles.statValue}>{stats.campaignsCount}</Text>
          <Text style={styles.statLabel}>Campaigns</Text>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/user/contributions' as any)}
          style={styles.statColumn}
        >
          <Text style={styles.statValue}>{stats.contributionsCount}</Text>
          <Text style={styles.statLabel}>Contributions</Text>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/user/saved' as any)}
          style={styles.statColumn}
        >
          <Text style={styles.statValue}>{stats.savedCount}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Menu List */}
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
          onPress={() => setEditModalVisible(true)}
          style={styles.menuItem}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIconContainer}>
              <ShieldCheck size={20} color={Colors.text} />
            </View>
            <Text style={styles.menuTitle}>Account Settings</Text>
          </View>
          <ChevronRight size={18} color={Colors.textLight} />
        </TouchableOpacity>


        {/* Log Out inside the Menu list / Settings */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLogout}
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIconContainer}>
              <LogOut size={20} color="#DC2626" />
            </View>
            <Text style={[styles.menuTitle, { color: '#DC2626', fontWeight: Typography.weights.semibold }]}>
              Log Out
            </Text>
          </View>
          <ChevronRight size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* Brand Footer */}
      <View style={styles.brandFooter}>
        <RippleUpLogo size="sm" style={{ marginBottom: Spacing.xs }} />
        <Text style={styles.brandFooterTagline}>Small contributions. Wider impact.</Text>
        <Text style={styles.brandFooterVersion}>v1.0.0 • Verified Account</Text>
      </View>

      {/* Settings & Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Settings & Profile</Text>
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
              title="Save Changes"
              loading={savingProfile}
              onPress={handleSaveProfile}
              style={{ marginTop: Spacing.sm }}
            />

            {/* Logout button inside Settings Box */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogout}
              style={styles.settingsLogoutBtn}
            >
              <LogOut size={18} color="#DC2626" />
              <Text style={styles.settingsLogoutText}>Log Out of RippleUp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  guestContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  guestAvatar: {
    marginBottom: Spacing.md,
  },
  guestTitle: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    maxWidth: 320,
  },
  guestActionButtons: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  benefitsCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  benefitsHeading: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  benefitTextGroup: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  benefitDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  avatar: {
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
  },
  userBio: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    lineHeight: 18,
  },
  editProfileBtn: {
    marginTop: Spacing.md,
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
  settingsLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: Radii.lg,
    marginTop: Spacing.lg,
  },
  settingsLogoutText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: '#DC2626',
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
