import { monthEndLabel, monthStartLabel, round2 } from './format';
import { TIER_CONFIGS, type Tier } from './survival';
import { pickLocation, type Location, type ScenarioTemplate } from './locations';
import type {
  Account,
  Discrepancy,
  FixOption,
  PrepaidPuzzle,
  Puzzle,
  PuzzleError,
  Scenario,
  Transaction,
} from './types';

const DECOY_DESCRIPTIONS = [
  'Reclassification per audit memo',
  'Mid-period true-up',
  'Adjusting entry — vendor invoice correction',
  'Catch-up entry from prior month',
  'Reversed & re-posted (manual JE)',
  'Quarter-end adjustment',
  'Reallocated from suspense account',
  'CFO override — see workpaper',
  'Per controller, posted to clear suspense',
  'Allocation from intercompany clearing',
];

const DISCREPANCIES: Discrepancy[] = [0.01, 0.02, 0.11, 0.2, 1.5];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randBetween = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1));

const uid = (() => {
  let n = 0;
  return () => `t${++n}`;
})();

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

const buildFixes = (
  errorTxnId: string,
  correctAmount: number,
  observedAmount: number,
  expenseAccount: Account,
): { fixes: FixOption[]; correctFixId: string } => {
  const correctId = `fix-${errorTxnId}-correct`;
  const correctLabel = `Correct the amount on the flagged row to ${currency(correctAmount)}`;
  const decoyAdjustAmount = round2(
    observedAmount - correctAmount + (pick([0.01, -0.01, 0.1, -0.1]) as number),
  );
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

const buildScenario = (template: ScenarioTemplate, cfg: ReturnType<typeof getCfg>): { scenario: Scenario; openingEntry: Transaction; amortizationEntries: Transaction[]; monthly: number; annual: number } => {
  const vendor = pick(template.vendors);
  const annualPool =
    cfg.monthsTotal === 24
      ? template.annualAmounts.map((a) => a * 2)
      : template.annualAmounts;
  const annual = pick(annualPool);
  const startMonth = randBetween(0, 3);
  const maxElapsed = Math.min(cfg.maxEntries, cfg.monthsTotal - 1);
  const minElapsed = Math.min(cfg.minEntries, maxElapsed);
  const monthsElapsed = randBetween(minElapsed, maxElapsed);
  const monthly = round2(annual / cfg.monthsTotal);

  const scenario: Scenario = {
    prepaidAccount: template.prepaidAccount,
    expenseAccount: template.expenseAccount,
    vendor,
    itemNoun: template.itemNoun,
    annualAmount: annual,
    startMonth,
    monthsElapsed,
    monthsTotal: cfg.monthsTotal,
  };

  const openingEntry: Transaction = {
    id: uid(),
    date: monthStartLabel(startMonth),
    description: `Prepaid ${cfg.monthsTotal}-mo ${template.itemNoun} — ${vendor}`,
    account: template.prepaidAccount,
    contraAccount: 'Cash',
    amount: annual,
  };

  const amortizationEntries: Transaction[] = [];
  for (let i = 0; i < monthsElapsed; i++) {
    amortizationEntries.push({
      id: uid(),
      date: monthEndLabel(startMonth + i),
      description: `Amortize ${capitalize(template.itemNoun)} — month ${i + 1} of ${cfg.monthsTotal}`,
      account: template.expenseAccount,
      contraAccount: template.prepaidAccount,
      amount: monthly,
    });
  }

  return { scenario, openingEntry, amortizationEntries, monthly, annual };
};

const getCfg = (tier: Tier) => TIER_CONFIGS[tier];

const injectError = (
  amortizationEntries: Transaction[],
  excludeIds: Set<string>,
  expenseAccount: Account,
  forcedDirection?: 1 | -1,
): { error: PuzzleError; index: number; observedAmount: number; discrepancy: number; direction: 1 | -1 } => {
  const candidates = amortizationEntries
    .map((_, idx) => idx)
    .filter((idx) => !excludeIds.has(amortizationEntries[idx].id));
  const errorIdx = pick(candidates);
  const discrepancy = pick(DISCREPANCIES);
  const direction: 1 | -1 = forcedDirection ?? (Math.random() < 0.5 ? 1 : -1);
  const correctAmount = amortizationEntries[errorIdx].amount;
  const observedAmount = round2(correctAmount + direction * discrepancy);
  amortizationEntries[errorIdx] = {
    ...amortizationEntries[errorIdx],
    amount: observedAmount,
  };
  const txnId = amortizationEntries[errorIdx].id;
  const { fixes, correctFixId } = buildFixes(txnId, correctAmount, observedAmount, expenseAccount);
  return {
    error: { txnId, correctAmount, fixes, correctFixId },
    index: errorIdx,
    observedAmount,
    discrepancy,
    direction,
  };
};

const applyDecoys = (
  amortizationEntries: Transaction[],
  excludeIds: Set<string>,
  decoyCount: number,
): void => {
  const candidates = amortizationEntries
    .map((_, idx) => idx)
    .filter((idx) => !excludeIds.has(amortizationEntries[idx].id));
  const targets = shuffle(candidates).slice(0, Math.min(decoyCount, candidates.length));
  const pool = shuffle(DECOY_DESCRIPTIONS);
  targets.forEach((idx, i) => {
    amortizationEntries[idx] = {
      ...amortizationEntries[idx],
      description: pool[i % pool.length],
      decoy: true,
    };
  });
};

/**
 * Public puzzle factory. Picks a location for the day, then picks one
 * of that location's allowed puzzle kinds, then routes to the matching
 * per-kind generator. Add a new branch here when a new PuzzleKind ships.
 */
export const generatePuzzle = (tier: Tier = 1, day = 1): Puzzle => {
  const location = pickLocation(day);
  const kind = pick(location.puzzleKinds);
  switch (kind) {
    case 'prepaid':
      return generatePrepaidPuzzle(tier, location);
    default: {
      // Exhaustiveness check: when a new PuzzleKind is added without a
      // case here, TS will complain.
      const _exhaustive: never = kind;
      throw new Error(`Unknown puzzle kind: ${_exhaustive}`);
    }
  }
};

const generatePrepaidPuzzle = (tier: Tier, location: Location): PrepaidPuzzle => {
  const cfg = getCfg(tier);
  const template = pick(location.templates);
  const { scenario, openingEntry, amortizationEntries, monthly, annual } = buildScenario(
    template,
    cfg,
  );

  // How many errors? Boss tier = 2; everyone else = 1.
  // For the boss, force both errors in the same direction so the discrepancy
  // can't cancel to zero — players need a real magnitude hint.
  const errorCount = tier === 5 ? 2 : 1;
  const bossDirection: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
  const injectedErrors: PuzzleError[] = [];
  const errorIds = new Set<string>();
  for (let i = 0; i < errorCount; i++) {
    const result = injectError(
      amortizationEntries,
      errorIds,
      template.expenseAccount,
      tier === 5 ? bossDirection : undefined,
    );
    injectedErrors.push(result.error);
    errorIds.add(result.error.txnId);
  }

  // Decoys: never overlap with error rows.
  applyDecoys(amortizationEntries, errorIds, cfg.decoys);

  const totalAmortized = amortizationEntries.reduce((s, t) => s + t.amount, 0);
  const scheduleBalance = round2(annual - totalAmortized);
  const trialBalance = round2(annual - monthly * scenario.monthsElapsed);
  const signedDiscrepancy = round2(scheduleBalance - trialBalance);

  const [first, ...rest] = injectedErrors;

  return {
    kind: 'prepaid',
    id: `puzzle-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tier,
    timeLimitMs: cfg.timeLimitMs,
    hintsAllowed: cfg.hintsAllowed,
    scenario,
    openingEntry,
    amortizationEntries,
    trialBalance,
    scheduleBalance,
    discrepancy: signedDiscrepancy,
    errorTransactionId: first.txnId,
    correctAmount: first.correctAmount,
    fixes: first.fixes,
    correctFixId: first.correctFixId,
    pendingErrors: rest,
    totalErrors: injectedErrors.length,
    currentErrorIndex: 0,
    locationName: location.name,
    locationBlurb: location.blurb,
  };
};

/**
 * Boss-puzzle advance: apply the just-fixed error and surface the next
 * one. Prepaid-only for now; future kinds with multi-error boss
 * variants will add their own advance functions.
 */
export const advancePrepaidPuzzle = (puzzle: PrepaidPuzzle): PrepaidPuzzle => {
  if (puzzle.pendingErrors.length === 0) return puzzle;
  const fixedEntries = puzzle.amortizationEntries.map((t) =>
    t.id === puzzle.errorTransactionId ? { ...t, amount: puzzle.correctAmount } : t,
  );
  const nextError = puzzle.pendingErrors[0];
  const remaining = puzzle.pendingErrors.slice(1);
  const totalAmortized = fixedEntries.reduce((s, t) => s + t.amount, 0);
  const scheduleBalance = round2(puzzle.scenario.annualAmount - totalAmortized);
  const signedDiscrepancy = round2(scheduleBalance - puzzle.trialBalance);
  return {
    ...puzzle,
    amortizationEntries: fixedEntries,
    scheduleBalance,
    discrepancy: signedDiscrepancy,
    errorTransactionId: nextError.txnId,
    correctAmount: nextError.correctAmount,
    fixes: nextError.fixes,
    correctFixId: nextError.correctFixId,
    pendingErrors: remaining,
    currentErrorIndex: puzzle.currentErrorIndex + 1,
  };
};
