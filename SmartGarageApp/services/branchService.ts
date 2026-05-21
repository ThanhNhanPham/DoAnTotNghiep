import apiClient from '@/constants/Api';

export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  imageUrl?: string | null;
  isActive?: boolean;
}

const branchService = {
  async getActiveBranches() {
    const response = await apiClient.get<Branch[]>('/branches/active');
    return response.data;
  },
};

export default branchService;
