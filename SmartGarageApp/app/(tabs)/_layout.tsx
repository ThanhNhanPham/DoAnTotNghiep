import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useUnreadChatCount } from '@/hooks/use-unread-chat-count';
import { useThemePreference
 } from '@/contexts/theme-preference';

export default function TabLayout() {
  const { colorScheme } = useThemePreference();
  const unreadChatCount = useUnreadChatCount();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopColor: colorScheme === 'dark' ? '#1E293B' : '#E2E8F0',
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Xe của tôi',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="car.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bubble.left.and.bubble.right.fill" color={color} />
          ),
          tabBarBadge: unreadChatCount > 0 ? (unreadChatCount > 99 ? '99+' : unreadChatCount) : undefined,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'AI tư vấn',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
