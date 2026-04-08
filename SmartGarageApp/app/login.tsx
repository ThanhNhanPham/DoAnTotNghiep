import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, View, Text, ScrollView, Dimensions, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/constants/Api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import Car3DViewer from '@/components/Car3DViewer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Constants.statusBarHeight;

export default function LoginScreen() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email: email,
        password: password,
      });

      if (response.status === 200) {
        const data = response.data;
        console.log('API Login Response:', data); // Dòng này giúp bạn kiểm tra dữ liệu từ Server
        
        // Lưu chuyển hướng và token
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('userEmail', data.email);
        await AsyncStorage.setItem('userRole', data.role);
        await AsyncStorage.setItem('userId', data.userId.toString());
        
        // Lưu fullName từ backend
        const fullName = data.fullName || data.full_name;
        if (fullName) {
          await AsyncStorage.setItem('fullName', fullName);
        }
        
        if (data.fullAddress) {
          await AsyncStorage.setItem('fullAddress', data.fullAddress);
        }

        Alert.alert('Thành công', 'Đăng nhập thành công!');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
      
      if (error.response) {
        // Lỗi từ server (401, 400, v.v.)
        errorMessage = error.response.data || 'Email hoặc mật khẩu không chính xác!';
      } else if (error.request) {
        // Lỗi không kết nối được server
        errorMessage = 'Không thể kết nối đến máy chủ. Kiểm tra lại kết nối mạng hoặc server.';
      }

      Alert.alert('Đăng nhập thất bại', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Nền tràn toàn bộ màn hình */}
      <LinearGradient
        colors={['#F9FAFB', '#F3F4F6', '#E5E7EB']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        {/* Thanh điều hướng trên cùng cố định */}
        <View style={styles.topHeader}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Vùng hiển thị xe - Chiều cao cố định để tránh bị giãn quá mức */}
            <View style={styles.headerArea}>
              <View style={styles.logoContainer}>
                <Car3DViewer width={600} height={300} />
              </View>
            </View>

            {/* Thẻ Form đăng nhập - Đẩy cao lên để cân đối với xe */}
            <View style={styles.card}>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>Chào Mừng Trở Lại</Text>
                <Text style={styles.eyeIcon}>Đăng nhập để tiếp tục</Text>
              </View>

              {/* Input Fields */}
              <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập Email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu "
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    secureTextEntry={!showPassword}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Options Row */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity 
                    style={styles.checkboxContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <Ionicons 
                      name={rememberMe ? "checkmark-circle" : "ellipse-outline"} 
                      size={22} 
                      color={rememberMe ? "#6366F1" : "#D1D5DB"} 
                    /> 
                    <Text style={styles.rememberText}>Duy trì đăng nhập</Text>
                  </TouchableOpacity>

                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity 
                  onPress={handleLogin} 
                  activeOpacity={0.8} 
                  style={[styles.loginButtonContainer, isLoading && styles.disabledButton]}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.loginButtonText}>ĐĂNG NHẬP NGAY </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Signup Footer */}
                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                  <TouchableOpacity>
                    <Text style={styles.signupText}>Đăng ký ngay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
  },
  topHeader: {
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingHorizontal: 20,
    height: STATUS_BAR_HEIGHT + 64,
    justifyContent: 'center',
    zIndex: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerArea: {
    height: 220, // Chiều cao cố định để cân đối với xe
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0, // Kéo nhẹ lên gần back button
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderTopRightRadius:40,
    paddingHorizontal: 28,
    paddingTop: 45,
    marginTop: -20, // Kéo thẻ form chèn nhẹ lên nền xe để tạo sự liên kết
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 25,
    flex: 1,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#4B5563',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  loginButtonContainer: {
    width: '100%',
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.7,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    color: '#6B7280',
  },
  signupText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0e15eaff',
  },
});
