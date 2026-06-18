import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useThemePreference } from '@/contexts/theme-preference';

const BENEFITS = [
  {
    icon: 'shield-checkmark-outline',
    title: 'An toàn hơn khi di chuyển',
    text: 'Kiểm tra phanh, lốp, đèn, dầu và hệ thống lái giúp phát hiện sớm dấu hiệu bất thường trước khi xe gặp sự cố trên đường.',
  },
  {
    icon: 'cash-outline',
    title: 'Giảm chi phí sửa chữa lớn',
    text: 'Một lỗi nhỏ nếu được xử lý sớm thường rẻ hơn nhiều so với khi để hỏng lan sang động cơ, hộp số, phanh hoặc hệ thống điện.',
  },
  {
    icon: 'speedometer-outline',
    title: 'Xe vận hành êm và tiết kiệm',
    text: 'Thay dầu, vệ sinh lọc gió, bugi, kim phun và kiểm tra áp suất lốp giúp xe bốc hơn, ít hao nhiên liệu hơn.',
  },
  {
    icon: 'car-sport-outline',
    title: 'Giữ giá trị xe lâu dài',
    text: 'Xe có lịch sử bảo dưỡng đều đặn thường ít xuống cấp, ngoại thất sạch hơn và dễ tạo niềm tin khi cần bán lại.',
  },
];

const RISKS = [
  'Dầu máy bẩn làm tăng ma sát, khiến động cơ nóng, ì và dễ mòn chi tiết.',
  'Phanh, lốp hoặc đèn không được kiểm tra có thể gây mất an toàn khi đi mưa, đi đêm hoặc phanh gấp.',
  'Bụi bẩn tích tụ ở khoang máy, lọc gió, dàn lạnh và nội thất làm xe có mùi, giảm hiệu suất và ảnh hưởng sức khỏe.',
  'Các lỗi nhỏ như rò rỉ dầu, nước làm mát yếu, dây curoa nứt có thể biến thành hư hỏng nặng nếu bị bỏ qua.',
];

const SCHEDULES = [
  'Kiểm tra nhanh lốp, đèn, phanh và mức dầu mỗi 2 đến 4 tuần.',
  'Thay dầu, vệ sinh lọc gió và kiểm tra tổng quát theo khuyến nghị của hãng hoặc sau mỗi 5.000 đến 10.000 km.',
  'Rửa xe, vệ sinh gầm và nội thất thường xuyên hơn sau khi đi mưa, đường ngập, đường bụi hoặc đường biển.',
];

export default function MaintenanceDocsScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const isDark = colorScheme === 'dark';
  const palette = {
    screen: isDark ? '#020617' : '#F8FAFC',
    heroStart: isDark ? '#0F172A' : '#0F766E',
    heroEnd: isDark ? '#1E293B' : '#14B8A6',
    card: isDark ? '#0F172A' : '#FFFFFF',
    border: isDark ? '#1E293B' : '#E2E8F0',
    text: isDark ? '#E2E8F0' : '#0F172A',
    subtext: isDark ? '#94A3B8' : '#475569',
    action: isDark ? '#2DD4BF' : '#0F766E',
    soft: isDark ? '#112D2A' : '#ECFDF5',
    warningSoft: isDark ? '#3A1F1F' : '#FEF2F2',
    warning: isDark ? '#FCA5A5' : '#DC2626',
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
          <View style={styles.heroIconWrap}>
            <Ionicons name="construct-outline" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Bảo dưỡng định kỳ</Text>
          <Text style={styles.heroText}>
            Chăm xe đều đặn giúp xe bền hơn, an toàn hơn và tránh những khoản sửa chữa bất ngờ.
          </Text>
        </LinearGradient>

        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Lợi ích chính</Text>
          {BENEFITS.map((item) => (
            <View key={item.title} style={styles.infoRow}>
              <View style={[styles.iconWrap, { backgroundColor: palette.soft }]}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={21} color={palette.action} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={[styles.infoTitle, { color: palette.text }]}>{item.title}</Text>
                <Text style={[styles.infoText, { color: palette.subtext }]}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Nếu bỏ qua bảo dưỡng</Text>
          {RISKS.map((risk) => (
            <View key={risk} style={styles.bulletRow}>
              <View style={[styles.warningIconWrap, { backgroundColor: palette.warningSoft }]}>
                <Ionicons name="alert-circle-outline" size={18} color={palette.warning} />
              </View>
              <Text style={[styles.bulletText, { color: palette.subtext }]}>{risk}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Nên duy trì thói quen</Text>
          {SCHEDULES.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <View style={[styles.checkIconWrap, { backgroundColor: palette.soft }]}>
                <Ionicons name="checkmark" size={17} color={palette.action} />
              </View>
              <Text style={[styles.bulletText, { color: palette.subtext }]}>{item}</Text>
            </View>
          ))}
        </View>
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
    gap: 16,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    minHeight: 190,
    justifyContent: 'flex-end',
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.86)',
  },
  section: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrap: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  warningIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
