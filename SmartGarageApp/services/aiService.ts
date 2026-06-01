import apiClient from '@/constants/Api';
import { VehicleType } from '@/services/vehicleService';

export interface AIConsultationRequest {
  issue: string;
  vehicleType: VehicleType;
}

export interface AIConsultationHistoryItem {
  id: number;
  customerIssue: string;
  aiSuggestion: string;
  suggestedServiceIds?: string | null;
  createdAt?: string;
}

const COMMON_TYPO_MAP: Record<string, string> = {
  mays: 'máy',
  phanhs: 'phanh',
  lops: 'lốp',
  xes: 'xe',
};

export const normalizeVehicleIssueText = (value: string) => {
  const cleaned = value
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/([,.;!?]){2,}/g, '$1')
    .trim();

  return cleaned.replace(/\b([^\s,.;!?]+)\b/gi, (word) => {
    const normalizedWord = COMMON_TYPO_MAP[word.toLowerCase()];
    return normalizedWord ?? word;
  });
};

const aiService = {
  async suggestService(payload: AIConsultationRequest) {
    const response = await apiClient.post<string>('/ai/suggest', {
      ...payload,
      issue: normalizeVehicleIssueText(payload.issue),
    });
    return response.data;
  },

  async getMyHistory() {
    const response = await apiClient.get<AIConsultationHistoryItem[]>('/ai/history/me');
    return response.data;
  },

  async deleteHistoryItem(id: number) {
    const response = await apiClient.delete<string>(`/ai/history/${id}/me`);
    return response.data;
  },
};

export default aiService;
