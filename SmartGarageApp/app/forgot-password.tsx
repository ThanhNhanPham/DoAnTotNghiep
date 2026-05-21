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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [hasRequestedCode, setHasRequestedCode] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    soft: isDark ? '#111827' : '#ECFDF5',
  };

  const handleRequestCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert('Thiếu email', 'Vui lòng nhập email tài khoản để nhận mã xác nhận.');
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      Alert.alert('Email chưa đúng', 'Vui lòng nhập đúng định dạng email, ví dụ: tenban@example.com.');
      return;
    }

    setIsRequestingCode(true);

    try {
      const response = await authService.forgotPassword({ email: normalizedEmail });
      setEmail(normalizedEmail);
      setHasRequestedCode(true);
      Alert.alert('Đã gửi mã', String(response?.message || 'Mã xác nhận đã được gửi về email của bạn.'));
    } catch (error: any) {
      console.error('Forgot password request failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể gửi mã xác nhận lúc này.';
      Alert.alert('Gửi mã thất bại', String(serverMessage));
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token || !newPassword || !confirmNewPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mã xác nhận và đầy đủ mật khẩu mới.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu mới cần có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Không khớp', 'Mật khẩu mới và xác nhận mật khẩu chưa trùng nhau.');
      return;
    }

    setIsResettingPassword(true);

    try {
      const response = await authService.resetPassword({
        token: token.trim(),
        newPassword,
        confirmNewPassword,
      });

      Alert.alert(
        'Thành công',
        String(response?.message || 'Đặt lại mật khẩu thành công.'),
        [{ text: 'Đăng nhập', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      console.error('Reset password failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể đặt lại mật khẩu lúc này.';
      Alert.alert('Đặt lại mật khẩu thất bại', String(serverMessage));
    } finally {
      setIsResettingPassword(false);
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
            <Text style={styles.heroTitle}>Quên mật khẩu</Text>
            <Text style={styles.heroText}>
              Nhập email để nhận mã xác nhận, sau đó đặt lại mật khẩu mới cho tài khoản của bạn.
            </Text>
          </LinearGradient>

          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.stepBadge, { backgroundColor: palette.soft }]}>
                <Text style={[styles.stepBadgeText, { color: palette.action }]}>Bước 1</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Nhận mã xác nhận</Text>
            </View>

            <FieldLabel label="Email tài khoản" color={palette.text} />
            <View
              style={[
                styles.inputWrap,
                { backgroundColor: palette.input, borderColor: palette.inputBorder },
              ]}>
              <Ionicons name="mail-outline" size={18} color={palette.subtext} />
              <TextInput
                style={[styles.input, { color: palette.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Nhập email của bạn"
                placeholderTextColor={palette.subtext}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: palette.action }]}
              onPress={handleRequestCode}
              disabled={isRequestingCode}>
              {isRequestingCode ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {hasRequestedCode ? 'Gửi lại mã xác nhận' : 'Gửi mã xác nhận'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.stepBadge, { backgroundColor: palette.soft }]}>
                <Text style={[styles.stepBadgeText, { color: palette.action }]}>Bước 2</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Đặt lại mật khẩu</Text>
            </View>

            <FieldLabel label="Mã xác nhận" color={palette.text} />
            <View
              style={[
                styles.inputWrap,
                { backgroundColor: palette.input, borderColor: palette.inputBorder },
              ]}>
              <Ionicons name="key-outline" size={18} color={palette.subtext} />
              <TextInput
                style={[styles.input, { color: palette.text }]}
                value={token}
                onChangeText={setToken}
                placeholder="Nhập mã gửi về email"
                placeholderTextColor={palette.subtext}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
              />
            </View>

            <PasswordField
              label="Mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Ít nhất 8 ký tự"
              secureTextEntry={!showNewPassword}
              onToggleVisibility={() => setShowNewPassword((prev) => !prev)}
              isVisible={showNewPassword}
              palette={palette}
            />

            <PasswordField
              label="Xác nhận mật khẩu mới"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              placeholder="Nhập lại mật khẩu mới"
              secureTextEntry={!showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
              isVisible={showConfirmPassword}
              palette={palette}
            />

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: palette.action }]}
              onPress={handleResetPassword}
              disabled={isResettingPassword}>
              {isResettingPassword ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Đặt lại mật khẩu</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.fieldLabel, { color }]}>{label}</Text>;
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
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
    fontSize: 15,
    minHeight: 52,
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
});
