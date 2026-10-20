import React, { useEffect, useState } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Compass, Plus, Bell, User } from 'lucide-react-native';
import { Colors, Typography } from '../../constants/theme';
import { activityApi } from '../../api/activity';
import { useAuth } from '../../context/auth-context';

const TABS_CONFIG = [
  {
    name: 'index',
    label: 'Home',
    icon: (color: string) => <Home size={22} color={color} />,
  },
  {
    name: 'explore',
    label: 'Explore',
    icon: (color: string) => <Compass size={22} color={color} />,
  },
  {
    name: 'create',
    label: 'Create',
    icon: () => null,
  },
  {
    name: 'activity',
    label: 'Activity',
    icon: (color: string) => <Bell size={22} color={color} />,
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: (color: string) => <User size={22} color={color} />,
  },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, promptAuth } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const res = await activityApi.getUnreadCount();
        setUnreadCount(res.unreadCount);
      } catch {
        // silent catch
      }
    })();
  }, []);

  const bottomPadding = Math.max(
    insets.bottom,
    Platform.OS === 'ios' ? 24 : 10
  );

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomPadding }]}>
      {TABS_CONFIG.map((tab, idx) => {
        const activeRouteName = state?.routes?.[state?.index]?.name;
        const isFocused = activeRouteName
          ? activeRouteName === tab.name
          : tab.name === 'index'
          ? pathname === '/' || pathname === '/(tabs)' || pathname.endsWith('/index')
          : pathname.includes(tab.name);

        const isCreate = tab.name === 'create';
        const color = isFocused ? Colors.primary : Colors.textMuted;

        const handlePress = () => {
          if (isCreate) {
            if (!isAuthenticated) {
              promptAuth({
                title: 'Create a Campaign',
                reason: 'Sign in to create and publish campaigns on RippleUp.',
                onSuccess: () => router.push('/create/1' as any),
              });
              return;
            }
            router.push('/create/1' as any);
            return;
          }

          try {
            if (navigation && typeof navigation.emit === 'function') {
              const route = state?.routes?.find((r: any) => r.name === tab.name) || state?.routes?.[idx];
              const event = navigation.emit({
                type: 'tabPress',
                target: route?.key || tab.name,
                canPreventDefault: true,
              });

              if (event?.defaultPrevented) {
                return;
              }
            }
          } catch {
            // ignore emit errors
          }

          if (tab.name === 'index') {
            router.navigate('/(tabs)');
          } else {
            router.navigate(`/(tabs)/${tab.name}` as any);
          }
        };

        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={0.8}
            onPress={handlePress}
            style={styles.tabItem}
          >
            <View style={styles.iconContainer}>
              {isCreate ? (
                <View style={styles.createButton}>
                  <Plus size={22} color="#FFFFFF" strokeWidth={2.8} />
                </View>
              ) : (
                <View style={styles.iconWrapper}>
                  {tab.icon(color)}
                  {tab.name === 'activity' && unreadCount > 0 && (
                    <View style={styles.badgeDot} />
                  )}
                </View>
              )}
            </View>

            <Text
              numberOfLines={1}
              style={[
                styles.tabLabel,
                isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="create" options={{ title: 'Create' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconContainer: {
    height: 24,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    position: 'absolute',
    top: -26,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 7,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: Typography.weights.medium,
    marginTop: 4,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  tabLabelInactive: {
    color: Colors.textMuted,
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
