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
import { useLocalSearchParams, useRouter } from 'expo-router';

import invoiceService, { InvoiceResponse } from '@/services/invoiceService';

const MEMBERSHIP_LABELS: Record<string, string> = {
  REGULAR: 'Thường',
  BRONZE: 'Đồng',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color="#F59E0B" />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = Number(params.bookingId);
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadInvoice = useCallback(async (refreshing = false) => {
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      setIsLoading(false);
      Alert.alert('Lỗi', 'Không tìm thấy mã booking để tải hóa đơn.');
      return;
    }

    try {
      if (refreshing) {
        setIsRefreshing(true);
      }

      const invoiceData = await invoiceService.getInvoiceByBookingId(bookingId);
      setInvoice(invoiceData);
    } catch (error: any) {
      console.error('Load invoice failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể tải hóa đơn lúc này.';
      Alert.alert('Lỗi', String(serverMessage));
      setInvoice(null);
    } finally {
      setIsLoading(false);
      if (refreshing) {
        setIsRefreshing(false);
      }
    }
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      loadInvoice();
    }, [loadInvoice])
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
            onRefresh={() => loadInvoice(true)}
            tintColor="#F59E0B"
          />
        }>
        {isLoading ? (
          <View style={[styles.card, styles.centerCard]}>
            <ActivityIndicator color="#F59E0B" />
            <Text style={styles.loadingText}>Đang tải hóa đơn...</Text>
          </View>
        ) : invoice ? (
          <>
            <LinearGradient colors={['#F59E0B', '#EA580C']} style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>Invoice</Text>
              <Text style={styles.heroTitle}>{invoice.invoiceNumber || `INV-${invoice.bookingId}`}</Text>
              <Text style={styles.heroText}>Hóa đơn cho booking #{invoice.bookingId}</Text>
            </LinearGradient>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
              <InfoRow icon="person-outline" label="Khách hàng" value={invoice.customerName || 'Chưa có'} />
              <InfoRow icon="call-outline" label="Số điện thoại" value={invoice.customerPhone || 'Chưa có'} />
              <InfoRow icon="car-sport-outline" label="Biển số xe" value={invoice.licensePlate || 'Chưa có'} />
              <InfoRow icon="receipt-outline" label="Mã hóa đơn" value={invoice.invoiceNumber || 'Chưa có'} />
              <InfoRow icon="calendar-outline" label="Thời gian xuất" value={formatDateTime(invoice.issuedAt)} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
              <View style={styles.amountBox}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Tiền dịch vụ</Text>
                  <Text style={styles.amountValue}>{formatCurrency(invoice.serviceAmount)}</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Tiền linh kiện</Text>
                  <Text style={styles.amountValue}>{formatCurrency(invoice.partAmount)}</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Hạng thành viên</Text>
                  <Text style={styles.amountValue}>
                    {MEMBERSHIP_LABELS[invoice.membershipTier || ''] || 'Thường'}
                  </Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Giảm giá thành viên</Text>
                  <Text style={styles.discountValue}>- {formatCurrency(invoice.membershipDiscountAmount)}</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Phương thức thanh toán</Text>
                  <Text style={styles.amountValue}>
                    {PAYMENT_LABELS[invoice.paymentMethod || ''] || invoice.paymentMethod || 'Chưa có'}
                  </Text>
                </View>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.finalAmount)}</Text>
              </View>

              {(invoice.pointsEarned ?? 0) > 0 ? (
                <Text style={styles.pointsText}>Điểm cộng thêm từ giao dịch này: +{invoice.pointsEarned}</Text>
              ) : null}

              {invoice.note ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>Ghi chú</Text>
                  <Text style={styles.noteText}>{invoice.note}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có hóa đơn</Text>
            <Text style={styles.emptyText}>
              Hóa đơn sẽ xuất hiện sau khi booking hoàn thành và được xác nhận thanh toán.
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
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
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
    paddingVertical: 36,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  infoValue: {
    marginTop: 5,
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
    fontWeight: '700',
  },
  amountBox: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    padding: 14,
    gap: 10,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  amountLabel: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '700',
  },
  amountValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '800',
  },
  discountValue: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '800',
  },
  totalRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#9A3412',
  },
  pointsText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#15803D',
    fontWeight: '800',
  },
  noteBox: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  noteText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#7C2D12',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
  },
});
