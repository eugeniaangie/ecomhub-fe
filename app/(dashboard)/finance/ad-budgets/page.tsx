'use client';

import { useEffect, useState } from 'react';
import { adBudgetsApi } from '@/lib/services/financeApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate, formatNumber, parseFormattedNumber } from '@/lib/utils/formatters';
import { AD_PLATFORM_OPTIONS, AD_PLATFORM_LABELS } from '@/lib/utils/constants';
import type { AdBudget, AdPlatform } from '@/lib/types/finance';

export default function AdBudgetsPage() {
  useEffect(() => {
    document.title = 'Ad Budgets - Finance Management';
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSpentModalOpen, setIsSpentModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdBudget | null>(null);
  const [updatingSpentItem, setUpdatingSpentItem] = useState<AdBudget | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  // Default to current month (YYYY-MM-01 format)
  const getCurrentMonthFilter = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };
  const [monthFilter, setMonthFilter] = useState(getCurrentMonthFilter());

  // Data
  const [budgets, setBudgets] = useState<AdBudget[]>([]);

  // Form
  const [form, setForm] = useState<{
    platform: AdPlatform | '';
    month_year: string;
    budget_amount: number;
    spent_amount: number;
    notes: string;
  }>({
    platform: '',
    month_year: '',
    budget_amount: 0,
    spent_amount: 0,
    notes: '',
  });

  // Display states for formatted amounts
  const [budgetAmountDisplay, setBudgetAmountDisplay] = useState('');
  const [spentAmountDisplay, setSpentAmountDisplay] = useState('');
  const [spentAmountUpdateDisplay, setSpentAmountUpdateDisplay] = useState('');

  // Spent update form
  const [spentForm, setSpentForm] = useState({
    spent_amount: 0,
  });

  // TODO: Get user role from auth context
  const userRole = 'admin'; // Temporary: 'staff' | 'admin' | 'superadmin'
  const canEdit = userRole === 'admin' || userRole === 'superadmin';

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, platformFilter, monthFilter, pageSize]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await adBudgetsApi.getList({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        platform: platformFilter || undefined,
        month_year: monthFilter || undefined,
      });
      setBudgets(response.results);
      setTotalPages(response.total_pages);
      setTotalResults(response.total_results);
    } catch (err: unknown) {
      console.error('Error loading ad budgets:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setBudgets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setEditingItem(null);
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setForm({
      platform: '',
      month_year: firstDayOfMonth.toISOString().split('T')[0].slice(0, 7) + '-01',
      budget_amount: 0,
      spent_amount: 0,
      notes: '',
    });
    setBudgetAmountDisplay('');
    setSpentAmountDisplay('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: AdBudget) => {
    setEditingItem(item);
    setForm({
      platform: item.platform,
      month_year: item.month_year,
      budget_amount: item.budget_amount,
      spent_amount: item.spent_amount,
      notes: item.notes || '',
    });
    setBudgetAmountDisplay(formatNumber(item.budget_amount.toString()));
    setSpentAmountDisplay(formatNumber(item.spent_amount.toString()));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleUpdateSpent = (item: AdBudget) => {
    setUpdatingSpentItem(item);
    setSpentForm({
      spent_amount: item.spent_amount,
    });
    setSpentAmountUpdateDisplay(formatNumber(item.spent_amount.toString()));
    setIsSpentModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ad budget?')) return;

    try {
      await adBudgetsApi.delete(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.platform.trim()) {
      setFormError('Platform is required');
      return;
    }

    if (!form.month_year) {
      setFormError('Month is required');
      return;
    }

    if (!form.budget_amount || form.budget_amount <= 0) {
      setFormError('Budget amount must be greater than 0');
      return;
    }

    if (form.spent_amount > form.budget_amount) {
      setFormError('Spent amount cannot exceed budget amount');
      return;
    }

    if (!form.platform) {
      setFormError('Platform is required');
      return;
    }

    try {
      setFormError('');
      const payload = {
        platform: form.platform as AdPlatform,
        month_year: form.month_year,
        budget_amount: form.budget_amount,
        spent_amount: form.spent_amount || 0,
        notes: form.notes?.trim() || undefined,
      };

      if (editingItem) {
        await adBudgetsApi.update(editingItem.id, payload);
      } else {
        await adBudgetsApi.create(payload);
      }
      setIsModalOpen(false);
      setForm({
        platform: '',
        month_year: '',
        budget_amount: 0,
        spent_amount: 0,
        notes: '',
      });
      setBudgetAmountDisplay('');
      setSpentAmountDisplay('');
      loadData();
    } catch (err: unknown) {
      console.error('Error saving ad budget:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save item';
      setFormError(errorMessage);
    }
  };

  const handleUpdateSpentSubmit = async () => {
    if (!updatingSpentItem) return;

    if (spentForm.spent_amount < 0) {
      setFormError('Spent amount cannot be negative');
      return;
    }

    if (spentForm.spent_amount > updatingSpentItem.budget_amount) {
      setFormError('Spent amount cannot exceed budget amount');
      return;
    }

    try {
      setFormError('');
      await adBudgetsApi.updateSpent(updatingSpentItem.id, {
        spent_amount: spentForm.spent_amount,
      });
      setIsSpentModalOpen(false);
      setUpdatingSpentItem(null);
      loadData();
    } catch (err: unknown) {
      console.error('Error updating spent amount:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update spent amount';
      setFormError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm({
      platform: '',
      month_year: '',
      budget_amount: 0,
      spent_amount: 0,
      notes: '',
    });
    setBudgetAmountDisplay('');
    setSpentAmountDisplay('');
    setFormError('');
  };

  const handleCloseSpentModal = () => {
    setIsSpentModalOpen(false);
    setUpdatingSpentItem(null);
    setSpentForm({ spent_amount: 0 });
    setSpentAmountUpdateDisplay('');
    setFormError('');
  };

  const getRemainingAmount = (budget: AdBudget) => {
    return budget.budget_amount - budget.spent_amount;
  };

  const getProgressPercentage = (budget: AdBudget) => {
    if (budget.budget_amount === 0) return 0;
    return Math.min((budget.spent_amount / budget.budget_amount) * 100, 100);
  };

  if (isLoading && budgets.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading ad budgets...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ad Budgets</h1>
        {canEdit && (
          <Button onClick={handleCreate} variant="primary">
            + Add Ad Budget
          </Button>
        )}
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
          placeholder="Search by platform or notes..."
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={platformFilter}
          onChange={(e) => {
            setPlatformFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          {AD_PLATFORM_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="month"
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          value={monthFilter ? monthFilter.slice(0, 7) : getCurrentMonthFilter().slice(0, 7)}
          onChange={(e) => {
            const monthValue = e.target.value;
            if (monthValue) {
              setMonthFilter(`${monthValue}-01`);
              setCurrentPage(1);
            }
          }}
        />
        <Button onClick={handleSearch} variant="secondary">
          Search
        </Button>
        {(searchQuery || platformFilter || (monthFilter && monthFilter !== getCurrentMonthFilter())) && (
          <Button
            onClick={() => {
              setSearchInput('');
              setSearchQuery('');
              setPlatformFilter('');
              setMonthFilter(getCurrentMonthFilter());
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
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Progress
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {budgets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery || platformFilter || monthFilter
                      ? 'No budgets found matching your filters'
                      : 'No ad budgets found'}
                  </td>
                </tr>
              ) : (
                budgets.map((budget) => {
                  const remaining = getRemainingAmount(budget);
                  const progress = getProgressPercentage(budget);
                  const isOverBudget = budget.spent_amount > budget.budget_amount;

                  return (
                    <tr key={budget.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {AD_PLATFORM_LABELS[budget.platform] || budget.platform}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(budget.month_year)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {formatCurrency(budget.budget_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {formatCurrency(budget.spent_amount)}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm font-medium ${
                          remaining < 0 ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {formatCurrency(remaining)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              isOverBudget
                                ? 'bg-red-500'
                                : progress > 80
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(budget)}>
                                Edit
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUpdateSpent(budget)}
                              >
                                Update Spent
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDelete(budget.id)}>
                                Delete
                              </Button>
                            </>
                          )}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Ad Budget' : 'Create Ad Budget'}
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

          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
              Platform <span className="text-red-500">*</span>
            </label>
            <select
              id="platform"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value as AdPlatform | '' })}
              required
            >
              <option value="">Select a platform</option>
              {AD_PLATFORM_OPTIONS.filter(opt => opt.value !== '').map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="month-year" className="block text-sm font-medium text-gray-700 mb-1">
              Month <span className="text-red-500">*</span>
            </label>
            <input
              id="month-year"
              type="month"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.month_year ? form.month_year.slice(0, 7) : ''}
              onChange={(e) => setForm({ ...form, month_year: `${e.target.value}-01` })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget-amount" className="block text-sm font-medium text-gray-700 mb-1">
                Budget Amount (IDR) <span className="text-red-500">*</span>
              </label>
              <input
                id="budget-amount"
                type="text"
                inputMode="numeric"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={budgetAmountDisplay}
                onChange={(e) => {
                  const val = e.target.value;
                  const numValue = parseFormattedNumber(val);
                  const formatted = formatNumber(val);
                  setBudgetAmountDisplay(formatted);
                  setForm({ ...form, budget_amount: numValue });
                }}
                onFocus={(e) => {
                  if (form.budget_amount === 0 || budgetAmountDisplay === '') {
                    e.target.select();
                  }
                }}
                onBlur={() => {
                  if (form.budget_amount > 0) {
                    setBudgetAmountDisplay(formatNumber(form.budget_amount.toString()));
                  } else {
                    setBudgetAmountDisplay('');
                  }
                }}
                required
                placeholder="Enter budget amount (e.g., 1.000.000)"
              />
            </div>

            <div>
              <label htmlFor="spent-amount" className="block text-sm font-medium text-gray-700 mb-1">
                Spent Amount (IDR)
              </label>
              <input
                id="spent-amount"
                type="text"
                inputMode="numeric"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={spentAmountDisplay}
                onChange={(e) => {
                  const val = e.target.value;
                  const numValue = parseFormattedNumber(val);
                  const formatted = formatNumber(val);
                  setSpentAmountDisplay(formatted);
                  setForm({ ...form, spent_amount: numValue });
                }}
                onFocus={(e) => {
                  if (form.spent_amount === 0 || spentAmountDisplay === '') {
                    e.target.select();
                  }
                }}
                onBlur={() => {
                  if (form.spent_amount > 0) {
                    setSpentAmountDisplay(formatNumber(form.spent_amount.toString()));
                  } else {
                    setSpentAmountDisplay('');
                  }
                }}
                placeholder="Enter spent amount (e.g., 500.000)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Optional notes"
            />
          </div>
        </div>
      </Modal>

      {/* Update Spent Modal */}
      <Modal
        isOpen={isSpentModalOpen}
        onClose={handleCloseSpentModal}
        title="Update Spent Amount"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseSpentModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateSpentSubmit}>
              Update
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

          {updatingSpentItem && (
            <>
              <div>
                <div className="text-sm text-gray-500">Platform</div>
                <div className="text-sm font-medium text-gray-900">{updatingSpentItem.platform}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Budget Amount</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(updatingSpentItem.budget_amount)}
                </div>
              </div>
              <div>
                <label htmlFor="spent-amount-update" className="block text-sm font-medium text-gray-700 mb-1">
                  Spent Amount (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  id="spent-amount-update"
                  type="text"
                  inputMode="numeric"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={spentAmountUpdateDisplay}
                  onChange={(e) => {
                    const val = e.target.value;
                    const numValue = parseFormattedNumber(val);
                    const formatted = formatNumber(val);
                    setSpentAmountUpdateDisplay(formatted);
                    setSpentForm({ spent_amount: numValue });
                  }}
                  onFocus={(e) => {
                    if (spentForm.spent_amount === 0 || spentAmountUpdateDisplay === '') {
                      e.target.select();
                    }
                  }}
                  onBlur={() => {
                    if (spentForm.spent_amount > 0) {
                      setSpentAmountUpdateDisplay(formatNumber(spentForm.spent_amount.toString()));
                    } else {
                      setSpentAmountUpdateDisplay('');
                    }
                  }}
                  required
                  placeholder="Enter spent amount (e.g., 500.000)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Remaining: {formatCurrency(updatingSpentItem.budget_amount - spentForm.spent_amount)}
                </p>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

