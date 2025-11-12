# CheckoutChamp Funnel Tracker - User Flows & Architecture Analysis

## APPLICATION ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 16 APP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐        ┌─────────────────────────────┐  │
│  │  PAGE LAYER      │        │  API ROUTES                 │  │
│  ├──────────────────┤        ├─────────────────────────────┤  │
│  │ app/page.tsx     │──────→│ /api/funnels      (CRUD)    │  │
│  │ (Home)           │        │ /api/funnels/[id] (Detail) │  │
│  └──────────────────┘        │ /api/import       (POST)    │  │
│         │                    │ /api/export       (GET)     │  │
│         │                    │ /api/stats        (GET)     │  │
│         │                    │ /api/pages        (GET)     │  │
│         │                    │ /api/cleanup      (POST)    │  │
│         └────────────────────┴─────────────────────────────┘  │
│              │                         │                       │
│              ▼                         ▼                       │
│  ┌──────────────────────┐   ┌──────────────────────┐         │
│  │  COMPONENTS          │   │  DATABASE LAYER      │         │
│  ├──────────────────────┤   ├──────────────────────┤         │
│  │ Dashboard.tsx        │   │ database-utils.ts    │         │
│  │ SearchBar.tsx        │──→│ (SQLite operations)  │         │
│  │ FilterBar.tsx        │   │                      │         │
│  │ FunnelCard.tsx       │   └──────────────────────┘         │
│  │ StatsBar.tsx         │            │                        │
│  │ ImportExport.tsx     │            ▼                        │
│  └──────────────────────┘   ┌──────────────────────┐         │
│                              │  SQLite Database     │         │
│                              │ checkout-champ.db    │         │
│                              │ (Local/Persistent)   │         │
│                              └──────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

STYLING: Tailwind CSS v4 (PostCSS)
STATE MANAGEMENT: React Hooks (useState, useEffect)
LANGUAGE: TypeScript
```

---

## CURRENT USER FLOWS

### Flow 1: Initial Data Load & Display

```
User Opens App
│
├─→ [Dashboard Component Mounts]
│   │
│   ├─→ useEffect: Initialize State
│   │   └─→ filters = { sortBy: 'newest' }
│   │
│   ├─→ StatsBar Component
│   │   └─→ Fetch: GET /api/stats
│   │       └─→ Display: 6 stat cards (or nothing if loading)
│   │
│   └─→ FetchFunnels()
│       └─→ Build Query Parameters
│           └─→ GET /api/funnels?sortBy=newest
│               └─→ State: loading = true
│               └─→ Response: funnels[] with pages
│               └─→ State: loading = false, funnels = data
│
└─→ Render Dashboard with Funnels
    ├─→ Show Stats Bar
    ├─→ Show Import/Export Section
    ├─→ Show Search Bar
    ├─→ Show Filter Bar
    └─→ Show Funnel Cards List
```

**Issues in Flow**:
- StatsBar loads independently (could flicker)
- No error handling for partial failures
- Loading state is global (can't show partial data)

---

### Flow 2: Search and Filter

```
User Types in Search
│
├─→ onChange Handler
│   └─→ setLocalValue (immediate)
│       └─→ useEffect debounce timer starts (300ms)
│
├─→ 300ms Passes Without New Input
│   └─→ onChange to parent
│       └─→ setFilters({ ...filters, search })
│           └─→ useEffect dependency: filters changed
│               └─→ fetchFunnels()
│                   ├─→ Build params: search=value
│                   ├─→ GET /api/funnels?search=value
│                   └─→ Update UI with results
│
└─→ If User Types Again Before 300ms
    └─→ Timer resets (debounce mechanism)
```

**Current Issues**:
```
Query: { search: 'landing', pageType: 'Landing', hasSplitTest: true, showFavorites: true }
└─→ ALL must match (AND logic)
└─→ No visual indication of active filters
└─→ No "Clear filters" button
```

---

### Flow 3: Import Data Workflow

```
User Clicks Import
│
├─→ Opens Hidden File Input <input type="file" accept=".json" />
│   └─→ User Selects File
│
├─→ onChange Event
│   ├─→ State: importing = true
│   ├─→ Read File: file.text()
│   ├─→ Parse: JSON.parse(text)
│   │
│   ├─→ POST /api/import
│   │   ├─→ Backend: importExtensionData()
│   │   │   ├─→ Transaction BEGIN
│   │   │   ├─→ For each funnel:
│   │   │   │   ├─→ INSERT/UPDATE funnel
│   │   │   │   └─→ For each page: INSERT/UPDATE page
│   │   │   ├─→ Transaction COMMIT
│   │   │   └─→ Return: { funnelsImported, pagesImported, errors }
│   │   │
│   │   └─→ Frontend: Show Success Message
│   │       └─→ "Successfully imported X funnels and Y pages"
│   │
│   ├─→ State: importing = false
│   ├─→ onImportComplete() callback
│   │   └─→ fetchFunnels() (refresh list)
│   │
│   └─→ Display: Green success message

