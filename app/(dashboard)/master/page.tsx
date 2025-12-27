'use client';

import { useEffect, useState } from 'react';
import { masterCategoryApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { MasterCategory } from '@/lib/types';

export default function MasterDataPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterCategory | null>(null);

  // Data states
  const [categories, setCategories] = useState<MasterCategory[]>([]);

  // Form states
  const [categoryForm, setCategoryForm] = useState({ 
    category_name: '', 
    description: '', 
    parent_id: null as number | null 
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await masterCategoryApi.getAll(1, 100);
      if (response && response.results) {
        setCategories(response.results);
      } else {
        setCategories([]);
      }
    } catch (err: unknown) {
      console.error('Error loading categories:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    console.log('handleCreate called');
    setEditingItem(null);
    setCategoryForm({ category_name: '', description: '', parent_id: null });
    setIsModalOpen(true);
    console.log('Modal should be open now, isModalOpen:', true);
  };

  const handleEdit = (item: MasterCategory) => {
    setEditingItem(item);
    setCategoryForm({ 
      category_name: item.category_name, 
      description: item.description || '', 
      parent_id: item.parent_id || null
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await masterCategoryApi.delete(id);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Validation
    if (!categoryForm.category_name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setError('');
      const payload = {
        category_name: categoryForm.category_name.trim(),
        description: categoryForm.description?.trim() || undefined,
        parent_id: categoryForm.parent_id ?? null,
      };

      if (editingItem) {
        await masterCategoryApi.update(editingItem.id, payload);
      } else {
        await masterCategoryApi.create(payload);
      }
      setIsModalOpen(false);
      setCategoryForm({ category_name: '', description: '', parent_id: null });
      await loadData();
    } catch (err: unknown) {
      console.error('Error saving category:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save item';
      setError(errorMessage);
    }
  };

  const renderCategories = () => (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.category_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{cat.parent_id || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{cat.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(cat.id)}>
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
  );

  const renderModalContent = () => {
    console.log('renderModalContent called');
    // Get available parent categories (exclude current category if editing)
    const availableParents = categories.filter(cat => 
      editingItem ? cat.id !== editingItem.id : true
    );

    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            id="category-name"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={categoryForm.category_name || ''}
            onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
            required
            maxLength={50}
            placeholder="Enter category name"
          />
        </div>
        
        <div>
          <label htmlFor="parent-category" className="block text-sm font-medium text-gray-700 mb-1">
            Parent Category
          </label>
          <select
            id="parent-category"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryForm.parent_id || ''}
            onChange={(e) => setCategoryForm({ 
              ...categoryForm, 
              parent_id: e.target.value ? parseInt(e.target.value) : null 
            })}
          >
            <option value="">Root Category (No Parent)</option>
            {availableParents.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name} (ID: {cat.id})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Select a parent category or leave as &quot;Root Category&quot; to create a top-level category
          </p>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryForm.description || ''}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            rows={3}
            placeholder="Optional description"
          />
        </div>
      </div>
    );
  };

  const getModalTitle = () => {
    return editingItem ? 'Edit Category' : 'Create Category';
  };

  if (isLoading && categories.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Master Data - Categories</h1>
        <Button onClick={handleCreate} variant="primary">
          + Add Category
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Content */}
      {renderCategories()}

      {/* Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            console.log('Modal close called');
            setIsModalOpen(false);
          }}
          title={getModalTitle()}
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleSubmit()}>
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          {renderModalContent()}
        </Modal>
      )}
    </div>
  );
}

