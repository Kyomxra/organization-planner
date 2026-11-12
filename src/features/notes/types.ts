export type NoteAudience = 'All' | 'Private' | 'Division' | 'Executive' | 'Coordinators' | 'Members';

export interface NoteBadge {
  label: string;
  type: 'executive' | 'coordinators' | 'members' | 'private' | 'division';
  bgColor: string;
  textColor: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  dateLabel: string;
  badges: NoteBadge[];
  audienceCategory: NoteAudience[];
}