```

**Critical Issues in Flow**:
- No file size validation (could hang on large files)
- No progress indicator during upload
- Errors not shown with details (which items failed?)
- Message auto-disappears (might not see it)
- No drag-and-drop support
- Can't cancel mid-upload

---

### Flow 4: Funnel Card Interactions

```
User Sees Funnel Card
│
├─→ Card Header
│   ├─→ Name + Icons (📌 if pinned, ⭐ if favorite)
│   ├─→ Domain (clickable link opens in new tab)
│   ├─→ Meta info (page count, split tests, dates)
│   │
│   └─→ Action Buttons (Row 1: Pin/Favorite/Notes/Export/Expand/Delete)
│       │
│       ├─→ Pin Button
│       │   ├─→ onClick: PUT /api/funnels/{id}
│       │   │   └─→ { isPinned: !current }
│       │   ├─→ Response: Success (silent)
│       │   ├─→ Refresh List (no visual feedback first)
│       │   └─→ Icon changes on re-render
│       │
│       ├─→ Favorite Button
│       │   └─→ Same flow as Pin
│       │
│       ├─→ Notes Button
│       │   ├─→ State: showNotes = true
│       │   ├─→ Render: <textarea>
│       │   ├─→ On Save: PUT /api/funnels/{id} { notes }
│       │   └─→ State: showNotes = false
│       │
│       ├─→ CSV Export Button
│       │   ├─→ handleExportCSV()
│       │   ├─→ Build CSV from pages
│       │   ├─→ Download: filename-pages.csv
│       │   └─→ No user feedback
│       │
│       ├─→ Expand Button
│       │   ├─→ State: expanded = !expanded
│       │   ├─→ Render: All pages list
│       │   └─→ Show badges: A/B TEST, page type
│       │
│       └─→ Delete Button
│           ├─→ Show: confirm('Are you sure?')
│           ├─→ DELETE /api/funnels/{id}
│           ├─→ Response: Success
│           ├─→ Refresh List
│           └─→ No undo option

```

**Issues**:
- Icon buttons not semantic (missing aria-labels)
- Operations "silent" on success (no toast)
- Delete uses browser confirm (not styled)
- No undo for destructive actions
- Buttons too small on mobile (22px padding)

---

### Flow 5: Error Scenarios

```
SCENARIO A: Import File Parse Error
│
├─→ User selects .txt file (not .json)
├─→ JSON.parse(text) throws error
├─→ Catch block: setMessage({ type: 'error', text: 'Failed to parse JSON file' })
├─→ State: importing = false
└─→ User sees red message, must retry


SCENARIO B: Fetch Funnels Network Error
│
├─→ GET /api/funnels fails (network down, timeout, etc.)
├─→ catch(err) in fetchFunnels()
├─→ setError('Failed to fetch funnels')
├─→ State: loading = false
└─→ User sees red error banner, NO RETRY BUTTON


SCENARIO C: Import API Returns Error
│
├─→ POST /api/import succeeds (200 OK)
├─→ Response: { success: false, error: 'Import failed', details: [...] }
├─→ UI checks: if (!result.success)
├─→ setMessage({ type: 'error', text: result.error })
├─→ Details array is IGNORED
└─→ User sees generic message, no helpful info


SCENARIO D: Database Transaction Fails
│
├─→ importExtensionData() catches error
├─→ Returns: { success: false, funnelsImported: 0, errors: [...] }
├─→ Frontend receives and shows generic error
└─→ User doesn't know what went wrong
```

---

## COMPONENT DEPENDENCY GRAPH

```
App (page.tsx)
│
└──→ Dashboard
    │
    ├──→ StatsBar
    │   └──→ fetch /api/stats
    │       └──→ DB: getStatistics()
    │
    ├──→ ImportExport
    │   ├──→ POST /api/import
    │   │   └──→ DB: importExtensionData()
    │   │
    │   └──→ GET /api/export
    │       └──→ DB: exportToExtensionFormat()
    │
    ├──→ SearchBar
    │   └──→ onChange → parent state update
    │
    ├──→ FilterBar
    │   └──→ onChange → parent state update
    │
    └──→ FunnelCard[] (mapped)
        │
        ├──→ PUT /api/funnels/{id}
        │   └──→ DB: updateFunnelFlags()
        │
        ├──→ DELETE /api/funnels/{id}
        │   └──→ DB: deleteFunnel()
        │
        └──→ Local: CSV Export
            └──→ Generate blob, download
```

---

## DATA FLOW DURING NORMAL OPERATION

```
┌─────────────────────────────────────────────────────────────────┐
│ COMPONENT STATE TREE                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dashboard                                                      │
│  ├─ funnels: FunnelWithPages[]        [Source: API]           │
│  ├─ loading: boolean                  [UI state]              │
│  ├─ error: string | null              [API error]             │
│  └─ filters: SearchFilters                                    │
│     ├─ search?: string                [User input]            │
│     ├─ pageType?: string              [User selection]        │
│     ├─ hasSplitTest?: boolean         [User toggle]           │
│     ├─ showFavorites?: boolean        [User toggle]           │
│     └─ sortBy: 'newest'|'oldest'|...  [User selection]        │
│                                                                 │
│  ImportExport                                                   │
│  ├─ importing: boolean                [Button state]          │
│  ├─ exporting: boolean                [Button state]          │
│  └─ message?: { type, text }          [Feedback]              │
│                                                                 │
│  SearchBar                                                      │
│  ├─ localValue: string                [Input value]           │
│  └─ [Timer for debounce]                                      │
│                                                                 │
│  FunnelCard (per funnel)                                        │
│  ├─ expanded: boolean                 [UI state]              │
│  ├─ showNotes: boolean                [UI state]              │
│  └─ notes: string                     [Edited text]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## API RESPONSE PATTERNS

