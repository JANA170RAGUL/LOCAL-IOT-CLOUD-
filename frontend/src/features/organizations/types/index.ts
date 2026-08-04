export interface Organization {
  id: string;
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
  language: string;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
  license_type: 'Community' | 'Professional' | 'Enterprise' | 'Academic';
  subscription_end?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationCreate {
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
  timezone?: string;
  language?: string;
  currency?: string;
  status?: string;
  license_type?: string;
  subscription_end?: string;
}

export interface OrganizationUpdate {
  name?: string;
  description?: string;
  logo_url?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  language?: string;
  currency?: string;
  status?: string;
  license_type?: string;
  subscription_end?: string;
}

export interface OrganizationFilter {
  search?: string;
  status?: string;
  license_type?: string;
}

export interface OrganizationListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Organization[];
}
