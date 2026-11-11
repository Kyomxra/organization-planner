export interface IncomeItem {
  id: string;
  no: number;
  date: string;
  from: string;
  total: string;
  numericTotal: number;
}

export interface ExpenseItem {
  id: string;
  no: number;
  date: string;
  typeOfCost: string;
  total: string;
  numericTotal: number;
  hasReceipt: boolean;
  status: 'PENDING' | 'VERIFIED';
}
