'use client';

import { useEffect, useState } from 'react';
import { transactionsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import type { Transaction, TransactionCreate, Category, PaymentMethod, Account } from '@/lib/types';
import { categoriesApi, paymentMethodsApi, accountsApi } from '@/lib/api';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<TransactionCreate>({
    type: 'income',
    amount: 0,
    description: '',
    category_id: '',
    payment_method_id: '',
    account_id: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Master data for dropdowns
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const type = filter === 'all' ? undefined : filter;
      const [transactionsData, categoriesData, paymentMethodsData, accountsData] = await Promise.all([
        transactionsApi.getAll(type),
        categoriesApi.getAll(),
        paymentMethodsApi.getAll(),
        accountsApi.getAll(),
      ]);
      
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setPaymentMethods(paymentMethodsData);
      setAccounts(accountsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'income',
      amount: 0,
      description: '',
      category_id: '',
      payment_method_id: '',
      account_id: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      category_id: transaction.category_id,
      payment_method_id: transaction.payment_method_id,
      account_id: transaction.account_id,
      date: transaction.date.split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await transactionsApi.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete transaction');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTransaction) {
        await transactionsApi.update(editingTransaction.id, formData);
      } else {
        await transactionsApi.create(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.type || !formData.type);

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Records</h1>
        <Button onClick={handleCreate} variant="primary">
          + Add Transaction
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'income' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('income')}
        >
          Income
        </Button>
        <Button
          variant={filter === 'expense' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('expense')}
        >
          Expense
        </Button>
      </div>

      {/* Transactions List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.category?.name || '-'}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.payment_method?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.account?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
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
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTransaction ? 'Edit Transaction' : 'Create Transaction'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingTransaction ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'income' | 'expense', category_id: '' })
                }
                required
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.payment_method_id}
                onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                required
              >
                <option value="">Select payment method</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                required
              >
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

