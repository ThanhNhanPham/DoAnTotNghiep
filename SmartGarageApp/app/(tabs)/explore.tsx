import React, { useCallback, useState } from 'react';
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
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import aiService, { AIConsultationHistoryItem, normalizeVehicleIssueText } from '@/services/aiService';
import vehicleService from '@/services/vehicleService';

export default function ExploreScreen() {
  const router = useRouter();
  const [issue, setIssue] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [deletingHistoryId, setDeletingHistoryId] = useState<number | null>(null);
  const [hasVehicle, setHasVehicle] = useState(true);
  const [queryHistory, setQueryHistory] = useState<AIConsultationHistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadScreenData = async () => {
        try {
          const storedUserId = await AsyncStorage.getItem('userId');

          if (!storedUserId) {
            setHasVehicle(false);
            setQueryHistory([]);
            return;
          }

          const [vehicles, history] = await Promise.all([
            vehicleService.getVehiclesByUserId(Number(storedUserId)),
            aiService.getMyHistory(),
          ]);
          const activeVehicles = Array.isArray(vehicles)
            ? vehicles.filter((vehicle) => vehicle.isActive !== false)
            : [];

          setHasVehicle(activeVehicles.length > 0);
          setQueryHistory(Array.isArray(history) ? history : []);
        } catch (error) {
          console.error('Load vehicles for AI screen failed:', error);
          setHasVehicle(false);
          setQueryHistory([]);
        }
      };

      loadScreenData();
    }, [])
  );

  const handleReuseHistoryItem = (item: AIConsultationHistoryItem) => {
    setIssue(item.customerIssue);
    setAiSuggestion(item.aiSuggestion);
  };

  const handleDeleteHistoryItem = (item: AIConsultationHistoryItem) => {
    if (deletingHistoryId !== null) {
      return;
    }

    Alert.alert('Xoá lịch sử truy vấn', 'Bạn có chắc muốn xoá lịch sử truy vấn này không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          setDeletingHistoryId(item.id);
          try {
            await aiService.deleteHistoryItem(item.id);
            setQueryHistory((currentHistory) =>
              currentHistory.filter((historyItem) => historyItem.id !== item.id)
            );

            if (issue === item.customerIssue && aiSuggestion === item.aiSuggestion) {
              setIssue('');
              setAiSuggestion('');
            }

            Alert.alert('Thành công', 'Đã xoá lịch sử truy vấn AI.');
          } catch (error: any) {
            console.error('Delete AI history failed:', error);
            const serverMessage =
              error?.response?.data?.message ||
              error?.response?.data ||
              'Không thể xoá lịch sử truy vấn AI. Vui lòng thử lại.';

            Alert.alert('Xoá thất bại', String(serverMessage));
          } finally {
            setDeletingHistoryId(null);
          }
        },
      },
    ]);
  };

  const handleAskAI = async () => {
    const normalizedIssue = normalizeVehicleIssueText(issue);

    if (!normalizedIssue) {
      Alert.alert('Thiếu mô tả', 'Hãy nhập triệu chứng hoặc vấn đề xe đang gặp.');
      return;
    }

    setIsSuggesting(true);

    try {
      setIssue(normalizedIssue);
      const suggestion = await aiService.suggestService({ issue: normalizedIssue });
      setAiSuggestion(suggestion);
      const nextHistory = await aiService.getMyHistory();
      setQueryHistory(Array.isArray(nextHistory) ? nextHistory : []);
    } catch (error: any) {
      console.error('AI suggestion failed:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        'Không thể lấy gợi ý AI lúc này.';

      Alert.alert('AI đang bận', String(serverMessage));
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGoToBooking = () => {
    const normalizedIssue = normalizeVehicleIssueText(issue);

    router.push({
      pathname: '/modal',
      params: {
        issue: normalizedIssue,
        aiSuggestion,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
          <LinearGradient colors={['#0F766E', '#115E59']} style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>AI Consultation</Text>
            <Text style={styles.heroTitle}>Tư vấn lỗi xe bằng AI</Text>
            <Text style={styles.heroText}>
              Mô tả triệu chứng xe đang gặp, AI sẽ gợi ý hướng xử lý và các dịch vụ phù hợp.
            </Text>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mô tả vấn đề của xe</Text>
            <TextInput
              style={styles.textArea}
              multiline
              scrollEnabled={false}
              placeholder="Ví dụ: Xe rung đầu, bóp phanh có tiếng kêu, máy nóng nhanh..."
              placeholderTextColor="#94A3B8"
              value={issue}
              onChangeText={setIssue}
              returnKeyType="default"
              blurOnSubmit={false}
            />

            <TouchableOpacity
              style={[styles.primaryButton, isSuggesting && styles.disabledButton]}
              onPress={handleAskAI}
              disabled={isSuggesting}>
              {isSuggesting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Tư vấn với AI</Text>
              )}
            </TouchableOpacity>
          </View>

          {aiSuggestion ? (
            <View style={styles.card}>
              <View style={styles.resultHeader}>
                <Ionicons name="sparkles" size={20} color="#0F766E" />
                <Text style={styles.sectionTitle}>Kết quả tư vấn</Text>
              </View>
              <View style={styles.markdownWrapper}>
                <Markdown style={markdownStyles}>{aiSuggestion}</Markdown>
              </View>

              <View style={styles.bookingPrompt}>
                {hasVehicle ? (
                  <>
                    <Text style={styles.bookingPromptTitle}>Bạn có muốn đặt lịch ngay không?</Text>
                    <Text style={styles.bookingPromptText}>
                      Nếu muốn, app sẽ chuyển bạn sang màn hình đặt lịch và mang theo kết quả AI.
                    </Text>

                    <TouchableOpacity style={styles.bookingButton} onPress={handleGoToBooking}>
                      <Text style={styles.bookingButtonText}>Đặt lịch</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.bookingPromptTitle}>Vui lòng thêm xe trước khi đặt lịch</Text>
                    <Text style={styles.bookingPromptText}>
                      Bạn cần khai báo ít nhất một xe trong tài khoản trước khi tạo booking.
                    </Text>

                    <TouchableOpacity
                      style={styles.addVehicleButton}
                      onPress={() => router.push('/(tabs)/vehicles')}>
                      <Text style={styles.addVehicleButtonText}>Đi tới thêm xe</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Lịch sử truy vấn</Text>
            </View>

            {queryHistory.length > 0 ? (
              queryHistory.map((item, index) => {
                const createdAtText = item.createdAt
                  ? new Date(item.createdAt).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    })
                  : '--:--';

                return (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={[styles.historyCard, index === queryHistory.length - 1 && styles.historyCardLast]}
                    onPress={() => handleReuseHistoryItem(item)}
                    activeOpacity={0.85}>
                    <View style={styles.historyTopRow}>
                      <Text style={styles.historyIssue}>{item.customerIssue}</Text>
                      <View style={styles.historyMeta}>
                        <Text style={styles.historyDate}>{createdAtText}</Text>
                        <TouchableOpacity
                          style={[
                            styles.deleteHistoryButton,
                            deletingHistoryId !== null && styles.deleteHistoryButtonDisabled,
                          ]}
                          onPress={(event) => {
                            event.stopPropagation();
                            handleDeleteHistoryItem(item);
                          }}
                          disabled={deletingHistoryId !== null}
                          activeOpacity={0.8}>
                          {deletingHistoryId === item.id ? (
                            <ActivityIndicator size="small" color="#DC2626" />
                          ) : (
                            <Ionicons name="trash-outline" size={17} color="#DC2626" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.historySuggestion} numberOfLines={2}>
                      {item.aiSuggestion}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyHistoryState}>
                <Ionicons name="time-outline" size={20} color="#94A3B8" />
                <Text style={styles.emptyHistoryText}>
                  Chưa có lịch sử truy vấn AI. Sau khi bạn tư vấn thành công, hệ thống sẽ lưu lại tại đây.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDFA',
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
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
  },
  heroTitle: {
    marginTop: 10,
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
  textArea: {
    marginTop: 14,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 22,
    color: '#0F172A',
    textAlignVertical: 'top',
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteHistoryButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteHistoryButtonDisabled: {
    opacity: 0.45,
  },
  historyCard: {
    marginTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  historyCardLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  historyIssue: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyDate: {
    fontSize: 12,
    color: '#64748B',
  },
  historyMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  historySuggestion: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },
  emptyHistoryState: {
    marginTop: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  emptyHistoryText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
  },
  resultText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  bookingPrompt: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bookingPromptTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookingPromptText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
  },
  bookingButton: {
    marginTop: 14,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addVehicleButton: {
    marginTop: 14,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addVehicleButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  markdownWrapper: {
    marginTop: 12,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  heading1: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 4,
  },
  strong: {
    fontWeight: '700',
    color: '#0F172A',
  },
  em: {
    fontStyle: 'italic',
    color: '#475569',
  },
  bullet_list: {
    marginTop: 4,
    marginBottom: 4,
  },
  ordered_list: {
    marginTop: 4,
    marginBottom: 4,
  },
  list_item: {
    marginVertical: 3,
  },
  bullet_list_icon: {
    marginTop: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F766E',
  },
  code_inline: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#F1F5F9',
    color: '#0F766E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fence: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#F1F5F9',
    color: '#334155',
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  blockquote: {
    backgroundColor: '#F0FDFA',
    borderLeftWidth: 4,
    borderLeftColor: '#0F766E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 8,
    borderRadius: 8,
  },
  hr: {
    backgroundColor: '#E2E8F0',
    height: 1,
    marginVertical: 12,
  },
  paragraph: {
    marginTop: 4,
    marginBottom: 4,
  },
});
