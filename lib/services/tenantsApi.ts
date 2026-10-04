import { api } from '../api';
import type {
  CreateTenantParam,
  Tenant,
  TenantListItem,
  UpdateTenantActiveParam,
} from '../types/settings';

const API_VERSION = '/api/v1';

/** Superadmin tenant admin (Core F7c / FE36). */
export const tenantsApi = {
  list: async () => {
    return api.get<TenantListItem[]>(`${API_VERSION}/tenants`);
  },

  create: async (body: CreateTenantParam) => {
    return api.post<Tenant>(`${API_VERSION}/tenants`, body);
  },

  updateActive: async (id: number, body: UpdateTenantActiveParam) => {
    return api.patch<Tenant>(`${API_VERSION}/tenants/${id}`, body);
  },
};
