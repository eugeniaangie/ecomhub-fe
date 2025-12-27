'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import type { DashboardSummary } from '@/lib/types';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setIsLoading(true);
      // Get current month in YYYY-MM format
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const data = await dashboardApi.getSummary(month);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard summary');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="text-sm text-gray-600 mb-1">Total Income</div>
          <div className="text-3xl font-bold text-green-600">
            {summary ? formatCurrency(summary.total_income) : 'Rp 0'}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Total Expense</div>
          <div className="text-3xl font-bold text-red-600">
            {summary ? formatCurrency(summary.total_expense) : 'Rp 0'}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600 mb-1">Net Profit</div>
          <div className={`text-3xl font-bold ${summary && summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary ? formatCurrency(summary.net_profit) : 'Rp 0'}
          </div>
        </Card>
      </div>

      {summary && (
        <Card>
          <div className="text-sm text-gray-600">
            Period: <span className="font-medium">{summary.period}</span>
          </div>
        </Card>
      )}
    </div>
  );
}

