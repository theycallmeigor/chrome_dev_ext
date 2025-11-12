# UX Issues - Location Map

## Quick Reference Guide to Find and Fix Issues

---

## 1. ACCESSIBILITY ISSUES

### Issue: Icon Buttons Missing ARIA Labels
**File**: `/home/user/chrome_dev_ext/web-app/components/FunnelCard.tsx`
**Lines**: 101-143 (Action button group)
**Code**:
```jsx
<button
  onClick={() => onUpdate(funnel.funnelId, { isPinned: !funnel.isPinned })}
  className="p-2 hover:bg-gray-100 rounded transition-colors"
  title={funnel.isPinned ? 'Unpin' : 'Pin'}
>
  {funnel.isPinned ? '📌' : '📍'}
</button>
// ❌ Missing: aria-label attribute
```

**Affected Buttons**: Pin, Favorite, Notes, Export, Expand, Delete (6 total)

**Fix**: Add `aria-label` to each button
```jsx
<button
  onClick={() => ...}
  aria-label="Pin this funnel"
  className="p-2 hover:bg-gray-100 rounded transition-colors"
  title="Pin funnel"
>
  📌
</button>
```

---

### Issue: Loading Spinner Not Accessible
**File**: `/home/user/chrome_dev_ext/web-app/components/Dashboard.tsx`
**Lines**: 112-116
**Code**:
```jsx
{loading ? (
  <div className="text-center py-12">
    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p className="mt-4 text-gray-600">Loading funnels...</p>
  </div>
```

**Issue**: Spinner has no aria-label; text might not be connected

**Fix**: Wrap in aria-live region:
```jsx
{loading ? (
  <div className="text-center py-12" aria-live="polite" aria-busy="true">
    <div 
      className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
      aria-label="Loading"
    ></div>
    <p className="mt-4 text-gray-600">Loading funnels...</p>
  </div>
```

---

### Issue: Messages Not Announced to Screen Readers
**File**: `/home/user/chrome_dev_ext/web-app/components/ImportExport.tsx`
**Lines**: 157-167
**Code**:
```jsx
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
// ❌ No aria-live="polite" or role="alert"
```

**Fix**: Add ARIA attributes:
```jsx
{message && (
  <div
    role="alert"
    aria-live="polite"
    className={`mt-4 p-3 rounded-md ${...}`}
  >
    {message.text}
  </div>
)}
```

---

## 2. MOBILE USABILITY ISSUES

### Issue: Button Touch Targets Too Small (< 44px)
**File**: `/home/user/chrome_dev_ext/web-app/components/FunnelCard.tsx`
**Lines**: 101-143
**Problem**: 
```jsx
className="p-2 hover:bg-gray-100 rounded"
// p-2 = 8px padding
// Icon ~16px
// Total: 16 + 8*2 = 32px (WCAG requires 44px minimum)
```

**Fix**: Change padding:
```jsx
className="p-4 hover:bg-gray-100 rounded"
// p-4 = 16px padding
// Icon ~16px
// Total: 16 + 16*2 = 48px ✓ (meets WCAG 2.5.5)
```

**Affected Components**:
- FunnelCard.tsx lines 102, 110, 117, 124, 131, 138 (6 buttons)
- StatsBar.tsx (if used)
- FilterBar.tsx checkboxes (consider expanding hit area)

---

## 3. ERROR HANDLING ISSUES

### Issue: No Retry Button on Error
**File**: `/home/user/chrome_dev_ext/web-app/components/Dashboard.tsx`
**Lines**: 117-120
**Code**:
```jsx
) : error ? (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
    {error}
  </div>
```

**Issue**: Error shown but no retry button; user must refresh manually

**Fix**: Add retry button:
```jsx
) : error ? (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
    <span>{error}</span>
    <button 
      onClick={fetchFunnels}
      className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Retry
    </button>
  </div>
```

---

### Issue: Import Errors Ignore Details
**File**: `/home/user/chrome_dev_ext/web-app/components/ImportExport.tsx`
**Lines**: 34-44
**Code**:
```jsx
const result = await response.json();

if (result.success) {
  setMessage({
    type: 'success',
    text: `Successfully imported ${result.data.funnelsImported} funnels...`
  });
} else {
  setMessage({
    type: 'error',
    text: result.error || 'Failed to import data'
  });
  // ❌ result.data.errors array is ignored!
}
```

