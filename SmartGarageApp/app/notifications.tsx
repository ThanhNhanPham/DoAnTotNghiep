import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { useThemePreference } from '@/contexts/theme-preference';
import notificationService, { NotificationItem } from '@/services/notificationService';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [rawMessage, setRawMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isDark = colorScheme === 'dark';
  const palette = {
    screen: isDark ? '#020617' : '#F0FDFA',
    heroStart: isDark ? '#0F172A' : '#0F766E',
    heroEnd: isDark ? '#134E4A' : '#115E59',
    card: isDark ? '#0F172A' : '#FFFFFF',
    border: isDark ? '#1E293B' : '#CCFBF1',
    text: isDark ? '#E2E8F0' : '#0F172A',
    subtext: isDark ? '#94A3B8' : '#475569',
    action: isDark ? '#14B8A6' : '#0F766E',
  };

  const loadNotifications = useCallback(async (refreshing = false) => {
    try {
      if (refreshing) {
        setIsRefreshing(true);
      }

      const data = await notificationService.getMyNotifications();

      if (Array.isArray(data)) {
        setNotifications(data);
        setRawMessage('');
      } else {
        setNotifications([]);
        setRawMessage(String(data || 'Chưa có dữ liệu thông báo.'));
      }
    } catch (error: any) {
      console.error('Load notifications failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể tải thông báo lúc này.';
      Alert.alert('Lỗi', String(serverMessage));
    } finally {
      setIsLoading(false);
      if (refreshing) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleMarkAsRead = async (item: NotificationItem) => {
    try {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === item.id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error: any) {
      console.error('Mark notification read failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể cập nhật trạng thái thông báo.';
      Alert.alert('Lỗi', String(serverMessage));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.screen }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: palette.action }]}
          onPress={() => router.back()}
          activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadNotifications(true)}
            tintColor={isDark ? '#E2E8F0' : '#0F766E'}
          />
        }>
        <LinearGradient colors={[palette.heroStart, palette.heroEnd]} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Thông báo</Text>
          <Text style={styles.heroText}>
            Theo dõi các cập nhật mới nhất liên quan đến xe và lịch hẹn của bạn.
          </Text>
        </LinearGradient>

        {isLoading ? (
          <View style={[styles.card, styles.centerCard, { backgroundColor: palette.card }]}>
            <ActivityIndicator color={palette.action} />
          </View>
        ) : rawMessage ? (
          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Thông báo từ hệ thống</Text>
            <Text style={[styles.messageText, { color: palette.subtext }]}>{rawMessage}</Text>
          </View>
        ) : notifications.length > 0 ? (
          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Danh sách thông báo</Text>
            {notifications.map((item, index) => {
              const isLast = index === notifications.length - 1;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.notificationRow,
                    { borderBottomColor: palette.border },
                    isLast && styles.notificationRowLast,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => {
                    if (!item.isRead) {
                      handleMarkAsRead(item);
                    }
                  }}>
                  <View
                    style={[
                      styles.notificationIconWrap,
                      { backgroundColor: item.isRead ? (isDark ? '#111827' : '#F1F5F9') : '#ECFDF5' },
                    ]}>
                    <Ionicons
                      name={item.isRead ? 'mail-open-outline' : 'notifications-outline'}
                      size={20}
                      color={item.isRead ? '#94A3B8' : '#0F766E'}
                    />
                  </View>
                  <View style={styles.notificationTextWrap}>
                    <Text style={[styles.notificationTitle, { color: palette.text }]}>
                      {item.title || 'Thông báo từ Smart Garage'}
                    </Text>
                    <Text style={[styles.notificationContent, { color: palette.subtext }]}>
                      {item.content || 'Nội dung thông báo sẽ hiển thị ở đây.'}
                    </Text>
                  </View>
                  {!item.isRead ? <View style={styles.unreadDot} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Chưa có thông báo</Text>
            <Text style={[styles.messageText, { color: palette.subtext }]}>
              Khi có cập nhật mới, thông báo sẽ xuất hiện tại đây.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 18,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.82)',
  },
  card: {
    borderRadius: 24,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  messageText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
  },
  notificationRow: {
    marginTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  notificationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTextWrap: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  notificationContent: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#14B8A6',
    marginTop: 6,
  },
});
