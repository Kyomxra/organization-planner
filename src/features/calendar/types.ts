export interface CalendarEvent {
  id: string;
  title: string;
  category: string; // e.g. "ORGANIZATION MEETING"
  orgName: string;
  divisionName: string;
  dayOfMonth: number; // 5
  month: number; // 9 for Oct (0-indexed or 10)
  year: number; // 2026
  dateLabel: string; // "Monday, 5 October 2026"
  startTime: string; // "21.00"
  endTime: string; // "22.00"
  duration: string; // "1 hour"
  description: string;
  linkedRundown?: {
    title: string;
    itemsCount: number;
    timeRange: string;
  };
  notes?: string;
}
