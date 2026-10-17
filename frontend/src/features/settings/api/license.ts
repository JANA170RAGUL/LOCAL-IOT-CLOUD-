import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../../services/api/axios';

export interface LicenseStatusResponse {
  mode: string;
  status: string;
  customer?: string | null;
  plan?: string | null;
  expires_at?: string | null;
  grace_ends_at?: string | null;
  expires_in_days: number;
  reason?: string;
  features?: Record<string, any>;
  current_fingerprint: string;
  machine_code?: string;
  machine_match: boolean;
  activated_at?: string | null;
}

export const getLicenseStatus = async (): Promise<LicenseStatusResponse> => {
  const response = await axios.get('/licensing/status');
  let machineCode = '';
  try {
    const machineRes = await axios.get('/licensing/machine-code');
    machineCode = machineRes.data?.machine_code || '';
  } catch {
    // Ignore error if user lacks system:admin permission for machine-code
  }

  const data = response.data;
  const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
  const now = new Date();
  const expiresInDays = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24)) : 0;

  return {
    mode: data.mode || 'UNLICENSED',
    status: data.mode === 'VALID' ? 'ACTIVE' : data.mode || 'UNLICENSED',
    customer: data.customer_name || data.customer || null,
    plan: data.plan || 'Community',
    expires_at: data.expires_at,
    grace_ends_at: data.grace_ends_at,
    expires_in_days: expiresInDays,
    reason: data.reason,
    features: data.features || {},
    current_fingerprint: machineCode || data.current_fingerprint || 'MACHINE-FINGERPRINT-AVAILABLE',
    machine_code: machineCode,
    machine_match: data.mode === 'VALID',
    activated_at: data.activated_at || null,
  };
};

export const uploadLicense = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post('/licensing/upload', formData, {
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
    refetchInterval: 30000,
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
