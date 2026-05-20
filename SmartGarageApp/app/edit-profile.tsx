import React, { useEffect, useMemo, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useThemePreference } from '@/contexts/theme-preference';
import userService from '@/services/userService';

function parseStoredAddress(address: string | null) {
  if (!address) {
    return {
      houseNumber: '',
      ward: '',
      province: '',
    };
  }

  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);

  if (parts.length >= 3) {
    return {
      houseNumber: parts.slice(0, parts.length - 2).join(', '),
      ward: parts[parts.length - 2] || '',
      province: parts[parts.length - 1] || '',
    };
  }

  return {
    houseNumber: parts[0] || '',
    ward: parts[1] || '',
    province: parts[2] || '',
  };
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [ward, setWard] = useState('');
  const [province, setProvince] = useState('');
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  const isDark = colorScheme === 'dark';
  const palette = useMemo(
    () => ({
      screen: isDark ? '#020617' : '#F0FDFA',
      heroStart: isDark ? '#0F172A' : '#0F766E',
      heroEnd: isDark ? '#134E4A' : '#115E59',
      card: isDark ? '#0F172A' : '#FFFFFF',
      text: isDark ? '#E2E8F0' : '#0F172A',
      subtext: isDark ? '#94A3B8' : '#475569',
      input: isDark ? '#111827' : '#F8FAFC',
      inputBorder: isDark ? '#334155' : '#CCFBF1',
      action: isDark ? '#14B8A6' : '#0F766E',
    }),
    [isDark]
  );

  useEffect(() => {
    if (isBootstrapped) {
      return;
    }

    const bootstrap = async () => {
      const [storedName, storedPhone, storedAddress] = await Promise.all([
        AsyncStorage.getItem('fullName'),
        AsyncStorage.getItem('userPhone'),
        AsyncStorage.getItem('fullAddress'),
      ]);

      const parsedAddress = parseStoredAddress(storedAddress);

      setFullName(storedName || '');
      setPhone(storedPhone || '');
      setHouseNumber(parsedAddress.houseNumber);
      setWard(parsedAddress.ward);
      setProvince(parsedAddress.province);
      setIsBootstrapped(true);
    };

    bootstrap();
  }, [isBootstrapped]);

  const handleUpdateProfile = async () => {
    const userId = await AsyncStorage.getItem('userId');

    if (!userId) {
      Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại để cập nhật thông tin.');
      router.replace('/login');
      return;
    }

    if (!fullName.trim() || !phone.trim() || !houseNumber.trim() || !ward.trim() || !province.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedUser = await userService.updateUser(Number(userId), {
        fullName: fullName.trim(),
        phone: phone.trim(),
        houseNumber: houseNumber.trim(),
        ward: ward.trim(),
        province: province.trim(),
      });

      const updatedAddress =
        updatedUser.fullAddress ||
        `${updatedUser.houseNumber}, ${updatedUser.ward}, ${updatedUser.province}`;

      await Promise.all([
        AsyncStorage.setItem('fullName', updatedUser.fullName),
        AsyncStorage.setItem('fullAddress', updatedAddress),
        AsyncStorage.setItem('userPhone', updatedUser.phone),
      ]);

      Alert.alert('Cập nhật thành công', 'Thông tin cá nhân của bạn đã được lưu.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Update profile failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể cập nhật thông tin lúc này. Vui lòng thử lại.';

      Alert.alert('Cập nhật thất bại', String(serverMessage));
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
            <Text style={styles.heroTitle}>Cập nhật thông tin cá nhân</Text>
            <Text style={styles.heroText}>
              Chỉnh sửa họ tên, số điện thoại và địa chỉ để gara hỗ trợ bạn chính xác hơn.
            </Text>
          </LinearGradient>

          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <ProfileField label="Họ và tên" value={fullName} onChangeText={setFullName} placeholder="Nhập họ và tên" palette={palette} />
            <ProfileField
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              palette={palette}
            />
            <ProfileField
              label="Số nhà, tên đường"
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder="Ví dụ: 123 Lê Lợi"
              palette={palette}
            />
            <ProfileField label="Phường / Xã" value={ward} onChangeText={setWard} placeholder="Nhập phường / xã" palette={palette} />
            <ProfileField
              label="Tỉnh / Thành phố"
              value={province}
              onChangeText={setProvince}
              placeholder="Nhập tỉnh / thành phố"
              palette={palette}
            />

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: palette.action }]}
              onPress={handleUpdateProfile}
              disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Lưu thông tin</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  palette,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  palette: {
    text: string;
    subtext: string;
    input: string;
    inputBorder: string;
  };
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: palette.text }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: palette.input, borderColor: palette.inputBorder }]}>
        <TextInput
          style={[styles.input, { color: palette.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.subtext}
          keyboardType={keyboardType}
        />
      </View>
    </View>
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
  keyboardAvoidingView: {
    flex: 1,
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
  fieldGroup: {
    marginTop: 16,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  input: {
    minHeight: 52,
    fontSize: 15,
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
