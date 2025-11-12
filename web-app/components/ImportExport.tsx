'use client';

import { useState, useRef } from 'react';

interface ImportExportProps {
  onImportComplete: () => void;
}

export default function ImportExport({ onImportComplete }: ImportExportProps) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Successfully imported ${result.data.funnelsImported} funnels and ${result.data.pagesImported} pages`,
        });
        onImportComplete();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to import data',
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Failed to parse JSON file',
      });
      console.error('Import error:', err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/export');
      const result = await response.json();

      if (result.success) {
        // Download as JSON file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `checkout-champ-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setMessage({
          type: 'success',
          text: 'Data exported successfully',
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to export data',
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Failed to export data',
      });
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Import/Export</h3>
          <p className="text-sm text-gray-600">
            Import data from Chrome extension or export your current data
          </p>
        </div>

        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <label
            htmlFor="import-file"
            className={`px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors ${
              importing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {importing ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Importing...
              </span>
            ) : (
              '📥 Import JSON'
            )}
          </label>

          <button
            onClick={handleExport}
            disabled={exporting}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
              exporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {exporting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Exporting...
              </span>
            ) : (
              '📤 Export JSON'
            )}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 p-3 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
