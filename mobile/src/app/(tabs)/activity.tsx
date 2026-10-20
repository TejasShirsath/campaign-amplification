import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Heart, DollarSign, BellRing, Eye, CheckCheck } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/screen-container';
import { HeaderBar } from '../../components/common/header-bar';
import { SkeletonNotificationItem } from '../../components/common/skeleton';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';
import { NotificationItem, activityApi } from '../../api/activity';

const TABS = ['All', 'Contributions', 'Updates', 'Saves'] as const;

export default function ActivityScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<typeof TABS[number]>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const list = await activityApi.getNotifications(1, 30);
      setNotifications(list);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Static reference activities combined with real notification data
  const defaultActivities = [
    {
      id: 'mock-1',
      type: 'contribution',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      text: 'You contributed $50\nto Clean Rivers Brighter Futures',
      time: '2 hours ago',
      category: 'Contributions',
    },
    {
      id: 'mock-2',
      type: 'update',
      avatarUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=100',
      text: 'New update from\nDigital Skills for Rural Youth',
      time: '5 hours ago',
      category: 'Updates',
    },
    {
      id: 'mock-3',
      type: 'view',
      icon: 'view',
      text: 'Your campaign was viewed 128 times',
      time: '3 days ago',
      category: 'Updates',
    },
    {
      id: 'mock-4',
      type: 'save',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      text: 'You saved a campaign\nMental Health Awareness',
      time: '4 days ago',
      category: 'Saves',
    },
  ];

  const filteredMock = defaultActivities.filter((item) => {
    if (selectedTab === 'All') return true;
    return item.category === selectedTab;
  });

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <HeaderBar
        title="Activity"
        rightAction={
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
            <Search size={20} color={Colors.text} />
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs matching reference */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroll}
      >
        {TABS.map((tab) => {
          const isSelected = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setSelectedTab(tab)}
              style={[
                styles.tabPill,
                isSelected ? styles.tabPillActive : styles.tabPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.tabPillText,
                  isSelected ? styles.tabPillTextActive : styles.tabPillTextInactive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Mark all as read button */}
      <View style={styles.metaRow}>
        <Text style={styles.recentLabel}>Recent</Text>
        <TouchableOpacity
          onPress={markAllRead}
          style={styles.markAllBtn}
        >
          <CheckCheck size={14} color={Colors.primary} />
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.notifSection}>
          <SkeletonNotificationItem />
          <SkeletonNotificationItem />
          <SkeletonNotificationItem />
          <SkeletonNotificationItem />
          <SkeletonNotificationItem />
        </View>
      ) : (
        <>
          {/* Live backend notifications */}
          {notifications.length > 0 && selectedTab === 'All' && (
            <View style={styles.notifSection}>
              {notifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  activeOpacity={0.8}
                  onPress={() => markSingleRead(n.id)}
                  style={[
                    styles.activityRow,
                    !n.isRead && styles.unreadActivityRow,
                  ]}
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
                      {new Date(n.createdAt).toLocaleTimeString([], {
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

          {/* Styled timeline list matching reference image */}
          <View style={styles.activitiesList}>
            {filteredMock.map((item) => (
              <View key={item.id} style={styles.activityRow}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.iconCircle}>
                    <Eye size={18} color={Colors.textMuted} />
                  </View>
                )}
                <View style={styles.activityBody}>
                  <Text style={styles.activityTitle}>{item.text}</Text>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    padding: Spacing.xs,
  },
  tabScroll: {
    paddingVertical: Spacing.sm,
    gap: Spacing.xs + 4,
    marginBottom: Spacing.sm,
  },
  tabPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabPillInactive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  tabPillText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.semibold,
  },
  tabPillTextInactive: {
    color: Colors.textSecondary,
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
  activitiesList: {
    marginTop: Spacing.xs,
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    marginRight: Spacing.md,
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
});
