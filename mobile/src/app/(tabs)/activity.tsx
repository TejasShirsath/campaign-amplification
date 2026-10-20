import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BellRing, CheckCheck, LogIn, Bell } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/screen-container';
import { HeaderBar } from '../../components/common/header-bar';
import { Button } from '../../components/common/button';
import { SkeletonNotificationItem } from '../../components/common/skeleton';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';
import { NotificationItem, activityApi } from '../../api/activity';
import { useAuth } from '../../context/auth-context';

export default function ActivityScreen() {
  const router = useRouter();
  const { isAuthenticated, promptAuth, isAuthenticating } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const list = await activityApi.getNotifications(1, 30);
      setNotifications(list);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    try {
      await activityApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await activityApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silent
    }
  };

  // ─── GUEST STATE ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <HeaderBar title="Activity" />
        <View style={styles.guestState}>
          <View style={styles.guestIconCircle}>
            <Bell size={36} color={Colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Stay in the Loop</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to receive updates when your campaigns are approved, funding milestones are achieved, or contributions are received.
          </Text>
          <Button
            title="Sign In to View Activity"
            icon={<LogIn size={18} color="#FFFFFF" />}
            loading={isAuthenticating}
            onPress={() =>
              promptAuth({
                title: 'Activity Notifications',
                reason: 'Sign in to access your personalized updates and campaign milestones.',
              })
            }
            style={{ width: '100%', maxWidth: 300, marginTop: Spacing.md }}
          />
        </View>
      </ScreenContainer>
    );
  }

  // ─── AUTHENTICATED STATE ─────────────────────────────────────────────────────
  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <HeaderBar title="Activity" />

      {/* Header meta row */}
      <View style={styles.metaRow}>
        <Text style={styles.recentLabel}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <CheckCheck size={14} color={Colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.notifSection}>
          <SkeletonNotificationItem />
          <SkeletonNotificationItem />
          <SkeletonNotificationItem />
          <SkeletonNotificationItem />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <BellRing size={32} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptySubtitle}>
            When campaigns you back or create achieve milestones, receive donations, or update distribution status, you'll see updates here.
          </Text>
        </View>
      ) : (
        <View style={styles.notifSection}>
          {notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              activeOpacity={0.8}
              onPress={() => markSingleRead(n.id)}
              style={[styles.activityRow, !n.isRead && styles.unreadActivityRow]}
            >
              <View style={styles.iconCircle}>
                <BellRing size={18} color={Colors.primary} />
              </View>
              <View style={styles.activityBody}>
                <Text style={styles.activityTitle}>{n.title}</Text>
                <Text style={styles.activityMessage} numberOfLines={2}>
                  {n.message}
                </Text>
                <Text style={styles.activityTime}>
                  {new Date(n.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {!n.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  guestState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  guestIconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  guestTitle: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.xs,
    maxWidth: 320,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  recentLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  notifSection: {
    marginBottom: Spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  unreadActivityRow: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityBody: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    lineHeight: 19,
  },
  activityMessage: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    maxWidth: 300,
    lineHeight: 20,
  },
});