### Success Response (Funnels)
```json
{
  "success": true,
  "data": [
    {
      "funnelId": "funnel_123",
      "name": "Landing Page",
      "domain": "example.com",
      "firstSeen": "2025-01-01T00:00:00Z",
      "lastSeen": "2025-01-15T00:00:00Z",
      "isPinned": false,
      "isFavorite": true,
      "isOwned": true,
      "notes": "High converting funnel",
      "tags": "premium",
      "pages": [
        {
          "pageId": "page_456",
          "funnelId": "funnel_123",
          "title": "Home",
          "urlSlug": "home",
          "pageType": "Landing",
          "splitEnabled": false,
          "firstSeen": "2025-01-01T00:00:00Z"
        }
      ]
    }
  ],
  "count": 1
}
```

### Error Response (Generic)
```json
{
  "success": false,
  "error": "Failed to fetch funnels"
}
```

### Import Response
```json
{
  "success": true,
  "message": "Data imported successfully",
  "data": {
    "funnelsImported": 5,
    "pagesImported": 23,
    "errors": [
      "Skipping invalid funnel: metadata_field (missing required fields: name or domain)"
    ]
  }
}
```

---

## PERFORMANCE BOTTLENECKS IDENTIFIED

### 1. N+1 Query Pattern
```javascript
// In database-utils.ts - getAllFunnels()
const funnels = db.prepare(query).all(...params); // Gets 100 funnels

funnels.map(funnel => {
  const pages = getPagesByFunnelId(funnel.funnelId); // 100 queries!
  return { ...funnel, pages };
});

// Result: 1 query + N queries = N+1 pattern
```

**Impact**: With 1000 funnels = 1001 database queries

**Solution**: Use SQL JOIN to get all data in 1-2 queries

---

### 2. Separate Stats Fetch
```javascript
// StatsBar does its own fetch
fetch('/api/stats')

// Main Dashboard does its own fetch
fetch('/api/funnels')

// Result: 2 separate API calls that could be combined
```

**Impact**: Extra latency, extra network round trip

---

### 3. No Pagination
```javascript
// Always fetches ALL funnels, even if 10,000+
const funnels = getAllFunnels(filters);
// Then renders all in DOM
```

**Impact**: 
- Large DOM (slow rendering)
- Memory usage grows with data
- No infinite scroll optimization

---

### 4. No Caching
```javascript
// Every filter change = fresh fetch
useEffect(() => {
  fetchFunnels(); // Runs on every filter change
}, [filters]);

// If user clicks same filter twice, fetches again
```

**Impact**: Wasted bandwidth, slower UX

---

## MOBILE UX ISSUES - DETAILED BREAKDOWN

### Button Size Issue
```jsx
<button
  onClick={() => ...}
  className="p-2 hover:bg-gray-100 rounded"
  // p-2 = 8px padding
  // With icon size ~16px, total: 16 + 8*2 = 32px (not 44px!)
>
  🗑️ {/* ~16px icon size */}
</button>
```

**Measurement**:
- Padding: 8px (p-2)
- Icon: ~16px
- Total: 32px × 32px
- **Target**: 44px × 44px minimum (WCAG 2.5.5)

**Fix**: Change `p-2` to `p-3` or `p-4` = 12px or 16px padding

---

### Spacing on Mobile FilterBar
```jsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  // gap-4 = 16px gap
  // On mobile: still 4 selects stacked with just 16px gap
  // Could feel crowded
</div>
```

---

## KEYBOARD NAVIGATION ANALYSIS

```
Current State:
├─ Tab: Works (outline visible)
├─ Enter/Space: Works on buttons
├─ Arrow Keys: Not implemented for dropdowns
└─ Escape: Not implemented for any modals/confirmations

Missing Implementations:
├─ No keyboard shortcut hints
├─ No dialog focus trap
├─ Delete confirm: Uses browser confirm() (ok)
└─ Notes editor: Can tab out without saving (might lose work)
```

---

## SUMMARY OF ARCHITECTURE PATTERNS

### Well Implemented:
- API layer separation (routes are clean)
- Component composition (nested correctly)
- Type safety (TypeScript interfaces)
- Error handling basics (try-catch)

### Needs Improvement:
- Error handling (not granular enough)
- Loading states (too simple, no skeletons)
- Accessibility (missing ARIA)
- Performance (N+1 queries, no caching)
- Mobile UX (button sizes, spacing)

