import { Division, DivisionMember } from '../types/division';

export const mockDivisions: Division[] = [
  { id: 'division-a', name: 'Division A', color: '#5145E8', backgroundColor: '#EEECFF' },
  { id: 'division-b', name: 'Division B', color: '#2B88E8', backgroundColor: '#E6F4FF' },
  { id: 'division-c', name: 'Division C', color: '#E87A35', backgroundColor: '#FFF1E6' },
];

export const initialDivisionMembers: DivisionMember[] = [
  { id: 'member-1', name: 'Alya Putri', email: 'alya.putri@organization.com', role: 'Member', divisionId: 'division-a' },
  { id: 'member-2', name: 'Bima Pratama', email: 'bima.pratama@organization.com', role: 'Member', divisionId: null },
  { id: 'member-3', name: 'Citra Lestari', email: 'citra.lestari@organization.com', role: 'Coordinator', divisionId: 'division-b' },
  { id: 'member-4', name: 'Daffa Ramadhan', email: 'daffa.ramadhan@organization.com', role: 'Member', divisionId: null },
  { id: 'member-5', name: 'Eka Safitri', email: 'eka.safitri@organization.com', role: 'Member', divisionId: 'division-a' },
  { id: 'member-6', name: 'Farhan Akbar', email: 'farhan.akbar@organization.com', role: 'Member', divisionId: null },
  { id: 'member-7', name: 'Gita Maharani', email: 'gita.maharani@organization.com', role: 'Member', divisionId: 'division-c' },
  { id: 'member-8', name: 'Hana Wijaya', email: 'hana.wijaya@organization.com', role: 'Member', divisionId: null },
  { id: 'member-9', name: 'Iqbal Maulana', email: 'iqbal.maulana@organization.com', role: 'Member', divisionId: 'division-c' },
  { id: 'member-10', name: 'Jihan Amelia', email: 'jihan.amelia@organization.com', role: 'Member', divisionId: null },
];
