import { api } from '../api';
import type { PaginatedResponse } from '../types';
import type {
  ClearTenantMembershipResult,
  SetTenantMembershipParam,
  SetTenantMembershipResult,
  UpdateUserRolesParam,
  UpdateUserRolesResult,
  UserListItem,
} from '../types/settings';

const API_VERSION = '/api/v1';

/** Superadmin user admin (Core F7c / FE34). */
export const usersApi = {
  getList: async (params: { page: number; limit: number; search?: string }) => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });
    if (params.search) query.set('search', params.search);
    return api.get<PaginatedResponse<UserListItem>>(
      `${API_VERSION}/users?${query.toString()}`
    );
  },

  updateRoles: async (userId: number, body: UpdateUserRolesParam) => {
    return api.put<UpdateUserRolesResult>(
      `${API_VERSION}/users/${userId}/roles`,
      body
    );
  },

  setTenantMembership: async (userId: number, body: SetTenantMembershipParam) => {
    return api.put<SetTenantMembershipResult>(
      `${API_VERSION}/users/${userId}/tenant-membership`,
      body
    );
  },

  clearTenantMembership: async (userId: number) => {
    return api.delete<ClearTenantMembershipResult>(
      `${API_VERSION}/users/${userId}/tenant-membership`
    );
  },
};
