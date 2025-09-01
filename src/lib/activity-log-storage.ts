// lib/activity-log-storage.ts
import type { ActivityLog, ActivityEntry, ActivityDateGroup } from '@/types/activity';

const ACTIVITY_LOG_STORAGE_KEY = 'invoice_insights_activity_log';
const MAX_ENTRIES_PER_DATE = 20; // Limit entries per date to manage storage
const MAX_DATES = 30; // Keep activity for last 30 days

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

export interface StoredActivityEntry {
  id: string;
  label: string;
  timestamp: number;
  excelFileDataUri?: string;
}

export interface StoredActivityDateGroup {
  date: string;
  entries: StoredActivityEntry[];
}

export type StoredActivityLog = StoredActivityDateGroup[];

/**
 * Save activity log to localStorage
 */
export const saveActivityLogToLocalStorage = (activityLog: ActivityLog): void => {
  if (!isBrowser) return;

  try {
    const storableLog: StoredActivityLog = activityLog.map(group => ({
      date: group.date,
      entries: group.entries.slice(0, MAX_ENTRIES_PER_DATE),
    }));

    localStorage.setItem(ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(storableLog));
    console.log(`Saved activity log to localStorage: ${storableLog.length} date groups`);

    
    window.dispatchEvent(
      new CustomEvent("activityLogUpdated", { detail: { activityLog: storableLog } })
    );
  } catch (error) {
    console.error("Failed to save activity log to localStorage:", error);

    try {
      cleanupOldActivityLog(activityLog, 7);
      const minimalLog: StoredActivityLog = activityLog.slice(0, 7).map(group => ({
        date: group.date,
        entries: group.entries.slice(0, 5),
      }));
      localStorage.setItem(ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(minimalLog));
      console.log("Saved minimal activity log after cleanup");

      window.dispatchEvent(
        new CustomEvent("activityLogUpdated", { detail: { activityLog: minimalLog } })
      );
    } catch (retryError) {
      console.error("Failed to save even minimal activity log:", retryError);
    }
  }
};


/**
 * Load activity log from localStorage
 */
export const loadActivityLogFromLocalStorage = (): ActivityLog => {
  if (!isBrowser) return [];

  try {
    const stored = localStorage.getItem(ACTIVITY_LOG_STORAGE_KEY);
    if (!stored) return [];

    const storedLog: StoredActivityLog = JSON.parse(stored);
    
    // Convert back to ActivityLog format and validate
    const activityLog: ActivityLog = storedLog
      .filter(group => group && group.date && Array.isArray(group.entries))
      .map((group): ActivityDateGroup => ({
        date: group.date,
        entries: group.entries
          .filter(entry => entry && entry.id && entry.label && typeof entry.timestamp === 'number')
          .map((entry): ActivityEntry => ({
            id: entry.id,
            label: entry.label,
            timestamp: entry.timestamp,
            excelFileDataUri: entry.excelFileDataUri
          }))
      }))
      .filter(group => group.entries.length > 0); // Remove empty groups

    console.log(`Loaded activity log from localStorage: ${activityLog.length} date groups`);
    return activityLog;
  } catch (error) {
    console.error('Failed to load activity log from localStorage:', error);
    
    // Try to recover by clearing corrupted data
    try {
      localStorage.removeItem(ACTIVITY_LOG_STORAGE_KEY);
      console.log('Removed corrupted activity log data');
    } catch (cleanupError) {
      console.error('Failed to cleanup corrupted activity log:', cleanupError);
    }
    
    return [];
  }
};

/**
 * Clear activity log from localStorage
 */
export const clearActivityLogFromLocalStorage = (): void => {
  if (!isBrowser) return;

  try {
    localStorage.removeItem(ACTIVITY_LOG_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent("activityLogUpdated", { detail: { activityLog: null } })
    )
    console.log('Cleared activity log from localStorage');
  } catch (error) {
    console.error('Failed to clear activity log from localStorage:', error);
  }
};

/**
 * Clean up old activity log entries
 */
const cleanupOldActivityLog = (activityLog: ActivityLog, maxDays: number = MAX_DATES): ActivityLog => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxDays);
  const cutoffTimestamp = cutoffDate.getTime();

  return activityLog
    .filter(group => {
      const groupDate = new Date(group.date);
      return groupDate.getTime() >= cutoffTimestamp;
    })
    .slice(0, maxDays) // Ensure we don't exceed max dates
    .map(group => ({
      ...group,
      entries: group.entries.slice(0, MAX_ENTRIES_PER_DATE) // Limit entries per group
    }));
};

