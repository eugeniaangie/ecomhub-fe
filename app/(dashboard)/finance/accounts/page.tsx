'use client';

import { useEffect, useState } from 'react';
import { accountsFinanceApi } from '@/lib/services/financeApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/finance/StatusBadge';
import { ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_OPTIONS } from '@/lib/utils/constants';
import type { Account, AccountType } from '@/lib/types/finance';

export default function AccountsPage() {
  useEffect(() => {
    document.title = 'Chart of Accounts - Finance Management';
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Account | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('');

  // Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]); // For parent dropdown

  // Form
  const [form, setForm] = useState({
    account_code: '',
    account_name: '',
    account_type: 'asset' as AccountType,
    parent_account_id: null as number | null,
    is_active: true,
  });

  useEffect(() => {
    loadData();
    loadAllAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, accountTypeFilter, pageSize]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await accountsFinanceApi.getList({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        account_type: accountTypeFilter || undefined,
      });
      setAccounts(response.results);
      setTotalPages(response.total_pages);
      setTotalResults(response.total_results);
    } catch (err: unknown) {
      console.error('Error loading accounts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllAccounts = async () => {
    try {
      const response = await accountsFinanceApi.getAll();
      setAllAccounts(response || []);
    } catch (err: unknown) {
      console.error('Error loading all accounts:', err);
      setAllAccounts([]);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setForm({
      account_code: '',
      account_name: '',
      account_type: 'asset',
      parent_account_id: null,
      is_active: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: Account) => {
    setEditingItem(item);
    setForm({
      account_code: item.account_code,
      account_name: item.account_name,
      account_type: item.account_type,
      parent_account_id: item.parent_account_id || null,
      is_active: item.is_active,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account? This will be a soft delete.')) return;

    try {
      await accountsFinanceApi.delete(id);
      loadData();
      loadAllAccounts();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.account_code.trim()) {
      setFormError('Account code is required');
      return;
    }

    if (!form.account_name.trim()) {
      setFormError('Account name is required');
      return;
    }

    if (form.account_name.trim().length < 3) {
      setFormError('Account name must be at least 3 characters');
      return;
    }

    try {
      setFormError('');
      const payload = {
        account_code: form.account_code.trim(),
        account_name: form.account_name.trim(),
        account_type: form.account_type,
        parent_account_id: form.parent_account_id || undefined,
        is_active: form.is_active,
      };

      if (editingItem) {
        await accountsFinanceApi.update(editingItem.id, payload);
      } else {
        await accountsFinanceApi.create(payload);
      }
      setIsModalOpen(false);
      setForm({
        account_code: '',
        account_name: '',
        account_type: 'asset',
        parent_account_id: null,
        is_active: true,
      });
      loadData();
      loadAllAccounts();
    } catch (err: unknown) {
      console.error('Error saving account:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save item';
      setFormError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm({
      account_code: '',
      account_name: '',
      account_type: 'asset',
      parent_account_id: null,
      is_active: true,
    });
    setFormError('');
  };

  // Get available parent accounts (exclude current account if editing)
  const availableParents = (allAccounts || []).filter((acc) => {
    if (editingItem && acc.id === editingItem.id) return false;
    return acc.is_active;
  });

  if (isLoading && accounts.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
        <Button onClick={handleCreate} variant="primary">
          + Add Account
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Search & Filters */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search by code or name..."
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={accountTypeFilter}
          onChange={(e) => {
            setAccountTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Account Types</option>
          {ACCOUNT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Button onClick={handleSearch} variant="secondary">
          Search
        </Button>
        {(searchQuery || accountTypeFilter) && (
          <Button
            onClick={() => {
              setSearchInput('');
              setSearchQuery('');
              setAccountTypeFilter('');
              setCurrentPage(1);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Account Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Account Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Account Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery || accountTypeFilter ? 'No accounts found matching your filters' : 'No accounts found'}
                  </td>
                </tr>
              ) : (
                accounts.map((account) => {
                  // Calculate indent level based on parent_account_id
                  const indent = account.parent_account_id ? 'pl-8' : '';
                  
                  return (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {account.account_code}
                      </td>
                      <td className={`px-6 py-4 text-sm text-gray-900 ${indent}`}>
                        {account.parent_account_id && (
                          <span className="text-gray-400 mr-2">└─</span>
                        )}
                        {account.account_name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <StatusBadge
                          label={ACCOUNT_TYPE_LABELS[account.account_type]}
                          colorClass={ACCOUNT_TYPE_COLORS[account.account_type]}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <StatusBadge
                          label={account.is_active ? 'Active' : 'Inactive'}
                          colorClass={account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(account)}>
                            Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(account.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Account' : 'Create Account'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="account-code" className="block text-sm font-medium text-gray-700 mb-1">
                Account Code <span className="text-red-500">*</span>
              </label>
              <input
                id="account-code"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.account_code}
                onChange={(e) => setForm({ ...form, account_code: e.target.value })}
                required
                placeholder="e.g., 1000"
              />
            </div>

            <div>
              <label htmlFor="account-type" className="block text-sm font-medium text-gray-700 mb-1">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                id="account-type"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.account_type}
                onChange={(e) => setForm({ ...form, account_type: e.target.value as AccountType })}
              >
                {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="account-name" className="block text-sm font-medium text-gray-700 mb-1">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              id="account-name"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              required
              placeholder="e.g., Cash in Bank"
            />
          </div>

          <div>
            <label htmlFor="parent-account" className="block text-sm font-medium text-gray-700 mb-1">
              Parent Account (Optional)
            </label>
            <select
              id="parent-account"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.parent_account_id || ''}
              onChange={(e) =>
                setForm({ ...form, parent_account_id: e.target.value ? parseInt(e.target.value) : null })
              }
            >
              <option value="">No Parent (Root Account)</option>
              {availableParents.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_code} - {acc.account_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="is-active"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <label htmlFor="is-active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}

