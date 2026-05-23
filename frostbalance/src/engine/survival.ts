export type Resource = 'food' | 'fuel' | 'shelter' | 'medicine';

export const RESOURCES: Resource[] = ['food', 'fuel', 'shelter', 'medicine'];

export const RESOURCE_LABEL: Record<Resource, string> = {
  food: 'Food',
  fuel: 'Fuel',
  shelter: 'Shelter',
  medicine: 'Medicine',
};

export const RESOURCE_BLURB: Record<Resource, string> = {
  food: 'Tinned beans, jerky, anything edible.',
  fuel: 'Logs, coal, lighter fluid — warmth.',
  shelter: 'Tarps, plywood, duct tape — windbreak.',
  medicine: 'Aspirin, bandages, antibiotics.',
};

export const INITIAL_RESOURCES: Record<Resource, number> = {
  food: 5,
  fuel: 5,
  shelter: 5,
  medicine: 3,
};

export const TIME_LIMIT_MS = 90_000;
export const WRONG_PENALTY_MS = 10_000;
export const HINT_FUEL_COST = 1;

export type Tier = 1 | 2 | 3 | 4 | 5;

export type TierConfig = {
  tier: Tier;
  label: string;
  flavor: string;
  minEntries: number;
  maxEntries: number;
  monthsTotal: 12 | 24;
  decoys: number;
  timeLimitMs: number;
  hintsAllowed: number;
  rewardBonus: number;
};

export const TIER_CONFIGS: Record<Tier, TierConfig> = {
  1: {
    tier: 1,
    label: 'Sunrise reconciliation',
    flavor: 'Short ledger. Clean entries. Warm up the fingers.',
    minEntries: 4,
    maxEntries: 7,
    monthsTotal: 12,
    decoys: 0,
    timeLimitMs: 90_000,
    hintsAllowed: 0,
    rewardBonus: 0,
  },
  2: {
    tier: 2,
    label: 'Morning ledger',
    flavor: 'Longer schedule. A suspicious-looking row or two — not all that glitters is wrong.',
    minEntries: 8,
    maxEntries: 12,
    monthsTotal: 12,
    decoys: 1,
    timeLimitMs: 100_000,
    hintsAllowed: 1,
    rewardBonus: 0,
  },
  3: {
    tier: 3,
    label: 'Afternoon audit',
    flavor: 'A 24-month roll-forward. More rows, more red herrings, more time.',
    minEntries: 12,
    maxEntries: 18,
    monthsTotal: 24,
    decoys: 2,
    timeLimitMs: 120_000,
    hintsAllowed: 2,
    rewardBonus: 1,
  },
  4: {
    tier: 4,
    label: 'Dusk close',
    flavor: 'The books get unfriendly after dark. Hint costs are worth it now.',
    minEntries: 16,
    maxEntries: 22,
    monthsTotal: 24,
    decoys: 3,
    timeLimitMs: 140_000,
    hintsAllowed: 2,
    rewardBonus: 2,
  },
  5: {
    tier: 5,
    label: 'Final audit',
    flavor: 'Two errors hidden in one consolidated trial balance. Fix them in sequence — the timer never stops.',
    minEntries: 20,
    maxEntries: 24,
    monthsTotal: 24,
    decoys: 4,
    timeLimitMs: 180_000,
    hintsAllowed: 3,
    rewardBonus: 3,
  },
};

export const tierForDay = (day: number): Tier => {
  if (day <= 3) return 1;
  if (day <= 7) return 2;
  if (day <= 12) return 3;
  if (day <= 17) return 4;
  return 5;
};

export const computeReward = (
  elapsedMs: number,
  limitMs: number,
  bonus = 0,
): number => {
  if (elapsedMs >= limitMs) return 0;
  const fraction = elapsedMs / limitMs;
  const base = fraction <= 1 / 3 ? 3 : fraction <= 2 / 3 ? 2 : 1;
  return base + bonus;
};

export const dailyDecay = (
  res: Record<Resource, number>,
): Record<Resource, number> => ({
  food: Math.max(0, res.food - 1),
  fuel: Math.max(0, res.fuel - 1),
  shelter: Math.max(0, res.shelter - 1),
  medicine: Math.max(0, res.medicine - 1),
});

export const isStarved = (res: Record<Resource, number>): Resource | null => {
  for (const r of RESOURCES) {
    if (res[r] <= 0) return r;
  }
  return null;
};

export const grantReward = (
  res: Record<Resource, number>,
  resource: Resource,
  amount: number,
): Record<Resource, number> => ({
  ...res,
  [resource]: res[resource] + amount,
});
