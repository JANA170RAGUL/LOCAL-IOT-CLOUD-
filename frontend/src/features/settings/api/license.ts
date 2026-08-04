import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../../services/api/axios';

export interface LicenseStatusResponse {
  customer: string | null;
  plan: string | null;
  status: string;
  expires_in_days: number;
  machine_match: boolean;
  features_loaded: number;
  current_fingerprint: string;
  activated_at: string | null;
  features: Record<string, any>;
}

export const getLicenseStatus = async (): Promise<LicenseStatusResponse> => {
  const response = await axios.get('/license/status');
  return response.data;
};

export const uploadLicense = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post('/license/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const useLicenseStatus = () => {
  return useQuery({
    queryKey: ['license-status'],
    queryFn: getLicenseStatus,
    refetchInterval: 30000, // Optional: Poll occasionally
  });
};

export const useUploadLicense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: uploadLicense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-status'] });
    },
  });
};
