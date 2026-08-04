export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  tenant_id?: string;
  status: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  first_name: string;
  last_name: string;
  email: string;
  password?: string; // used internally or for manual creation
  phone?: string;
  role: string;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  status?: string;
}

export interface UserFilter {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordRequest {
  auto_generate: boolean;
  new_password?: string;
  confirm_password?: string;
}
