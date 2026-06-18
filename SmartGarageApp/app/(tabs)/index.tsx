import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUnreadNotificationCount } from '@/hooks/use-unread-notification-count';
import bookingService from '@/services/bookingService';
import vehicleService from '@/services/vehicleService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const unreadNotificationCount = useUnreadNotificationCount();
  const [userData, setUserData] = useState<{
    email: string | null;
    fullName: string | null;
    address: string | null;
  }>({
    email: null,
    fullName: null,
    address: null,
  });
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);

  const fetchUserData = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      const fullName = await AsyncStorage.getItem('fullName');
      const address = await AsyncStorage.getItem('fullAddress');
      const userId = await AsyncStorage.getItem('userId');
      const userRole = await AsyncStorage.getItem('userRole');

      if (!email) {
        // Nếu không có email (chưa đăng nhập), chuyển về trang login
        router.replace('/login');
        return;
      }

      if (userRole && userRole !== 'CUSTOMER') {
        await AsyncStorage.clear();
        Alert.alert(
          'Phiên đăng nhập không phù hợp',
          'Ứng dụng mobile chỉ dành cho tài khoản khách hàng. Vui lòng đăng nhập lại bằng tài khoản CUSTOMER.'
        );
        router.replace('/login');
        return;
      }

      setUserData({ email, fullName, address });

      if (userId) {
        const [vehiclesResult, bookingsResult] = await Promise.allSettled([
          vehicleService.getVehiclesByUserId(Number(userId)),
          bookingService.getMyBookings(),
        ]);

        if (vehiclesResult.status === 'fulfilled') {
          const vehicles = vehiclesResult.value;
          setVehicleCount(Array.isArray(vehicles) ? vehicles.filter((vehicle) => vehicle.isActive !== false).length : 0);
        } else {
          console.error('Error fetching home vehicles:', vehiclesResult.reason);
          setVehicleCount(0);
        }

        if (bookingsResult.status === 'fulfilled') {
          const bookings = bookingsResult.value;
          setBookingCount(Array.isArray(bookings) ? bookings.length : 0);
        } else {
          console.error('Error fetching home bookings:', bookingsResult.reason);
          setBookingCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/login');
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <LinearGradient
          colors={['#6366F1', '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingText}>Xin chào,</Text>
              <Text style={styles.userNameText}>{userData.fullName || 'Người dùng'}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/notifications')}>
                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                {unreadNotificationCount > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.roleBadgeContainer}>
            <View style={styles.roleBadge}>
              <Ionicons name="person" size={14} color="#6366F1" />
              <Text style={styles.roleText}>Khách hàng</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Info Section */}
        <View style={styles.contentContainer}>
          {userData.address && (
            <TouchableOpacity
              style={styles.addressCard}
              onPress={() => setIsAddressExpanded(!isAddressExpanded)}
              activeOpacity={0.7}
            >
              <Ionicons name="location" size={20} color="#6366F1" />
              <Text
                style={styles.addressText}
                numberOfLines={isAddressExpanded ? undefined : 1}
              >
                {userData.address}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Dịch vụ của bạn</Text>

          <View style={styles.menuGrid}>
            <MenuCard
              icon="car-sport"
              title="Xe của tôi"
              subtitle={vehicleCount > 0 ? `${vehicleCount} xe đang đăng ký` : 'Chưa đăng ký xe'}
              color="#EEF2FF"
              iconColor="#6366F1"
              onPress={() => router.push('/(tabs)/vehicles')}
            />
            <MenuCard
              icon="calendar"
              title="Đặt lịch"
              subtitle="Đặt lịch sửa chữa"
              color="#ECFDF5"
              iconColor="#10B981"
              onPress={() => router.push('/(tabs)/explore')}
            />
            <MenuCard
              icon="time"
              title="Lịch sử"
              subtitle={bookingCount > 0 ? `${bookingCount} lịch hẹn` : 'Chưa có lịch hẹn'}
              color="#FFF7ED"
              iconColor="#F59E0B"
              onPress={() => router.push('/booking-history')}
            />
            <MenuCard
              icon="settings"
              title="Cài đặt"
              subtitle="Tài khoản & App"
              color="#F5F3FF"
              iconColor="#8B5CF6"
              onPress={() => router.push('/settings')}
            />
          </View>

          {/* Maintenance Guide Banner */}
          <LinearGradient
            colors={['#111827', '#172033', '#0F766E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerBadge}>
                <Ionicons name="book-outline" size={13} color="#A7F3D0" />
                <Text style={styles.bannerBadgeText}>Cẩm nang chăm sóc xe</Text>
              </View>
              <Text style={styles.bannerTitle}>Bảo dưỡng định kỳ</Text>
              <Text style={styles.bannerText}>Hiểu đúng để xe vận hành bền bỉ, an toàn và tiết kiệm hơn.</Text>
              <TouchableOpacity
                style={styles.bannerButton}
                onPress={() => router.push('/maintenance-docs')}
                activeOpacity={0.88}>
                <Text style={styles.bannerButtonText}>Tìm hiểu thêm</Text>
                <Ionicons name="arrow-forward" size={14} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <View style={styles.bannerIconHalo}>
              <Ionicons name="construct" size={64} color="rgba(255,255,255,0.16)" />
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuCard({ icon, title, subtitle, color, iconColor, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.menuCard, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.menuCardTitle}>{title}</Text>
      <Text style={styles.menuCardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 12,
  },
  header: {
    paddingTop: 42,
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderTopRightRadius: 28,
    borderTopLeftRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  roleBadgeContainer: {
    marginTop: 16,
    flexDirection: 'row',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
  },
  contentContainer: {
    paddingHorizontal: 24,
    marginTop: -18,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 13,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  addressText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginTop: 24,
    marginBottom: 18,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 22,
    columnGap: 12,
  },
  menuCard: {
    width: (SCREEN_WIDTH - 48 - 12) / 2,
    minHeight: 128,
    padding: 18,
    borderRadius: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  banner: {
    marginTop: 44,
    borderRadius: 20,
    padding: 18,
    minHeight: 142,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerContent: {
    flex: 1,
    zIndex: 1,
    paddingRight: 72,
    justifyContent: 'space-between',
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 10,
  },
  bannerBadgeText: {
    color: '#D1FAE5',
    fontSize: 10,
    fontWeight: '800',
  },
  bannerTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.76)',
    marginBottom: 14,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  bannerIconHalo: {
    position: 'absolute',
    right: -26,
    bottom: -24,
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
