// TypeScript types matching the Chrome extension data structure

export interface Page {
  id?: number;
  funnelId: string;
  pageId: string;
  title: string;
  urlSlug: string;
  externalURL?: string;
  referenceId?: string;
  pageType?: string;
  splitEnabled?: boolean;
  firstSeen: string;
  isFavorite?: boolean;
}

export interface Funnel {
  id?: number;
  funnelId: string;
  name: string;
  domain: string;
  firstSeen: string;
  lastSeen: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  isOwned?: boolean;
  notes?: string;
  tags?: string;
}

export interface FunnelWithPages extends Funnel {
  pages: Page[];
}

// Extension's historical data format for import/export
export interface ExtensionHistoricalData {
  [funnelId: string]: {
    name: string;
    domain: string;
    firstSeen: string;
    lastSeen: string;
    pages: {
      [pageId: string]: {
        title: string;
        urlSlug: string;
        externalURL?: string;
        referenceId?: string;
        firstSeen: string;
        splitEnabled?: boolean;
        pageType?: string;
      };
    };
  };
}

export interface ImportResult {
  success: boolean;
  funnelsImported: number;
  pagesImported: number;
  errors?: string[];
}

export interface SearchFilters {
  search?: string;
  pageType?: string;
  hasSplitTest?: boolean;
  showFavorites?: boolean;
  sortBy?: 'newest' | 'oldest' | 'name' | 'pageCount';
}
