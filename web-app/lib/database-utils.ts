import { getDatabase } from './db';
import type { Funnel, Page, FunnelWithPages, ExtensionHistoricalData, ImportResult, SearchFilters } from './types';

// Funnel operations
export function getAllFunnels(filters?: SearchFilters): FunnelWithPages[] {
  const db = getDatabase();

  let query = 'SELECT * FROM funnels WHERE 1=1';
  const params: unknown[] = [];

  if (filters?.search) {
    query += ' AND (name LIKE ? OR domain LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters?.showFavorites) {
    query += ' AND isFavorite = 1';
  }

  // Sorting
  switch (filters?.sortBy) {
    case 'newest':
      query += ' ORDER BY lastSeen DESC';
      break;
    case 'oldest':
      query += ' ORDER BY firstSeen ASC';
      break;
    case 'name':
      query += ' ORDER BY name ASC';
      break;
    case 'pageCount':
      // Will handle after fetching pages
      query += ' ORDER BY lastSeen DESC';
      break;
    default:
      query += ' ORDER BY lastSeen DESC';
  }

  const funnels = db.prepare(query).all(...params) as Funnel[];

  // Fetch pages for each funnel
  const funnelsWithPages = funnels.map(funnel => {
    const pages = getPagesByFunnelId(funnel.funnelId, {
      pageType: filters?.pageType,
      hasSplitTest: filters?.hasSplitTest,
    });
    return {
      ...funnel,
      pages,
    };
  });

  // Sort by page count if requested
  if (filters?.sortBy === 'pageCount') {
    funnelsWithPages.sort((a, b) => b.pages.length - a.pages.length);
  }

  return funnelsWithPages;
}

export function getFunnelById(funnelId: string): FunnelWithPages | null {
  const db = getDatabase();
  const funnel = db.prepare('SELECT * FROM funnels WHERE funnelId = ?').get(funnelId) as Funnel | undefined;

  if (!funnel) return null;

  const pages = getPagesByFunnelId(funnelId);
  return {
    ...funnel,
    pages,
  };
}

