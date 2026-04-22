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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { useThemePreference } from '@/contexts/theme-preference';
import vehicleService from '@/services/vehicleService';

type ProfileData = {
  email: string | null;
  fullName: string | null;
  address: string | null;
  userId: string | null;
};

const INITIAL_PROFILE: ProfileData = {
  email: null,
  fullName: null,
  address: null,
  userId: null,
};

export default function ProfileScreen() {
  const router = useRouter();
  const { colorScheme, preference, setPreference } = useThemePreference();
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProfile = useCallback(async (refreshing = false) => {
    try {
      if (refreshing) {
        setIsRefreshing(true);
      }

      const [email, fullName, address, userId] = await Promise.all([
        AsyncStorage.getItem('userEmail'),
        AsyncStorage.getItem('fullName'),
        AsyncStorage.getItem('fullAddress'),
        AsyncStorage.getItem('userId'),
      ]);

      if (!email) {
        router.replace('/login');
        return;
      }

      setProfile({
        email,
        fullName,
        address,
        userId,
      });

      if (userId) {
        try {
          const vehicles = await vehicleService.getVehiclesByUserId(Number(userId));
          const activeVehicles = Array.isArray(vehicles)
            ? vehicles.filter((vehicle) => vehicle.isActive !== false)
            : [];

          setVehicleCount(activeVehicles.length);
        } catch (vehicleError) {
          console.error('Load profile vehicle count failed:', vehicleError);
          setVehicleCount(0);
        }
      } else {
        setVehicleCount(0);
      }
    } catch (error) {
      console.error('Load profile failed:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin cá nhân lúc này.');
    } finally {
      setIsLoading(false);
      if (refreshing) {
        setIsRefreshing(false);
      }
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/login');
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  const displayName = profile.fullName || 'Người dùng Smart Garage';
  const displayRole = 'Khách hàng';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const isDark = colorScheme === 'dark';
  const palette = {
    screen: isDark ? '#020617' : '#F0FDFA',
    heroStart: isDark ? '#0F172A' : '#0F766E',
    heroEnd: isDark ? '#134E4A' : '#115E59',
    card: isDark ? '#0F172A' : '#FFFFFF',
    cardBorder: isDark ? '#1E293B' : '#CCFBF1',
    text: isDark ? '#E2E8F0' : '#0F172A',
    subtext: isDark ? '#94A3B8' : '#475569',
    muted: isDark ? '#64748B' : '#64748B',
    soft: isDark ? '#111827' : '#ECFDF5',
    input: isDark ? '#111827' : '#F8FAFC',
    inputBorder: isDark ? '#334155' : '#CCFBF1',
    white: '#FFFFFF',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.screen }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchProfile(true)}
            tintColor={isDark ? '#E2E8F0' : '#0F766E'}
          />
        }>
          <LinearGradient colors={[palette.heroStart, palette.heroEnd]} style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials || 'SG'}</Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroName}>{displayName}</Text>
            <Text style={styles.heroEmail}>{profile.email || 'Chưa có email'}</Text>

            <View style={styles.roleBadge}>
              <Ionicons name="person-circle" size={16} color="#0F766E" />
              <Text style={styles.roleBadgeText}>{displayRole}</Text>
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            <StatCard
              icon="car-sport-outline"
              label="Xe đã đăng ký"
              value={String(vehicleCount)}
              accent={isDark ? '#5EEAD4' : '#0F766E'}
              background={isDark ? '#0B2A26' : '#ECFDF5'}
              textColor={palette.text}
              labelColor={palette.subtext}
            />
          </View>

          <View style={[styles.card, { backgroundColor: palette.card, shadowOpacity: isDark ? 0 : 0.06 }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Thông tin tài khoản</Text>
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={profile.email || 'Chưa cập nhật'}
              palette={palette}
            />
            <InfoRow icon="person-outline" label="Họ và tên" value={displayName} palette={palette} />
            <InfoRow icon="shield-outline" label="Vai trò" value={displayRole} palette={palette} />
            <InfoRow
              icon="location-outline"
              label="Địa chỉ"
              value={profile.address || 'Bạn chưa cập nhật địa chỉ'}
              isMultiline
              palette={palette}
            />
            <InfoRow
              icon="id-card-outline"
              label="Mã người dùng"
              value={profile.userId || 'Chưa có'}
              palette={palette}
            />
          </View>

          <View style={[styles.card, { backgroundColor: palette.card, shadowOpacity: isDark ? 0 : 0.06 }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Tiện ích nhanh</Text>
            <QuickActionRow
              icon="car-outline"
              title="Quản lý xe"
              subtitle="Thêm mới hoặc cập nhật thông tin xe của bạn"
              onPress={() => router.push('/(tabs)/vehicles')}
              palette={palette}
            />
            <QuickActionRow
              icon="sparkles-outline"
              title="Tư vấn AI"
              subtitle="Mô tả tình trạng xe để nhận gợi ý dịch vụ"
              onPress={() => router.push('/(tabs)/explore')}
              palette={palette}
            />
            <QuickActionRow
              icon="calendar-outline"
              title="Đặt lịch sửa xe"
              subtitle="Đi đến luồng tư vấn và gửi yêu cầu đặt lịch"
              onPress={() => router.push('/(tabs)/explore')}
              isLast
              palette={palette}
            />

          </View>

          <View style={[styles.card, { backgroundColor: palette.card, shadowOpacity: isDark ? 0 : 0.06 }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Giao diện</Text>
            <Text style={[styles.sectionDescription, { color: palette.subtext }]}>
              Chọn chế độ hiển thị bạn thấy dễ dùng nhất khi thao tác trong app.
            </Text>

            <View style={styles.themeRow}>
              <ThemeOption
                icon="sunny-outline"
                label="Sáng"
                isActive={preference === 'light'}
                onPress={() => setPreference('light')}
                palette={palette}
              />
              <ThemeOption
                icon="moon-outline"
                label="Tối"
                isActive={preference === 'dark'}
                onPress={() => setPreference('dark')}
                palette={palette}
              />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: palette.card, shadowOpacity: isDark ? 0 : 0.06 }]}>
            <QuickActionRow
              icon="lock-closed-outline"
              title="Đổi mật khẩu"
              subtitle="Mở màn hình riêng để cập nhật mật khẩu tài khoản"
              onPress={() => router.push('/change-password')}
              palette={palette}
              isStandalone
            />
          </View>

          <View
            style={[
              styles.card,
              styles.tipCard,
              {
                backgroundColor: palette.card,
                borderColor: palette.cardBorder,
                shadowOpacity: isDark ? 0 : 0.04,
              },
            ]}>
            <Ionicons name="information-circle" size={22} color={isDark ? '#5EEAD4' : '#0F766E'} />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: palette.text }]}>Lưu ý về báo giá</Text>
              <Text style={[styles.tipText, { color: palette.subtext }]}>
                Chi phí hiển thị trong bước đặt lịch chỉ là mức dự kiến. Gara sẽ kiểm tra xe và xác
                nhận báo giá cuối cùng trước khi thanh toán.
              </Text>
            </View>
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  background,
  textColor,
  labelColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent: string;
  background: string;
  textColor: string;
  labelColor: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: background }]}>
      <View style={[styles.statIconWrap, { backgroundColor: '#FFFFFF' }]}>
        <Ionicons name={icon} size={22} color={accent} />
      </View>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isMultiline = false,
  palette,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isMultiline?: boolean;
  palette: {
    text: string;
    subtext: string;
    soft: string;
  };
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrap, { backgroundColor: palette.soft }]}>
        <Ionicons name={icon} size={18} color="#0F766E" />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={[styles.infoLabel, { color: palette.subtext }]}>{label}</Text>
        <Text
          style={[styles.infoValue, { color: palette.text }]}
          numberOfLines={isMultiline ? undefined : 1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function QuickActionRow({
  icon,
  title,
  subtitle,
  onPress,
  isLast = false,
  palette,
  isStandalone = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  isLast?: boolean;
  isStandalone?: boolean;
  palette: {
    text: string;
    subtext: string;
    soft: string;
    cardBorder: string;
  };
}) {
  return (
    <TouchableOpacity
      style={[
        styles.quickActionRow,
        { borderBottomColor: palette.cardBorder },
        isStandalone && styles.quickActionRowStandalone,
        isLast && styles.quickActionRowLast,
      ]}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={[styles.quickActionIcon, { backgroundColor: palette.soft }]}>
        <Ionicons name={icon} size={20} color="#0F766E" />
      </View>
      <View style={styles.quickActionTextWrap}>
        <Text style={[styles.quickActionTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.quickActionSubtitle, { color: palette.subtext }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </TouchableOpacity>
  );
}

function ThemeOption({
  icon,
  label,
  isActive,
  onPress,
  palette,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isActive: boolean;
  onPress: () => void;
  palette: {
    text: string;
    soft: string;
  };
}) {
  return (
    <TouchableOpacity
      style={[
        styles.themeOption,
        {
          backgroundColor: isActive ? '#0F766E' : palette.soft,
          borderColor: isActive ? '#0F766E' : 'transparent',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}>
      <Ionicons name={icon} size={20} color={isActive ? '#FFFFFF' : '#0F766E'} />
      <Text style={[styles.themeOptionText, { color: isActive ? '#FFFFFF' : palette.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
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
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroName: {
    marginTop: 16,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroEmail: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.82)',
  },
  roleBadge: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
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
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    color: '#0F172A',
  },
  quickActionRow: {
    marginTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickActionRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  quickActionRowStandalone: {
    marginTop: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTextWrap: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickActionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
  },
  themeRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  themeOptionText: {
    fontSize: 15,
    fontWeight: '800',
  },
  tipCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  tipText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },
});
