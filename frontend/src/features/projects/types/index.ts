export type ProjectStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';

export interface ProjectSummary {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  status: ProjectStatus;
  is_active: boolean;
}

export interface Project {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  code: string;
  name: string;
  description?: string;
  status?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: string;
}

export interface ProjectFilter {
  search?: string;
  status?: string;
}

export interface ProjectListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: ProjectSummary[];
}