export function createOrUpdateFunnel(funnel: Omit<Funnel, 'id'>): number {
  const db = getDatabase();

  const existing = db.prepare('SELECT id FROM funnels WHERE funnelId = ?').get(funnel.funnelId) as { id: number } | undefined;

  if (existing) {
    // Update
    const stmt = db.prepare(`
      UPDATE funnels
      SET name = ?, domain = ?, lastSeen = ?, notes = ?, tags = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE funnelId = ?
    `);
    stmt.run(funnel.name, funnel.domain, funnel.lastSeen, funnel.notes || null, funnel.tags || null, funnel.funnelId);
    return existing.id;
  } else {
    // Insert
    const stmt = db.prepare(`
      INSERT INTO funnels (funnelId, name, domain, firstSeen, lastSeen, isPinned, isFavorite, isOwned, notes, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      funnel.funnelId,
      funnel.name,
      funnel.domain,
      funnel.firstSeen,
      funnel.lastSeen,
      funnel.isPinned ? 1 : 0,
      funnel.isFavorite ? 1 : 0,
      funnel.isOwned ? 1 : 0,
      funnel.notes || null,
      funnel.tags || null
    );
    return result.lastInsertRowid as number;
  }
}

export function updateFunnelFlags(funnelId: string, updates: Partial<Pick<Funnel, 'isPinned' | 'isFavorite' | 'isOwned' | 'notes' | 'tags'>>) {
  const db = getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.isPinned !== undefined) {
    fields.push('isPinned = ?');
    values.push(updates.isPinned ? 1 : 0);
  }
  if (updates.isFavorite !== undefined) {
    fields.push('isFavorite = ?');
    values.push(updates.isFavorite ? 1 : 0);
  }
  if (updates.isOwned !== undefined) {
    fields.push('isOwned = ?');
    values.push(updates.isOwned ? 1 : 0);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes || null);
  }
  if (updates.tags !== undefined) {
    fields.push('tags = ?');
    values.push(updates.tags || null);
  }

  if (fields.length === 0) return;

  fields.push('updatedAt = CURRENT_TIMESTAMP');
  values.push(funnelId);

  const stmt = db.prepare(`UPDATE funnels SET ${fields.join(', ')} WHERE funnelId = ?`);
  stmt.run(...values);
}

export function deleteFunnel(funnelId: string) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM funnels WHERE funnelId = ?');
  stmt.run(funnelId);
}

// Page operations
export function getPagesByFunnelId(funnelId: string, filters?: Pick<SearchFilters, 'pageType' | 'hasSplitTest'>): Page[] {
  const db = getDatabase();

  let query = 'SELECT * FROM pages WHERE funnelId = ?';
  const params: unknown[] = [funnelId];

  if (filters?.pageType) {
    query += ' AND pageType = ?';
    params.push(filters.pageType);
  }

  if (filters?.hasSplitTest) {
    query += ' AND splitEnabled = 1';
  }

  query += ' ORDER BY firstSeen ASC';

  return db.prepare(query).all(...params) as Page[];
}

export function createOrUpdatePage(page: Omit<Page, 'id'>): number {
  const db = getDatabase();

  const existing = db.prepare('SELECT id FROM pages WHERE funnelId = ? AND pageId = ?')
    .get(page.funnelId, page.pageId) as { id: number } | undefined;

  if (existing) {
    // Update
    const stmt = db.prepare(`
      UPDATE pages
      SET title = ?, urlSlug = ?, externalURL = ?, referenceId = ?, pageType = ?,
          splitEnabled = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE funnelId = ? AND pageId = ?
    `);
    stmt.run(
      page.title,
      page.urlSlug,
      page.externalURL || null,
      page.referenceId || null,
      page.pageType || null,
      page.splitEnabled ? 1 : 0,
      page.funnelId,
      page.pageId
    );
    return existing.id;
  } else {
    // Insert
    const stmt = db.prepare(`
      INSERT INTO pages (funnelId, pageId, title, urlSlug, externalURL, referenceId, pageType, splitEnabled, firstSeen, isFavorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      page.funnelId,
      page.pageId,
      page.title,
      page.urlSlug,
      page.externalURL || null,
      page.referenceId || null,
      page.pageType || null,
      page.splitEnabled ? 1 : 0,
      page.firstSeen,
      page.isFavorite ? 1 : 0
    );
    return result.lastInsertRowid as number;
  }
}

export function updatePageFavorite(funnelId: string, pageId: string, isFavorite: boolean) {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE pages SET isFavorite = ?, updatedAt = CURRENT_TIMESTAMP WHERE funnelId = ? AND pageId = ?');
  stmt.run(isFavorite ? 1 : 0, funnelId, pageId);
}

export function deletePage(funnelId: string, pageId: string) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM pages WHERE funnelId = ? AND pageId = ?');
  stmt.run(funnelId, pageId);
}

