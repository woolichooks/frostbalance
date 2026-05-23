export type Account =
  | 'Prepaid Insurance'
  | 'Insurance Expense'
  | 'Prepaid Rent'
  | 'Rent Expense'
  | 'Prepaid Software'
  | 'Software Expense'
  | 'Prepaid Maintenance'
  | 'Maintenance Expense'
  | 'Cash';

export type Transaction = {
  id: string;
  date: string;
  description: string;
  account: Account;
  contraAccount: Account;
  amount: number;
};

export type Discrepancy = 0.01 | 0.02 | 0.11 | 0.2 | 1.5;

export type FixOption = {
  id: string;
  label: string;
};

export type Scenario = {
  prepaidAccount: Account;
  expenseAccount: Account;
  vendor: string;
  itemNoun: string;
  annualAmount: number;
  startMonth: number;
  monthsElapsed: number;
};

export type Puzzle = {
  id: string;
  scenario: Scenario;
  openingEntry: Transaction;
  amortizationEntries: Transaction[];
  trialBalance: number;
  scheduleBalance: number;
  discrepancy: number;
  errorTransactionId: string;
  correctAmount: number;
  fixes: FixOption[];
  correctFixId: string;
};
