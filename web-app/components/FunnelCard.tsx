'use client';

import { useState } from 'react';
import type { FunnelWithPages } from '@/lib/types';
import Link from 'next/link';

interface FunnelCardProps {
  funnel: FunnelWithPages;
  onUpdate: (funnelId: string, updates: any) => void;
  onDelete: (funnelId: string) => void;
}

export default function FunnelCard({ funnel, onUpdate, onDelete }: FunnelCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(funnel.notes || '');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSaveNotes = () => {
    onUpdate(funnel.funnelId, { notes });
    setShowNotes(false);
  };

  const handleExportCSV = () => {
    const headers = ['Page Title', 'URL Slug', 'External URL', 'Page Type', 'Split Test', 'First Seen'];
    const rows = funnel.pages.map(page => [
      page.title,
      page.urlSlug,
      page.externalURL || '',
      page.pageType || '',
      page.splitEnabled ? 'Yes' : 'No',
      formatDate(page.firstSeen),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${funnel.name.replace(/[^a-z0-9]/gi, '-')}-pages.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const splitTestCount = funnel.pages.filter(p => p.splitEnabled).length;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{funnel.name}</h2>
              {funnel.isPinned && <span className="text-lg">📌</span>}
              {funnel.isFavorite && <span className="text-lg">⭐</span>}
              {funnel.isOwned && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                  OWNED
                </span>
              )}
            </div>

            <a
              href={funnel.domain}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              {funnel.domain}
            </a>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              <span>📄 {funnel.pages.length} pages</span>
              {splitTestCount > 0 && <span>🔀 {splitTestCount} A/B tests</span>}
              <span>👁️ First seen: {formatDate(funnel.firstSeen)}</span>
              <span>🔄 Last seen: {formatDate(funnel.lastSeen)}</span>
            </div>

            {funnel.notes && !showNotes && (
              <div className="mt-3 text-sm text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                📝 {funnel.notes}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => onUpdate(funnel.funnelId, { isPinned: !funnel.isPinned })}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title={funnel.isPinned ? 'Unpin' : 'Pin'}
            >
              {funnel.isPinned ? '📌' : '📍'}
            </button>
            <button
              onClick={() => onUpdate(funnel.funnelId, { isFavorite: !funnel.isFavorite })}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title={funnel.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {funnel.isFavorite ? '⭐' : '☆'}
            </button>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Edit notes"
            >
              📝
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Export to CSV"
            >
              📊
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? '🔼' : '🔽'}
            </button>
            <button
              onClick={() => onDelete(funnel.funnelId)}
              className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
              title="Delete funnel"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Notes Editor */}
        {showNotes && (
          <div className="mt-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this funnel..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setNotes(funnel.notes || '');
                  setShowNotes(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pages List */}
      {expanded && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pages ({funnel.pages.length})
          </h3>
          <div className="space-y-2">
            {funnel.pages.length === 0 ? (
              <p className="text-gray-600 text-sm">No pages found</p>
            ) : (
              funnel.pages.map((page) => (
                <div
                  key={page.pageId}
                  className="bg-white p-4 rounded border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{page.title}</h4>
                        {page.splitEnabled && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                            A/B TEST
                          </span>
                        )}
                        {page.pageType && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                            {page.pageType}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {page.urlSlug}
                        </span>
                      </p>
                      {page.externalURL && (
                        <a
                          href={page.externalURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                        >
                          🔗 Visit page
                        </a>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        First seen: {formatDate(page.firstSeen)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