// Import from extension
export function importExtensionData(data: ExtensionHistoricalData): ImportResult {
  const db = getDatabase();
  const errors: string[] = [];
  let funnelsImported = 0;
  let pagesImported = 0;

  // Metadata fields to skip (these are not funnel data)
  const METADATA_FIELDS = ['funnels', 'favorites', 'exportDate', 'lastExportDate', 'version'];

  // Use transaction for atomicity
  const importTransaction = db.transaction(() => {
    for (const [funnelId, funnelData] of Object.entries(data)) {
      // Skip metadata fields
      if (METADATA_FIELDS.includes(funnelId)) {
        continue;
      }

      // Validate that this is actually funnel data
      if (!funnelData || typeof funnelData !== 'object') {
        errors.push(`Skipping invalid entry: ${funnelId} (not an object)`);
        continue;
      }

      if (!funnelData.name || !funnelData.domain) {
        errors.push(`Skipping invalid funnel: ${funnelId} (missing required fields: name or domain)`);
        continue;
      }

      if (!funnelData.pages || typeof funnelData.pages !== 'object') {
        errors.push(`Skipping funnel without pages: ${funnelId}`);
        continue;
      }

      try {
        // Import funnel
        createOrUpdateFunnel({
          funnelId,
          name: funnelData.name,
          domain: funnelData.domain,
          firstSeen: funnelData.firstSeen,
          lastSeen: funnelData.lastSeen,
        });
        funnelsImported++;

        // Import pages
        for (const [pageId, pageData] of Object.entries(funnelData.pages)) {
          try {
            createOrUpdatePage({
              funnelId,
              pageId,
              title: pageData.title,
              urlSlug: pageData.urlSlug,
              externalURL: pageData.externalURL,
              referenceId: pageData.referenceId,
              pageType: pageData.pageType,
              splitEnabled: pageData.splitEnabled,
              firstSeen: pageData.firstSeen,
            });
            pagesImported++;
          } catch (error) {
            errors.push(`Error importing page ${pageId}: ${error}`);
          }
        }
      } catch (error) {
        errors.push(`Error importing funnel ${funnelId}: ${error}`);
      }
    }
  });

  try {
    importTransaction();
    return {
      success: true,
      funnelsImported,
      pagesImported,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      funnelsImported: 0,
      pagesImported: 0,
      errors: [`Transaction failed: ${error}`],
    };
  }
}

// Export to extension format
export function exportToExtensionFormat(): ExtensionHistoricalData {
  const funnels = getAllFunnels();
  const result: ExtensionHistoricalData = {};

  for (const funnel of funnels) {
    result[funnel.funnelId] = {
      name: funnel.name,
      domain: funnel.domain,
      firstSeen: funnel.firstSeen,
      lastSeen: funnel.lastSeen,
      pages: {},
    };

    for (const page of funnel.pages) {
      result[funnel.funnelId].pages[page.pageId] = {
        title: page.title,
        urlSlug: page.urlSlug,
        externalURL: page.externalURL,
        referenceId: page.referenceId,
        firstSeen: page.firstSeen,
        splitEnabled: page.splitEnabled,
        pageType: page.pageType,
      };
    }
  }

  return result;
}

// Get statistics
export function getStatistics() {
  const db = getDatabase();

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM funnels) as totalFunnels,
      (SELECT COUNT(*) FROM pages) as totalPages,
      (SELECT COUNT(*) FROM funnels WHERE isFavorite = 1) as favoriteFunnels,
      (SELECT COUNT(*) FROM pages WHERE isFavorite = 1) as favoritePages,
      (SELECT COUNT(*) FROM pages WHERE splitEnabled = 1) as splitTestPages,
      (SELECT COUNT(DISTINCT domain) FROM funnels) as uniqueDomains
  `).get();

  return stats;
}

// Clean up invalid funnel entries (metadata that was incorrectly imported)
export function cleanupInvalidFunnels(): { deleted: number; funnelIds: string[] } {
  const db = getDatabase();
  const METADATA_FIELDS = ['funnels', 'favorites', 'exportDate', 'lastExportDate', 'version'];

  // Find invalid entries
  const invalidFunnels = db.prepare(`
    SELECT funnelId FROM funnels
    WHERE name IS NULL OR domain IS NULL
  `).all() as { funnelId: string }[];

  const funnelIdsToDelete = invalidFunnels.map(f => f.funnelId)
    .concat(METADATA_FIELDS);

  // Delete invalid entries
  const deleteStmt = db.prepare('DELETE FROM funnels WHERE funnelId = ?');
  const deleteTransaction = db.transaction(() => {
    for (const funnelId of funnelIdsToDelete) {
      deleteStmt.run(funnelId);
    }
  });

  deleteTransaction();

  return {
    deleted: funnelIdsToDelete.length,
    funnelIds: funnelIdsToDelete
  };
}
