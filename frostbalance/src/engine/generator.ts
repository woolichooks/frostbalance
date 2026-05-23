import { monthEndLabel, monthStartLabel, round2 } from './format';
import type {
  Account,
  Discrepancy,
  FixOption,
  Puzzle,
  Scenario,
  Transaction,
} from './types';

type ScenarioTemplate = {
  prepaidAccount: Account;
  expenseAccount: Account;
  vendors: string[];
  itemNoun: string;
  annualAmounts: number[];
};

const TEMPLATES: ScenarioTemplate[] = [
  {
    prepaidAccount: 'Prepaid Insurance',
    expenseAccount: 'Insurance Expense',
    vendors: ['Northwind Mutual', 'Glacier Casualty', 'Polaris Indemnity'],
    itemNoun: 'insurance',
    annualAmounts: [1200, 2400, 3600, 4800, 6000],
  },
  {
    prepaidAccount: 'Prepaid Rent',
    expenseAccount: 'Rent Expense',
    vendors: ['Tundra Realty', 'Permafrost Properties', 'Iceshelf Holdings'],
    itemNoun: 'rent',
    annualAmounts: [2400, 3600, 6000, 7200, 12000],
  },
  {
    prepaidAccount: 'Prepaid Software',
    expenseAccount: 'Software Expense',
    vendors: ['LedgerLight', 'QuickFrost SaaS', 'Aurora Tools'],
    itemNoun: 'SaaS license',
    annualAmounts: [1200, 2400, 3600, 4800],
  },
  {
    prepaidAccount: 'Prepaid Maintenance',
    expenseAccount: 'Maintenance Expense',
    vendors: ['Boreal HVAC', 'Snowdrift Maintenance Co.'],
    itemNoun: 'maintenance contract',
    annualAmounts: [1200, 2400, 3600],
  },
];

const DISCREPANCIES: Discrepancy[] = [0.01, 0.02, 0.11, 0.2, 1.5];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const uid = (() => {
  let n = 0;
  return () => `t${++n}`;
})();

const buildFixes = (
  errorTxnId: string,
  correctAmount: number,
  observedAmount: number,
  expenseAccount: Account,
): { fixes: FixOption[]; correctFixId: string } => {
  const correctId = `fix-${errorTxnId}-correct`;
  const correctLabel = `Correct the amount on the flagged row to ${currency(correctAmount)}`;

  const decoyAdjustAmount = round2(observedAmount - correctAmount + (pick([0.01, -0.01, 0.1, -0.1]) as number));
  const decoy1: FixOption = {
    id: `fix-${errorTxnId}-adj`,
    label: `Post an adjusting entry for ${signed(decoyAdjustAmount)} against ${expenseAccount}`,
  };
  const decoy2: FixOption = {
    id: `fix-${errorTxnId}-reverse`,
    label: `Reverse the flagged row in full`,
  };
  const decoy3: FixOption = {
    id: `fix-${errorTxnId}-noop`,
    label: `Leave as-is — rounding is immaterial`,
  };

  const correctFix: FixOption = { id: correctId, label: correctLabel };
  const fixes = shuffle([correctFix, decoy1, decoy2, decoy3]);
  return { fixes, correctFixId: correctId };
};

const shuffle = <T,>(arr: T[]): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const currency = (n: number): string =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const signed = (n: number): string =>
  (n >= 0 ? '+' : '−') + currency(Math.abs(n));

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export const generatePuzzle = (): Puzzle => {
  const template = pick(TEMPLATES);
  const vendor = pick(template.vendors);
  const annual = pick(template.annualAmounts);
  const startMonth = Math.floor(Math.random() * 4); // Jan-Apr
  const monthsElapsed = 4 + Math.floor(Math.random() * 6); // 4-9 months elapsed
  const monthly = round2(annual / 12);

  const scenario: Scenario = {
    prepaidAccount: template.prepaidAccount,
    expenseAccount: template.expenseAccount,
    vendor,
    itemNoun: template.itemNoun,
    annualAmount: annual,
    startMonth,
    monthsElapsed,
  };

  const openingEntry: Transaction = {
    id: uid(),
    date: monthStartLabel(startMonth),
    description: `Prepaid 12-mo ${template.itemNoun} — ${vendor}`,
    account: template.prepaidAccount,
    contraAccount: 'Cash',
    amount: annual,
  };

  const amortizationEntries: Transaction[] = [];
  for (let i = 0; i < monthsElapsed; i++) {
    amortizationEntries.push({
      id: uid(),
      date: monthEndLabel(startMonth + i),
      description: `Amortize ${capitalize(template.itemNoun)} — month ${i + 1} of 12`,
      account: template.expenseAccount,
      contraAccount: template.prepaidAccount,
      amount: monthly,
    });
  }

  // Inject error
  const discrepancy = pick(DISCREPANCIES);
  const direction = Math.random() < 0.5 ? 1 : -1;
  const errorIdx = Math.floor(Math.random() * amortizationEntries.length);
  const correctAmount = amortizationEntries[errorIdx].amount;
  // If direction = +1, observed amortization is too high → less prepaid remaining → schedule < TB by `discrepancy`
  // If direction = -1, observed amortization is too low → more prepaid remaining → schedule > TB by `discrepancy`
  const observedAmount = round2(correctAmount + direction * discrepancy);
  amortizationEntries[errorIdx] = {
    ...amortizationEntries[errorIdx],
    amount: observedAmount,
  };

  const totalAmortized = amortizationEntries.reduce((s, t) => s + t.amount, 0);
  const scheduleBalance = round2(annual - totalAmortized);
  const trialBalance = round2(annual - monthly * monthsElapsed);
  const signedDiscrepancy = round2(scheduleBalance - trialBalance);

  const { fixes, correctFixId } = buildFixes(
    amortizationEntries[errorIdx].id,
    correctAmount,
    observedAmount,
    template.expenseAccount,
  );

  return {
    id: `puzzle-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    scenario,
    openingEntry,
    amortizationEntries,
    trialBalance,
    scheduleBalance,
    discrepancy: signedDiscrepancy,
    errorTransactionId: amortizationEntries[errorIdx].id,
    correctAmount,
    fixes,
    correctFixId,
  };
};
