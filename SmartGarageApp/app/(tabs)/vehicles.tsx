import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
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
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import vehicleService, { Vehicle, VehiclePayload, VehicleType } from '@/services/vehicleService';

const LICENSE_PLATE_REGEX = /^[0-9]{2}[A-Z0-9]{1,2}-[0-9]{4,5}$/;

const BRANDS: Record<VehicleType, string[]> = {
  MOTORBIKE: ['Honda', 'Yamaha', 'Suzuki', 'Piaggio', 'VinFast'],
  CAR: ['Toyota', 'Hyundai', 'Kia', 'Mazda', 'Ford', 'BMW'],
};

const EMPTY_FORM: VehiclePayload = {
  type: 'MOTORBIKE',
  licensePlate: '',
  brand: '',
  model: '',
  color: '',
  imageUrl: '',
  isActive: true,
};

export default function VehiclesScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<VehiclePayload>(EMPTY_FORM);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');

      if (!storedUserId) {
        Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại để quản lý xe.', [
          {
            text: 'Đăng nhập',
            onPress: () => router.replace('/login'),
          },
        ]);
        return;
      }

      const parsedUserId = Number(storedUserId);
      setUserId(parsedUserId);
      await loadVehicles(parsedUserId);
    } catch (error) {
      console.error('Bootstrap vehicles failed:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu xe. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVehicles = async (targetUserId = userId, refreshing = false) => {
    if (!targetUserId) {
      return;
    }

    if (refreshing) {
      setIsRefreshing(true);
    }

    try {
      const data = await vehicleService.getVehiclesByUserId(targetUserId);
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load vehicles failed:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách xe từ máy chủ.');
    } finally {
      if (refreshing) {
        setIsRefreshing(false);
      }
    }
  };

  const updateForm = <K extends keyof VehiclePayload>(key: K, value: VehiclePayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickType = (type: VehicleType) => {
    setForm((prev) => ({
      ...prev,
      type,
      brand: BRANDS[type].includes(prev.brand) ? prev.brand : '',
    }));
  };

  const validateForm = () => {
    if (!form.licensePlate || !form.brand || !form.model) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập biển số, hãng xe và model.');
      return false;
    }

    if (!LICENSE_PLATE_REGEX.test(form.licensePlate.trim().toUpperCase())) {
      Alert.alert('Biển số chưa đúng', 'Ví dụ đúng: 51G-12345 hoặc 29A1-12345.');
      return false;
    }

    return true;
  };

  const uploadSelectedImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setIsUploadingImage(true);
      const imageUrl = await vehicleService.uploadVehicleImage({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
      updateForm('imageUrl', imageUrl);
      Alert.alert('Thành công', 'Ảnh xe đã được tải lên.');
    } catch (error: any) {
      console.error('Upload vehicle image failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể tải ảnh lên. Vui lòng thử lại.';

      Alert.alert('Tải ảnh thất bại', String(serverMessage));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePickImageFromLibrary = async (allowsEditing = false) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Thiếu quyền', 'Bạn cần cho phép truy cập thư viện ảnh để chọn ảnh xe.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadSelectedImage(result.assets[0]);
    }
  };

  const handleCaptureVehicleImage = async (allowsEditing = false) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Thiếu quyền', 'Bạn cần cho phép sử dụng camera để chụp ảnh xe.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadSelectedImage(result.assets[0]);
    }
  };

  const openVehicleImageOptions = () => {
    if (isUploadingImage) {
      return;
    }

    Alert.alert('Hình ảnh', 'Bạn muốn tải ảnh gốc hay chỉnh sửa trước khi tải lên?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Chụp ảnh gốc', onPress: () => handleCaptureVehicleImage(false) },
      { text: 'Chụp & chỉnh sửa', onPress: () => handleCaptureVehicleImage(true) },
      { text: 'Chọn ảnh gốc', onPress: () => handlePickImageFromLibrary(false) },
      { text: 'Chọn & chỉnh sửa', onPress: () => handlePickImageFromLibrary(true) },
    ]);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingVehicleId(null);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setForm({
      type: vehicle.type,
      licensePlate: vehicle.licensePlate,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color || '',
      imageUrl: vehicle.imageUrl || '',
      isActive: vehicle.isActive,
    });
  };

  const handleDeleteVehicle = (vehicleId: number) => {
    Alert.alert('Xoá xe', 'Bạn có chắc muốn xoá xe này khỏi danh sách không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await vehicleService.deleteVehicle(vehicleId);
            setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== vehicleId));

            if (editingVehicleId === vehicleId) {
              resetForm();
            }

            Alert.alert('Thành công', 'Đã xoá xe khỏi danh sách.');
          } catch (error: any) {
            console.error('Delete vehicle failed:', error);
            const serverMessage =
              error?.response?.data?.message ||
              error?.response?.data ||
              'Không thể xoá xe. Vui lòng thử lại.';

            Alert.alert('Xoá xe thất bại', String(serverMessage));
          }
        },
      },
    ]);
  };

  const submitVehicle = async () => {
    if (!userId || isSubmitting || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: VehiclePayload = {
        ...form,
        licensePlate: form.licensePlate.trim().toUpperCase(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        color: form.color?.trim() || '',
        imageUrl: form.imageUrl?.trim() || '',
        isActive: form.isActive ?? true,
      };

      if (editingVehicleId) {
        const updatedVehicle = await vehicleService.updateVehicle(editingVehicleId, payload);
        setVehicles((prev) =>
          prev.map((vehicle) => (vehicle.id === editingVehicleId ? updatedVehicle : vehicle))
        );
        Alert.alert('Thành công', 'Đã cập nhật thông tin xe.');
      } else {
        const createdVehicle = await vehicleService.createVehicle(userId, payload);
        setVehicles((prev) => [createdVehicle, ...prev]);
        Alert.alert('Thành công', 'Đã thêm xe vào tài khoản của bạn.');
      }

      resetForm();
    } catch (error: any) {
      console.error('Submit vehicle failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể lưu xe. Vui lòng kiểm tra lại thông tin.';

      Alert.alert(editingVehicleId ? 'Cập nhật xe thất bại' : 'Thêm xe thất bại', String(serverMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitVehicle = () => {
    if (editingVehicleId) {
      Alert.alert(
        'Xác nhận cập nhật',
        'Bạn có chắc muốn cập nhật thông tin xe này không?',
        [
          { text: 'Huỷ', style: 'cancel' },
          {
            text: 'Cập nhật',
            onPress: () => {
              submitVehicle();
            },
          },
        ]
      );
      return;
    }

    submitVehicle();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadVehicles(undefined, true)}
            tintColor="#2563EB"
          />
        }>
        <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Xe của tôi</Text>
          <Text style={styles.heroSubtitle}>
            Quản lý phương tiện và thêm xe mới để đặt lịch sửa chữa nhanh hơn.
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{vehicles.length}</Text>
              <Text style={styles.statLabel}>Xe đã đăng ký</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{vehicles.filter((vehicle) => vehicle.isActive).length}</Text>
              <Text style={styles.statLabel}>Đang hoạt động</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{editingVehicleId ? 'Cập nhật xe' : 'Thêm xe mới'}</Text>
            <Ionicons name={editingVehicleId ? 'create' : 'add-circle'} size={22} color="#2563EB" />
          </View>

          <Text style={styles.fieldLabel}>Loại xe</Text>
          <View style={styles.typeRow}>
            {(['MOTORBIKE', 'CAR'] as VehicleType[]).map((type) => {
              const isActive = form.type === type;

              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeButton, isActive && styles.typeButtonActive]}
                  onPress={() => handlePickType(type)}>
                  <Ionicons
                    name={type === 'CAR' ? 'car-sport' : 'bicycle'}
                    size={18}
                    color={isActive ? '#FFFFFF' : '#2563EB'}
                  />
                  <Text style={[styles.typeButtonText, isActive && styles.typeButtonTextActive]}>
                    {type === 'CAR' ? 'Ô tô' : 'Xe máy'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Biển số xe</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 51G-12345"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            value={form.licensePlate}
            onChangeText={(value) => updateForm('licensePlate', value)}
          />

          <Text style={styles.fieldLabel}>Hãng xe</Text>
          <View style={styles.brandWrap}>
            {BRANDS[form.type].map((brand) => {
              const isSelected = form.brand === brand;

              return (
                <TouchableOpacity
                  key={brand}
                  style={[styles.brandChip, isSelected && styles.brandChipActive]}
                  onPress={() => updateForm('brand', brand)}>
                  <Text style={[styles.brandChipText, isSelected && styles.brandChipTextActive]}>
                    {brand}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Hoặc nhập hãng xe khác"
            placeholderTextColor="#9CA3AF"
            value={form.brand}
            onChangeText={(value) => updateForm('brand', value)}
          />

          <Text style={styles.fieldLabel}>Model</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Vision, Air Blade, Camry..."
            placeholderTextColor="#9CA3AF"
            value={form.model}
            onChangeText={(value) => updateForm('model', value)}
          />

          <Text style={styles.fieldLabel}>Màu sắc</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Đen, Trắng, Xanh..."
            placeholderTextColor="#9CA3AF"
            value={form.color}
            onChangeText={(value) => updateForm('color', value)}
          />

          <Text style={styles.fieldLabel}>Hình ảnh</Text>
          <View style={styles.imageUploadCard}>
            {form.imageUrl ? (
              <Image source={{ uri: form.imageUrl }} style={styles.formVehicleImage} resizeMode="contain" />
            ) : (
              <View style={styles.formVehicleImagePlaceholder}>
                <Ionicons name={form.type === 'CAR' ? 'car-sport-outline' : 'bicycle-outline'} size={30} color="#60A5FA" />
              </View>
            )}

            <View style={styles.imageUploadContent}>
              <Text style={styles.imageUploadTitle}>
                {form.imageUrl ? 'Ảnh xe đã sẵn sàng' : 'Thêm ảnh cho phương tiện'}
              </Text>
              <Text style={styles.imageUploadText}>
                Chụp ảnh mới hoặc chọn ảnh có sẵn từ thư viện trên thiết bị.
              </Text>

              <View style={styles.imageUploadActions}>
                <TouchableOpacity
                  style={[styles.imageActionButton, isUploadingImage && styles.submitButtonDisabled]}
                  onPress={openVehicleImageOptions}
                  disabled={isUploadingImage}>
                  {isUploadingImage ? (
                    <ActivityIndicator color="#1D4ED8" />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={18} color="#1D4ED8" />
                      <Text style={styles.imageActionButtonText}>
                        {form.imageUrl ? 'Đổi ảnh xe' : 'Thêm ảnh xe'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {form.imageUrl ? (
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => updateForm('imageUrl', '')}
                    disabled={isUploadingImage}>
                    <Text style={styles.removeImageButtonText}>Xoá ảnh</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmitVehicle}
            disabled={isSubmitting || isUploadingImage}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {editingVehicleId ? 'Cập nhật xe' : 'Lưu xe vào tài khoản'}
              </Text>
            )}
          </TouchableOpacity>

          {editingVehicleId ? (
            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelButtonText}>Huỷ chỉnh sửa</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Danh sách xe</Text>

          {vehicles.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={36} color="#93C5FD" />
              <Text style={styles.emptyTitle}>Bạn chưa có xe nào</Text>
              <Text style={styles.emptyText}>Thêm chiếc xe đầu tiên để bắt đầu đặt lịch dịch vụ.</Text>
            </View>
          ) : (
            vehicles.map((vehicle) => (
              <View key={vehicle.id} style={styles.vehicleCard}>
                <View style={styles.vehicleMainRow}>
                  {vehicle.imageUrl ? (
                    <Image source={{ uri: vehicle.imageUrl }} style={styles.vehicleImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.vehicleImagePlaceholder}>
                      <Ionicons
                        name={vehicle.type === 'CAR' ? 'car-sport-outline' : 'bicycle-outline'}
                        size={28}
                        color="#60A5FA"
                      />
                    </View>
                  )}

                  <View style={styles.vehicleInfo}>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleBadgeRow}>
                        <View style={styles.vehicleTypeBadge}>
                          <Ionicons
                            name={vehicle.type === 'CAR' ? 'car-sport' : 'bicycle'}
                            size={16}
                            color="#2563EB"
                          />
                          <Text style={styles.vehicleTypeText}>
                            {vehicle.type === 'CAR' ? 'Ô tô' : 'Xe máy'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.plateText}>{vehicle.licensePlate}</Text>
                    <Text style={styles.vehicleName}>
                      {vehicle.brand} {vehicle.model}
                    </Text>
                    <Text style={styles.vehicleMeta}>
                      Màu: {vehicle.color || 'Chưa cập nhật'}
                    </Text>
                  </View>

                  <View style={styles.vehicleRightColumn}>
                    <View style={[styles.statusBadge, !vehicle.isActive && styles.statusBadgeInactive]}>
                      <Text
                        style={[
                          styles.statusText,
                          !vehicle.isActive && styles.statusTextInactive,
                        ]}>
                        {vehicle.isActive ? 'Hoạt động' : 'Ngưng dùng'}
                      </Text>
                    </View>

                    <View style={styles.vehicleActionRow}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditVehicle(vehicle)}
                        activeOpacity={0.8}>
                        <Ionicons name="create-outline" size={18} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteActionButton]}
                        onPress={() => handleDeleteVehicle(vehicle.id)}
                        activeOpacity={0.8}>
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 18,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.85)',
  },
  heroStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    marginTop: 6,
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    paddingVertical: 14,
  },
  typeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },
  imageUploadCard: {
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 14,
  },
  formVehicleImage: {
    width: 96,
    height: 96,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
  },
  formVehicleImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadContent: {
    flex: 1,
  },
  imageUploadTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  imageUploadText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
  },
  imageUploadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  imageActionButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  imageActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  removeImageButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  brandWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  brandChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  brandChipActive: {
    backgroundColor: '#DBEAFE',
  },
  brandChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  brandChipTextActive: {
    color: '#1D4ED8',
  },
  submitButton: {
    marginTop: 20,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  listSection: {
    gap: 12,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  vehicleMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  vehicleImage: {
    width: 84,
    height: 84,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
  },
  vehicleImagePlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleHeader: {
    marginBottom: 8,
  },
  vehicleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleRightColumn: {
    alignItems: 'flex-end',
    gap: 10,
  },
  vehicleActionRow: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 10,
    justifyContent: 'flex-start',
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  deleteActionButton: {
    backgroundColor: '#FEE2E2',
  },
  vehicleTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  vehicleTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  statusTextInactive: {
    color: '#64748B',
  },
  plateText: {
    marginTop: 0,
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  vehicleName: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  vehicleMeta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
});
