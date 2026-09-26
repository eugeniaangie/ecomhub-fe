'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageChrome, GapPlaceholder, EmptyPanel } from '@/components/finance/PageChrome';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { financeReportsApi } from '@/lib/services/financeApi';
import type { AccountBalance, AccountMovement } from '@/lib/types/finance';
import {
  formatCurrency,
  formatDateForAPI,
  getFirstDayOfCurrentMonth,
  getTodayFormatted,
} from '@/lib/utils/formatters';

/**
 * Total cash = sum of cash-subtree current_balance rows from T31.
 * Product design (T34 / FE16): Overview shows that sum; per-account detail lives on Accounts.
 * Sign is already normalised by the API — do not re-negate.
 */
function sumBalances(rows: AccountBalance[]): number {
  return rows.reduce((acc, row) => acc + row.current_balance, 0);
}

function sumMovements(rows: AccountMovement[]) {
  return rows.reduce(
    (acc, row) => ({
      debit: acc.debit + row.total_debit,
      credit: acc.credit + row.total_credit,
      net: acc.net + row.net_movement,
    }),
    { debit: 0, credit: 0, net: 0 }
  );
}

export default function FinanceOverviewPage() {
  const [asOf, setAsOf] = useState(getTodayFormatted());
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth());
  const [endDate, setEndDate] = useState(getTodayFormatted());

  const [balances, setBalances] = useState<AccountBalance[] | null>(null);
  const [movements, setMovements] = useState<AccountMovement[] | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);

  useEffect(() => {
    document.title = 'Finance Overview · EcomHub';
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

  const totalCash = balances ? sumBalances(balances) : null;
  const periodTotals = movements ? sumMovements(movements) : null;

  return (
    <PageChrome
      title="Overview"
      description="Cash position (cumulative) and period movement on cash accounts. Channel strip waits on T32."
    >
      <Card className="mb-2">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-50 flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Balance as of
            </label>
            <DatePicker
              value={asOf}
              onChange={setAsOf}
              max={formatDateForAPI(new Date())}
            />
          </div>
          <p className="pb-2 text-xs text-gray-500">
            Balance is cumulative through this date — not limited to the movement range below.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-sm text-gray-500">Total cash</p>
          {loadingBalances ? (
            <p className="mt-1 text-2xl font-semibold text-gray-300">…</p>
          ) : balanceError ? (
            <p className="mt-1 text-sm text-red-600">{balanceError}</p>
          ) : totalCash !== null ? (
            <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
              {formatCurrency(totalCash)}
            </p>
          ) : (
            <p className="mt-1 text-2xl font-semibold text-gray-300">—</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Kas + Bank + E-Wallet, cumulative through the as-of date
          </p>
        </div>
        <GapPlaceholder label="Channel net (aggregate)" gapId="G5" />
        <GapPlaceholder label="Fees (all channels)" gapId="G4" />
      </div>

      <Card title="Period movement (cash accounts)">
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
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            This month
          </button>
        </div>

        {movementError ? (
          <p className="text-sm text-red-600">{movementError}</p>
        ) : loadingMovements ? (
          <p className="text-sm text-gray-500">Loading movements…</p>
        ) : periodTotals ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">In (debit)</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900">
                {formatCurrency(periodTotals.debit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Out (credit)</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900">
                {formatCurrency(periodTotals.credit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Net movement</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900">
                {formatCurrency(periodTotals.net)}
              </p>
            </div>
          </div>
        ) : null}
        <p className="mt-3 text-xs text-gray-400">
          Debit / credit are ledger totals on cash accounts in range; net uses API sign rules.
          Detail by account is on Finance → Accounts.
        </p>
      </Card>

      <EmptyPanel
        title="Channel performance"
        body="Side-by-side revenue / expense / net per channel. Empty until T32. Fees stay null until fee accounts exist (G4)."
        gapIds={['G5', 'G7']}
      />
    </PageChrome>
  );
}
