'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { canWriteWarehouse } from '@/lib/authHelpers';
import { warehousesApi } from '@/lib/services/warehousesApi';
import type { Warehouse } from '@/lib/types/warehouse';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination';

const MAX_CODE_LEN = 64;

type FormState = {
  code: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
};

const emptyForm = (): FormState => ({
  code: '',
  name: '',
  is_active: true,
  is_default: false,
});

export default function WarehousePage() {
  const canWrite = canWriteWarehouse();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [rows, setRows] = useState<Warehouse[]>([]);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Warehouses · EcomHub';
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await warehousesApi.list({
        page: currentPage,
        limit: pageSize,
        search: search || undefined,
      });
      setRows(data?.results ?? []);
      setTotalPages(data?.total_pages ?? 1);
      setTotalResults(data?.total_results ?? 0);
    } catch (err: unknown) {
      setRows([]);
      setTotalPages(1);
      setTotalResults(0);
      setError(err instanceof Error ? err.message : 'Failed to load warehouses');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (row: Warehouse) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      is_active: row.is_active,
      is_default: row.is_default,
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setFormError('');
  };

  const handleSubmit = async () => {
    const code = form.code.trim();
    const name = form.name.trim();
    if (!code) {
      setFormError('Code is required');
      return;
    }
    if (code.length > MAX_CODE_LEN) {
      setFormError(`Code must be at most ${MAX_CODE_LEN} characters`);
      return;
    }
    if (!name) {
      setFormError('Name is required');
      return;
    }

    if (editing) {
      if (
        editing.is_default &&
        !form.is_default &&
        !confirm(
          'Clear default on this warehouse? Another warehouse must become the default (Core will reject invalid states).'
        )
      ) {
        return;
      }
      if (
        editing.is_active &&
        !form.is_active &&
        !confirm(
          `Deactivate warehouse “${editing.name}”? The default and last active warehouse cannot be deactivated, and Core rejects warehouses with non-zero stock.`
        )
      ) {
        return;
      }
      if (
        !editing.is_default &&
        form.is_default &&
        !confirm(
          `Make “${name}” the default warehouse for this tenant? The previous default will be cleared.`
        )
      ) {
        return;
      }
    }

    try {
      setSaving(true);
      setFormError('');
      if (editing) {
        await warehousesApi.update(editing.id, {
          code,
          name,
          is_active: form.is_active,
          is_default: form.is_default,
        });
      } else {
        await warehousesApi.create({
          code,
          name,
          ...(form.is_default ? { is_default: true } : {}),
        });
      }
      setModalOpen(false);
      setEditing(null);
      await loadData();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : editing
            ? 'Failed to update warehouse'
            : 'Failed to create warehouse'
      );
    } finally {
      setSaving(false);
    }
  };

  const applySearch = () => {
    setCurrentPage(DEFAULT_PAGE);
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses"
        parent={null}
        actions={
          canWrite ? (
            <Button onClick={openCreate}>Add warehouse</Button>
          ) : undefined
        }
      />

      {!canWrite ? (
        <p className="text-sm text-gray-500">
          View only — admin or superadmin can create and edit warehouses.
        </p>
      ) : null}

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <Input
              label="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
              placeholder="Code or name"
            />
          </div>
          <Button variant="secondary" onClick={applySearch}>
            Search
          </Button>
        </div>

        {error ? (
          <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {isLoading && rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No warehouses found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-2 py-2 font-medium">Code</th>
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Default</th>
                  {canWrite ? (
                    <th className="px-2 py-2 font-medium">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id} className="text-gray-900">
                    <td className="px-2 py-2 font-mono text-xs">{row.code}</td>
                    <td className="px-2 py-2">{row.name}</td>
                    <td className="px-2 py-2">
                      {row.is_active ? (
                        <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {row.is_default ? (
                        <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-800">
                          Default
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    {canWrite ? (
                      <td className="px-2 py-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={totalResults}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(DEFAULT_PAGE);
            }}
          />
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit warehouse' : 'Add warehouse'}
        footer={
          <>
            <Button variant="secondary" disabled={saving} onClick={closeModal}>
              Cancel
            </Button>
            <Button
              disabled={saving}
              isLoading={saving}
              onClick={() => void handleSubmit()}
            >
              {editing ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          {formError ? (
            <p className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
              {formError}
            </p>
          ) : null}
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="e.g. DEFAULT"
            disabled={saving}
            maxLength={MAX_CODE_LEN}
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Display name"
            disabled={saving}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_default: e.target.checked }))
              }
              disabled={saving}
            />
            Default warehouse for this tenant
          </label>
          {editing ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
                disabled={saving}
              />
              Active
            </label>
          ) : null}
          <p className="text-xs text-gray-500">
            Core rejects deactivating the default or last active warehouse, or
            one with non-zero stock. There is no hard delete.
          </p>
        </div>
      </Modal>
    </div>
  );
}
