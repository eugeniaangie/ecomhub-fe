/** Settings / multi-tenant admin types (Core F7c — FE34 / FE36). */

export interface TenantListItem {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  shopee_shop_id?: number | null;
}

export interface Tenant {
  id: number;
  organization_id?: number | null;
  name: string;
  slug: string;
  is_active: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface CreateTenantParam {
  name: string;
  slug: string;
  timezone?: string;
}

export interface UpdateTenantActiveParam {
  is_active: boolean;
}

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string | null;
  is_active: boolean;
  last_login?: string | null;
  roles: string[];
  tenant_id?: number | null;
  tenant_name?: string | null;
}

export interface UpdateUserRolesParam {
  roles: string[];
}

export interface UpdateUserRolesResult {
  user_id: number;
  roles: string[];
}

export interface SetTenantMembershipParam {
  tenant_id: number;
}

export interface SetTenantMembershipResult {
  user_id: number;
  tenant_id: number;
}

export interface ClearTenantMembershipResult {
  user_id: number;
}

/** Roles Core accepts on PUT /users/:id/roles. */
export const USER_ROLE_OPTIONS = [
  'superadmin',
  'admin',
  'manager',
  'staff',
  'viewer',
] as const;

export type AssignableUserRole = (typeof USER_ROLE_OPTIONS)[number];
