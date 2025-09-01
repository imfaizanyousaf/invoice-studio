// src/types/activity.ts
export interface ActivityEntry {
  id: string;
  label: string; // e.g., "View List"
  timestamp: number; // Unix timestamp for when the activity occurred
  excelFileDataUri?: string; // Optional: Data URI of the generated Excel file for this activity
}

export interface ActivityDateGroup {
  date: string; // Date string in 'YYYY-MM-DD' format
  entries: ActivityEntry[];
}

export type ActivityLog = ActivityDateGroup[];