**Fix**: Show error details:
```jsx
if (result.success) {
  let errorText = `Imported ${result.data.funnelsImported} funnels`;
  if (result.data.errors?.length) {
    errorText += ` (${result.data.errors.length} warnings)`;
  }
  setMessage({ type: 'success', text: errorText });
} else {
  const details = result.data?.errors?.join('; ') || result.error;
  setMessage({ type: 'error', text: details });
}
```

---

## 4. FILTER & SEARCH ISSUES

### Issue: No Active Filter Indicators
**File**: `/home/user/chrome_dev_ext/web-app/components/FilterBar.tsx`
**Lines**: 26-104
**Problem**: User applies filters but no visual indication of active filters

**Fix**: Add filter count at top:
```jsx
export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const activeFilterCount = [
    filters.search,
    filters.pageType,
    filters.hasSplitTest,
    filters.showFavorites,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      {activeFilterCount > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Active filters: <span className="bg-blue-100 px-2 py-1 rounded">{activeFilterCount}</span>
          </span>
          <button 
            onClick={() => onChange({ sortBy: 'newest' })}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
      {/* Rest of filters */}
    </div>
  );
}
```

---

### Issue: Case-Sensitive Search
**File**: `/home/user/chrome_dev_ext/web-app/lib/database-utils.ts`
**Lines**: 11-14
**Code**:
```javascript
if (filters?.search) {
  query += ' AND (name LIKE ? OR domain LIKE ?)';
  const searchTerm = `%${filters.search}%`;
  params.push(searchTerm, searchTerm);
}
```

**Issue**: LIKE is case-sensitive in SQLite by default

**Fix**: Use LOWER() for case-insensitive search:
```javascript
if (filters?.search) {
  query += ' AND (LOWER(name) LIKE ? OR LOWER(domain) LIKE ?)';
  const searchTerm = `%${filters.search.toLowerCase()}%`;
  params.push(searchTerm, searchTerm);
}
```

---

### Issue: Filter State Not in URL
**File**: `/home/user/chrome_dev_ext/web-app/components/Dashboard.tsx`
**Problem**: Filter state only in component state, not in URL query params
**Impact**: Can't share filtered views; filters reset on page refresh

**Fix**: Use useRouter to update URL:
```jsx
import { useRouter, useSearchParams } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize filters from URL
  const [filters, setFilters] = useState<SearchFilters>({
    search: searchParams.get('search') || undefined,
    pageType: searchParams.get('pageType') || undefined,
    // ... etc
  });

  // Update URL when filters change
  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    // ... etc
    router.push(`?${params.toString()}`);
  };
}
```

---

## 5. PERFORMANCE ISSUES

### Issue: N+1 Query Pattern
**File**: `/home/user/chrome_dev_ext/web-app/lib/database-utils.ts`
**Lines**: 5-60 (getAllFunnels function)
**Code**:
```javascript
export function getAllFunnels(filters?: SearchFilters): FunnelWithPages[] {
  const db = getDatabase();
  let query = 'SELECT * FROM funnels WHERE 1=1';
  // ... build query
  
  const funnels = db.prepare(query).all(...params) as Funnel[];
  
  // ❌ This loops N times:
  const funnelsWithPages = funnels.map(funnel => {
    const pages = getPagesByFunnelId(funnel.funnelId); // Query per funnel!
    return { ...funnel, pages };
  });
  
  return funnelsWithPages;
}
```

**Problem**: With 1000 funnels = 1001 database queries!

**Fix**: Use SQL JOIN:
```javascript
export function getAllFunnels(filters?: SearchFilters): FunnelWithPages[] {
  const db = getDatabase();
  
  // Build base query
  let query = `
    SELECT f.*, p.*
    FROM funnels f
    LEFT JOIN pages p ON f.funnelId = p.funnelId
    WHERE 1=1
  `;
  // ... add filter conditions
  
  const rows = db.prepare(query).all(...params) as any[];
  
  // Reshape into FunnelWithPages format
  const funnelsMap = new Map<string, FunnelWithPages>();
  for (const row of rows) {
    if (!funnelsMap.has(row.funnelId)) {
      funnelsMap.set(row.funnelId, {
        funnelId: row.funnelId,
        name: row.name,
        // ... other fields
        pages: []
      });
    }
    if (row.pageId) {
      funnelsMap.get(row.funnelId)!.pages.push({
        // ... page data
      });
    }
  }
  
  return Array.from(funnelsMap.values());
}
```

