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

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
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
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu mới cần có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Không khớp', 'Mật khẩu mới và xác nhận mật khẩu chưa trùng nhau.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.changePassword({
        oldPassword: currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Thành công', 'Mật khẩu của bạn đã được cập nhật.');
    } catch (error: any) {
      console.error('Change password failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể đổi mật khẩu lúc này. Vui lòng thử lại.';

      Alert.alert('Đổi mật khẩu thất bại', String(serverMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.screen }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: palette.action }]} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={[palette.heroStart, palette.heroEnd]} style={styles.heroCard}>
            <Text style={styles.heroTitle}>Đổi mật khẩu</Text>
            <Text style={styles.heroText}>
              Cập nhật mật khẩu mới để tài khoản của bạn an toàn hơn.
            </Text>
          </LinearGradient>

          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <PasswordField
              label="Mật khẩu hiện tại"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Nhập mật khẩu hiện tại"
              secureTextEntry={!showCurrentPassword}
              onToggleVisibility={() => setShowCurrentPassword((prev) => !prev)}
              isVisible={showCurrentPassword}
              palette={palette}
            />
            <PasswordField
              label="Mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Ít nhất 6 ký tự"
              secureTextEntry={!showNewPassword}
              onToggleVisibility={() => setShowNewPassword((prev) => !prev)}
              isVisible={showNewPassword}
              palette={palette}
            />
            <PasswordField
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu mới"
              secureTextEntry={!showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
              isVisible={showConfirmPassword}
              palette={palette}
            />

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: palette.action }]}
              onPress={handleChangePassword}
              disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Cập nhật mật khẩu</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
      <Text style={[styles.fieldLabel, { color: palette.text }]}>{label}</Text>
      <View style={[styles.passwordInputWrap, { backgroundColor: palette.input, borderColor: palette.inputBorder }]}>
        <TextInput
          style={[styles.passwordInput, { color: palette.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.subtext}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
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
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 18,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
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
  fieldGroup: {
    marginTop: 16,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
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
