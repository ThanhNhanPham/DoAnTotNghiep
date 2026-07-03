import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import bookingService, { BookingResponse } from '@/services/bookingService';
import reviewService, { ReviewItem } from '@/services/reviewService';

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
  BANK_TRANSFER: 'Chuyển khoản',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Chờ thanh toán',
  SUCCESS: 'Đã thanh toán',
  FAILED: 'Thanh toán lỗi',
  CANCELLED: 'Đã hủy',
};

const MEMBERSHIP_LABELS: Record<string, string> = {
  REGULAR: 'Thường',
  BRONZE: 'Đồng',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
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

const formatDuration = (start?: string | null, end?: string | null) => {
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (!startDate || !endDate) return 'Chưa hoàn tất';

  const diffMinutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours} giờ ${minutes} phút`;
  if (hours > 0) return `${hours} giờ`;
  return `${minutes} phút`;
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

function NameList({ title, names }: { title: string; names?: string[] }) {
  if (!names || names.length === 0) {
    return (
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>{title}</Text>
        <Text style={styles.detailText}>Chưa có dữ liệu.</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailBlock}>
      <Text style={styles.detailLabel}>{title}</Text>
      {names.map((name) => (
        <View key={name} style={styles.nameRow}>
          <Ionicons name="checkmark-circle" size={16} color="#F59E0B" />
          <Text style={styles.nameText}>{name}</Text>
        </View>
      ))}
    </View>
  );
}

export default function BookingDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const bookingId = Number(params.id);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [review, setReview] = useState<ReviewItem | null>(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadBookingDetail = useCallback(async (refreshing = false) => {
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      setIsLoading(false);
      Alert.alert('Lỗi', 'Không tìm thấy mã booking.');
      return;
    }

    try {
      if (refreshing) {
        setIsRefreshing(true);
      }

      const [bookingData, reviewResult] = await Promise.allSettled([
        bookingService.getBookingById(bookingId),
        reviewService.getReviewByBooking(bookingId),
      ]);

      if (bookingData.status === 'fulfilled') {
        setBooking(bookingData.value);
      } else {
        throw bookingData.reason;
      }

      if (reviewResult.status === 'fulfilled') {
        setReview(reviewResult.value);
        setSelectedRating(reviewResult.value.rating || 5);
        setReviewComment(reviewResult.value.comment || '');
      } else {
        const statusCode = reviewResult.reason?.response?.status;

        if (statusCode === 404) {
          setReview(null);
          setSelectedRating(5);
          setReviewComment('');
        } else {
          console.error('Load booking review failed:', reviewResult.reason);
          setReview(null);
        }
      }
    } catch (error: any) {
      console.error('Load booking detail failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể tải chi tiết booking lúc này.';
      Alert.alert('Lỗi', String(serverMessage));
      setBooking(null);
    } finally {
      setIsLoading(false);
      if (refreshing) {
        setIsRefreshing(false);
      }
    }
  }, [bookingId]);

  const handleSubmitReview = async () => {
    if (!booking) return;

    if (booking.status !== 'COMPLETED') {
      Alert.alert('Chưa thể đánh giá', 'Bạn chỉ có thể đánh giá sau khi đơn hàng hoàn thành.');
      return;
    }

    if (review) {
      Alert.alert('Đã đánh giá', 'Đơn hàng này đã có đánh giá trước đó.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const createdReview = await reviewService.createReview({
        bookingId: booking.id,
        rating: selectedRating,
        comment: reviewComment.trim(),
      });

      setReview(createdReview);
      setReviewComment(createdReview.comment || '');
      setSelectedRating(createdReview.rating || selectedRating);
      Alert.alert('Cảm ơn bạn', 'Đánh giá của bạn đã được gửi.');
    } catch (error: any) {
      console.error('Create review failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể gửi đánh giá lúc này.';
      Alert.alert('Gửi đánh giá thất bại', String(serverMessage));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBookingDetail();
    }, [loadBookingDetail])
  );

  const status = booking?.status || 'PENDING';
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.PENDING;

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
            onRefresh={() => loadBookingDetail(true)}
            tintColor="#F59E0B"
          />
        }>
        {isLoading ? (
          <View style={[styles.card, styles.centerCard]}>
            <ActivityIndicator color="#F59E0B" />
            <Text style={styles.loadingText}>Đang tải chi tiết booking...</Text>
          </View>
        ) : booking ? (
          <>
            <LinearGradient colors={['#F59E0B', '#EA580C']} style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroTextWrap}>
                  <Text style={styles.heroEyebrow}>Booking Detail</Text>
                  <Text style={styles.heroTitle}>Booking #{booking.id}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusColor.bg }]}>
                  <Text style={[styles.statusPillText, { color: statusColor.text }]}>
                    {STATUS_LABELS[status] || status}
                  </Text>
                </View>
              </View>
              <Text style={styles.heroText}>
                {booking.vehicleName || 'Xe của bạn'} · {booking.licensePlate || 'N/A'}
              </Text>
              {booking.status === 'PENDING' ? (
                <TouchableOpacity
                  style={styles.editBookingButton}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/modal',
                      params: { bookingId: String(booking.id) },
                    } as any)
                  }>
                  <Ionicons name="create-outline" size={18} color="#92400E" />
                  <Text style={styles.editBookingButtonText}>Chỉnh sửa lịch hẹn</Text>
                </TouchableOpacity>
              ) : null}
            </LinearGradient>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Thông tin xe</Text>
                {booking.vehicleImageUrl ? (
                  <Image source={{ uri: booking.vehicleImageUrl }} style={styles.vehicleImage} />
                ) : null}
              </View>
              <InfoRow icon="car-sport-outline" label="Xe" value={booking.vehicleName || 'Chưa có tên xe'} />
              <InfoRow icon="barcode-outline" label="Biển số" value={booking.licensePlate || 'N/A'} />
              <InfoRow
                icon="person-outline"
                label="Chủ xe"
                value={booking.vehicleOwnerName || booking.customerName || 'Chưa có thông tin'}
              />
              <InfoRow icon="call-outline" label="Số điện thoại" value={booking.customerPhone || 'Chưa có'} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Lịch hẹn</Text>
              <InfoRow
                icon="calendar-outline"
                label="Thời gian đặt"
                value={formatDateTime(booking.createdAt || booking.bookingTime)}
              />
              <InfoRow
                icon="time-outline"
                label="Khung giờ đến gara"
                value={`${formatDateTime(booking.arrivalSlotStart || booking.bookingTime)}${
                  booking.arrivalSlotEnd ? ` - ${formatTime(booking.arrivalSlotEnd)}` : ''
                }`}
              />
              <InfoRow
                icon="log-in-outline"
                label="Thời gian tiếp nhận"
                value={booking.arrivalTime ? formatDateTime(booking.arrivalTime) : 'Chưa tiếp nhận'}
              />
              <InfoRow
                icon="construct-outline"
                label="Bắt đầu sửa"
                value={booking.repairStartTime ? formatDateTime(booking.repairStartTime) : 'Chưa bắt đầu'}
              />
              <InfoRow
                icon="checkmark-done-outline"
                label="Hoàn tất sửa"
                value={booking.repairEndTime ? formatDateTime(booking.repairEndTime) : 'Chưa hoàn tất'}
              />
              <InfoRow
                icon="hourglass-outline"
                label="Thời gian sửa thực tế"
                value={formatDuration(booking.repairStartTime, booking.repairEndTime)}
              />
              <InfoRow icon="business-outline" label="Chi nhánh" value={booking.branchName || 'Chưa có'} />
              <InfoRow icon="construct-outline" label="Thợ phụ trách" value={booking.mechanicName || 'Chưa có'} />
              <TouchableOpacity
                style={styles.chatButton}
                activeOpacity={0.85}
                onPress={() => router.push(`/chat/${booking.id}` as any)}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
                <Text style={styles.chatButtonText}>Nhắn với chi nhánh</Text>
              </TouchableOpacity>
            </View>

            <NameList title="Dịch vụ đã chọn" names={booking.serviceNames} />
            <NameList title="Linh kiện phát sinh" names={booking.partNames} />

            {booking.cancelReason ? (
              <View style={styles.cancelBox}>
                <Text style={styles.cancelLabel}>Lý do hủy</Text>
                <Text style={styles.cancelText}>{booking.cancelReason}</Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Thanh toán</Text>
              <View style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentLabel}>Phương thức</Text>
                  <Text style={styles.paymentValue}>
                    {PAYMENT_LABELS[booking.paymentMethod || ''] || booking.paymentMethod || 'Chưa chọn'}
                  </Text>
                </View>
                <View style={styles.paymentStatusBox}>
                  <Text style={styles.paymentStatusText}>
                    {PAYMENT_STATUS_LABELS[booking.paymentStatus || ''] ||
                      booking.paymentStatus ||
                      'Chưa có trạng thái'}
                  </Text>
                </View>
              </View>
              <View style={styles.amountBreakdown}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Tiền dịch vụ</Text>
                  <Text style={styles.amountValue}>{formatCurrency(booking.serviceAmount)}</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Tiền linh kiện</Text>
                  <Text style={styles.amountValue}>{formatCurrency(booking.partAmount)}</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Hạng thành viên</Text>
                  <Text style={styles.amountValue}>
                    {MEMBERSHIP_LABELS[booking.membershipTierApplied || ''] || 'Thường'}
                  </Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Giảm giá thành viên</Text>
                  <Text style={styles.discountAmountValue}>
                    - {formatCurrency(booking.membershipDiscountAmount)}
                  </Text>
                </View>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Thanh toán cuối</Text>
                <Text style={styles.totalValue}>{formatCurrency(booking.finalAmount ?? booking.totalAmount)}</Text>
              </View>
              {(booking.pointsEarned ?? 0) > 0 ? (
                <Text style={styles.pointsEarnedText}>Điểm cộng thêm sau giao dịch: +{booking.pointsEarned}</Text>
              ) : null}
              {booking.paymentStatus === 'SUCCESS' ? (
                <TouchableOpacity
                  style={styles.invoiceButton}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/invoice-detail?bookingId=${booking.id}` as any)}>
                  <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.invoiceButtonText}>Xem hóa đơn</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Đánh giá đơn hàng</Text>
              {review ? (
                <>
                  <View style={styles.reviewStarsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating ? 'star' : 'star-outline'}
                        size={26}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewCommentText}>
                    {review.comment || 'Bạn đã đánh giá đơn hàng này nhưng chưa để lại bình luận.'}
                  </Text>
                  <Text style={styles.reviewDateText}>
                    Gửi lúc {formatDateTime(review.createdAt)}
                  </Text>

                  {review.adminReply ? (
                    <View style={styles.adminReplyBox}>
                      <Text style={styles.adminReplyLabel}>Phản hồi từ gara</Text>
                      <Text style={styles.adminReplyText}>{review.adminReply}</Text>
                      {review.repliedAt ? (
                        <Text style={styles.reviewDateText}>Phản hồi lúc {formatDateTime(review.repliedAt)}</Text>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.waitingReplyBox}>
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#92400E" />
                      <Text style={styles.waitingReplyText}>Gara chưa phản hồi đánh giá này.</Text>
                    </View>
                  )}
                </>
              ) : booking.status === 'COMPLETED' ? (
                <>
                  <Text style={styles.reviewHelperText}>
                    Chia sẻ trải nghiệm của bạn để gara cải thiện chất lượng dịch vụ.
                  </Text>
                  <View style={styles.ratingPickerRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        style={styles.starButton}
                        activeOpacity={0.75}
                        onPress={() => setSelectedRating(star)}>
                        <Ionicons
                          name={star <= selectedRating ? 'star' : 'star-outline'}
                          size={32}
                          color="#F59E0B"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.reviewInput}
                    multiline
                    maxLength={2000}
                    placeholder="Nhập nhận xét của bạn..."
                    placeholderTextColor="#94A3B8"
                    value={reviewComment}
                    onChangeText={setReviewComment}
                  />
                  <TouchableOpacity
                    style={[styles.submitReviewButton, isSubmittingReview && styles.disabledButton]}
                    activeOpacity={0.85}
                    disabled={isSubmittingReview}
                    onPress={handleSubmitReview}>
                    {isSubmittingReview ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitReviewButtonText}>Gửi đánh giá</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.waitingReplyBox}>
                  <Ionicons name="lock-closed-outline" size={18} color="#92400E" />
                  <Text style={styles.waitingReplyText}>
                    Bạn có thể đánh giá sau khi đơn hàng chuyển sang trạng thái hoàn thành.
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="document-text-outline" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.emptyTitle}>Không có dữ liệu booking</Text>
            <Text style={styles.emptyText}>Vui lòng quay lại danh sách và thử mở lại booking.</Text>
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
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroTextWrap: {
    flex: 1,
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
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
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
  editBookingButton: {
    marginTop: 16,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editBookingButtonText: {
    fontSize: 14,
    fontWeight: '800',
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
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  vehicleImage: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
  },
  infoRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 12,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  infoValue: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: '#334155',
  },
  detailBlock: {
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 18,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
  },
  nameRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#334155',
  },
  cancelBox: {
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    padding: 18,
  },
  cancelLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  cancelText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#7F1D1D',
  },
  paymentRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  paymentValue: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  paymentStatusBox: {
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C2410C',
  },
  amountBreakdown: {
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
  discountAmountValue: {
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
  pointsEarnedText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#15803D',
    fontWeight: '800',
  },
  invoiceButton: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatButton: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: '#0F766E',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  invoiceButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reviewStarsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 5,
  },
  reviewCommentText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  reviewDateText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  reviewHelperText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
  },
  ratingPickerRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewInput: {
    marginTop: 14,
    minHeight: 104,
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 20,
    color: '#0F172A',
  },
  submitReviewButton: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  disabledButton: {
    opacity: 0.65,
  },
  submitReviewButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  adminReplyBox: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    padding: 14,
  },
  adminReplyLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  adminReplyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#115E59',
  },
  waitingReplyBox: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    padding: 14,
  },
  waitingReplyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#92400E',
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
});
