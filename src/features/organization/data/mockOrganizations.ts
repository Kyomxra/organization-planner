import { OrganizationItem } from '../types';

export const initialOrganizations: OrganizationItem[] = [
  {
    id: 'org-1',
    name: 'Organization A',
    roleTitle: 'Executive Committee',
    role: 'BPH',
    memberCount: 48,
    status: 'Active',
    letter: 'A',
    avatarBg: '#EEECFF',
    avatarTextColor: '#5145E8',
    badgeBg: '#F3F2FF',
    badgeTextColor: '#5145E8',
  },
  {
    id: 'org-2',
    name: 'Organization B',
    roleTitle: 'Division B - Anggota',
    role: 'Participant',
    memberCount: 32,
    status: 'Active',
    letter: 'B',
    avatarBg: '#FFF2E8',
    avatarTextColor: '#E87A35',
    badgeBg: '#FFF6EE',
    badgeTextColor: '#E87A35',
  },
];
