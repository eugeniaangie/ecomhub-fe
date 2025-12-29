'use client';

import { useEffect, useState } from 'react';
import { journalEntriesApi, fiscalPeriodsApi, accountsFinanceApi } from '@/lib/services/financeApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/finance/StatusBadge';
import { formatDate, formatDateTime, formatCurrency, isValidDate, formatNumber, parseFormattedNumber } from '@/lib/utils/formatters';
import {
  JOURNAL_ENTRY_STATUS_COLORS,
  JOURNAL_ENTRY_STATUS_LABELS,
  JOURNAL_ENTRY_STATUS_OPTIONS,
} from '@/lib/utils/constants';
import type {
  JournalEntry,
  FiscalPeriod,
  Account,
} from '@/lib/types/finance';

export default function JournalEntriesPage() {
  useEffect(() => {
    document.title = 'Journal Entries - Finance Management';
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JournalEntry | null>(null);
  const [viewingItem, setViewingItem] = useState<JournalEntry | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fiscalPeriodFilter, setFiscalPeriodFilter] = useState('');

  // Data
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Display states for formatted amounts (debit/credit per line)
  const [lineDisplays, setLineDisplays] = useState<Array<{ debit: string; credit: string }>>([
    { debit: '', credit: '' },
    { debit: '', credit: '' },
  ]);

  // Form
  const [form, setForm] = useState({
    entry_date: '',
    fiscal_period_id: 0,
    description: '',
    reference_number: '',
    lines: [
      { account_id: 0, description: '', debit: 0, credit: 0 },
      { account_id: 0, description: '', debit: 0, credit: 0 },
    ] as Array<{ account_id: number; description: string; debit: number; credit: number }>,
  });

  // TODO: Get user role from auth context
  const userRole = 'admin'; // Temporary: 'staff' | 'admin' | 'superadmin'
  const canApprove = userRole === 'admin' || userRole === 'superadmin';

  useEffect(() => {
    loadData();
    loadDropdownData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, statusFilter, fiscalPeriodFilter, pageSize]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await journalEntriesApi.getList({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        fiscal_period_id: fiscalPeriodFilter ? parseInt(fiscalPeriodFilter) : undefined,
      });
      setEntries(response.results);
      setTotalPages(response.total_pages);
      setTotalResults(response.total_results);
    } catch (err: unknown) {
      console.error('Error loading journal entries:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [periodsRes, accountsRes] = await Promise.all([
        fiscalPeriodsApi.getAll(),
        accountsFinanceApi.getAll(),
      ]);
      setFiscalPeriods(periodsRes || []);
      setAccounts((accountsRes || []).filter((acc) => acc.is_active));
    } catch (err: unknown) {
      console.error('Error loading dropdown data:', err);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setEditingItem(null);
    const today = new Date().toISOString().split('T')[0];
    setForm({
      entry_date: today,
      fiscal_period_id: fiscalPeriods.length > 0 ? fiscalPeriods[0].id : 0,
      description: '',
      reference_number: '',
      lines: [
        { account_id: 0, description: '', debit: 0, credit: 0 },
        { account_id: 0, description: '', debit: 0, credit: 0 },
      ],
    });
    setLineDisplays([{ debit: '', credit: '' }, { debit: '', credit: '' }]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: JournalEntry) => {
    if (item.status !== 'draft') {
      setError('Can only edit journal entries with draft status');
      return;
    }
    setEditingItem(item);
    const lines = item.lines
      ? item.lines.map((line) => ({
          account_id: line.account_id,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
        }))
      : [
          { account_id: 0, description: '', debit: 0, credit: 0 },
          { account_id: 0, description: '', debit: 0, credit: 0 },
        ];
    
    setForm({
      entry_date: item.entry_date,
      fiscal_period_id: item.fiscal_period_id,
      description: item.description,
      reference_number: item.reference_number || '',
      lines,
    });
    
    setLineDisplays(
      lines.map((line) => ({
        debit: line.debit > 0 ? formatNumber(line.debit.toString()) : '',
        credit: line.credit > 0 ? formatNumber(line.credit.toString()) : '',
      }))
    );
    
    setFormError('');
    setIsModalOpen(true);
  };

  const handleView = (item: JournalEntry) => {
    setViewingItem(item);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: number, entry: JournalEntry) => {
    if (entry.status !== 'draft') {
      setError('Can only delete journal entries with draft status');
      return;
    }

    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    try {
      await journalEntriesApi.delete(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Are you sure you want to approve this journal entry?')) return;

    try {
      await journalEntriesApi.approve(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve entry';
      setError(errorMessage);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to reject this journal entry?')) return;

    try {
      await journalEntriesApi.reject(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject entry';
      setError(errorMessage);
    }
  };

  const handlePost = async (id: number) => {
    if (!confirm('Are you sure you want to post this journal entry? This action cannot be undone.'))
      return;

    try {
      await journalEntriesApi.post(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post entry';
      setError(errorMessage);
    }
  };

  const handleAddLine = () => {
    setForm({
      ...form,
      lines: [...form.lines, { account_id: 0, description: '', debit: 0, credit: 0 }],
    });
    setLineDisplays([...lineDisplays, { debit: '', credit: '' }]);
  };

  const handleRemoveLine = (index: number) => {
    if (form.lines.length <= 2) {
      setFormError('Journal entry must have at least 2 lines');
      return;
    }
    const newLines = form.lines.filter((_, i) => i !== index);
    const newDisplays = lineDisplays.filter((_, i) => i !== index);
    setForm({ ...form, lines: newLines });
    setLineDisplays(newDisplays);
    setFormError('');
  };

  const handleLineChange = (
    index: number,
    field: 'account_id' | 'description' | 'debit' | 'credit',
    value: string | number
  ) => {
    const newLines = [...form.lines];
    const newDisplays = [...lineDisplays];
    
    // If debit is set, clear credit and vice versa (mutually exclusive)
    if (field === 'debit') {
      const numValue = typeof value === 'string' ? parseFormattedNumber(value) : value;
      newLines[index] = { 
        ...newLines[index], 
        debit: numValue,
        credit: numValue > 0 ? 0 : newLines[index].credit // Clear credit only if debit > 0
      };
      // Update display
      const formatted = typeof value === 'string' ? formatNumber(value) : (numValue > 0 ? formatNumber(numValue.toString()) : '');
      newDisplays[index] = { 
        ...newDisplays[index], 
        debit: formatted,
        credit: numValue > 0 ? '' : newDisplays[index].credit // Clear credit display
      };
    } else if (field === 'credit') {
      const numValue = typeof value === 'string' ? parseFormattedNumber(value) : value;
      newLines[index] = { 
        ...newLines[index], 
        credit: numValue,
        debit: numValue > 0 ? 0 : newLines[index].debit // Clear debit only if credit > 0
      };
      // Update display
      const formatted = typeof value === 'string' ? formatNumber(value) : (numValue > 0 ? formatNumber(numValue.toString()) : '');
      newDisplays[index] = { 
        ...newDisplays[index], 
        credit: formatted,
        debit: numValue > 0 ? '' : newDisplays[index].debit // Clear debit display
      };
    } else {
      newLines[index] = { ...newLines[index], [field]: value };
    }

    setForm({ ...form, lines: newLines });
    setLineDisplays(newDisplays);
    setFormError('');
  };

  const calculateTotals = () => {
    const totalDebit = form.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = form.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return { totalDebit, totalCredit, isBalanced: totalDebit === totalCredit };
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.entry_date) {
      setFormError('Entry date is required');
      return;
    }

    if (!form.fiscal_period_id || form.fiscal_period_id === 0) {
      setFormError('Fiscal period is required');
      return;
    }

    if (!form.description.trim()) {
      setFormError('Description is required');
      return;
    }

    if (form.lines.length < 2) {
      setFormError('Journal entry must have at least 2 lines');
      return;
    }

    // Validate each line
    for (let i = 0; i < form.lines.length; i++) {
      const line = form.lines[i];
      if (!line.account_id || line.account_id === 0) {
        setFormError(`Line ${i + 1}: Account is required`);
        return;
      }
      if (!line.description.trim()) {
        setFormError(`Line ${i + 1}: Description is required`);
        return;
      }
      if (line.debit === 0 && line.credit === 0) {
        setFormError(`Line ${i + 1}: Either debit or credit must be greater than 0`);
        return;
      }
      if (line.debit > 0 && line.credit > 0) {
        setFormError(`Line ${i + 1}: Cannot have both debit and credit`);
        return;
      }
    }

    // Validate balance
    const { totalDebit, totalCredit, isBalanced } = calculateTotals();
    if (!isBalanced) {
      setFormError(
        `Total debit (${formatCurrency(totalDebit)}) must equal total credit (${formatCurrency(totalCredit)})`
      );
      return;
    }

    try {
      setFormError('');
      const payload = {
        entry_date: form.entry_date,
        fiscal_period_id: form.fiscal_period_id,
        description: form.description.trim(),
        reference_number: form.reference_number?.trim() || undefined,
        lines: form.lines.map((line) => ({
          account_id: line.account_id,
          description: line.description.trim(),
          debit: line.debit || 0,
          credit: line.credit || 0,
        })),
      };

      if (editingItem) {
        await journalEntriesApi.update(editingItem.id, payload);
      } else {
        await journalEntriesApi.create(payload);
      }
      setIsModalOpen(false);
      setForm({
        entry_date: '',
        fiscal_period_id: 0,
        description: '',
        reference_number: '',
        lines: [
          { account_id: 0, description: '', debit: 0, credit: 0 },
          { account_id: 0, description: '', debit: 0, credit: 0 },
        ],
      });
      setLineDisplays([{ debit: '', credit: '' }, { debit: '', credit: '' }]);
      loadData();
    } catch (err: unknown) {
      console.error('Error saving journal entry:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save item';
      setFormError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm({
      entry_date: '',
      fiscal_period_id: 0,
      description: '',
      reference_number: '',
      lines: [
        { account_id: 0, description: '', debit: 0, credit: 0 },
        { account_id: 0, description: '', debit: 0, credit: 0 },
      ],
    });
    setLineDisplays([{ debit: '', credit: '' }, { debit: '', credit: '' }]);
    setFormError('');
  };

  const canEdit = (entry: JournalEntry) => {
    return entry.status === 'draft';
  };

  const canDelete = (entry: JournalEntry) => {
    return entry.status === 'draft';
  };

  const getAccountName = (accountId: number) => {
    if (!accounts || accounts.length === 0) return 'Unknown';
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.account_code} - ${account.account_name}` : 'Unknown';
  };

  const { totalDebit, totalCredit, isBalanced } = calculateTotals();

  if (isLoading && entries.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading journal entries...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
        <Button onClick={handleCreate} variant="primary">
          + Add Journal Entry
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
          placeholder="Search by entry number or description..."
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
          {JOURNAL_ENTRY_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={fiscalPeriodFilter}
          onChange={(e) => {
            setFiscalPeriodFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Fiscal Periods</option>
          {fiscalPeriods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.period_name}
            </option>
          ))}
        </select>
        <Button onClick={handleSearch} variant="secondary">
          Search
        </Button>
        {(searchQuery || statusFilter || fiscalPeriodFilter) && (
          <Button
            onClick={() => {
              setSearchInput('');
              setSearchQuery('');
              setStatusFilter('');
              setFiscalPeriodFilter('');
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
                  Entry Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Debit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Credit
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
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery || statusFilter || fiscalPeriodFilter
                      ? 'No entries found matching your filters'
                      : 'No journal entries found'}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {entry.entry_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(entry.entry_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{entry.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {formatCurrency(entry.total_debit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {formatCurrency(entry.total_credit)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge
                        label={JOURNAL_ENTRY_STATUS_LABELS[entry.status]}
                        colorClass={JOURNAL_ENTRY_STATUS_COLORS[entry.status]}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <Button variant="ghost" size="sm" onClick={() => handleView(entry)}>
                          View
                        </Button>
                        {canEdit(entry) && (
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                            Edit
                          </Button>
                        )}
                        {canDelete(entry) && (
                          <Button variant="danger" size="sm" onClick={() => handleDelete(entry.id, entry)}>
                            Delete
                          </Button>
                        )}
                        {canApprove && entry.status === 'draft' && (
                          <>
                            <Button variant="primary" size="sm" onClick={() => handleApprove(entry.id)}>
                              Approve
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleReject(entry.id)}>
                              Reject
                            </Button>
                          </>
                        )}
                        {canApprove && entry.status === 'approved' && (
                          <Button variant="primary" size="sm" onClick={() => handlePost(entry.id)}>
                            Post
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
        title={editingItem ? 'Edit Journal Entry' : 'Create Journal Entry'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!isBalanced}>
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
              <label htmlFor="entry-date" className="block text-sm font-medium text-gray-700 mb-1">
                Entry Date <span className="text-red-500">*</span>
              </label>
              <input
                id="entry-date"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={form.entry_date}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isValidDate(value)) {
                    setForm({ ...form, entry_date: value });
                    setFormError('');
                  }
                }}
                required
                min="2000-01-01"
                max="2100-12-31"
              />
              <p className="mt-1 text-xs text-gray-500">Click to open calendar picker</p>
            </div>

            <div>
              <label htmlFor="fiscal-period" className="block text-sm font-medium text-gray-700 mb-1">
                Fiscal Period <span className="text-red-500">*</span>
              </label>
              <select
                id="fiscal-period"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.fiscal_period_id}
                onChange={(e) => setForm({ ...form, fiscal_period_id: parseInt(e.target.value) })}
                required
              >
                <option value={0}>Select fiscal period</option>
                {fiscalPeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.period_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              id="description"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              placeholder="Enter description"
            />
          </div>

          <div>
            <label htmlFor="reference-number" className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number
            </label>
            <input
              id="reference-number"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.reference_number}
              onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
              placeholder="Optional reference number"
            />
          </div>

          {/* Journal Entry Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Journal Entry Lines <span className="text-red-500">*</span>
              </label>
              <Button variant="secondary" size="sm" onClick={handleAddLine}>
                + Add Line
              </Button>
            </div>
            <div className="space-y-3">
              {form.lines.map((line, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Line {index + 1}</span>
                    {form.lines.length > 2 && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveLine(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Account *</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={line.account_id}
                        onChange={(e) =>
                          handleLineChange(index, 'account_id', parseInt(e.target.value))
                        }
                        required
                      >
                        <option value={0}>Select account</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.account_code} - {acc.account_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Description *</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={line.description}
                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                        required
                        placeholder="Line description"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Debit (Masuk) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={lineDisplays[index]?.debit || ''}
                        onChange={(e) => {
                          handleLineChange(index, 'debit', e.target.value);
                        }}
                        onFocus={(e) => {
                          if (!lineDisplays[index]?.debit || lineDisplays[index].debit === '') {
                            e.target.select();
                          }
                        }}
                        onBlur={() => {
                          const newDisplays = [...lineDisplays];
                          if (form.lines[index].debit > 0) {
                            newDisplays[index] = { ...newDisplays[index], debit: formatNumber(form.lines[index].debit.toString()) };
                          } else {
                            newDisplays[index] = { ...newDisplays[index], debit: '' };
                          }
                          setLineDisplays(newDisplays);
                        }}
                        disabled={line.credit > 0}
                        placeholder="0"
                      />
                      {line.credit > 0 && (
                        <p className="mt-1 text-xs text-gray-500">Pilih salah satu: Debit atau Credit</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Credit (Keluar) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={lineDisplays[index]?.credit || ''}
                        onChange={(e) => {
                          handleLineChange(index, 'credit', e.target.value);
                        }}
                        onFocus={(e) => {
                          if (!lineDisplays[index]?.credit || lineDisplays[index].credit === '') {
                            e.target.select();
                          }
                        }}
                        onBlur={() => {
                          const newDisplays = [...lineDisplays];
                          if (form.lines[index].credit > 0) {
                            newDisplays[index] = { ...newDisplays[index], credit: formatNumber(form.lines[index].credit.toString()) };
                          } else {
                            newDisplays[index] = { ...newDisplays[index], credit: '' };
                          }
                          setLineDisplays(newDisplays);
                        }}
                        disabled={line.debit > 0}
                        placeholder="0"
                      />
                      {line.debit > 0 && (
                        <p className="mt-1 text-xs text-gray-500">Pilih salah satu: Debit atau Credit</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Balance Summary */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total Debit:</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(totalDebit)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total Credit:</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(totalCredit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Balance:</span>
              <span
                className={`text-sm font-bold ${
                  isBalanced ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Journal Entry Details"
        size="xl"
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
                <div className="text-sm font-medium text-gray-500">Entry Number</div>
                <div className="text-sm text-gray-900 font-medium">{viewingItem.entry_number}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Status</div>
                <div className="mt-1">
                  <StatusBadge
                    label={JOURNAL_ENTRY_STATUS_LABELS[viewingItem.status]}
                    colorClass={JOURNAL_ENTRY_STATUS_COLORS[viewingItem.status]}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Entry Date</div>
                <div className="text-sm text-gray-900">{formatDate(viewingItem.entry_date)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Fiscal Period</div>
                <div className="text-sm text-gray-900">
                  {viewingItem.fiscal_period?.period_name || 'N/A'}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">Description</div>
              <div className="text-sm text-gray-900">{viewingItem.description}</div>
            </div>

            {viewingItem.reference_number && (
              <div>
                <div className="text-sm font-medium text-gray-500">Reference Number</div>
                <div className="text-sm text-gray-900">{viewingItem.reference_number}</div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-700 mb-3">Journal Entry Lines</div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Account
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Debit
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {viewingItem.lines?.map((line, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {getAccountName(line.account_id)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{line.description}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">
                          {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">
                          {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                        Total:
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(viewingItem.total_debit)}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(viewingItem.total_credit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

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
                {viewingItem.posted_at && (
                  <div>
                    <div className="text-xs text-gray-500">Posted</div>
                    <div className="text-sm text-gray-900">{formatDateTime(viewingItem.posted_at)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