/**
 * Get activity log storage statistics
 */
export const getActivityLogStorageInfo = (): { 
  dateGroups: number; 
  totalEntries: number; 
  sizeKB: number;
  oldestEntry?: string;
  newestEntry?: string;
} => {
  if (!isBrowser) return { dateGroups: 0, totalEntries: 0, sizeKB: 0 };

  try {
    const stored = localStorage.getItem(ACTIVITY_LOG_STORAGE_KEY);
    if (!stored) return { dateGroups: 0, totalEntries: 0, sizeKB: 0 };

    const storedLog: StoredActivityLog = JSON.parse(stored);
    const sizeKB = new Blob([stored]).size / 1024;
    
    let totalEntries = 0;
    let oldestTimestamp = Number.MAX_SAFE_INTEGER;
    let newestTimestamp = 0;

    storedLog.forEach(group => {
      totalEntries += group.entries.length;
      group.entries.forEach(entry => {
        if (entry.timestamp < oldestTimestamp) oldestTimestamp = entry.timestamp;
        if (entry.timestamp > newestTimestamp) newestTimestamp = entry.timestamp;
      });
    });

    return {
      dateGroups: storedLog.length,
      totalEntries,
      sizeKB: Math.round(sizeKB * 100) / 100,
      oldestEntry: oldestTimestamp !== Number.MAX_SAFE_INTEGER 
        ? new Date(oldestTimestamp).toLocaleDateString() 
        : undefined,
      newestEntry: newestTimestamp > 0 
        ? new Date(newestTimestamp).toLocaleDateString() 
        : undefined,
    };
  } catch (error) {
    console.error('Failed to get activity log storage info:', error);
    return { dateGroups: 0, totalEntries: 0, sizeKB: 0 };
  }
};

/**
 * Check if localStorage is available for activity log
 */
export const isActivityLogStorageAvailable = (): boolean => {
  if (!isBrowser) return false;

  try {
    const test = '__activity_log_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Merge activity logs (useful when combining local and remote data)
 */
export const mergeActivityLogs = (log1: ActivityLog, log2: ActivityLog): ActivityLog => {
  const mergedMap = new Map<string, ActivityDateGroup>();

  // Add all groups from log1
  log1.forEach(group => {
    mergedMap.set(group.date, { ...group });
  });

  // Merge groups from log2
  log2.forEach(group => {
    if (mergedMap.has(group.date)) {
      const existing = mergedMap.get(group.date)!;
      const entryIds = new Set(existing.entries.map(e => e.id));
      
      // Add entries that don't already exist
      const newEntries = group.entries.filter(entry => !entryIds.has(entry.id));
      
      mergedMap.set(group.date, {
        ...existing,
        entries: [...existing.entries, ...newEntries]
          .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp descending
          .slice(0, MAX_ENTRIES_PER_DATE) // Limit entries
      });
    } else {
      mergedMap.set(group.date, { ...group });
    }
  });

  // Convert back to array and sort by date descending
  return Array.from(mergedMap.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_DATES);
};

/**
 * Rename a specific activity log entry by ID
 */
export const renameActivityLogEntry = (id: string, newLabel: string): void => {
  if (!isBrowser) return;

  try {
    const stored = localStorage.getItem(ACTIVITY_LOG_STORAGE_KEY);
    if (!stored) return;

    const storedLog: StoredActivityLog = JSON.parse(stored);

    let updated = false;
    const updatedLog: StoredActivityLog = storedLog.map(group => ({
      ...group,
      entries: group.entries.map(entry => {
        if (entry.id === id) {
          updated = true;
          return { ...entry, label: newLabel };
        }
        return entry;
      }),
    }));

    if (updated) {
      localStorage.setItem(ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(updatedLog));
      console.log(`Renamed activity log entry ${id} → "${newLabel}"`);

      window.dispatchEvent(
        new CustomEvent("activityLogUpdated", { detail: { activityLog: updatedLog } })
      );
    }
  } catch (error) {
    console.error("Failed to rename activity log entry:", error);
  }
};
