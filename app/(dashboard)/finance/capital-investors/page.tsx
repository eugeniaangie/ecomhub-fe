'use client';

import { useEffect, useState } from 'react';
import { capitalInvestorsApi } from '@/lib/services/financeApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DatePicker } from '@/components/ui/DatePicker';
import { StatusBadge } from '@/components/finance/StatusBadge';
import { formatCurrency, formatDate, formatDateForAPI, formatNumber, parseFormattedNumber, isValidDate } from '@/lib/utils/formatters';
import {
  INVESTMENT_TYPE_COLORS,
  INVESTMENT_TYPE_LABELS,
  INVESTMENT_TYPE_OPTIONS,
  INVESTOR_STATUS_COLORS,
  INVESTOR_STATUS_LABELS,
  INVESTOR_STATUS_OPTIONS,
} from '@/lib/utils/constants';
import {
  canCreateCapitalInvestor,
  canUpdateCapitalInvestor,
  canDeleteCapitalInvestor,
  canUpdateCapitalInvestorReturnPaid,
  canUpdateCapitalInvestorStatus,
} from '@/lib/authHelpers';
import type { CapitalInvestor, InvestmentType, InvestorStatus } from '@/lib/types/finance';

export default function CapitalInvestorsPage() {
  useEffect(() => {
    document.title = 'Capital Investors - Finance Management';
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CapitalInvestor | null>(null);
  const [updatingReturnItem, setUpdatingReturnItem] = useState<CapitalInvestor | null>(null);
  const [updatingStatusItem, setUpdatingStatusItem] = useState<CapitalInvestor | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Data
  const [investors, setInvestors] = useState<CapitalInvestor[]>([]);
  const [totalInvestment, setTotalInvestment] = useState({
    total_amount: 0,
    total_return_paid: 0,
    total_remaining: 0,
  });

  // Form
  const [form, setForm] = useState({
    investor_name: '',
    investment_type: 'equity' as InvestmentType,
    amount: 0,
    investment_date: '',
    return_percentage: 0,
    maturity_date: '',
    contract_document_url: '',
    notes: '',
  });
  const [hasMaturityDate, setHasMaturityDate] = useState(false);
  const [amountDisplay, setAmountDisplay] = useState('');

  // Return paid form
  const [returnForm, setReturnForm] = useState({
    return_paid: 0,
  });

  // Status form
  const [statusForm, setStatusForm] = useState({
    status: 'active' as InvestorStatus,
  });

  // Permission checks
  const canCreate = canCreateCapitalInvestor();
  const canUpdate = canUpdateCapitalInvestor();
  const canDelete = canDeleteCapitalInvestor();
  const canUpdateReturn = canUpdateCapitalInvestorReturnPaid();
  const canUpdateStatus = canUpdateCapitalInvestorStatus();

  useEffect(() => {
    loadData();
    loadTotal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, pageSize]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await capitalInvestorsApi.getList({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
      });
      setInvestors(response.results);
      setTotalPages(response.total_pages);
      setTotalResults(response.total_results);
    } catch (err: unknown) {
      console.error('Error loading capital investors:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setInvestors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTotal = async () => {
    try {
      const total = await capitalInvestorsApi.getTotal();
      // Handle both object and number response
      if (typeof total === 'number') {
        // If API returns just a number, create object structure
        setTotalInvestment({
          total_amount: total,
          total_return_paid: 0,
          total_remaining: total,
        });
      } else if (total && typeof total === 'object') {
        // If API returns object, use it directly
        setTotalInvestment({
          total_amount: total.total_amount || 0,
          total_return_paid: total.total_return_paid || 0,
          total_remaining: total.total_remaining || (total.total_amount || 0) - (total.total_return_paid || 0),
        });
      }
    } catch (err: unknown) {
      console.error('Error loading total investment:', err);
      // Reset to default on error
      setTotalInvestment({
        total_amount: 0,
        total_return_paid: 0,
        total_remaining: 0,
      });
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setForm({
      investor_name: '',
      investment_type: 'equity',
      amount: 0,
      investment_date: new Date().toISOString().split('T')[0],
      return_percentage: 0,
      maturity_date: '',
      contract_document_url: '',
      notes: '',
    });
    setAmountDisplay('');
    setHasMaturityDate(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: CapitalInvestor) => {
    setEditingItem(item);
    
    // Ensure dates are in YYYY-MM-DD format (extract from ISO if needed)
    const normalizeDate = (dateStr: string | undefined): string => {
      if (!dateStr) return '';
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      // If it's an ISO datetime, extract just the date part
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      // Try to parse and format
      try {
        return formatDateForAPI(dateStr);
      } catch {
        return dateStr;
      }
    };
    
    setForm({
      investor_name: item.investor_name,
      investment_type: item.investment_type,
      amount: item.amount,
      investment_date: normalizeDate(item.investment_date),
      return_percentage: item.return_percentage || 0,
      maturity_date: normalizeDate(item.maturity_date),
      contract_document_url: item.contract_document_url || '',
      notes: item.notes || '',
    });
    setAmountDisplay(formatNumber(item.amount.toString()));
    setHasMaturityDate(!!item.maturity_date);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleUpdateReturn = (item: CapitalInvestor) => {
    setUpdatingReturnItem(item);
    setReturnForm({
      return_paid: item.return_paid,
    });
    setIsReturnModalOpen(true);
  };

  const handleUpdateStatus = (item: CapitalInvestor) => {
    setUpdatingStatusItem(item);
    setStatusForm({
      status: item.status,
    });
    setIsStatusModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this capital investor?')) return;

    try {
      await capitalInvestorsApi.delete(id);
      loadData();
      loadTotal();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.investor_name.trim()) {
      setFormError('Investor name is required');
      return;
    }

    if (!form.amount || form.amount <= 0) {
      setFormError('Amount must be greater than 0');
      return;
    }

    if (!form.investment_date) {
      setFormError('Investment date is required');
      return;
    }

    try {
      setFormError('');
      
      // Ensure dates are in YYYY-MM-DD format (not ISO datetime)
      const ensureDateFormat = (dateStr: string | undefined): string | undefined => {
        if (!dateStr) return undefined;
        // If already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        // If it's an ISO datetime, extract just the date part
        if (dateStr.includes('T')) {
          return dateStr.split('T')[0];
        }
        // Try to parse and format using existing helper
        try {
          return formatDateForAPI(dateStr);
        } catch {
          return dateStr;
        }
      };
      
      const payload = {
        investor_name: form.investor_name.trim(),
        investment_type: form.investment_type,
        amount: form.amount,
        investment_date: ensureDateFormat(form.investment_date) || form.investment_date,
        return_percentage: form.return_percentage || undefined,
        maturity_date: hasMaturityDate ? ensureDateFormat(form.maturity_date) : undefined,
        contract_document_url: form.contract_document_url?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };

      if (editingItem) {
        await capitalInvestorsApi.update(editingItem.id, payload);
      } else {
        await capitalInvestorsApi.create(payload);
      }
      setIsModalOpen(false);
      setForm({
        investor_name: '',
        investment_type: 'equity',
        amount: 0,
        investment_date: '',
        return_percentage: 0,
        maturity_date: '',
        contract_document_url: '',
        notes: '',
      });
      setAmountDisplay('');
      setHasMaturityDate(false);
      loadData();
      loadTotal();
    } catch (err: unknown) {
      console.error('Error saving capital investor:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save item';
      setFormError(errorMessage);
    }
  };

  const handleReturnSubmit = async () => {
    if (!updatingReturnItem) return;

    if (returnForm.return_paid < 0) {
      setFormError('Return paid cannot be negative');
      return;
    }

    try {
      setFormError('');
      await capitalInvestorsApi.updateReturnPaid(updatingReturnItem.id, {
        return_paid: returnForm.return_paid,
      });
      setIsReturnModalOpen(false);
      setUpdatingReturnItem(null);
      loadData();
      loadTotal();
    } catch (err: unknown) {
      console.error('Error updating return paid:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update return paid';
      setFormError(errorMessage);
    }
  };

  const handleStatusSubmit = async () => {
    if (!updatingStatusItem) return;

    try {
      setFormError('');
      await capitalInvestorsApi.updateStatus(updatingStatusItem.id, {
        status: statusForm.status,
      });
      setIsStatusModalOpen(false);
      setUpdatingStatusItem(null);
      loadData();
      loadTotal();
    } catch (err: unknown) {
      console.error('Error updating status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      setFormError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm({
      investor_name: '',
      investment_type: 'equity',
      amount: 0,
      investment_date: '',
      return_percentage: 0,
      maturity_date: '',
      contract_document_url: '',
      notes: '',
    });
    setAmountDisplay('');
    setHasMaturityDate(false);
    setFormError('');
  };

  if (isLoading && investors.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading capital investors...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Capital Investors</h1>
        <Button 
          onClick={handleCreate} 
          variant="primary"
          disabled={!canCreate}
          className={!canCreate ? 'opacity-50 cursor-not-allowed' : ''}
        >
          + Add Capital Investor
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Total Investment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-1">Total Investment</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalInvestment.total_amount)}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-1">Total Return Paid</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalInvestment.total_return_paid)}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-1">Total Remaining</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalInvestment.total_remaining)}
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search by investor name..."
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
                  Investor Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Investment Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Return Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Investment Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {investors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? 'No investors found matching your search' : 'No capital investors found'}
                  </td>
                </tr>
              ) : (
                investors.map((investor) => (
                  <tr key={investor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {investor.investor_name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge
                        label={INVESTMENT_TYPE_LABELS[investor.investment_type]}
                        colorClass={INVESTMENT_TYPE_COLORS[investor.investment_type]}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {formatCurrency(investor.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(investor.return_paid)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge
                        label={INVESTOR_STATUS_LABELS[investor.status]}
                        colorClass={INVESTOR_STATUS_COLORS[investor.status]}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(investor.investment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(investor)}
                          disabled={!canUpdate}
                          className={!canUpdate ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateReturn(investor)}
                          disabled={!canUpdateReturn}
                          className={!canUpdateReturn ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          Update Return
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateStatus(investor)}
                          disabled={!canUpdateStatus}
                          className={!canUpdateStatus ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          Update Status
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleDelete(investor.id)}
                          disabled={!canDelete}
                          className={!canDelete ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          Delete
                        </Button>
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
        title={editingItem ? 'Edit Capital Investor' : 'Create Capital Investor'}
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
            <label htmlFor="investor-name" className="block text-sm font-medium text-gray-700 mb-1">
              Investor Name <span className="text-red-500">*</span>
            </label>
            <input
              id="investor-name"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.investor_name}
              onChange={(e) => setForm({ ...form, investor_name: e.target.value })}
              required
              placeholder="Enter investor name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="investment-type" className="block text-sm font-medium text-gray-700 mb-1">
                Investment Type <span className="text-red-500">*</span>
              </label>
              <select
                id="investment-type"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.investment_type}
                onChange={(e) => setForm({ ...form, investment_type: e.target.value as InvestmentType })}
                required
              >
                {INVESTMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
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
                  // Parse the formatted value to get the actual number
                  const numValue = parseFormattedNumber(val);
                  // Format the display value
                  const formatted = formatNumber(val);
                  setAmountDisplay(formatted);
                  setForm({ ...form, amount: numValue });
                }}
                onFocus={(e) => {
                  // Select all text when focusing on empty or zero value
                  if (form.amount === 0 || amountDisplay === '') {
                    e.target.select();
                  }
                }}
                onBlur={() => {
                  // Ensure display is formatted on blur
                  if (form.amount > 0) {
                    setAmountDisplay(formatNumber(form.amount.toString()));
                  } else {
                    setAmountDisplay('');
                  }
                }}
                required
                placeholder="Enter amount (e.g., 1.000.000)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="investment-date" className="block text-sm font-medium text-gray-700 mb-1">
                Investment Date <span className="text-red-500">*</span>
              </label>
              <DatePicker
                id="investment-date"
                value={form.investment_date}
                onChange={(value) => {
                  if (isValidDate(value)) {
                    setForm({ ...form, investment_date: value });
                    setFormError('');
                  }
                }}
                required
                max={new Date().toISOString().split('T')[0]}
                placeholder="Select investment date"
              />
              <p className="mt-1 text-xs text-gray-500">Click to open calendar picker</p>
            </div>

            <div>
              <label htmlFor="return-percentage" className="block text-sm font-medium text-gray-700 mb-1">
                Return Percentage (%)
              </label>
              <input
                id="return-percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.return_percentage === 0 ? '' : form.return_percentage}
                onChange={(e) => {
                  const val = e.target.value;
                  // If empty, set to 0, otherwise parse the value
                  const numValue = val === '' ? 0 : parseFloat(val) || 0;
                  setForm({ ...form, return_percentage: numValue });
                }}
                onFocus={(e) => {
                  // If value is 0, select all text so user can type directly
                  if (e.target.value === '0') {
                    e.target.select();
                  }
                }}
                placeholder="e.g., 15.00"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="has-maturity-date"
                checked={hasMaturityDate}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setHasMaturityDate(checked);
                  if (!checked) {
                    setForm({ ...form, maturity_date: '' });
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="has-maturity-date" className="ml-2 text-sm font-medium text-gray-700">
                Set Maturity Date
              </label>
            </div>
            {hasMaturityDate && (
              <div>
                <label htmlFor="maturity-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Maturity Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  id="maturity-date"
                  value={form.maturity_date}
                  onChange={(value) => {
                    if (isValidDate(value)) {
                      setForm({ ...form, maturity_date: value });
                      setFormError('');
                    }
                  }}
                  min={form.investment_date || '2000-01-01'}
                  max="2100-12-31"
                  placeholder="Select maturity date"
                />
                <p className="mt-1 text-xs text-gray-500">Click to open calendar picker</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="contract-url" className="block text-sm font-medium text-gray-700 mb-1">
              Contract Document URL
            </label>
            <input
              id="contract-url"
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.contract_document_url}
              onChange={(e) => setForm({ ...form, contract_document_url: e.target.value })}
              placeholder="https://example.com/contract.pdf"
            />
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

      {/* Update Return Paid Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setUpdatingReturnItem(null);
          setReturnForm({ return_paid: 0 });
          setFormError('');
        }}
        title="Update Return Paid"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsReturnModalOpen(false);
                setUpdatingReturnItem(null);
                setReturnForm({ return_paid: 0 });
                setFormError('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReturnSubmit}>
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

          {updatingReturnItem && (
            <>
              <div>
                <div className="text-sm text-gray-500">Investor</div>
                <div className="text-sm font-medium text-gray-900">
                  {updatingReturnItem.investor_name}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Investment Amount</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(updatingReturnItem.amount)}
                </div>
              </div>
              <div>
                <label
                  htmlFor="return-paid"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Return Paid (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  id="return-paid"
                  type="number"
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={returnForm.return_paid}
                  onChange={(e) =>
                    setReturnForm({ return_paid: parseFloat(e.target.value) || 0 })
                  }
                  required
                  placeholder="Enter return paid amount"
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setUpdatingStatusItem(null);
          setStatusForm({ status: 'active' });
          setFormError('');
        }}
        title="Update Investor Status"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsStatusModalOpen(false);
                setUpdatingStatusItem(null);
                setStatusForm({ status: 'active' });
                setFormError('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleStatusSubmit}>
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

          {updatingStatusItem && (
            <>
              <div>
                <div className="text-sm text-gray-500">Investor</div>
                <div className="text-sm font-medium text-gray-900">
                  {updatingStatusItem.investor_name}
                </div>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ status: e.target.value as InvestorStatus })}
                  required
                >
                  {INVESTOR_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

