export interface RundownItem {
  id: string;
  stepNumber: number;
  title: string;
  startTime: string;
  durationMinutes: number;
  description: string;
  assigneeUserId?: string | null;
  assigneeInitials: string;
  assigneeName: string;
}

export interface Rundown {
  id: string;
  title: string;
  eventDate: string;
  updatedLabel: string;
  itemCount: number;
  accentColor?: string;
  items?: RundownItem[];
}