import React, { useCallback, useMemo, useState } from 'react';
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

import bookingService, { BookingResponse } from '@/services/bookingService';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  ARRIVED: 'Đã tiếp nhận',
  IN_PROGRESS: 'Đang sửa',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#B45309' },
  CONFIRMED: { bg: '#DBEAFE', text: '#2563EB' },
  ARRIVED: { bg: '#E0E7FF', text: '#4F46E5' },
  IN_PROGRESS: { bg: '#CCFBF1', text: '#0F766E' },
  COMPLETED: { bg: '#DCFCE7', text: '#15803D' },
  CANCELLED: { bg: '#FEE2E2', text: '#DC2626' },
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  MOMO: 'MoMo',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Chờ thanh toán',
  SUCCESS: 'Đã thanh toán',
  FAILED: 'Thanh toán lỗi',
  CANCELLED: 'Đã hủy',
};

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    Number(value || 0)
  );

const parseDate = (value?: string | null) => {
  if (!value) return null;

  const localDateTimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);

  if (localDateTimeMatch) {
    const [, year, month, day, hour, minute, second = '0'] = localDateTimeMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatDateTime = (value?: string | null) => {
  const date = parseDate(value);

  if (!date) return 'Chưa có thời gian';

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatTime = (value?: string | null) => {
  const date = parseDate(value);

  if (!date) return '--:--';

  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export default function BookingHistoryScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = useMemo(() => {
    const activeStatuses = ['PENDING', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'];
    const activeCount = bookings.filter((booking) => activeStatuses.includes(booking.status || '')).length;
    const completedCount = bookings.filter((booking) => booking.status === 'COMPLETED').length;

    return { activeCount, completedCount };
  }, [bookings]);

  const loadBookings = useCallback(async (refreshing = false) => {
    try {
      if (refreshing) {
        setIsRefreshing(true);
      }

      const data = await bookingService.getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Load booking history failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể tải lịch sử đặt lịch lúc này.';
      Alert.alert('Lỗi', String(serverMessage));
      setBookings([]);
    } finally {
      setIsLoading(false);
      if (refreshing) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
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
            onRefresh={() => loadBookings(true)}
            tintColor="#F59E0B"
          />
        }>
        <LinearGradient colors={['#F59E0B', '#EA580C']} style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Booking History</Text>
          <Text style={styles.heroTitle}>Lịch sử đặt lịch</Text>
          <Text style={styles.heroText}>
            Theo dõi các lịch hẹn sửa chữa, trạng thái xử lý và chi phí dự kiến của bạn.
          </Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Tổng lịch hẹn</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.activeCount}</Text>
            <Text style={styles.statLabel}>Đang xử lý</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.completedCount}</Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={[styles.card, styles.centerCard]}>
            <ActivityIndicator color="#F59E0B" />
            <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
          </View>
        ) : bookings.length > 0 ? (
          <View style={styles.listWrap}>
            {bookings.map((booking) => {
              const status = booking.status || 'PENDING';
              const statusColor = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
              const serviceNames = booking.serviceNames || [];
              const partNames = booking.partNames || [];

              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  activeOpacity={0.88}
                  onPress={() =>
                    router.push({
                      pathname: '/booking-detail',
                      params: { id: String(booking.id) },
                    })
                  }>
                  <View style={styles.cardHeader}>
                    <View style={styles.bookingTitleWrap}>
                      <Text style={styles.bookingCode}>Booking #{booking.id}</Text>
                      <Text style={styles.bookingVehicle}>
                        {booking.vehicleName || 'Xe của bạn'} · {booking.licensePlate || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusColor.bg }]}>
                      <Text style={[styles.statusPillText, { color: statusColor.text }]}>
                        {STATUS_LABELS[status] || status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={18} color="#F59E0B" />
                    <Text style={styles.infoText}>
                      {formatDateTime(booking.arrivalSlotStart || booking.bookingTime)}
                      {booking.arrivalSlotEnd ? ` - ${formatTime(booking.arrivalSlotEnd)}` : ''}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="business-outline" size={18} color="#F59E0B" />
                    <Text style={styles.infoText}>{booking.branchName || 'Chưa có chi nhánh'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={18} color="#F59E0B" />
                    <Text style={styles.infoText}>{booking.mechanicName || 'Chưa có thợ phụ trách'}</Text>
                  </View>

                  {serviceNames.length > 0 ? (
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>Dịch vụ</Text>
                      <Text style={styles.detailText}>{serviceNames.join(', ')}</Text>
                    </View>
                  ) : null}

                  {partNames.length > 0 ? (
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>Linh kiện</Text>
                      <Text style={styles.detailText}>{partNames.join(', ')}</Text>
                    </View>
                  ) : null}

                  {booking.cancelReason ? (
                    <View style={styles.cancelBox}>
                      <Text style={styles.cancelLabel}>Lý do hủy</Text>
                      <Text style={styles.cancelText}>{booking.cancelReason}</Text>
                    </View>
                  ) : null}

                  <View style={styles.footerRow}>
                    <View>
                      <Text style={styles.footerLabel}>Thanh toán</Text>
                      <Text style={styles.footerText}>
                        {PAYMENT_LABELS[booking.paymentMethod || ''] || booking.paymentMethod || 'Chưa chọn'} ·{' '}
                        {PAYMENT_STATUS_LABELS[booking.paymentStatus || ''] ||
                          booking.paymentStatus ||
                          'Chưa có trạng thái'}
                      </Text>
                    </View>
                    <Text style={styles.totalText}>{formatCurrency(booking.totalAmount)}</Text>
                  </View>
                  <View style={styles.detailActionRow}>
                    <Text style={styles.detailActionText}>Xem chi tiết</Text>
                    <Ionicons name="chevron-forward" size={18} color="#F59E0B" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-clear-outline" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có lịch đặt</Text>
            <Text style={styles.emptyText}>
              Sau khi bạn gửi yêu cầu đặt lịch, lịch hẹn sẽ xuất hiện tại đây.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.primaryButtonText}>Đặt lịch mới</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEB',
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
    borderRadius: 999,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    color: 'rgba(255,255,255,0.78)',
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.86)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#9A3412',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  card: {
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 18,
  },
  centerCard: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  listWrap: {
    gap: 14,
  },
  bookingCard: {
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  bookingTitleWrap: {
    flex: 1,
  },
  bookingCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookingVehicle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#64748B',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  infoRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#334155',
  },
  detailBlock: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    padding: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C2410C',
    textTransform: 'uppercase',
  },
  detailText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
  },
  cancelBox: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    padding: 12,
  },
  cancelLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  cancelText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: '#7F1D1D',
  },
  footerRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  footerText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9A3412',
  },
  detailActionRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  detailActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F59E0B',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
  },
  primaryButton: {
    marginTop: 18,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
