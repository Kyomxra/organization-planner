export interface RundownItem {
  id: string;
  stepNumber: number;
  title: string;
  startTime: string;
  durationMinutes: number;
  description: string;
  assigneeInitials: string;
  assigneeName: string;
}

export interface Rundown {
  id: string;
  title: string;
  eventDate: string; // display string e.g. "Sat, 24 Oct 2026"
  updatedLabel: string; // e.g. "12 min ago"
  itemCount: number;
  accentColor?: string; // hex for the icon accent
}
