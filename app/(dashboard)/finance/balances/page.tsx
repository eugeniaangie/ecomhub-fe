'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageChrome } from '@/components/finance/PageChrome';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { financeReportsApi } from '@/lib/services/financeApi';
import type { AccountBalance, AccountMovement } from '@/lib/types/finance';
import {
  amountColorClass,
  formatCurrency,
  formatDateForAPI,
  getFirstDayOfCurrentMonth,
  getTodayFormatted,
  LEDGER_START_DATE,
} from '@/lib/utils/formatters';

export default function FinanceBalancesPage() {
  const [asOf, setAsOf] = useState(getTodayFormatted());
  const [startDate, setStartDate] = useState(LEDGER_START_DATE);
  const [endDate, setEndDate] = useState(getTodayFormatted());

  const [balances, setBalances] = useState<AccountBalance[] | null>(null);
  const [movements, setMovements] = useState<AccountMovement[] | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);

  useEffect(() => {
    document.title = 'Accounts · EcomHub';
  }, []);

  const loadBalances = useCallback(async () => {
    try {
      setLoadingBalances(true);
      setBalanceError(null);
      const data = await financeReportsApi.getAccountBalances({ as_of: asOf });
      setBalances(data);
    } catch (err) {
      setBalances(null);
      setBalanceError(err instanceof Error ? err.message : 'Failed to load balances');
    } finally {
      setLoadingBalances(false);
    }
  }, [asOf]);

  const loadMovements = useCallback(async () => {
    try {
      setLoadingMovements(true);
      setMovementError(null);
      const data = await financeReportsApi.getAccountMovements({
        start_date: startDate,
        end_date: endDate,
      });
      setMovements(data);
    } catch (err) {
      setMovements(null);
      setMovementError(err instanceof Error ? err.message : 'Failed to load movements');
    } finally {
      setLoadingMovements(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  return (
    <PageChrome
      title="Accounts"
      description="Where is the money? Cumulative balances and period movement for Kas, Bank, and E-Wallet. Chart of Accounts (structure) lives under Finance setup."
    >
      <Card title="Balances (as of date)">
        <div className="mb-4 max-w-xs">
          <label className="mb-2 block text-sm font-medium text-gray-700">As of</label>
          <DatePicker
            value={asOf}
            onChange={setAsOf}
            max={formatDateForAPI(new Date())}
          />
        </div>

        {balanceError ? (
          <p className="text-sm text-red-600">{balanceError}</p>
        ) : loadingBalances ? (
          <p className="text-sm text-gray-500">Loading balances…</p>
        ) : balances && balances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Code</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Active</th>
                  <th className="py-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {balances.map((row) => (
                  <tr key={row.account_code} className="text-gray-900">
                    <td className="py-2 pr-4 font-mono text-xs">
                      <Link
                        href={`/finance/transactions?account_code=${encodeURIComponent(row.account_code)}`}
                        className="text-blue-600 hover:underline"
                      >
                        {row.account_code}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/finance/transactions?account_code=${encodeURIComponent(row.account_code)}`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {row.account_name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{row.account_type}</td>
                    <td className="py-2 pr-4">{row.is_active ? 'Yes' : 'No'}</td>
                    <td className={`py-2 text-right tabular-nums font-medium ${amountColorClass(row.current_balance)}`}>
                      {formatCurrency(row.current_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No cash accounts returned.</p>
        )}
        <p className="mt-3 text-xs text-gray-400">
          Click an account code or name to open its posted lines on Finance → Transactions.
        </p>
      </Card>

      <Card title="Period movement">
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div className="min-w-45 flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">Start</label>
            <DatePicker
              value={startDate}
              onChange={(value) => {
                if (value <= endDate) setStartDate(value);
              }}
              max={endDate}
            />
          </div>
          <div className="min-w-45 flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">End</label>
            <DatePicker
              value={endDate}
              onChange={(value) => {
                if (value >= startDate) setEndDate(value);
              }}
              min={startDate}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setStartDate(getFirstDayOfCurrentMonth());
              setEndDate(getTodayFormatted());
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
            }}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            From start
          </button>
        </div>

        {movementError ? (
          <p className="text-sm text-red-600">{movementError}</p>
        ) : loadingMovements ? (
          <p className="text-sm text-gray-500">Loading movements…</p>
        ) : movements && movements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Code</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 text-right font-medium">Debit (in)</th>
                  <th className="py-2 pr-4 text-right font-medium">Credit (out)</th>
                  <th className="py-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((row) => (
                  <tr key={row.account_code} className="text-gray-900">
                    <td className="py-2 pr-4 font-mono text-xs">{row.account_code}</td>
                    <td className="py-2 pr-4">{row.account_name}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatCurrency(row.total_debit)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatCurrency(row.total_credit)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatCurrency(row.net_movement)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No movement rows for this range.</p>
        )}
      </Card>
    </PageChrome>
  );
}
