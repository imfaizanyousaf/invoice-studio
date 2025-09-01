// hooks/use-activity-log-storage.ts
import { useCallback } from 'react';
import type { ActivityLog } from '@/types/activity';
import {
  saveActivityLogToLocalStorage,
  loadActivityLogFromLocalStorage,
  clearActivityLogFromLocalStorage,
  getActivityLogStorageInfo,
  isActivityLogStorageAvailable,
  mergeActivityLogs,
  renameActivityLogEntry,   // 👈 import the new function
} from '@/lib/activity-log-storage';

interface UseActivityLogStorageReturn {
  loadStoredActivityLog: () => ActivityLog;
  saveActivityLog: (activityLog: ActivityLog) => void;
  clearStoredActivityLog: () => void;
  getStorageInfo: () => ReturnType<typeof getActivityLogStorageInfo>;
  isStorageAvailable: boolean;
  mergeActivityLogs: (log1: ActivityLog, log2: ActivityLog) => ActivityLog;
  renameActivityLogEntry: (id: string, newLabel: string) => void; // 👈 add to interface
}

export const useActivityLogStorage = (): UseActivityLogStorageReturn => {
  const isStorageAvailable = isActivityLogStorageAvailable();

  const loadStoredActivityLog = useCallback((): ActivityLog => {
    if (!isStorageAvailable) {
      console.warn('localStorage is not available for activity log');
      return [];
    }
    return loadActivityLogFromLocalStorage();
  }, [isStorageAvailable]);

  const saveActivityLog = useCallback((activityLog: ActivityLog) => {
    if (!isStorageAvailable) {
      console.warn('localStorage is not available, cannot save activity log');
      return;
    }
    saveActivityLogToLocalStorage(activityLog);
  }, [isStorageAvailable]);

  const clearStoredActivityLog = useCallback(() => {
    if (!isStorageAvailable) {
      console.warn('localStorage is not available');
      return;
    }
    clearActivityLogFromLocalStorage();
  }, [isStorageAvailable]);

  const renameEntry = useCallback((id: string, newLabel: string) => {
    if (!isStorageAvailable) {
      console.warn('localStorage is not available, cannot rename activity log');
      return;
    }
    renameActivityLogEntry(id, newLabel);
  }, [isStorageAvailable]);

  return {
    loadStoredActivityLog,
    saveActivityLog,
    clearStoredActivityLog,
    getStorageInfo: getActivityLogStorageInfo,
    isStorageAvailable,
    mergeActivityLogs,
    renameActivityLogEntry: renameEntry,
  };
};
