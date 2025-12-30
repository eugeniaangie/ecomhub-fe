'use client';

import { useEffect, useState } from 'react';
import { masterCategoryApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import {
  canCreateCategory,
  canUpdateCategory,
  canDeleteCategory,
} from '@/lib/authHelpers';
import type { MasterCategory } from '@/lib/types';

export default function MasterDataPage() {
  // Set document title
  useEffect(() => {
    document.title = 'Master Category';
  }, []);

  // Permission checks
  const canCreate = canCreateCategory();
  const canUpdate = canUpdateCategory();
  const canDelete = canDeleteCategory();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(''); // For page-level errors (loading data)
  const [formError, setFormError] = useState(''); // For form submission errors
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterCategory | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Data states
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [allCategories, setAllCategories] = useState<MasterCategory[]>([]); // For parent lookup

  // Form states
  const [categoryForm, setCategoryForm] = useState({ 
    category_name: '', 
    description: '', 
    parent_id: null as number | null 
  });

  useEffect(() => {
    loadData();
    loadAllCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const loadAllCategories = async () => {
    try {
      // Load all categories for parent lookup (reasonable limit)
      // Load first page with reasonable limit, or use current page data
      const response = await masterCategoryApi.getAll(1, 100);
      if (response && response.results) {
        setAllCategories(response.results);
        // If there are more pages, we'll use what we have
        // For better UX, we could load more pages if needed, but 100 should be enough for most cases
      }
    } catch (err) {
      console.error('Error loading all categories:', err);
      // Don't show error, just use empty array
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

  const handleCreate = () => {
    console.log('handleCreate called');
    setEditingItem(null);
    setCategoryForm({ category_name: '', description: '', parent_id: null });
    setFormError(''); // Clear form errors
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
    setFormError(''); // Clear form errors
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
      setFormError('Category name is required');
      return;
    }

    try {
      setFormError(''); // Clear previous form errors
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
      setFormError(errorMessage); // Set form error, not page error
    }
  };

  // Helper function to get parent category name
  // First check current page categories, then allCategories
  const getParentCategoryName = (parentId: number | null | undefined): string => {
    if (!parentId) return '-';
    // First check in current page categories (most common case)
    const parentInPage = categories.find(cat => cat.id === parentId);
    if (parentInPage) return parentInPage.category_name;
    // Then check in allCategories (for parent lookup)
    const parent = allCategories.find(cat => cat.id === parentId);
    return parent ? parent.category_name : `ID: ${parentId}`;
  };

  // Sort categories: parent followed by all its children (depth-first)
  const sortedCategories = (() => {
    const sorted: MasterCategory[] = [];
    const processed = new Set<number>();
    
    // Helper to get all descendants of a category
    const getDescendants = (parentId: number): MasterCategory[] => {
      return categories.filter(cat => cat.parent_id === parentId);
    };
    
    // Helper to add category and all its descendants recursively
    const addWithDescendants = (category: MasterCategory) => {
      if (processed.has(category.id)) return;
      
      sorted.push(category);
      processed.add(category.id);
      
      // Add all direct children, sorted by category_name
      const children = getDescendants(category.id).sort((a, b) => 
        a.category_name.localeCompare(b.category_name)
      );
      
      // Recursively add each child and its descendants
      children.forEach(child => addWithDescendants(child));
    };
    
    // Start with root categories (no parent), sorted by category_name
    const rootCategories = categories
      .filter(cat => !cat.parent_id)
      .sort((a, b) => a.category_name.localeCompare(b.category_name));
    
    // Add each root and all its descendants
    rootCategories.forEach(root => addWithDescendants(root));
    
    // Add any remaining categories (orphaned, shouldn't happen but just in case)
    categories.forEach(cat => {
      if (!processed.has(cat.id)) {
        sorted.push(cat);
      }
    });
    
    return sorted;
  })();

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
                Parent Category
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
                // Calculate indent level based on parent hierarchy (recursive)
                const getIndentLevel = (category: MasterCategory, visited = new Set<number>()): number => {
                  // Prevent infinite loop
                  if (visited.has(category.id)) return 0;
                  visited.add(category.id);
                  
                  if (!category.parent_id) return 0;
                  const parent = categories.find(c => c.id === category.parent_id);
                  if (!parent) return 1;
                  return getIndentLevel(parent, visited) + 1;
                };
                
                const indentLevel = getIndentLevel(cat);
                // Apply indent: level 0 = no indent, level 1 = pl-8, level 2 = pl-16, level 3 = pl-24, etc.
                const indentClass = 
                  indentLevel === 0 ? '' :
                  indentLevel === 1 ? 'pl-8' :
                  indentLevel === 2 ? 'pl-16' :
                  indentLevel === 3 ? 'pl-24' :
                  indentLevel === 4 ? 'pl-32' :
                  'pl-40'; // Max 5 levels
                
                return (
                <tr key={cat.id} className="hover:bg-gray-50">
                    <td className={`px-6 py-4 text-sm font-medium text-gray-900 ${indentClass}`}>
                      {cat.parent_id && (
                        <span className="text-gray-400 mr-2">└─</span>
                      )}
                      {cat.category_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {getParentCategoryName(cat.parent_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {cat.description || '-'}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
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
  );

  const renderModalContent = () => {
    console.log('renderModalContent called');
    // Get available parent categories (exclude current category if editing)
    const availableParents = categories.filter(cat => 
      editingItem ? cat.id !== editingItem.id : true
    );

    return (
      <div className="space-y-4">
        {/* Form Error Message */}
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {formError}
          </div>
        )}

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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
        <h1 className="text-2xl font-bold text-gray-900">Master Category</h1>
        <Button 
          onClick={handleCreate} 
          variant="primary"
          disabled={!canCreate}
          className={!canCreate ? 'opacity-50 cursor-not-allowed' : ''}
        >
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          setCategoryForm({ category_name: '', description: '', parent_id: null });
          setFormError(''); // Clear form errors
        }}
        title={getModalTitle()}
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setIsModalOpen(false);
              setEditingItem(null);
              setCategoryForm({ category_name: '', description: '', parent_id: null });
              setFormError(''); // Clear form errors
            }}>
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
    </div>
  );
}

