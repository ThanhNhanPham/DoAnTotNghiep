import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useThemePreference } from '@/contexts/theme-preference';

export default function SettingsScreen() {
  const router = useRouter();
  const { colorScheme, preference, setPreference } = useThemePreference();

  const isDark = colorScheme === 'dark';
  const palette = {
    screen: isDark ? '#020617' : '#F0FDFA',
    heroStart: isDark ? '#0F172A' : '#0F766E',
    heroEnd: isDark ? '#134E4A' : '#115E59',
    card: isDark ? '#0F172A' : '#FFFFFF',
    border: isDark ? '#1E293B' : '#E2E8F0',
    text: isDark ? '#E2E8F0' : '#0F172A',
    subtext: isDark ? '#94A3B8' : '#475569',
    action: isDark ? '#14B8A6' : '#0F766E',
    soft: isDark ? '#111827' : '#ECFDF5',
    danger: '#DC2626',
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[palette.heroStart, palette.heroEnd]} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Cài đặt</Text>
          <Text style={styles.heroText}>
            Quản lý thông tin tài khoản, thông báo, giao diện và các thiết lập cơ bản của ứng dụng.
          </Text>
        </LinearGradient>

        <View style={[styles.card, { backgroundColor: palette.card }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Tài khoản</Text>
          <SettingRow
            icon="person-outline"
            title="Thông tin cá nhân"
            subtitle="Cập nhật họ tên, số điện thoại và địa chỉ"
            onPress={() => router.push('/edit-profile')}
            palette={palette}
          />
          <SettingRow
            icon="lock-closed-outline"
            title="Đổi mật khẩu"
            subtitle="Cập nhật mật khẩu đăng nhập của bạn"
            onPress={() => router.push('/change-password')}
            palette={palette}
            isLast
          />
        </View>

        <View style={[styles.card, { backgroundColor: palette.card }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Ứng dụng</Text>
          <SettingRow
            icon="notifications-outline"
            title="Thông báo"
            subtitle="Xem các thông báo và cập nhật từ hệ thống"
            onPress={() => router.push('/notifications')}
            palette={palette}
          />
          <View style={[styles.toggleRow, { borderTopColor: palette.border }]}>
            <View style={[styles.settingIconWrap, { backgroundColor: palette.soft }]}>
              <Ionicons name="moon-outline" size={20} color={palette.action} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, { color: palette.text }]}>Chế độ tối</Text>
              <Text style={[styles.settingSubtitle, { color: palette.subtext }]}>
                Bật hoặc tắt giao diện tối cho toàn bộ ứng dụng
              </Text>
            </View>
            <Switch
              value={preference === 'dark'}
              onValueChange={(value) => setPreference(value ? 'dark' : 'light')}
              trackColor={{ false: '#CBD5E1', true: '#14B8A6' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.card }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Hỗ trợ</Text>
          <SettingRow
            icon="help-circle-outline"
            title="Liên hệ hỗ trợ"
            subtitle="Hotline: 1900 0000 · Email: support@smartgarage.vn"
            onPress={() =>
              Alert.alert('Hỗ trợ', 'Liên hệ hotline 1900 0000 hoặc email support@smartgarage.vn')
            }
            palette={palette}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            title="Chính sách bảo mật"
            subtitle="Xem thông tin về dữ liệu và quyền riêng tư"
            onPress={() =>
              Alert.alert('Chính sách bảo mật', 'Mục này đang chờ nội dung chính thức từ hệ thống.')
            }
            palette={palette}
            isLast
          />
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: palette.card, borderColor: palette.danger }]}
          onPress={handleLogout}
          activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={palette.danger} />
          <Text style={[styles.logoutText, { color: palette.danger }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  palette,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  palette: {
    text: string;
    subtext: string;
    border: string;
    soft: string;
    action: string;
  };
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: palette.border }, isLast && styles.settingRowLast]}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={[styles.settingIconWrap, { backgroundColor: palette.soft }]}>
        <Ionicons name={icon} size={20} color={palette.action} />
      </View>
      <View style={styles.settingTextWrap}>
        <Text style={[styles.settingTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: palette.subtext }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  settingRow: {
    marginTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  toggleRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTextWrap: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  settingSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
