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

export const computeReward = (elapsedMs: number, limitMs = TIME_LIMIT_MS): number => {
  if (elapsedMs >= limitMs) return 0;
  const fraction = elapsedMs / limitMs;
  if (fraction <= 1 / 3) return 3;
  if (fraction <= 2 / 3) return 2;
  return 1;
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
