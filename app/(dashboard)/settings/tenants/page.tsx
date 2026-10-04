'use client';

import { useCallback, useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import { canManageTenants } from '@/lib/authHelpers';
import { tenantsApi } from '@/lib/services/tenantsApi';
import type { TenantListItem } from '@/lib/types/settings';
import { useTenant } from '@/components/layout/TenantProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function SettingsTenantsPage() {
  // Render gate only — Core enforces. Mounted after PageWrapper auth.
  const canManage = canManageTenants();
  const { hydrateFromMe } = useTenant();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', timezone: '' });
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    document.title = 'Tenants · Settings · EcomHub';
  }, []);

  const loadData = useCallback(async () => {
    if (!canManage) {
      setIsLoading(false);
      setTenants([]);
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      const data = await tenantsApi.list();
      setTenants(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setTenants([]);
      setError(err instanceof Error ? err.message : 'Failed to load tenants');
    } finally {
      setIsLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const refreshMeTenants = async () => {
    try {
      const me = await authApi.getMe();
      hydrateFromMe(me);
    } catch {
      // list still works; switcher updates on next shell hydrate / reload
    }
  };

  const handleCreate = () => {
    setForm({ name: '', slug: '', timezone: '' });
    setSlugTouched(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const name = form.name.trim();
    const slug = form.slug.trim().toLowerCase();
    if (!name) {
      setFormError('Name is required');
      return;
    }
    if (!slug) {
      setFormError('Slug is required');
      return;
    }
    if (!SLUG_RE.test(slug)) {
      setFormError('Slug must be lowercase letters, numbers, and hyphens (e.g. midriffmuse)');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      await tenantsApi.create({
        name,
        slug,
        timezone: form.timezone.trim() || undefined,
      });
      setIsModalOpen(false);
      await refreshMeTenants();
      await loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create tenant');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: TenantListItem) => {
    const next = !item.is_active;
    const label = next ? 'activate' : 'deactivate';
    if (!confirm(`${label[0].toUpperCase()}${label.slice(1)} tenant "${item.name}"?`)) {
      return;
    }
    try {
      setTogglingId(item.id);
      setError('');
      await tenantsApi.updateActive(item.id, { is_active: next });
      await refreshMeTenants();
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${label} tenant`);
    } finally {
      setTogglingId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tenants" />
        <Card title="Access">
          <p className="text-sm text-gray-600">Tenant management is superadmin only.</p>
        </Card>
      </div>
    );
  }

  if (isLoading && tenants.length === 0 && !error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading tenants…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        className="mb-6"
        title="Tenants"
        actions={
          <Button onClick={handleCreate} variant="primary">
            + Add tenant
          </Button>
        }
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      ) : null}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Shopee shop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No tenants yet
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.name}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{t.slug}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">
                      {t.shopee_shop_id ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={
                          t.is_active
                            ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
                            : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'
                        }
                      >
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={togglingId === t.id}
                        onClick={() => void handleToggleActive(t)}
                      >
                        {t.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          New tenants start with empty books (no CoA clone yet). Delete is not available in v0 —
          deactivate instead. After create, use the top-bar switcher to select the tenant.
        </p>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title="Create tenant"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} isLoading={saving}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug: slugTouched ? prev.slug : slugify(name),
                }));
              }}
              placeholder="Midriffmuse"
              maxLength={255}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }));
              }}
              placeholder="midriffmuse"
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-500">
              Lowercase letters, numbers, hyphens. Unique across the deployment.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Timezone <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.timezone}
              onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
              placeholder="Asia/Jakarta"
              maxLength={64}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
