'use client';

import { useEffect, useMemo, useState } from 'react';
import { masterCategoryApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  canCreateCategory,
  canUpdateCategory,
  canDeleteCategory,
} from '@/lib/authHelpers';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination';
import type { MasterCategory } from '@/lib/types';

function buildCategoryById(list: MasterCategory[]): Map<number, MasterCategory> {
  return new Map(list.map((c) => [c.id, c]));
}

/** Full path for disambiguation — same child name can exist under different parents. */
function getCategoryPath(
  categoryId: number | null | undefined,
  byId: Map<number, MasterCategory>
): string {
  if (!categoryId) return '';
  const parts: string[] = [];
  const visited = new Set<number>();
  let current = byId.get(categoryId);
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    parts.unshift(current.category_name);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return parts.join(' › ');
}

export default function MasterDataPage() {
  useEffect(() => {
    document.title = 'Master Category';
  }, []);

  const canCreate = canCreateCategory();
  const canUpdate = canUpdateCategory();
  const canDelete = canDeleteCategory();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterCategory | null>(null);
  /** When set (and not editing), parent is locked — Add child / create-another flow. */
  const [lockedParentId, setLockedParentId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [allCategories, setAllCategories] = useState<MasterCategory[]>([]);

  const [categoryForm, setCategoryForm] = useState({
    category_name: '',
    description: '',
    parent_id: null as number | null,
  });

  const categoryById = useMemo(
    () => buildCategoryById(allCategories.length > 0 ? allCategories : categories),
    [allCategories, categories]
  );

  useEffect(() => {
    loadData();
    loadAllCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const loadAllCategories = async () => {
    try {
      const response = await masterCategoryApi.getAll(1, 100);
      if (response && response.results) {
        setAllCategories(response.results);
      }
    } catch (err) {
      console.error('Error loading all categories:', err);
      setAllCategories([]);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await masterCategoryApi.getAll(currentPage, pageSize);
      if (response && response.results) {
        setCategories(response.results);
        setTotalPages(response.total_pages);
        setTotalResults(response.total_results);
      } else {
        setCategories([]);
        setTotalPages(1);
        setTotalResults(0);
      }
    } catch (err: unknown) {
      console.error('Error loading categories:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setCategories([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setLockedParentId(null);
    setCategoryForm({ category_name: '', description: '', parent_id: null });
    setFormError('');
    setFormSuccess('');
  };

  const handleCreateRoot = () => {
    setEditingItem(null);
    setLockedParentId(null);
    setCategoryForm({ category_name: '', description: '', parent_id: null });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleAddChild = (parent: MasterCategory) => {
    setEditingItem(null);
    setLockedParentId(parent.id);
    setCategoryForm({
      category_name: '',
      description: '',
      parent_id: parent.id,
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: MasterCategory) => {
    setEditingItem(item);
    setLockedParentId(null);
    setCategoryForm({
      category_name: item.category_name,
      description: item.description || '',
      parent_id: item.parent_id || null,
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await masterCategoryApi.delete(id);
      await Promise.all([loadData(), loadAllCategories()]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
    }
  };

  const handleSubmit = async () => {
    if (!categoryForm.category_name.trim()) {
      setFormError('Category name is required');
      return;
    }

    try {
      setFormError('');
      setFormSuccess('');
      const payload = {
        category_name: categoryForm.category_name.trim(),
        description: categoryForm.description?.trim() || undefined,
        parent_id: categoryForm.parent_id ?? null,
      };

      if (editingItem) {
        await masterCategoryApi.update(editingItem.id, payload);
        closeModal();
        await Promise.all([loadData(), loadAllCategories()]);
        return;
      }

      await masterCategoryApi.create(payload);
      await Promise.all([loadData(), loadAllCategories()]);

      // Keep form open under the same parent so operators can add several children quickly.
      if (payload.parent_id != null) {
        setLockedParentId(payload.parent_id);
        setCategoryForm({
          category_name: '',
          description: '',
          parent_id: payload.parent_id,
        });
        setFormSuccess(`Created “${payload.category_name}”. Add another child under the same parent, or close.`);
        return;
      }

      closeModal();
    } catch (err: unknown) {
      console.error('Error saving category:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save item';
      setFormError(errorMessage);
    }
  };

  const getParentLabel = (parentId: number | null | undefined): string => {
    if (!parentId) return '—';
    const path = getCategoryPath(parentId, categoryById);
    return path || `ID: ${parentId}`;
  };

  const sortedCategories = (() => {
    const sorted: MasterCategory[] = [];
    const processed = new Set<number>();

    const getDescendants = (parentId: number): MasterCategory[] => {
      return categories.filter((cat) => cat.parent_id === parentId);
    };

    const addWithDescendants = (category: MasterCategory) => {
      if (processed.has(category.id)) return;

      sorted.push(category);
      processed.add(category.id);

      const children = getDescendants(category.id).sort((a, b) =>
        a.category_name.localeCompare(b.category_name)
      );
      children.forEach((child) => addWithDescendants(child));
    };

    const rootCategories = categories
      .filter((cat) => !cat.parent_id)
      .sort((a, b) => a.category_name.localeCompare(b.category_name));

    rootCategories.forEach((root) => addWithDescendants(root));

    categories.forEach((cat) => {
      if (!processed.has(cat.id)) {
        sorted.push(cat);
      }
    });

    return sorted;
  })();

  const availableParents = useMemo(() => {
    const source = allCategories.length > 0 ? allCategories : categories;
    return source
      .filter((cat) => (editingItem ? cat.id !== editingItem.id : true))
      .slice()
      .sort((a, b) =>
        getCategoryPath(a.id, categoryById).localeCompare(getCategoryPath(b.id, categoryById))
      );
  }, [allCategories, categories, editingItem, categoryById]);

  const lockedParentPath =
    lockedParentId != null ? getCategoryPath(lockedParentId, categoryById) : '';

  const getModalTitle = () => {
    if (editingItem) return 'Edit Category';
    if (lockedParentId != null) return 'Add Child Category';
    return 'Add Category';
  };

  const renderCategories = () => (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent path
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No categories found
                </td>
              </tr>
            ) : (
              sortedCategories.map((cat) => {
                const getIndentLevel = (
                  category: MasterCategory,
                  visited = new Set<number>()
                ): number => {
                  if (visited.has(category.id)) return 0;
                  visited.add(category.id);

                  if (!category.parent_id) return 0;
                  const parent = categories.find((c) => c.id === category.parent_id);
                  if (!parent) return 1;
                  return getIndentLevel(parent, visited) + 1;
                };

                const indentLevel = getIndentLevel(cat);
                const indentClass =
                  indentLevel === 0
                    ? ''
                    : indentLevel === 1
                      ? 'pl-8'
                      : indentLevel === 2
                        ? 'pl-16'
                        : indentLevel === 3
                          ? 'pl-24'
                          : indentLevel === 4
                            ? 'pl-32'
                            : 'pl-40';

                return (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className={`px-6 py-4 text-sm font-medium text-gray-900 ${indentClass}`}>
                      {cat.parent_id ? <span className="mr-2 text-gray-400">└─</span> : null}
                      {cat.category_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {getParentLabel(cat.parent_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{cat.description || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddChild(cat)}
                          disabled={!canCreate}
                          className={!canCreate ? 'opacity-50 cursor-not-allowed' : ''}
                          title="Add a child under this category"
                        >
                          Add child
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(cat)}
                          disabled={!canUpdate}
                          className={!canUpdate ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(cat.id)}
                          disabled={!canDelete}
                          className={!canDelete ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
  );

  const renderModalContent = () => {
    const parentLocked = lockedParentId != null && !editingItem;

    return (
      <div className="space-y-4">
        {formError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {formError}
          </div>
        ) : null}

        {formSuccess ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {formSuccess}
          </div>
        ) : null}

        {parentLocked ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <div className="font-medium">Parent (locked)</div>
            <div className="mt-0.5 font-mono text-xs sm:text-sm">
              {lockedParentPath || `ID: ${lockedParentId}`}
            </div>
            <p className="mt-2 text-xs text-blue-700">
              Same name is allowed under a different parent. Names must be unique among siblings.
            </p>
          </div>
        ) : null}

        <div>
          <label htmlFor="category-name" className="mb-1 block text-sm font-medium text-gray-700">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            id="category-name"
            type="text"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryForm.category_name || ''}
            onChange={(e) => {
              setFormSuccess('');
              setCategoryForm({ ...categoryForm, category_name: e.target.value });
            }}
            required
            maxLength={50}
            placeholder="Enter category name"
            autoFocus
          />
        </div>

        {!parentLocked ? (
          <div>
            <label
              htmlFor="parent-category"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Parent Category
            </label>
            <select
              id="parent-category"
              className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryForm.parent_id || ''}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  parent_id: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
            >
              <option value="">Root (no parent)</option>
              {availableParents.map((cat) => {
                const path = getCategoryPath(cat.id, categoryById);
                return (
                  <option key={cat.id} value={cat.id}>
                    {path || cat.category_name}
                  </option>
                );
              })}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Shown as full path so identical names under different parents stay clear. Leave as Root
              for a top-level category — or use <span className="font-medium">Add child</span> on a
              row to skip picking.
            </p>
          </div>
        ) : null}

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryForm.description || ''}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            rows={3}
            placeholder="Optional description"
          />
        </div>
      </div>
    );
  };

  if (isLoading && categories.length === 0 && !error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        className="mb-6"
        title="Categories"
        actions={
          <Button
            onClick={handleCreateRoot}
            variant="primary"
            disabled={!canCreate}
            className={!canCreate ? 'opacity-50 cursor-not-allowed' : ''}
          >
            + Add Category
          </Button>
        }
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      ) : null}

      {renderCategories()}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={getModalTitle()}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              {formSuccess ? 'Done' : 'Cancel'}
            </Button>
            <Button variant="primary" onClick={() => void handleSubmit()}>
              {editingItem ? 'Update' : lockedParentId != null ? 'Create child' : 'Create'}
            </Button>
          </>
        }
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
}
