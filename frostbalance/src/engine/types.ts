export type Account = string;

export type Transaction = {
  id: string;
  date: string;
  description: string;
  account: Account;
  contraAccount: Account;
  amount: number;
  decoy?: boolean;
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
  monthsTotal: number;
};

export type PuzzleError = {
  txnId: string;
  correctAmount: number;
  fixes: FixOption[];
  correctFixId: string;
};

/**
 * Kinds of puzzle the game can present. Add a string here, then add a
 * matching variant to the Puzzle union below + a view in
 * src/components/puzzles/. Locations declare which kinds they offer
 * via Location.puzzleKinds.
 */
export type PuzzleKind = 'prepaid';

type PuzzleCommon = {
  id: string;
  tier: 1 | 2 | 3 | 4 | 5;
  timeLimitMs: number;
  hintsAllowed: number;
  locationName: string;
  locationBlurb: string;
};

export type PrepaidPuzzle = PuzzleCommon & {
  kind: 'prepaid';
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
  /** Remaining errors after the current one (boss puzzles only). */
  pendingErrors: PuzzleError[];
  /** Total errors at puzzle start (for "Error 1 of 3" UI). */
  totalErrors: number;
  /** Index of the currently-active error (0-based). */
  currentErrorIndex: number;
};

/**
 * Discriminated union of every puzzle kind. Add a `| FooPuzzle` here
 * when a new kind ships and TypeScript will surface every site that
 * needs to handle the new variant.
 */
export type Puzzle = PrepaidPuzzle;
