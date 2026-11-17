export type NoteAudience =
  | 'All'
  | 'Private'
  | 'Division'
  | 'Organization'
  | 'My Division'
  | 'Personal'
  | 'Executive'
  | 'Coordinators'
  | 'Members';

export interface NoteBadge {
  label: string;
  type: 'executive' | 'coordinators' | 'members' | 'private' | 'division';
  bgColor: string;
  textColor: string;
}

export interface NoteItem {
  id: string;
  authorId: string;
  title: string;
  content: string;
  dateLabel: string;
  badges: NoteBadge[];
  audienceCategory: NoteAudience[];
  divisionIds: string[];
  roleAudiences: string[];
  shareWithAllMembers: boolean;
  scopeLabel: 'Organization' | 'Division' | 'Personal';
}
