'use client';

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import type { MasterCategory, MasterCategoryTree, CreateMasterCategoryParam, UpdateMasterCategoryParam } from '@/lib/types';

interface CategoryFormProps {
  mode: 'create-root' | 'create-child' | 'edit';
  parentId?: number;
  category?: MasterCategory | MasterCategoryTree;
  categoryTree: MasterCategoryTree[];
  onSubmit: (data: CreateMasterCategoryParam | UpdateMasterCategoryParam) => Promise<void>;
  onCancel: () => void;
  error?: string;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  mode,
  parentId,
  category,
  categoryTree,
  onSubmit,
  onCancel,
  error,
}) => {
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    parent_id: undefined as number | undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && category) {
      const cat = category as MasterCategory;
      setFormData({
        category_name: category.category_name,
        description: 'description' in cat ? (cat.description || '') : '',
        parent_id: category.parent_id,
      });
    } else if (mode === 'create-child' && parentId) {
      setFormData({
        category_name: '',
        description: '',
        parent_id: parentId,
      });
    } else {
      setFormData({
        category_name: '',
        description: '',
        parent_id: undefined,
      });
    }
    setFormError('');
  }, [mode, category, parentId]);

  // Flatten tree to get all categories for parent dropdown
  const flattenTree = (nodes: MasterCategoryTree[], excludeId?: number): MasterCategoryTree[] => {
    const result: MasterCategoryTree[] = [];
    for (const node of nodes) {
      if (node.id !== excludeId) {
        result.push(node);
        if (node.children) {
          result.push(...flattenTree(node.children, excludeId));
        }
      }
    }
    return result;
  };

  const getCategoryPath = (cat: MasterCategoryTree, allNodes: MasterCategoryTree[]): string => {
    if (cat.parent_id) {
      const findParent = (nodes: MasterCategoryTree[], parentId: number): MasterCategoryTree | null => {
        for (const node of nodes) {
          if (node.id === parentId) return node;
          if (node.children) {
            const found = findParent(node.children, parentId);
            if (found) return found;
          }
        }
        return null;
      };
      const parent = findParent(allNodes, cat.parent_id);
      if (parent) {
        return `${getCategoryPath(parent, allNodes)} > ${cat.category_name}`;
      }
    }
    return cat.category_name;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.category_name.trim()) {
      setFormError('Category name is required');
      return;
    }

    if (formData.category_name.length > 50) {
      setFormError('Category name must be 50 characters or less');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'edit' && category) {
        const updateData: UpdateMasterCategoryParam = {
          category_name: formData.category_name.trim(),
          description: formData.description.trim() || undefined,
          parent_id: formData.parent_id || undefined,
        };
        await onSubmit(updateData);
      } else {
        const createData: CreateMasterCategoryParam = {
          category_name: formData.category_name.trim(),
          description: formData.description.trim() || undefined,
          parent_id: formData.parent_id || undefined,
        };
        await onSubmit(createData);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save category';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableParents = flattenTree(categoryTree, mode === 'edit' ? category?.id : undefined);

  const getFormTitle = () => {
    switch (mode) {
      case 'create-root':
        return 'Add Root Category';
      case 'create-child':
        return 'Add Child Category';
      case 'edit':
        return 'Edit Category';
      default:
        return 'Category Form';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{getFormTitle()}</h3>

      {(error || formError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error || formError}
        </div>
      )}

      {mode === 'edit' && category && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
          <strong>Current Path:</strong>{' '}
          {categoryTree.length > 0
            ? getCategoryPath(category as MasterCategoryTree, categoryTree)
            : category.category_name}
        </div>
      )}

      <Input
        label="Category Name"
        value={formData.category_name}
        onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
        required
        maxLength={50}
        error={formData.category_name.length > 50 ? 'Maximum 50 characters' : undefined}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parent Category
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          value={formData.parent_id || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              parent_id: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          disabled={mode === 'create-child'}
        >
          <option value="">Root Category (No Parent)</option>
          {availableParents.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {getCategoryPath(cat, categoryTree)}
            </option>
          ))}
        </select>
        {mode === 'create-child' && (
          <p className="mt-1 text-xs text-gray-500">
            Parent is pre-filled. You can change it after creation.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Optional description"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

