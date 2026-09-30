'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageChrome } from '@/components/finance/PageChrome';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Pagination } from '@/components/ui/Pagination';
import { accountsFinanceApi, financeReportsApi } from '@/lib/services/financeApi';
import type { Account, AccountTransaction, Channel } from '@/lib/types/finance';
import { CHANNEL_OPTIONS } from '@/lib/utils/constants';
import {
  formatCurrency,
  formatDate,
  getFirstDayOfCurrentMonth,
  getTodayFormatted,
  LEDGER_START_DATE,
} from '@/lib/utils/formatters';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination';

const CHANNEL_FILTER_OPTIONS: Array<{ value: '' | Channel; label: string }> = [
  { value: '', label: 'All channels' },
  ...CHANNEL_OPTIONS,
];

const DATE_PARAM_RE = /^\d{4}-\d{2}-\d{2}$/;

function dateFromUrlParam(value: string | null, fallback: string): string {
  if (value && DATE_PARAM_RE.test(value)) return value;
  return fallback;
}

function TransactionsFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountFromUrl = searchParams.get('account_code') || '';
  const startFromUrl = searchParams.get('start_date');
  const endFromUrl = searchParams.get('end_date');

  const [startDate, setStartDate] = useState(() =>
    dateFromUrlParam(startFromUrl, LEDGER_START_DATE)
  );
  const [endDate, setEndDate] = useState(() =>
    dateFromUrlParam(endFromUrl, getTodayFormatted())
  );
  const [channel, setChannel] = useState('');
  const [accountCode, setAccountCode] = useState(accountFromUrl);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [rows, setRows] = useState<AccountTransaction[]>([]);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Transactions · EcomHub';
  }, []);

  useEffect(() => {
    setAccountCode(accountFromUrl);
    setCurrentPage(DEFAULT_PAGE);
  }, [accountFromUrl]);

  useEffect(() => {
    const nextStart = dateFromUrlParam(startFromUrl, LEDGER_START_DATE);
    const nextEnd = dateFromUrlParam(endFromUrl, getTodayFormatted());
    if (nextStart <= nextEnd) {
      setStartDate(nextStart);
      setEndDate(nextEnd);
      setCurrentPage(DEFAULT_PAGE);
    }
  }, [startFromUrl, endFromUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await accountsFinanceApi.getAll();
        if (!cancelled) setAccounts(list);
      } catch {
        if (!cancelled) setAccounts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncAccountInUrl = (code: string) => {
    const params = new URLSearchParams();
    if (code) params.set('account_code', code);
    if (startDate !== LEDGER_START_DATE) params.set('start_date', startDate);
    if (endDate !== getTodayFormatted()) params.set('end_date', endDate);
    const qs = params.toString();
    router.replace(qs ? `/finance/transactions?${qs}` : '/finance/transactions');
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financeReportsApi.getTransactions({
        start_date: startDate,
        end_date: endDate,
        page: currentPage,
        limit: pageSize,
        channel: channel || undefined,
        account_code: accountCode || undefined,
      });
      setRows(data.results);
      setTotalPages(data.total_pages);
      setTotalResults(data.total_results);
    } catch (err) {
      setRows([]);
      setTotalPages(0);
      setTotalResults(0);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, currentPage, pageSize, channel, accountCode]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageChrome title="Transactions">
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-45 flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">Start</label>
            <DatePicker
              value={startDate}
              onChange={(value) => {
                if (value <= endDate) {
                  setStartDate(value);
                  setCurrentPage(DEFAULT_PAGE);
                }
              }}
              max={endDate}
            />
          </div>
          <div className="min-w-45 flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">End</label>
            <DatePicker
              value={endDate}
              onChange={(value) => {
                if (value >= startDate) {
                  setEndDate(value);
                  setCurrentPage(DEFAULT_PAGE);
                }
              }}
              min={startDate}
            />
          </div>
          <div className="min-w-40">
            <label className="mb-2 block text-sm font-medium text-gray-700">Channel tag</label>
            <select
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value);
                setCurrentPage(DEFAULT_PAGE);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CHANNEL_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-50 flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">Account</label>
            <select
              value={accountCode}
              onChange={(e) => {
                const code = e.target.value;
                setAccountCode(code);
                setCurrentPage(DEFAULT_PAGE);
                syncAccountInUrl(code);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.account_code}>
                  {a.account_code} — {a.account_name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              setStartDate(getFirstDayOfCurrentMonth());
              setEndDate(getTodayFormatted());
              setCurrentPage(DEFAULT_PAGE);
            }}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            This month
          </button>
          <button
            type="button"
            onClick={() => {
              setStartDate(LEDGER_START_DATE);
              setEndDate(getTodayFormatted());
              setCurrentPage(DEFAULT_PAGE);
            }}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            From start
          </button>
        </div>
        {accountCode ? (
          <p className="mt-3 text-xs text-gray-500">
            Filtered to account <span className="font-mono">{accountCode}</span>
            {' · '}
            <Link
              href="/finance/balances"
              className="text-blue-600 hover:underline"
            >
              Back to Accounts
            </Link>
          </p>
        ) : null}
      </Card>

      <Card title="Posted lines">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="text-sm text-gray-500">Loading transactions…</p>
        ) : rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Entry</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Account</th>
                    <th className="px-4 py-3">Partner</th>
                    <th className="px-4 py-3 text-right">Debit</th>
                    <th className="px-4 py-3 text-right">Credit</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rows.map((tx, idx) => (
                    <tr
                      key={`${tx.journal_entry_id}-${tx.account_code}-${idx}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                        {formatDate(tx.entry_date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-900">
                        {tx.entry_number}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {tx.channel || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        <div className="font-medium">{tx.entry_description}</div>
                        {tx.line_description ? (
                          <div className="mt-0.5 text-xs text-gray-500">{tx.line_description}</div>
                        ) : null}
                        {tx.reference_number ? (
                          <div className="mt-0.5 text-xs text-gray-400">
                            Ref: {tx.reference_number}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="font-medium">{tx.account_name}</div>
                        <div className="font-mono text-xs text-gray-500">{tx.account_code}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {tx.partner_accounts && tx.partner_accounts.length > 0 ? (
                          <div>
                            {tx.partner_accounts.map((partner, pIdx) => (
                              <div key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>
                                <div className="font-medium">{partner.account_name}</div>
                                <div className="text-xs text-gray-500">
                                  {partner.account_code} ({partner.account_type})
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-900">
                        {tx.account_debit > 0 ? formatCurrency(tx.account_debit) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-900">
                        {tx.account_credit > 0 ? formatCurrency(tx.account_credit) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            tx.status === 'posted'
                              ? 'bg-green-100 text-green-800'
                              : tx.status === 'approved'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
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
                setCurrentPage(DEFAULT_PAGE);
              }}
            />
          </>
        ) : (
          <p className="text-sm text-gray-500">No transactions for this filter.</p>
        )}
      </Card>
    </PageChrome>
  );
}

export default function FinanceTransactionsPage() {
  return (
    <Suspense
      fallback={
        <PageChrome title="Transactions">
          <p className="text-sm text-gray-500">Loading…</p>
        </PageChrome>
      }
    >
      <TransactionsFeed />
    </Suspense>
  );
}
