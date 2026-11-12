export interface Division {
  id: string;
  name: string;
  color: string;
  backgroundColor: string;
}

export interface DivisionMember {
  id: string;
  name: string;
  email: string;
  role: string;
  divisionId: string | null;
}
