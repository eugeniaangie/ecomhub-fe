'use client';

import { useEffect, useState } from 'react';
import { operationalExpensesApi, expenseCategoriesApi, accountsFinanceApi } from '@/lib/services/financeApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/finance/StatusBadge';
import { formatDate, formatDateTime, formatCurrency, getTodayFormatted, isValidDate, formatNumber, parseFormattedNumber } from '@/lib/utils/formatters';
import { EXPENSE_STATUS_COLORS, EXPENSE_STATUS_LABELS, EXPENSE_STATUS_OPTIONS } from '@/lib/utils/constants';
import type { OperationalExpense, ExpenseCategory, Account } from '@/lib/types/finance';

export default function OperationalExpensesPage() {
  useEffect(() => {
    document.title = 'Operational Expenses - Finance Management';
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OperationalExpense | null>(null);
  const [viewingItem, setViewingItem] = useState<OperationalExpense | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Data
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Display state for formatted amount
  const [amountDisplay, setAmountDisplay] = useState('');

  // Form
  const [form, setForm] = useState({
    expense_date: getTodayFormatted(),
    expense_category_id: 0,
    account_id: 0,
    amount: 0,
    description: '',
    receipt_image_url: '',
  });

  // TODO: Get user role and user ID from auth context
  const userRole = 'admin'; // Temporary: 'staff' | 'admin' | 'superadmin'
  const currentUserId = 1; // Temporary

  useEffect(() => {
    loadData();
    loadDropdownData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, statusFilter, categoryFilter, pageSize]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await operationalExpensesApi.getList({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        category_id: categoryFilter ? parseInt(categoryFilter) : undefined,
      });
      setExpenses(response.results);
      setTotalPages(response.total_pages);
      setTotalResults(response.total_results);
    } catch (err: unknown) {
      console.error('Error loading operational expenses:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [categoriesRes, accountsRes] = await Promise.all([
        expenseCategoriesApi.getAll(),
        accountsFinanceApi.getAll(),
      ]);
      setCategories(categoriesRes || []);
      setAccounts((accountsRes || []).filter((acc) => acc.is_active));
    } catch (err: unknown) {
      console.error('Error loading dropdown data:', err);
      setCategories([]);
      setAccounts([]);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setForm({
      expense_date: getTodayFormatted(),
      expense_category_id: categories.length > 0 ? categories[0].id : 0,
      account_id: accounts.length > 0 ? accounts[0].id : 0,
      amount: 0,
      description: '',
      receipt_image_url: '',
    });
    setAmountDisplay('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: OperationalExpense) => {
    if (item.status !== 'pending') {
      setError('Can only edit expenses with pending status');
      return;
    }
    setEditingItem(item);
    setForm({
      expense_date: item.expense_date,
      expense_category_id: item.expense_category_id,
      account_id: item.account_id,
      amount: item.amount,
      description: item.description || '',
      receipt_image_url: item.receipt_image_url || '',
    });
    setAmountDisplay(formatNumber(item.amount.toString()));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleView = (item: OperationalExpense) => {
    setViewingItem(item);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: number, expense: OperationalExpense) => {
    if (expense.status !== 'pending') {
      setError('Can only delete expenses with pending status');
      return;
    }

    if (!confirm('Are you sure you want to delete this operational expense?')) return;

    try {
      await operationalExpensesApi.delete(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Are you sure you want to approve this expense?')) return;

    try {
      await operationalExpensesApi.approve(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve expense';
      setError(errorMessage);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to reject this expense?')) return;

    try {
      await operationalExpensesApi.reject(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject expense';
      setError(errorMessage);
    }
  };

  const handlePay = async (id: number) => {
    if (!confirm('Are you sure you want to mark this expense as paid?')) return;

    try {
      await operationalExpensesApi.pay(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark expense as paid';
      setError(errorMessage);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.expense_date) {
      setFormError('Expense date is required');
      return;
    }

    if (!form.expense_category_id || form.expense_category_id === 0) {
      setFormError('Expense category is required');
      return;
    }

    if (!form.account_id || form.account_id === 0) {
      setFormError('Account is required');
      return;
    }

    if (!form.amount || form.amount <= 0) {
      setFormError('Amount must be greater than 0');
      return;
    }

    try {
      setFormError('');
      const payload = {
        expense_date: form.expense_date,
        expense_category_id: form.expense_category_id,
        account_id: form.account_id,
        amount: form.amount,
        description: form.description?.trim() || undefined,
        receipt_image_url: form.receipt_image_url?.trim() || undefined,
      };

      if (editingItem) {
        await operationalExpensesApi.update(editingItem.id, payload);
      } else {
        await operationalExpensesApi.create(payload);
      }
      setIsModalOpen(false);
      setForm({
        expense_date: getTodayFormatted(),
        expense_category_id: 0,
        account_id: 0,
        amount: 0,
        description: '',
        receipt_image_url: '',
      });
      setAmountDisplay('');
      loadData();
    } catch (err: unknown) {
      console.error('Error saving operational expense:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save item';
      setFormError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm({
      expense_date: getTodayFormatted(),
      expense_category_id: 0,
      account_id: 0,
      amount: 0,
      description: '',
      receipt_image_url: '',
    });
    setAmountDisplay('');
    setFormError('');
  };

  const canApprove = (expense: OperationalExpense) => {
    return (
      (userRole === 'admin' || userRole === 'superadmin') &&
      expense.status === 'pending'
    );
  };

  const canPay = (expense: OperationalExpense) => {
    return (
      (userRole === 'admin' || userRole === 'superadmin') &&
      expense.status === 'approved'
    );
  };

  const canEdit = (expense: OperationalExpense) => {
    const isOwner = expense.created_by === currentUserId;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    return expense.status === 'pending' && (isOwner || isAdmin);
  };

  const canDelete = (expense: OperationalExpense) => {
    return canEdit(expense);
  };

  const getCategoryName = (categoryId: number) => {
    if (!categories || categories.length === 0) return 'Unknown';
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.category_name : 'Unknown';
  };

  const getAccountName = (accountId: number) => {
    if (!accounts || accounts.length === 0) return 'Unknown';
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.account_code} - ${account.account_name}` : 'Unknown';
  };

  if (isLoading && expenses.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading operational expenses...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-16 left-64 right-0 z-40 bg-white px-6 py-4 border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Operational Expenses</h1>
          <Button onClick={handleCreate} variant="primary">
            + Add Expense
          </Button>
        </div>
      </div>

      <div className="pt-[72px] px-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Search & Filters */}
        <div className="fixed top-[136px] left-64 right-0 z-30 bg-white px-6 py-4 border-b border-gray-200 shadow-sm">
        <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search by expense number or description..."
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          {EXPENSE_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Categories</option>
          {(categories || []).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.category_name}
            </option>
          ))}
        </select>
        <Button onClick={handleSearch} variant="secondary">
          Search
        </Button>
        {(searchQuery || statusFilter || categoryFilter) && (
          <Button
            onClick={() => {
              setSearchInput('');
              setSearchQuery('');
              setStatusFilter('');
              setCategoryFilter('');
              setCurrentPage(1);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        )}
        </div>
        </div>
        <div className="pt-[72px]">
      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Expense Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
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
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery || statusFilter || categoryFilter
                      ? 'No expenses found matching your filters'
                      : 'No operational expenses found'}
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {expense.expense_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(expense.expense_date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {getCategoryName(expense.expense_category_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge
                        label={EXPENSE_STATUS_LABELS[expense.status]}
                        colorClass={EXPENSE_STATUS_COLORS[expense.status]}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <Button variant="ghost" size="sm" onClick={() => handleView(expense)}>
                          View
                        </Button>
                        {canEdit(expense) && (
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                            Edit
                          </Button>
                        )}
                        {canDelete(expense) && (
                          <Button variant="danger" size="sm" onClick={() => handleDelete(expense.id, expense)}>
                            Delete
                          </Button>
                        )}
                        {canApprove(expense) && (
                          <>
                            <Button variant="primary" size="sm" onClick={() => handleApprove(expense.id)}>
                              Approve
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleReject(expense.id)}>
                              Reject
                            </Button>
                          </>
                        )}
                        {canPay(expense) && (
                          <Button variant="primary" size="sm" onClick={() => handlePay(expense.id)}>
                            Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
        title={editingItem ? 'Edit Operational Expense' : 'Create Operational Expense'}
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
            <label htmlFor="expense-date" className="block text-sm font-medium text-gray-700 mb-1">
              Expense Date <span className="text-red-500">*</span>
            </label>
            <input
              id="expense-date"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              value={form.expense_date}
              onChange={(e) => {
                const value = e.target.value;
                if (isValidDate(value)) {
                  setForm({ ...form, expense_date: value });
                  setFormError('');
                }
              }}
              required
              max={getTodayFormatted()}
            />
            <p className="mt-1 text-xs text-gray-500">Click to open calendar picker</p>
          </div>

          <div>
            <label htmlFor="expense-category" className="block text-sm font-medium text-gray-700 mb-1">
              Expense Category <span className="text-red-500">*</span>
            </label>
            <select
              id="expense-category"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.expense_category_id}
              onChange={(e) => setForm({ ...form, expense_category_id: parseInt(e.target.value) })}
              required
            >
              <option value={0}>Select a category</option>
              {(categories || []).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">
              Account <span className="text-red-500">*</span>
            </label>
            <select
              id="account"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.account_id}
              onChange={(e) => setForm({ ...form, account_id: parseInt(e.target.value) })}
              required
            >
              <option value={0}>Select an account</option>
              {(accounts || []).map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_code} - {acc.account_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount (IDR) <span className="text-red-500">*</span>
            </label>
            <input
              id="amount"
              type="text"
              inputMode="numeric"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={amountDisplay}
              onChange={(e) => {
                const val = e.target.value;
                const numValue = parseFormattedNumber(val);
                const formatted = formatNumber(val);
                setAmountDisplay(formatted);
                setForm({ ...form, amount: numValue });
              }}
              onFocus={(e) => {
                if (form.amount === 0 || amountDisplay === '') {
                  e.target.select();
                }
              }}
              onBlur={() => {
                if (form.amount > 0) {
                  setAmountDisplay(formatNumber(form.amount.toString()));
                } else {
                  setAmountDisplay('');
                }
              }}
              required
              placeholder="Enter amount (e.g., 7.000.000)"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label htmlFor="receipt-url" className="block text-sm font-medium text-gray-700 mb-1">
              Receipt Image URL
            </label>
            <input
              id="receipt-url"
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.receipt_image_url}
              onChange={(e) => setForm({ ...form, receipt_image_url: e.target.value })}
              placeholder="https://example.com/receipt.jpg"
            />
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Expense Details"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>
        }
      >
        {viewingItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Expense Number</div>
                <div className="text-sm text-gray-900 font-medium">{viewingItem.expense_number}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Status</div>
                <div className="mt-1">
                  <StatusBadge
                    label={EXPENSE_STATUS_LABELS[viewingItem.status]}
                    colorClass={EXPENSE_STATUS_COLORS[viewingItem.status]}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Date</div>
                <div className="text-sm text-gray-900">{formatDate(viewingItem.expense_date)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Amount</div>
                <div className="text-sm text-gray-900 font-medium">{formatCurrency(viewingItem.amount)}</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">Category</div>
              <div className="text-sm text-gray-900">{getCategoryName(viewingItem.expense_category_id)}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">Account</div>
              <div className="text-sm text-gray-900">{getAccountName(viewingItem.account_id)}</div>
            </div>

            {viewingItem.description && (
              <div>
                <div className="text-sm font-medium text-gray-500">Description</div>
                <div className="text-sm text-gray-900">{viewingItem.description}</div>
              </div>
            )}

            {viewingItem.receipt_image_url && (
              <div>
                <div className="text-sm font-medium text-gray-500">Receipt</div>
                <a
                  href={viewingItem.receipt_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Receipt
                </a>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Workflow History</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">Created</div>
                  <div className="text-sm text-gray-900">{formatDateTime(viewingItem.created_at)}</div>
                </div>
                {viewingItem.approved_at && (
                  <div>
                    <div className="text-xs text-gray-500">Approved</div>
                    <div className="text-sm text-gray-900">{formatDateTime(viewingItem.approved_at)}</div>
                  </div>
                )}
                {viewingItem.paid_at && (
                  <div>
                    <div className="text-xs text-gray-500">Paid</div>
                    <div className="text-sm text-gray-900">{formatDateTime(viewingItem.paid_at)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
}

