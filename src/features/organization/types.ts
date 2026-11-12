export type OrgStatus = 'Active' | 'Inactive';

export interface OrganizationItem {
  id: string;
  name: string;
  roleTitle: string; // e.g. "Executive Committee"
  role: 'Executive' | 'Coordinator' | 'Participant';
  memberCount: number;
  status: OrgStatus;
  letter: string;
  avatarBg: string;
  avatarTextColor: string;
  badgeBg: string;
  badgeTextColor: string;
  badgeBorderColor?: string;
}

export interface CreateOrgFormData {
  name: string;
  description: string;
  divisions: string[];
  logoUri?: string | null;
}
