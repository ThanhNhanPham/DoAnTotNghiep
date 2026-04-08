import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<{
    email: string | null;
    fullName: string | null;
    role: string | null;
    address: string | null;
  }>({
    email: null,
    fullName: null,
    role: null,
    address: null,
  });
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      const fullName = await AsyncStorage.getItem('fullName');
      const role = await AsyncStorage.getItem('userRole');
      const address = await AsyncStorage.getItem('fullAddress');

      if (!email) {
        // Nếu không có email (chưa đăng nhập), chuyển về trang login
        router.replace('/login');
        return;
      }

      setUserData({ email, fullName, role, address });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.roleBadgeContainer}>
            <View style={styles.roleBadge}>
              <Ionicons
                name={userData.role === 'ADMIN' ? 'shield-checkmark' : 'person'}
                size={14}
                color="#6366F1"
              />
              <Text style={styles.roleText}>
                {userData.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
              </Text>
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
              subtitle="2 xe đang đăng ký"
              color="#EEF2FF"
              iconColor="#6366F1"
            />
            <MenuCard
              icon="calendar"
              title="Đặt lịch"
              subtitle="Đặt lịch sửa chữa"
              color="#ECFDF5"
              iconColor="#10B981"
            />
            <MenuCard
              icon="time"
              title="Lịch sử"
              subtitle="15 lượt sửa chữa"
              color="#FFF7ED"
              iconColor="#F59E0B"
            />
            <MenuCard
              icon="settings"
              title="Cài đặt"
              subtitle="Tài khoản & App"
              color="#F5F3FF"
              iconColor="#8B5CF6"
            />
          </View>

          {/* Promotional Banner */}
          <LinearGradient
            colors={['#1F2937', '#111827']}
            style={styles.banner}
          >
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Bảo dưỡng định kỳ</Text>
              <Text style={styles.bannerSubtitle}>Giảm ngay 20% cho khách hàng mới</Text>
              <TouchableOpacity style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>Tìm hiểu thêm</Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="construct" size={80} color="rgba(255,255,255,0.1)" style={styles.bannerIcon} />
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuCard({ icon, title, subtitle, color, iconColor }: any) {
  return (
    <TouchableOpacity style={[styles.menuCard, { backgroundColor: color }]}>
      <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
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
    paddingBottom: 30,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderTopRightRadius: 32,
    borderTopLeftRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 4,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadgeContainer: {
    marginTop: 20,
    flexDirection: 'row',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    marginTop: -20,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 30,
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  menuCard: {
    width: (SCREEN_WIDTH - 48 - 16) / 2,
    padding: 20,
    borderRadius: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  banner: {
    marginTop: 30,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerContent: {
    flex: 1,
    zIndex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
});
