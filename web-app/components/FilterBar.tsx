'use client';

import type { SearchFilters } from '@/lib/types';

interface FilterBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

const PAGE_TYPES = [
  'Landing',
  'Lead',
  'Upsell',
  'Checkout',
  'Thank You',
  'Static',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'pageCount', label: 'Most Pages' },
];

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Page Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Page Type
          </label>
          <select
            value={filters.pageType || ''}
            onChange={(e) =>
              onChange({ ...filters, pageType: e.target.value || undefined })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {PAGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sortBy || 'newest'}
            onChange={(e) =>
              onChange({
                ...filters,
                sortBy: e.target.value as SearchFilters['sortBy'],
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggles */}
        <div className="flex items-end">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hasSplitTest || false}
              onChange={(e) =>
                onChange({ ...filters, hasSplitTest: e.target.checked || undefined })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">A/B Tests Only</span>
          </label>
        </div>

        <div className="flex items-end">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showFavorites || false}
              onChange={(e) =>
                onChange({ ...filters, showFavorites: e.target.checked || undefined })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Favorites Only</span>
          </label>
        </div>
      </div>
    </div>
  );
}