---

### Issue: Separate Stats API Call
**File**: `/home/user/chrome_dev_ext/web-app/components/StatsBar.tsx`
**Lines**: 8-17
**Code**:
```javascript
useEffect(() => {
  fetch('/api/stats')  // ❌ Separate API call
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setStats(data.data);
      }
    })
}, []);
```

**Also**: `/home/user/chrome_dev_ext/web-app/components/Dashboard.tsx` lines 19-46

**Problem**: 2 API calls when they could be combined

**Fix**: Combine into single API call or pass stats from Dashboard to StatsBar:
```jsx
// In Dashboard.tsx
const [stats, setStats] = useState(null);

// Fetch both in single call
const fetchFunnels = async () => {
  const response = await fetch(`/api/funnels?...`);
  const data = await response.json();
  if (data.success) {
    setFunnels(data.data);
    // Also return stats in same response
    setStats(data.stats);
  }
};

// Pass to StatsBar
<StatsBar stats={stats} />
```

---

### Issue: No Pagination
**File**: `/home/user/chrome_dev_ext/web-app/components/Dashboard.tsx`
**Lines**: 32-36
**Code**:
```jsx
const response = await fetch(`/api/funnels?${params.toString()}`);
const data = await response.json();

if (data.success) {
  setFunnels(data.data);  // ❌ Loads ALL funnels into memory
}
```

**Problem**: With 10,000+ funnels, very slow to load/render

**Fix**: Implement pagination:
```jsx
const [page, setPage] = useState(1);
const ITEMS_PER_PAGE = 20;

const fetchFunnels = async () => {
  params.set('page', page.toString());
  params.set('limit', ITEMS_PER_PAGE.toString());
  
  const response = await fetch(`/api/funnels?${params.toString()}`);
  const data = await response.json();
  
  setFunnels(data.data);
  setTotalCount(data.total);
};

// Render pagination controls
{totalCount > ITEMS_PER_PAGE && (
  <div className="flex gap-2 mt-4">
    <button 
      onClick={() => setPage(p => Math.max(1, p - 1))}
      disabled={page === 1}
    >
      Previous
    </button>
    <span>Page {page} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}</span>
    <button 
      onClick={() => setPage(p => p + 1)}
      disabled={page >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
    >
      Next
    </button>
  </div>
)}
```

---

## 6. VISUAL FEEDBACK ISSUES

