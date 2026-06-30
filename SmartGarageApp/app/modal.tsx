import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Markdown from 'react-native-markdown-display';
import { useLocalSearchParams, useRouter } from 'expo-router';

import bookingService, { PaymentMethod } from '@/services/bookingService';
import branchService, { Branch } from '@/services/branchService';
import garageService, { GarageService } from '@/services/garageService';
import vehicleService, { Vehicle } from '@/services/vehicleService';

type SlotOption = {
  id: string;
  label: string;
  sublabel: string;
  start: string;
  end: string;
  remainingCapacity?: number;
};

type DateOption = {
  id: string;
  label: string;
  sublabel: string;
};

const PAYMENT_OPTIONS: { label: string; value: PaymentMethod; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Tiền mặt', value: 'CASH', icon: 'cash-outline' },
  { label: 'Chuyển khoản', value: 'BANK_TRANSFER', icon: 'card-outline' },
];

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    Number(value || 0)
  );

const formatDistanceKm = (value?: number | null) => (value == null ? '' : `${value.toFixed(2)} km`);

const calculateDistanceKm = (
  fromLatitude: number,
  fromLongitude: number,
  toLatitude?: number | null,
  toLongitude?: number | null
) => {
  if (toLatitude == null || toLongitude == null) {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadiusKm = 6371;
  const latDistance = ((toLatitude - fromLatitude) * Math.PI) / 180;
  const lonDistance = ((toLongitude - fromLongitude) * Math.PI) / 180;
  const startLat = (fromLatitude * Math.PI) / 180;
  const endLat = (toLatitude * Math.PI) / 180;
  const haversine =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
  const distance = earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return Math.round(distance * 100) / 100;
};

const sortBranchesByCurrentLocation = (branches: Branch[], latitude: number, longitude: number) =>
  branches
    .map((branch) => ({
      ...branch,
      distanceKm: calculateDistanceKm(latitude, longitude, branch.latitude, branch.longitude),
    }))
    .sort((leftBranch, rightBranch) => (leftBranch.distanceKm ?? Infinity) - (rightBranch.distanceKm ?? Infinity));

const getBranchDistanceLabel = (branch: Branch) => {
  if (branch.travelDistanceKm != null) {
    return `Quãng đường di chuyển ${formatDistanceKm(branch.travelDistanceKm)}`;
  }

  if (branch.distanceKm != null) {
    return `Khoảng cách ước tính ${formatDistanceKm(branch.distanceKm)}`;
  }

  return '';
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const toDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseSlotDate = (value: string) => {
  const localDateTimeMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (localDateTimeMatch) {
    const [, year, month, day, hour, minute, second = '0'] = localDateTimeMatch;

    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? new Date(value) : parsedDate;
};

const generateDateOptions = (): DateOption[] => {
  const options: DateOption[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() + dayOffset);

    const weekday = date.toLocaleDateString('vi-VN', { weekday: 'short' });
    const dateText = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    options.push({
      id: toDateParam(date),
      label: dayOffset === 0 ? 'Hôm nay' : weekday,
      sublabel: dateText,
    });
  }

  return options;
};

const mapAvailableSlotToOption = (slot: { start: string; end: string; remainingCapacity: number }): SlotOption => {
  const start = parseSlotDate(slot.start);
  const end = parseSlotDate(slot.end);
  const weekday = start.toLocaleDateString('vi-VN', { weekday: 'short' });
  const dateText = start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  const startText = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const endText = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return {
    id: `${slot.start}-${slot.end}`,
    label: `${weekday}, ${dateText}`,
    sublabel: `${startText} - ${endText}`,
    start: slot.start,
    end: slot.end,
    remainingCapacity: slot.remainingCapacity,
  };
};

export default function BookingModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ issue?: string; aiSuggestion?: string }>();
  const issue = typeof params.issue === 'string' ? params.issue : '';
  const aiSuggestion = typeof params.aiSuggestion === 'string' ? params.aiSuggestion : '';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<GarageService[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => toDateParam(new Date()));
  const [slotOptions, setSlotOptions] = useState<SlotOption[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [note, setNote] = useState('');
  const [nearestBranchId, setNearestBranchId] = useState<number | null>(null);
  const [isLocatingBranches, setIsLocatingBranches] = useState(false);
  const [locationHint, setLocationHint] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  const dateOptions = useMemo(() => generateDateOptions(), []);
  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles]
  );
  const filteredServices = useMemo(() => {
    const vehicleType = selectedVehicle?.type;

    return services.filter((service) => {
      if (service.isActive === false) {
        return false;
      }

      if (!vehicleType || !service.type) {
        return true;
      }

      return service.type === vehicleType;
    });
  }, [selectedVehicle, services]);
  const selectedServices = useMemo(
    () => filteredServices.filter((service) => selectedServiceIds.includes(service.id)),
    [filteredServices, selectedServiceIds]
  );
  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId) ?? null,
    [branches, selectedBranchId]
  );
  const selectedSlot = useMemo(
    () => slotOptions.find((slot) => slot.id === selectedSlotId) ?? null,
    [selectedSlotId, slotOptions]
  );
  const estimatedTotal = useMemo(
    () => selectedServices.reduce((sum, service) => sum + Number(service.price || 0), 0),
    [selectedServices]
  );

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedBranchId || !selectedDate) {
      setSlotOptions([]);
      setSelectedSlotId(null);
      return;
    }

    let isActive = true;

    const fetchAvailableSlots = async () => {
      try {
        setIsLoadingSlots(true);
        setSelectedSlotId(null);

        const slotData = await bookingService.getAvailableSlots(selectedBranchId, selectedDate, 60, 60);

        if (!isActive) {
          return;
        }

        setSlotOptions((slotData.slots || []).map(mapAvailableSlotToOption));
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error('Fetch available slots failed:', error);
        setSlotOptions([]);
        Alert.alert('Lỗi', 'Không thể tải khung giờ trống. Vui lòng thử lại.');
      } finally {
        if (isActive) {
          setIsLoadingSlots(false);
        }
      }
    };

    fetchAvailableSlots();

    return () => {
      isActive = false;
    };
  }, [selectedBranchId, selectedDate]);

  useEffect(() => {
    if (!selectedVehicle) {
      return;
    }

    setSelectedServiceIds((prev) =>
      prev.filter((serviceId) => filteredServices.some((service) => service.id === serviceId))
    );
  }, [filteredServices, selectedVehicle]);

  useEffect(() => {
    if (!aiSuggestion || filteredServices.length === 0) {
      return;
    }

    const normalizedSuggestion = normalizeText(aiSuggestion);
    const matchedServiceIds = filteredServices
      .filter((service) => normalizedSuggestion.includes(normalizeText(service.name)))
      .map((service) => service.id);

    if (matchedServiceIds.length > 0) {
      setSelectedServiceIds((prev) => Array.from(new Set([...prev, ...matchedServiceIds])));
    }
  }, [aiSuggestion, filteredServices]);

  useEffect(() => {
    if (!selectedBranchId) {
      return;
    }

    if (nearestBranchId === selectedBranchId) {
      if (selectedBranch) {
        const distanceLabel = getBranchDistanceLabel(selectedBranch);
        setLocationHint(
          `Đã chọn chi nhánh gần nhất: ${selectedBranch.name}${
            distanceLabel ? ` (${distanceLabel})` : ''
          }.`
        );
      }
      return;
    }

    if (nearestBranchId && selectedBranch) {
      setLocationHint(
        `Bạn đang chọn thủ công: ${selectedBranch.name}. Ứng dụng vẫn gợi ý chi nhánh gần nhất khi có vị trí.`
      );
    }
  }, [nearestBranchId, selectedBranch, selectedBranchId]);

  const bootstrap = async (refreshing = false) => {
    try {
      if (refreshing) {
        setIsRefreshing(true);
      }

      const storedUserId = await AsyncStorage.getItem('userId');

      if (!storedUserId) {
        Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại để đặt lịch.', [
          { text: 'Đăng nhập', onPress: () => router.replace('/login') },
        ]);
        return;
      }

      const parsedUserId = Number(storedUserId);
      const [vehicleData, branchData, serviceData] = await Promise.all([
        vehicleService.getVehiclesByUserId(parsedUserId),
        branchService.getActiveBranches(),
        garageService.getAllServices(),
      ]);

      const activeVehicles = (vehicleData || []).filter((vehicle) => vehicle.isActive !== false);
      const activeBranches = (branchData || []).filter((branch) => branch.isActive !== false);

      setVehicles(activeVehicles);
      setServices(Array.isArray(serviceData) ? serviceData : []);
      setSelectedVehicleId((current) => current ?? activeVehicles[0]?.id ?? null);
      await loadNearestBranches(activeBranches);
    } catch (error) {
      console.error('Bootstrap booking screen failed:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu đặt lịch. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      if (refreshing) {
        setIsRefreshing(false);
      }
    }
  };

  const loadNearestBranches = async (fallbackBranches: Branch[]) => {
    setBranches(fallbackBranches);
    setNearestBranchId(null);
    setSelectedBranchId((current) => current ?? fallbackBranches[0]?.id ?? null);

    try {
      setIsLocatingBranches(true);
      setLocationHint('');

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationHint('Chưa có quyền truy cập vị trí. Bạn có thể chọn chi nhánh thủ công.');
        return;
      }

      const position =
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch(() => null)) ||
        (await Location.getLastKnownPositionAsync({
          maxAge: 5 * 60 * 1000,
          requiredAccuracy: 3000,
        }));

      if (!position) {
        setLocationHint('Không thể lấy vị trí hiện tại. Bạn có thể chọn chi nhánh thủ công.');
        return;
      }

      let nearbyBranches: Branch[] = [];

      try {
        nearbyBranches = await branchService.getNearbyActiveBranches(
          position.coords.latitude,
          position.coords.longitude
        );
      } catch (nearbyError) {
        console.warn('Load nearby branches from server failed, using local distance fallback:', nearbyError);
        nearbyBranches = sortBranchesByCurrentLocation(
          fallbackBranches,
          position.coords.latitude,
          position.coords.longitude
        );
      }

      const activeNearbyBranches = (nearbyBranches || []).filter((branch) => branch.isActive !== false);
      if (activeNearbyBranches.length === 0) {
        setLocationHint('Không tìm thấy chi nhánh gần bạn. Vui lòng chọn thủ công.');
        return;
      }

      const nearestBranch = activeNearbyBranches[0];
      const distanceLabel = getBranchDistanceLabel(nearestBranch);
      const routeSourceLabel =
        nearestBranch.travelDistanceKm != null ? 'theo lộ trình thực tế' : 'theo khoảng cách ước tính';

      setBranches(activeNearbyBranches);
      setNearestBranchId(nearestBranch.id);
      setSelectedBranchId((current) => current ?? nearestBranch.id);
      setLocationHint(
        `Đã gợi ý chi nhánh gần nhất ${routeSourceLabel}: ${nearestBranch.name}${
          distanceLabel ? ` (${distanceLabel})` : ''
        }.`
      );
    } catch (error) {
      console.error('Load nearest branches failed:', error);
      setLocationHint('Không thể lấy vị trí hiện tại. Bạn có thể chọn chi nhánh thủ công.');
    } finally {
      setIsLocatingBranches(false);
    }
  };

  const toggleService = (serviceId: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleCreateBooking = async () => {
    if (!selectedVehicleId) {
      Alert.alert('Thiếu xe', 'Vui lòng chọn xe để đặt lịch.');
      return;
    }

    if (!selectedBranchId) {
      Alert.alert('Thiếu chi nhánh', 'Vui lòng chọn chi nhánh gara.');
      return;
    }

    if (!selectedSlot) {
      Alert.alert('Thiếu khung giờ', 'Vui lòng chọn khung giờ bạn muốn mang xe tới.');
      return;
    }

    if (selectedServiceIds.length === 0) {
      Alert.alert('Thiếu dịch vụ', 'Hãy chọn ít nhất một dịch vụ trước khi tạo booking.');
      return;
    }

    Alert.alert('Xác nhận tạo booking', 'Bạn có muốn tạo lịch hẹn từ thông tin hiện tại không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Tạo booking',
        onPress: async () => {
          setIsCreatingBooking(true);

          try {
            const createdBooking = await bookingService.createBooking({
              vehicleId: selectedVehicleId,
              branchId: selectedBranchId,
              arrivalSlotStart: selectedSlot.start,
              arrivalSlotEnd: selectedSlot.end,
              serviceIds: selectedServiceIds,
              note: note.trim(),
              paymentMethod,
            });

            Alert.alert(
              'Đặt lịch thành công',
              `Booking #${createdBooking.id} đã được tạo.`,
              [{ text: 'Về trang chủ', onPress: () => router.replace('/(tabs)') }]
            );
          } catch (error: any) {
            console.error('Create booking failed:', error);
            const serverMessage =
              error?.response?.data?.message ||
              error?.response?.data ||
              'Không thể tạo booking. Vui lòng kiểm tra lại thông tin.';

            Alert.alert('Tạo booking thất bại', String(serverMessage));
          } finally {
            setIsCreatingBooking(false);
          }
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => bootstrap(true)}
            tintColor="#0F766E"
          />
        }>
        <LinearGradient colors={['#0F766E', '#115E59']} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Đặt lịch sửa xe</Text>
          <Text style={styles.heroText}>
            Chọn xe, chi nhánh, dịch vụ và khung giờ. Gara sẽ kiểm tra xe và xác nhận báo giá sau.
          </Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Kết quả AI</Text>
          <Text style={styles.summaryLabel}>Vấn đề bạn mô tả</Text>
          <Text style={styles.summaryText}>{issue || 'Chưa có mô tả từ AI.'}</Text>
          <Text style={styles.summaryLabel}>Gợi ý từ AI</Text>
          {aiSuggestion ? (
            <Markdown style={markdownStyles}>{aiSuggestion}</Markdown>
          ) : (
            <Text style={styles.summaryText}>Chưa có gợi ý AI.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin booking</Text>

          <Text style={styles.fieldLabel}>Xe mang đi sửa</Text>
          <View style={styles.optionWrap}>
            {vehicles.map((vehicle) => {
              const isActive = selectedVehicleId === vehicle.id;

              return (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[styles.optionChip, isActive && styles.optionChipActive]}
                  onPress={() => setSelectedVehicleId(vehicle.id)}>
                  <Text style={[styles.optionChipText, isActive && styles.optionChipTextActive]}>
                    {vehicle.licensePlate} · {vehicle.brand}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Chi nhánh gara</Text>
          {locationHint ? (
            <View style={styles.locationHintBox}>
              <Ionicons
                name={nearestBranchId ? 'navigate-circle-outline' : 'information-circle-outline'}
                size={18}
                color={nearestBranchId ? '#0F766E' : '#92400E'}
              />
              <Text style={[styles.locationHintText, !nearestBranchId && styles.locationHintTextWarning]}>
                {locationHint}
              </Text>
            </View>
          ) : null}
          {isLocatingBranches ? (
            <View style={styles.slotStatusBox}>
              <ActivityIndicator color="#0F766E" />
              <Text style={styles.slotStatusText}>Đang xác định chi nhánh gần bạn...</Text>
            </View>
          ) : null}
          <View style={styles.branchList}>
            {branches.map((branch) => {
              const isActive = selectedBranchId === branch.id;
              const isNearest = nearestBranchId === branch.id;
              const distanceLabel = getBranchDistanceLabel(branch);

              return (
                <TouchableOpacity
                  key={branch.id}
                  style={[styles.branchCard, isActive && styles.branchCardActive]}
                  onPress={() => setSelectedBranchId(branch.id)}>
                  <View style={styles.branchHeaderRow}>
                    <Text style={[styles.branchName, isActive && styles.branchNameActive]}>{branch.name}</Text>
                    {isNearest ? (
                      <View style={styles.nearestBadge}>
                        <Text style={styles.nearestBadgeText}>Gần nhất</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.branchMeta, isActive && styles.branchMetaActive]}>{branch.address}</Text>
                  <Text style={[styles.branchMeta, isActive && styles.branchMetaActive]}>{branch.phone}</Text>
                  {distanceLabel ? (
                    <Text style={[styles.branchDistance, isActive && styles.branchMetaActive]}>
                      {distanceLabel}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Dịch vụ áp dụng</Text>
          {filteredServices.length === 0 ? (
            <View style={styles.emptyServiceBox}>
              <Ionicons name="construct-outline" size={22} color="#64748B" />
              <Text style={styles.emptyServiceText}>Chưa có dịch vụ phù hợp với xe đang chọn.</Text>
            </View>
          ) : (
            <View style={styles.serviceList}>
              {filteredServices.map((service) => {
                const isActive = selectedServiceIds.includes(service.id);

                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.serviceCard, isActive && styles.serviceCardActive]}
                    onPress={() => toggleService(service.id)}>
                    <View style={styles.serviceTopRow}>
                      <Text style={[styles.serviceName, isActive && styles.serviceNameActive]}>{service.name}</Text>
                      <Ionicons
                        name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={isActive ? '#0F766E' : '#94A3B8'}
                      />
                    </View>
                    <Text style={[styles.serviceMeta, isActive && styles.serviceMetaActive]}>
                      {formatCurrency(service.price)} {service.durationMinutes ? `· ${service.durationMinutes} phút` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.fieldLabel}>Ngày đến gara</Text>
          <View style={styles.dateWrap}>
            {dateOptions.map((date) => {
              const isActive = selectedDate === date.id;

              return (
                <TouchableOpacity
                  key={date.id}
                  style={[styles.dateChip, isActive && styles.dateChipActive]}
                  onPress={() => setSelectedDate(date.id)}>
                  <Text style={[styles.dateChipText, isActive && styles.dateChipTextActive]}>{date.label}</Text>
                  <Text style={[styles.dateChipSubtext, isActive && styles.dateChipSubtextActive]}>
                    {date.sublabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Khung giờ đến gara</Text>
          {isLoadingSlots ? (
            <View style={styles.slotStatusBox}>
              <ActivityIndicator color="#0F766E" />
              <Text style={styles.slotStatusText}>Đang tải khung giờ trống...</Text>
            </View>
          ) : slotOptions.length === 0 ? (
            <View style={styles.slotStatusBox}>
              <Ionicons name="calendar-clear-outline" size={22} color="#64748B" />
              <Text style={styles.slotStatusText}>Ngày này chưa có khung giờ trống.</Text>
            </View>
          ) : (
            <View style={styles.slotWrap}>
              {slotOptions.map((slot) => {
                const isActive = selectedSlotId === slot.id;

                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.slotCard, isActive && styles.slotCardActive]}
                    onPress={() => setSelectedSlotId(slot.id)}>
                    <Text style={[styles.slotLabel, isActive && styles.slotLabelActive]}>{slot.label}</Text>
                    <Text style={[styles.slotSublabel, isActive && styles.slotSublabelActive]}>{slot.sublabel}</Text>
                    {slot.remainingCapacity ? (
                      <Text style={[styles.slotCapacity, isActive && styles.slotCapacityActive]}>
                        Còn {slot.remainingCapacity} chỗ
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.fieldLabel}>Hình thức thanh toán</Text>
          <View style={styles.optionWrap}>
            {PAYMENT_OPTIONS.map((option) => {
              const isActive = paymentMethod === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.paymentChip, isActive && styles.paymentChipActive]}
                  onPress={() => setPaymentMethod(option.value)}>
                  <Ionicons name={option.icon} size={18} color={isActive ? '#FFFFFF' : '#0F766E'} />
                  <Text style={[styles.paymentChipText, isActive && styles.paymentChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.fieldHelperText}>
            Bạn chưa thanh toán ở bước này. Gara sẽ xác nhận chi phí cuối cùng sau khi kiểm tra xe.
          </Text>

          <Text style={styles.fieldLabel}>Ghi chú</Text>
          <TextInput
            style={[styles.input, styles.noteArea]}
            multiline
            placeholder="Thêm lưu ý cho gara nếu cần..."
            placeholderTextColor="#94A3B8"
            value={note}
            onChangeText={setNote}
          />

          <View style={styles.summaryCard}>
            <Text style={styles.summaryPriceLabel}>Chi phí dịch vụ dự kiến</Text>
            <Text style={styles.summaryPriceValue}>{formatCurrency(estimatedTotal)}</Text>
            <Text style={styles.summaryHelperText}>
              Mức giá này chỉ là ước tính theo dịch vụ đã chọn, chưa bao gồm tiền công thực tế, phụ
              tùng thay thế hoặc dịch vụ phát sinh nếu gara phát hiện thêm vấn đề.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isCreatingBooking && styles.disabledButton]}
            onPress={handleCreateBooking}
            disabled={isCreatingBooking}>
            {isCreatingBooking ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Gửi yêu cầu đặt lịch</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 40,
    gap: 18,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
  },
  heroTitle: {
    fontSize: 28,
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
  summaryLabel: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  fieldHelperText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  noteArea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  optionChipActive: {
    backgroundColor: '#0F766E',
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  optionChipTextActive: {
    color: '#FFFFFF',
  },
  branchList: {
    gap: 10,
  },
  locationHintBox: {
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationHintText: {
    flex: 1,
    color: '#0F766E',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  locationHintTextWarning: {
    color: '#92400E',
  },
  branchCard: {
    borderWidth: 1,
    borderColor: '#CCFBF1',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
  },
  branchCardActive: {
    borderColor: '#0F766E',
    backgroundColor: '#ECFDF5',
  },
  branchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  branchName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  branchNameActive: {
    color: '#0F766E',
  },
  branchMeta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
  },
  branchDistance: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#0F766E',
    fontWeight: '700',
  },
  branchMetaActive: {
    color: '#115E59',
  },
  nearestBadge: {
    borderRadius: 999,
    backgroundColor: '#0F766E',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  nearestBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  serviceList: {
    marginTop: 4,
    gap: 10,
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: '#D1FAE5',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
  },
  serviceCardActive: {
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
  },
  serviceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  serviceName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  serviceNameActive: {
    color: '#0F766E',
  },
  serviceMeta: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
  },
  serviceMetaActive: {
    color: '#115E59',
  },
  emptyServiceBox: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
  },
  emptyServiceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  dateWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dateChip: {
    minWidth: 82,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateChipActive: {
    borderColor: '#0F766E',
    backgroundColor: '#ECFDF5',
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateChipTextActive: {
    color: '#0F766E',
  },
  dateChipSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  dateChipSubtextActive: {
    color: '#115E59',
  },
  slotWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotStatusBox: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
  },
  slotStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  slotCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    padding: 14,
  },
  slotCardActive: {
    borderColor: '#0F766E',
    backgroundColor: '#ECFDF5',
  },
  slotLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  slotLabelActive: {
    color: '#0F766E',
  },
  slotSublabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
  },
  slotSublabelActive: {
    color: '#115E59',
  },
  slotCapacity: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  slotCapacityActive: {
    color: '#0F766E',
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: '#ECFEFF',
  },
  paymentChipActive: {
    backgroundColor: '#0F766E',
  },
  paymentChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  paymentChipTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  summaryPriceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
  },
  summaryPriceValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryHelperText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.8)',
  },
  primaryButton: {
    marginTop: 16,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.75,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 4,
  },
  strong: {
    fontWeight: '800',
    color: '#0F172A',
  },
});
