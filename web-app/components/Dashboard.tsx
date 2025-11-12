'use client';

import { useState, useEffect } from 'react';
import type { FunnelWithPages, SearchFilters } from '@/lib/types';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import FunnelCard from './FunnelCard';
import StatsBar from './StatsBar';
import ImportExport from './ImportExport';

export default function Dashboard() {
  const [funnels, setFunnels] = useState<FunnelWithPages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'newest',
  });

  // Fetch funnels
  const fetchFunnels = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.pageType) params.set('pageType', filters.pageType);
      if (filters.hasSplitTest) params.set('hasSplitTest', 'true');
      if (filters.showFavorites) params.set('showFavorites', 'true');
      if (filters.sortBy) params.set('sortBy', filters.sortBy);

      const response = await fetch(`/api/funnels?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setFunnels(data.data);
      } else {
        setError(data.error || 'Failed to fetch funnels');
      }
    } catch (err) {
      setError('Failed to fetch funnels');
      console.error('Error fetching funnels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnels();
  }, [filters]);

  const handleUpdateFunnel = async (funnelId: string, updates: any) => {
    try {
      const response = await fetch(`/api/funnels/${funnelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchFunnels(); // Refresh the list
      }
    } catch (err) {
      console.error('Error updating funnel:', err);
    }
  };

  const handleDeleteFunnel = async (funnelId: string) => {
    if (!confirm('Are you sure you want to delete this funnel?')) return;

    try {
      const response = await fetch(`/api/funnels/${funnelId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchFunnels(); // Refresh the list
      }
    } catch (err) {
      console.error('Error deleting funnel:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          CheckoutChamp Funnel Tracker
        </h1>
        <p className="text-gray-600">
          Track and manage your CheckoutChamp funnels and pages
        </p>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Import/Export */}
      <ImportExport onImportComplete={fetchFunnels} />

      {/* Search */}
      <SearchBar
        value={filters.search || ''}
        onChange={(search) => setFilters({ ...filters, search })}
      />

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading funnels...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : funnels.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No funnels found
          </h3>
          <p className="text-gray-600 mb-4">
            Import data from your Chrome extension to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Showing {funnels.length} funnel{funnels.length !== 1 ? 's' : ''}
            </p>
          </div>
          {funnels.map((funnel) => (
            <FunnelCard
              key={funnel.funnelId}
              funnel={funnel}
              onUpdate={handleUpdateFunnel}
              onDelete={handleDeleteFunnel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
