import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { useRouter } from 'expo-router';

import { useThemePreference } from '@/contexts/theme-preference';
import authService from '@/services/authService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = colorScheme === 'dark';
  const palette = {
    screen: isDark ? '#020617' : '#F0FDFA',
    heroStart: isDark ? '#0F172A' : '#0F766E',
    heroEnd: isDark ? '#134E4A' : '#115E59',
    card: isDark ? '#0F172A' : '#FFFFFF',
    text: isDark ? '#E2E8F0' : '#0F172A',
    subtext: isDark ? '#94A3B8' : '#475569',
    input: isDark ? '#111827' : '#F8FAFC',
    inputBorder: isDark ? '#334155' : '#CCFBF1',
    action: isDark ? '#14B8A6' : '#0F766E',
  };

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const payload = {
      email: normalizedEmail,
      password,
      fullName: fullName.trim(),
      phone: phone.trim(),
      province: province.trim(),
      ward: ward.trim(),
      houseNumber: houseNumber.trim(),
    };

    if (
      !payload.email ||
      !payload.password ||
      !confirmPassword ||
      !payload.fullName ||
      !payload.phone ||
      !payload.province ||
      !payload.ward ||
      !payload.houseNumber
    ) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin đăng ký.');
      return;
    }

    if (!EMAIL_REGEX.test(payload.email)) {
      Alert.alert('Email chưa đúng', 'Vui lòng nhập đúng định dạng email, ví dụ: tenban@example.com.');
      return;
    }

    if (payload.password.length < 8) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu cần có ít nhất 8 ký tự.');
      return;
    }

    if (payload.password !== confirmPassword) {
      Alert.alert('Không khớp', 'Mật khẩu xác nhận chưa trùng với mật khẩu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.register(payload);
      Alert.alert(
        'Đăng ký thành công',
        String(response?.message || 'Tài khoản của bạn đã được tạo.'),
        [{ text: 'Đăng nhập', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      console.error('Register failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể đăng ký tài khoản lúc này.';
      Alert.alert('Đăng ký thất bại', String(serverMessage));
    } finally {
      setIsSubmitting(false);
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

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <LinearGradient colors={[palette.heroStart, palette.heroEnd]} style={styles.heroCard}>
            <Text style={styles.heroTitle}>Đăng ký tài khoản</Text>
            <Text style={styles.heroText}>
              Tạo tài khoản khách hàng để đặt lịch sửa chữa, quản lý xe và theo dõi hóa đơn.
            </Text>
          </LinearGradient>

          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Thông tin đăng nhập</Text>

            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập email của bạn"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              palette={palette}
            />

            <PasswordField
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              placeholder="Ít nhất 8 ký tự"
              secureTextEntry={!showPassword}
              onToggleVisibility={() => setShowPassword((prev) => !prev)}
              isVisible={showPassword}
              palette={palette}
            />

            <PasswordField
              label="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu"
              secureTextEntry={!showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
              isVisible={showConfirmPassword}
              palette={palette}
            />
          </View>

          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Thông tin cá nhân</Text>

            <TextField
              label="Họ tên"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ tên"
              icon="person-outline"
              palette={palette}
            />

            <TextField
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              placeholder="Ví dụ: 0912345678"
              icon="call-outline"
              keyboardType="phone-pad"
              palette={palette}
            />

            <TextField
              label="Tỉnh/Thành phố"
              value={province}
              onChangeText={setProvince}
              placeholder="Ví dụ: TP. Hồ Chí Minh"
              icon="location-outline"
              palette={palette}
            />

            <TextField
              label="Phường/Xã"
              value={ward}
              onChangeText={setWard}
              placeholder="Ví dụ: Phường Linh Trung"
              icon="map-outline"
              palette={palette}
            />

            <TextField
              label="Số nhà, tên đường"
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder="Ví dụ: 01 Võ Văn Ngân"
              icon="home-outline"
              palette={palette}
            />

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: palette.action }]}
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.85}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Đăng ký</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: palette.subtext }]}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={[styles.footerLink, { color: palette.action }]}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.fieldLabel, { color }]}>{label}</Text>;
}

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  palette,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  palette: {
    text: string;
    subtext: string;
    input: string;
    inputBorder: string;
  };
}) {
  return (
    <View style={styles.fieldGroup}>
      <FieldLabel label={label} color={palette.text} />
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: palette.input, borderColor: palette.inputBorder },
        ]}>
        <Ionicons name={icon} size={18} color={palette.subtext} />
        <TextInput
          style={[styles.input, { color: palette.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.subtext}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  onToggleVisibility,
  isVisible,
  palette,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry: boolean;
  onToggleVisibility: () => void;
  isVisible: boolean;
  palette: {
    text: string;
    subtext: string;
    input: string;
    inputBorder: string;
  };
}) {
  return (
    <View style={styles.fieldGroup}>
      <FieldLabel label={label} color={palette.text} />
      <View
        style={[
          styles.passwordInputWrap,
          { backgroundColor: palette.input, borderColor: palette.inputBorder },
        ]}>
        <TextInput
          style={[styles.passwordInput, { color: palette.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.subtext}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
        <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeButton}>
          <Ionicons name={isVisible ? 'eye-outline' : 'eye-off-outline'} size={20} color={palette.subtext} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
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
  fieldGroup: {
    marginTop: 16,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  inputWrap: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 14,
  },
  input: {
    flex: 1,
    minHeight: 52,
    fontSize: 15,
  },
  passwordInputWrap: {
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  passwordInput: {
    flex: 1,
    minHeight: 52,
    fontSize: 15,
  },
  eyeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
  },
});
