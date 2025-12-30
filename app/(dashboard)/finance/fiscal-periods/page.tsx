'use client';

import { useEffect, useState } from 'react';
import { fiscalPeriodsApi } from '@/lib/services/financeApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DatePicker } from '@/components/ui/DatePicker';
import { StatusBadge } from '@/components/finance/StatusBadge';
import {
  formatDate,
  formatDateTime,
  formatDateForAPI,
  getFirstDayOfCurrentMonth,
  getLastDayOfCurrentMonth,
  isValidDate,
} from '@/lib/utils/formatters';
import { FISCAL_PERIOD_STATUS_COLORS } from '@/lib/utils/constants';
import {
  canCreateFiscalPeriod,
  canUpdateFiscalPeriod,
  canDeleteFiscalPeriod,
  canCloseFiscalPeriod,
  canReopenFiscalPeriod,
} from '@/lib/authHelpers';
import type { FiscalPeriod } from '@/lib/types/finance';

export default function FiscalPeriodsPage() {
  useEffect(() => {
    document.title = 'Fiscal Periods - Finance Management';
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FiscalPeriod | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Data
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);

  // Form
  const [form, setForm] = useState({
    period_name: '',
    period_start: getFirstDayOfCurrentMonth(),
    period_end: getLastDayOfCurrentMonth(),
  });

  // TODO: Get user role from auth context
  // Permission checks
  const canCreate = canCreateFiscalPeriod();
  const canUpdate = canUpdateFiscalPeriod();
  const canDelete = canDeleteFiscalPeriod();
  const canClose = canCloseFiscalPeriod();
  const canReopen = canReopenFiscalPeriod();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, pageSize]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fiscalPeriodsApi.getList({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
      });
      setPeriods(response.results);
      setTotalPages(response.total_pages);
      setTotalResults(response.total_results);
    } catch (err: unknown) {
      console.error('Error loading fiscal periods:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setPeriods([]);
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
    // Set default to current month (1st day to last day)
    const startDate = getFirstDayOfCurrentMonth();
    const endDate = getLastDayOfCurrentMonth();
    setForm({
      period_name: '',
      period_start: startDate,
      period_end: endDate,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: FiscalPeriod) => {
    if (item.is_closed) {
      setError('Cannot edit closed fiscal period');
      return;
    }
    setEditingItem(item);
    setForm({
      period_name: item.period_name,
      period_start: formatDateForAPI(item.period_start),
      period_end: formatDateForAPI(item.period_end),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, period: FiscalPeriod) => {
    if (period.is_closed) {
      setError('Cannot delete closed fiscal period');
      return;
    }

    if (!confirm('Are you sure you want to delete this fiscal period?')) return;

    try {
      await fiscalPeriodsApi.delete(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
    }
  };

  const handleClose = async (id: number) => {
    if (!confirm('Are you sure you want to close this fiscal period? This action requires admin privileges.')) return;

    try {
      await fiscalPeriodsApi.close(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close fiscal period';
      setError(errorMessage);
    }
  };

  const handleReopen = async (id: number) => {
    if (!confirm('Are you sure you want to reopen this fiscal period? This action requires superadmin privileges.')) return;

    try {
      await fiscalPeriodsApi.reopen(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reopen fiscal period';
      setError(errorMessage);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.period_name.trim()) {
      setFormError('Period name is required');
      return;
    }

    if (form.period_name.trim().length < 3) {
      setFormError('Period name must be at least 3 characters');
      return;
    }

    if (!form.period_start || !form.period_end) {
      setFormError('Start and end dates are required');
      return;
    }

    // Validate date format and validity
    if (!isValidDate(form.period_start)) {
      setFormError('Start date is invalid. Please select a valid date.');
      return;
    }

    if (!isValidDate(form.period_end)) {
      setFormError('End date is invalid. Please select a valid date.');
      return;
    }

    const startDate = new Date(form.period_start);
    const endDate = new Date(form.period_end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setFormError('Invalid date format. Please select valid dates.');
      return;
    }

    if (endDate <= startDate) {
      setFormError('End date must be after start date');
      return;
    }

    try {
      setFormError('');
      const payload = {
        period_name: form.period_name.trim(),
        period_start: form.period_start,
        period_end: form.period_end,
      };

      if (editingItem) {
        await fiscalPeriodsApi.update(editingItem.id, payload);
      } else {
        await fiscalPeriodsApi.create(payload);
      }
      setIsModalOpen(false);
      setForm({
        period_name: '',
        period_start: getFirstDayOfCurrentMonth(),
        period_end: getLastDayOfCurrentMonth(),
      });
      loadData();
    } catch (err: unknown) {
      console.error('Error saving fiscal period:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save item';
      setFormError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm({
      period_name: '',
      period_start: getFirstDayOfCurrentMonth(),
      period_end: getLastDayOfCurrentMonth(),
    });
    setFormError('');
  };


  if (isLoading && periods.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading fiscal periods...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fiscal Periods</h1>
        <Button 
          onClick={handleCreate} 
          variant="primary"
          disabled={!canCreate}
          className={!canCreate ? 'opacity-50 cursor-not-allowed' : ''}
        >
          + Add Fiscal Period
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search by period name..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} variant="secondary">
          Search
        </Button>
        {searchQuery && (
          <Button
            onClick={() => {
              setSearchInput('');
              setSearchQuery('');
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
                  Period Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Closed At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {periods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? 'No periods found matching your search' : 'No fiscal periods found'}
                  </td>
                </tr>
              ) : (
                periods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {period.period_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(period.period_start)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(period.period_end)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge
                        label={period.is_closed ? 'Closed' : 'Open'}
                        colorClass={period.is_closed ? FISCAL_PERIOD_STATUS_COLORS.closed : FISCAL_PERIOD_STATUS_COLORS.open}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {period.closed_at ? formatDateTime(period.closed_at) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {!period.is_closed && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(period)}
                              disabled={!canUpdate}
                              className={!canUpdate ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm" 
                              onClick={() => handleDelete(period.id, period)}
                              disabled={!canDelete}
                              className={!canDelete ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              Delete
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => handleClose(period.id)}
                              disabled={!canClose}
                              className={!canClose ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              Close
                            </Button>
                          </>
                        )}
                        {period.is_closed && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleReopen(period.id)}
                            disabled={!canReopen}
                            className={!canReopen ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            Reopen
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Fiscal Period' : 'Create Fiscal Period'}
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
            <label htmlFor="period-name" className="block text-sm font-medium text-gray-700 mb-1">
              Period Name <span className="text-red-500">*</span>
            </label>
            <input
              id="period-name"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.period_name}
              onChange={(e) => setForm({ ...form, period_name: e.target.value })}
              required
              placeholder="e.g., Q1 2025"
            />
          </div>

          <div>
            <label htmlFor="period-start" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              id="period-start"
              value={form.period_start}
              onChange={(value) => {
                if (isValidDate(value)) {
                  setForm({ ...form, period_start: value });
                  setFormError('');
                }
              }}
              required
              min="2000-01-01"
              max="2100-12-31"
              placeholder="Select start date"
            />
            <p className="mt-1 text-xs text-gray-500">Click to open calendar picker</p>
          </div>

          <div>
            <label htmlFor="period-end" className="block text-sm font-medium text-gray-700 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              id="period-end"
              value={form.period_end}
              onChange={(value) => {
                if (isValidDate(value)) {
                  setForm({ ...form, period_end: value });
                  setFormError('');
                }
              }}
              required
              min={form.period_start || '2000-01-01'}
              max="2100-12-31"
              placeholder="Select end date"
            />
            <p className="mt-1 text-xs text-gray-500">Click to open calendar picker</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

