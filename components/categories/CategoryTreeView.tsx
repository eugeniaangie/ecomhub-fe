'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import type { MasterCategoryTree } from '@/lib/types';

interface CategoryTreeViewProps {
  tree: MasterCategoryTree[];
  onAddChild: (parentId: number) => void;
  onEdit: (category: MasterCategoryTree) => void;
  onDelete: (category: MasterCategoryTree) => void;
  getCategoryPath?: (category: MasterCategoryTree) => string[];
}

interface TreeNodeProps {
  node: MasterCategoryTree;
  level: number;
  onAddChild: (parentId: number) => void;
  onEdit: (category: MasterCategoryTree) => void;
  onDelete: (category: MasterCategoryTree) => void;
  getCategoryPath?: (category: MasterCategoryTree) => string[];
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  onAddChild,
  onEdit,
  onDelete,
  getCategoryPath,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const indent = level * 24;

  return (
    <div className="mb-2">
      <div
        className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-50 group"
        style={{ paddingLeft: `${12 + indent}px` }}
      >
        {/* Tree connector lines */}
        {level > 0 && (
          <div className="absolute left-0 w-6 h-6 flex items-center justify-center">
            <div className="w-px h-full bg-gray-300"></div>
            <div className="w-3 h-px bg-gray-300"></div>
          </div>
        )}

        {/* Category name */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900">{node.category_name}</div>
          {getCategoryPath && (
            <div className="text-xs text-gray-500 mt-0.5">
              {getCategoryPath(node).join(' > ')}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddChild(node.id)}
            title="Add Child Category"
          >
            Add Child
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(node)}
            title="Edit Category"
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(node)}
            disabled={hasChildren}
            title={hasChildren ? 'Cannot delete category with children' : 'Delete Category'}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Render children */}
      {hasChildren && (
        <div className="relative">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              getCategoryPath={getCategoryPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryTreeView: React.FC<CategoryTreeViewProps> = ({
  tree,
  onAddChild,
  onEdit,
  onDelete,
  getCategoryPath,
}) => {
  // Helper function to build category path
  const buildPath = (category: MasterCategoryTree, allNodes: MasterCategoryTree[]): string[] => {
    const path: string[] = [category.category_name];
    if (category.parent_id) {
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
      const parent = findParent(allNodes, category.parent_id);
      if (parent) {
        return [...buildPath(parent, allNodes), ...path];
      }
    }
    return path;
  };

  const getPath = (category: MasterCategoryTree) => {
    return buildPath(category, tree);
  };

  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No categories found. Create your first category!
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          getCategoryPath={getCategoryPath || getPath}
        />
      ))}
    </div>
  );
};