### Issue: Silent Success on Pin/Favorite/Notes
**File**: `/home/user/chrome_dev_ext/web-app/components/Dashboard.tsx`
**Lines**: 52-66 (handleUpdateFunnel)
**Code**:
```jsx
const handleUpdateFunnel = async (funnelId: string, updates: any) => {
  try {
    const response = await fetch(`/api/funnels/${funnelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      fetchFunnels(); // Refresh silently
      // ❌ No user feedback!
    }
  } catch (err) {
    console.error('Error updating funnel:', err);
    // ❌ No error shown to user!
  }
};
```

**Fix**: Add toast notification:
```jsx
const handleUpdateFunnel = async (funnelId: string, updates: any) => {
  try {
    const response = await fetch(`/api/funnels/${funnelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      fetchFunnels();
      showToast('success', 'Funnel updated successfully');
    } else {
      showToast('error', 'Failed to update funnel');
    }
  } catch (err) {
    console.error('Error updating funnel:', err);
    showToast('error', 'Failed to update funnel');
  }
};
```

---

### Issue: Delete Uses Browser Confirm()
**File**: `/home/user/chrome_dev_ext/web-app/components/Dashboard.tsx`
**Lines**: 68-82 (handleDeleteFunnel)
**Code**:
```jsx
const handleDeleteFunnel = async (funnelId: string) => {
  if (!confirm('Are you sure you want to delete this funnel?')) return;
  // ❌ Browser confirm dialog - not styled, not consistent
```

**Fix**: Use modal confirmation:
```jsx
const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

const handleDeleteFunnel = async (funnelId: string) => {
  try {
    const response = await fetch(`/api/funnels/${funnelId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      fetchFunnels();
      showToast('success', 'Funnel deleted');
      setDeleteConfirm(null);
    }
  } catch (err) {
    showToast('error', 'Failed to delete funnel');
  }
};

// Render modal
{deleteConfirm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg max-w-sm">
      <h3 className="text-lg font-semibold mb-4">Delete Funnel?</h3>
      <p className="text-gray-600 mb-6">This action cannot be undone.</p>
      <div className="flex gap-3">
        <button 
          onClick={async () => await handleDeleteFunnel(deleteConfirm)}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Delete
        </button>
        <button 
          onClick={() => setDeleteConfirm(null)}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 7. IMPORT WORKFLOW ISSUES

### Issue: No Drag-and-Drop Support
**File**: `/home/user/chrome_dev_ext/web-app/components/ImportExport.tsx`
**Lines**: 114-121
**Current**:
```jsx
<input
  ref={fileInputRef}
  type="file"
  accept=".json"
  onChange={handleImport}
  className="hidden"
  id="import-file"
/>
// Only: click to select - no drag-and-drop
```

**Fix**: Add drag-and-drop zone:
```jsx
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setDragActive(true);
};

const handleDragLeave = () => {
  setDragActive(false);
};

const handleDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  setDragActive(false);
  
  const file = e.dataTransfer.files?.[0];
  if (file) {
    await handleImport({ target: { files: [file] } } as any);
  }
};

return (
  <div
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer transition ${
      dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
    }`}
  >
    <p>Drag and drop JSON file here or click to select</p>
    <input
      ref={fileInputRef}
      type="file"
      accept=".json"
      onChange={handleImport}
      className="hidden"
    />
  </div>
);
```

---

### Issue: No File Size Validation
**File**: `/home/user/chrome_dev_ext/web-app/components/ImportExport.tsx`
**Lines**: 15-23
**Current**:
```jsx
const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  // ❌ No size check
  
  setImporting(true);
  const text = await file.text();  // Could hang on huge file
```

**Fix**: Add file validation:
```jsx
const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // Validate file size (max 50MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    setMessage({
      type: 'error',
      text: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max 50MB)`
    });
    return;
  }
  
  // Validate file type
  if (!file.type.includes('json') && !file.name.endsWith('.json')) {
    setMessage({
      type: 'error',
      text: 'Please select a JSON file'
    });
    return;
  }
  
  setImporting(true);
  // ... rest of import
```

---

## SUMMARY TABLE

| Issue | File | Line(s) | Priority | Estimated Effort |
|-------|------|---------|----------|------------------|
| No ARIA labels | FunnelCard.tsx | 101-143 | HIGH | 15 min |
| Button sizes < 44px | FunnelCard.tsx | 101-143 | HIGH | 10 min |
| No filter indicators | FilterBar.tsx | 26-104 | HIGH | 20 min |
| No retry button | Dashboard.tsx | 117-120 | HIGH | 15 min |
| N+1 query pattern | database-utils.ts | 5-60 | HIGH | 2 hours |
| Case-sensitive search | database-utils.ts | 11-14 | MEDIUM | 10 min |
| Silent success ops | Dashboard.tsx | 52-66 | MEDIUM | 30 min |
| Delete confirm() | Dashboard.tsx | 68-82 | MEDIUM | 30 min |
| No drag-drop | ImportExport.tsx | 114-121 | MEDIUM | 45 min |
| No file validation | ImportExport.tsx | 15-23 | MEDIUM | 20 min |
| Loading spinner not announced | Dashboard.tsx | 112-116 | MEDIUM | 10 min |
| Messages not announced | ImportExport.tsx | 157-167 | MEDIUM | 10 min |
| No pagination | Dashboard.tsx | 32-36 | LOW | 2 hours |
| Separate stats call | StatsBar.tsx | 8-17 | LOW | 1 hour |

