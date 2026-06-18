import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { useThemePreference } from '@/contexts/theme-preference';
import notificationService, { NotificationItem } from '@/services/notificationService';

const CHAT_NOTIFICATION_TITLES = new Set([
  'Tin nhắn mới từ khách hàng',
  'Tin nhắn mới từ gara',
]);

const isChatNotification = (item: NotificationItem) => {
  const title = (item.title || '').trim();
  const content = (item.content || '').trim().toLowerCase();

  return CHAT_NOTIFICATION_TITLES.has(title) || title.toLowerCase().includes('tin nhắn') || content.includes('tin nhắn');
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [rawMessage, setRawMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [deletingNotificationId, setDeletingNotificationId] = useState<number | null>(null);

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
    unreadSoft: isDark ? '#12362F' : '#ECFDF5',
    readSoft: isDark ? '#111827' : '#F1F5F9',
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

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

  const handleMarkAsRead = async (item: NotificationItem, showError = true) => {
    if (item.isRead) return;

    try {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === item.id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error: any) {
      console.error('Mark notification read failed:', error);
      if (!showError) {
        return;
      }

      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể cập nhật trạng thái thông báo.';
      Alert.alert('Lỗi', String(serverMessage));
    }
  };

  const handleOpenNotification = (item: NotificationItem) => {
    const bookingId = Number(item.bookingId ?? item.booking_id ?? item.bookingID);
    const hasBookingTarget = Number.isFinite(bookingId) && bookingId > 0;

    if (!item.isRead && !item.read) {
      void handleMarkAsRead(item, false);
    }

    if (hasBookingTarget && isChatNotification(item)) {
      router.push(`/chat/${bookingId}` as any);
    } else if (hasBookingTarget) {
      router.push({
        pathname: '/booking-detail',
        params: { id: String(bookingId) },
      });
    } else if (item.title === 'Gara đã phản hồi đánh giá của bạn') {
      Alert.alert(
        'Chưa có liên kết đơn hàng',
        'Thông báo này chưa có mã booking. Hãy thử tạo phản hồi đánh giá mới sau khi backend đã được khởi động lại.'
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAllRead) return;

    try {
      setIsMarkingAllRead(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    } catch (error: any) {
      console.error('Mark all notifications read failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể đánh dấu tất cả thông báo là đã đọc.';
      Alert.alert('Lỗi', String(serverMessage));
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleDeleteNotification = (item: NotificationItem) => {
    if (deletingNotificationId !== null) {
      return;
    }

    Alert.alert('Xoá thông báo', 'Bạn có chắc muốn xoá thông báo này không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingNotificationId(item.id);
            await notificationService.deleteNotification(item.id);
            setNotifications((prev) => prev.filter((notification) => notification.id !== item.id));
            Alert.alert('Thành công', 'Đã xoá thông báo thành công');
          } catch (error: any) {
            console.error('Delete notification failed:', error);
            const serverMessage =
              error?.response?.data?.message ||
              error?.response?.data ||
              'Không thể xoá thông báo lúc này.';
            Alert.alert('Xoá thất bại', String(serverMessage));
          } finally {
            setDeletingNotificationId(null);
          }
        },
      },
    ]);
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
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>Danh sách thông báo</Text>
                <Text style={[styles.sectionMeta, { color: palette.subtext }]}>
                  {unreadCount} chưa đọc / {notifications.length} thông báo
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.markAllButton,
                  {
                    backgroundColor: unreadCount > 0 ? palette.action : palette.readSoft,
                  },
                ]}
                activeOpacity={0.85}
                disabled={unreadCount === 0 || isMarkingAllRead}
                onPress={handleMarkAllAsRead}>
                {isMarkingAllRead ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.markAllButtonText,
                      { color: unreadCount > 0 ? '#FFFFFF' : palette.subtext },
                    ]}>
                    Đọc tất cả
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            {notifications.map((item, index) => {
              const isLast = index === notifications.length - 1;
              const isRead = item.isRead ?? item.read ?? false;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.notificationRow,
                    {
                      borderBottomColor: palette.border,
                      backgroundColor: isRead ? 'transparent' : palette.unreadSoft,
                    },
                    isLast && styles.notificationRowLast,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => {
                    handleOpenNotification(item);
                  }}>
                  <View style={styles.notificationIconColumn}>
                    <View
                      style={[
                        styles.notificationIconWrap,
                        { backgroundColor: isRead ? palette.readSoft : '#CCFBF1' },
                      ]}>
                      <Ionicons
                        name={isRead ? 'mail-open-outline' : 'notifications-outline'}
                        size={20}
                        color={isRead ? '#94A3B8' : '#0F766E'}
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        deletingNotificationId !== null && styles.deleteButtonDisabled,
                      ]}
                      activeOpacity={0.8}
                      disabled={deletingNotificationId !== null}
                      onPress={(event) => {
                        event.stopPropagation();
                        handleDeleteNotification(item);
                      }}>
                      {deletingNotificationId === item.id ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <Ionicons name="trash-outline" size={17} color="#DC2626" />
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.notificationTextWrap}>
                    <View style={styles.notificationTitleRow}>
                      <Text style={[styles.notificationTitle, { color: palette.text }]}>
                        {item.title || 'Thông báo từ Smart Garage'}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: isRead ? palette.readSoft : '#CCFBF1' },
                        ]}>
                        <Text
                          style={[
                            styles.statusPillText,
                            { color: isRead ? palette.subtext : '#0F766E' },
                          ]}>
                          {isRead ? 'Đã đọc' : 'Chưa đọc'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.notificationContent, { color: palette.subtext }]}>
                      {item.content || 'Nội dung thông báo sẽ hiển thị ở đây.'}
                    </Text>
                  </View>
                  <View style={styles.notificationActions}>
                    {!isRead ? <View style={styles.unreadDot} /> : null}
                    {item.bookingId || item.booking_id || item.bookingID ? (
                      <Ionicons name="chevron-forward" size={18} color={palette.subtext} />
                    ) : null}
                  </View>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionMeta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  markAllButton: {
    minWidth: 92,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  markAllButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  notificationRow: {
    marginTop: 16,
    padding: 12,
    borderRadius: 18,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationRowLast: {
    borderBottomWidth: 0,
  },
  notificationIconColumn: {
    alignItems: 'center',
    gap: 8,
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
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  statusPill: {
    flexShrink: 0,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 11,
    lineHeight: 13,
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
  },
  notificationActions: {
    alignItems: 'center',
    paddingTop: 4,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.45,
  },
});
