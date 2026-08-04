export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';

export interface TenantSummary {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  email: string;
  status: TenantStatus;
  is_active: boolean;
}

export interface Tenant {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string;
  logo_url?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone: string;
  status: TenantStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantCreate {
  code: string;
  name: string;
  email: string;
  description?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  status?: string;
}

export interface TenantUpdate {
  name?: string;
  email?: string;
  description?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  status?: string;
}

export interface TenantFilter {
  search?: string;
  status?: string;
}

export interface TenantListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: TenantSummary[];
}
