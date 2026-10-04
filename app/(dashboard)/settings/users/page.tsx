'use client';

import { useCallback, useEffect, useState } from 'react';
import { tenantsApi } from '@/lib/services/tenantsApi';
import { usersApi } from '@/lib/services/usersApi';
import type { TenantListItem, UserListItem } from '@/lib/types/settings';
import { USER_ROLE_OPTIONS } from '@/lib/types/settings';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination';
import { formatDateTime } from '@/lib/utils/formatters';

function isSuperadminUser(user: UserListItem): boolean {
  return (user.roles ?? []).includes('superadmin');
}

/** Render-only superadmin gate (Core still enforces). Avoids authHelpers import cycle. */
function canManageUsersLocal(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('user_roles');
    if (!raw) return localStorage.getItem('user_role') === 'superadmin';
    const roles = JSON.parse(raw) as unknown;
    return Array.isArray(roles) && roles.includes('superadmin');
  } catch {
    return false;
  }
}

export default function SettingsUsersPage() {
  const [canManage] = useState(() => canManageUsersLocal());
  const canAssign = canManage;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [rolesModalUser, setRolesModalUser] = useState<UserListItem | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [rolesError, setRolesError] = useState('');
  const [rolesSaving, setRolesSaving] = useState(false);

  const [membershipModalUser, setMembershipModalUser] = useState<UserListItem | null>(null);
  const [membershipTenantId, setMembershipTenantId] = useState<number>(0);
  const [membershipError, setMembershipError] = useState('');
  const [membershipSaving, setMembershipSaving] = useState(false);

  useEffect(() => {
    document.title = 'Users · Settings · EcomHub';
  }, []);

  const loadUsers = useCallback(async () => {
    if (!canManage) {
      setIsLoading(false);
      setUsers([]);
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      const response = await usersApi.getList({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
      });
      setUsers(response.results ?? []);
      setTotalPages(response.total_pages ?? 1);
      setTotalResults(response.total_results ?? 0);
    } catch (err: unknown) {
      setUsers([]);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [canManage, currentPage, pageSize, searchQuery]);

  const loadTenants = useCallback(async () => {
    if (!canAssign) return;
    try {
      const data = await tenantsApi.list();
      setTenants(Array.isArray(data) ? data.filter((t) => t.is_active) : []);
    } catch {
      setTenants([]);
    }
  }, [canAssign]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  const openRolesModal = (user: UserListItem) => {
    setRolesModalUser(user);
    setSelectedRoles([...(user.roles ?? [])]);
    setRolesError('');
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSaveRoles = async () => {
    if (!rolesModalUser) return;
    if (selectedRoles.length === 0) {
      setRolesError('Select at least one role');
      return;
    }
    try {
      setRolesSaving(true);
      setRolesError('');
      await usersApi.updateRoles(rolesModalUser.id, { roles: selectedRoles });
      setRolesModalUser(null);
      await loadUsers();
    } catch (err: unknown) {
      setRolesError(err instanceof Error ? err.message : 'Failed to update roles');
    } finally {
      setRolesSaving(false);
    }
  };

  const openMembershipModal = (user: UserListItem) => {
    setMembershipModalUser(user);
    setMembershipTenantId(user.tenant_id && user.tenant_id > 0 ? user.tenant_id : 0);
    setMembershipError('');
  };

  const handleSaveMembership = async () => {
    if (!membershipModalUser) return;
    if (!membershipTenantId) {
      setMembershipError('Select a tenant');
      return;
    }
    try {
      setMembershipSaving(true);
      setMembershipError('');
      await usersApi.setTenantMembership(membershipModalUser.id, {
        tenant_id: membershipTenantId,
      });
      setMembershipModalUser(null);
      await loadUsers();
    } catch (err: unknown) {
      setMembershipError(
        err instanceof Error ? err.message : 'Failed to assign tenant'
      );
    } finally {
      setMembershipSaving(false);
    }
  };

  const handleClearMembership = async (user: UserListItem) => {
    if (isSuperadminUser(user)) return;
    if (
      !confirm(
        `Clear tenant membership for “${user.username}”? They become view-only until reassigned.`
      )
    ) {
      return;
    }
    try {
      setError('');
      await usersApi.clearTenantMembership(user.id);
      await loadUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to clear membership');
    }
  };

  if (!canManage) {
    return (
      <div className="space-y-6">
        <PageHeader title="Users" />
        <Card title="Access">
          <p className="text-sm text-gray-600">User management is superadmin only.</p>
        </Card>
      </div>
    );
  }

  if (isLoading && users.length === 0 && !error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading users…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader className="mb-6" title="Users" />

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search username, email, or name…"
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSearchQuery(searchInput);
              setCurrentPage(1);
            }
          }}
        />
        <Button
          variant="secondary"
          onClick={() => {
            setSearchQuery(searchInput);
            setCurrentPage(1);
          }}
        >
          Search
        </Button>
        {searchQuery ? (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchInput('');
              setSearchQuery('');
              setCurrentPage(1);
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Last login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? 'No users match your search' : 'No users found'}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const superadmin = isSuperadminUser(user);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{user.username}</div>
                        <div className="text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">{user.full_name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {(user.roles ?? []).join(', ') || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {superadmin
                          ? 'All tenants'
                          : user.tenant_name || (user.tenant_id ? `#${user.tenant_id}` : '—')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.last_login ? formatDateTime(user.last_login) : '—'}
                      </td>
                      <td className="space-x-2 px-6 py-4 text-right text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRolesModal(user)}
                        >
                          Roles
                        </Button>
                        {!superadmin && canAssign ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openMembershipModal(user)}
                            >
                              Assign tenant
                            </Button>
                            {user.tenant_id ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void handleClearMembership(user)}
                              >
                                Clear
                              </Button>
                            ) : null}
                          </>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </Card>

      <Modal
        isOpen={Boolean(rolesModalUser)}
        onClose={() => !rolesSaving && setRolesModalUser(null)}
        title={rolesModalUser ? `Roles · ${rolesModalUser.username}` : 'Roles'}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              disabled={rolesSaving}
              onClick={() => setRolesModalUser(null)}
            >
              Cancel
            </Button>
            <Button isLoading={rolesSaving} onClick={() => void handleSaveRoles()}>
              Save roles
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {rolesError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {rolesError}
            </p>
          ) : null}
          <p className="text-sm text-gray-600">Select one or more roles.</p>
          <div className="space-y-2">
            {USER_ROLE_OPTIONS.map((role) => (
              <label key={role} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                <span className="text-gray-900">{role}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(membershipModalUser)}
        onClose={() => !membershipSaving && setMembershipModalUser(null)}
        title={
          membershipModalUser
            ? `Tenant · ${membershipModalUser.username}`
            : 'Assign tenant'
        }
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              disabled={membershipSaving}
              onClick={() => setMembershipModalUser(null)}
            >
              Cancel
            </Button>
            <Button
              isLoading={membershipSaving}
              onClick={() => void handleSaveMembership()}
            >
              Save membership
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {membershipError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {membershipError}
            </p>
          ) : null}
          <p className="text-sm text-gray-600">
            Admin (and other non-superadmin) users bind to exactly one tenant.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tenant</label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={membershipTenantId || ''}
              onChange={(e) => setMembershipTenantId(Number(e.target.value))}
            >
              <option value="">Select tenant…</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
            {tenants.length === 0 ? (
              <p className="mt-2 text-xs text-amber-700">
                No active tenants. Create one under Settings → Tenants first.
              </p>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  );
}
