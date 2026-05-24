import type { Account, PuzzleKind } from './types';

export type ScenarioTemplate = {
  prepaidAccount: Account;
  expenseAccount: Account;
  vendors: string[];
  itemNoun: string;
  annualAmounts: number[];
};

export type Location = {
  id: string;
  name: string;
  blurb: string;
  unlockDay: number;
  templates: ScenarioTemplate[];
  /** Puzzle kinds this site can serve. Generator picks one per visit. */
  puzzleKinds: PuzzleKind[];
};

export const LOCATIONS: Location[] = [
  {
    id: 'cpa-office',
    name: 'Abandoned CPA Office',
    blurb: 'Cubicle skeletons. Dead plants. The 10-keys still click.',
    unlockDay: 1,
    puzzleKinds: ['prepaid'],
    templates: [
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
    ],
  },
  {
    id: 'frozen-warehouse',
    name: 'Frozen Warehouse',
    blurb: 'Forklifts in ice. Pallet jacks fused to the floor. The freezer is louder than the wind.',
    unlockDay: 4,
    puzzleKinds: ['prepaid'],
    templates: [
      {
        prepaidAccount: 'Prepaid Cold Storage',
        expenseAccount: 'Storage Expense',
        vendors: ['Frostkeep Storage', 'Subzero Logistics', 'Iceshelf Cold Holdings'],
        itemNoun: 'cold storage lease',
        annualAmounts: [3600, 6000, 7200, 12000],
      },
      {
        prepaidAccount: 'Prepaid Refrigeration',
        expenseAccount: 'Refrigeration Expense',
        vendors: ['Tundra Cooling Co.', 'Polar Compressors Inc.', 'Glacial Refrigeration'],
        itemNoun: 'refrigeration service contract',
        annualAmounts: [2400, 3600, 4800],
      },
      {
        prepaidAccount: 'Prepaid Freight',
        expenseAccount: 'Freight Expense',
        vendors: ['Boreal Freight Lines', 'Snowdrift Logistics'],
        itemNoun: 'freight retainer',
        annualAmounts: [2400, 3600, 6000],
      },
      {
        prepaidAccount: 'Prepaid Fleet Maintenance',
        expenseAccount: 'Fleet Maintenance Expense',
        vendors: ['Polar Industrial', 'Iceshelf Fleet Services'],
        itemNoun: 'forklift maintenance plan',
        annualAmounts: [1200, 2400, 3600],
      },
    ],
  },
  {
    id: 'irs-bunker',
    name: 'IRS Bunker',
    blurb: 'Concrete corridors. The Form 1120s are alphabetized. Somewhere, a deadline is still being missed.',
    unlockDay: 8,
    puzzleKinds: ['prepaid'],
    templates: [
      {
        prepaidAccount: 'Prepaid Federal Lease',
        expenseAccount: 'Federal Lease Expense',
        vendors: ['U.S. General Services Admin.', 'Federal Properties Branch'],
        itemNoun: 'federal sublease',
        annualAmounts: [6000, 7200, 12000],
      },
      {
        prepaidAccount: 'Prepaid Audit Defense',
        expenseAccount: 'Audit Defense Expense',
        vendors: ['Cold Audit LLC', 'Bureau of Compliance', 'Federal Filing Bureau'],
        itemNoun: 'audit defense retainer',
        annualAmounts: [2400, 3600, 6000],
      },
      {
        prepaidAccount: 'Prepaid Tax Services',
        expenseAccount: 'Tax Services Expense',
        vendors: ['Glacial CPA Services', 'Sub-Zero Tax Group'],
        itemNoun: 'tax preparation retainer',
        annualAmounts: [1200, 2400, 4800],
      },
      {
        prepaidAccount: 'Prepaid Compliance Subscription',
        expenseAccount: 'Compliance Expense',
        vendors: ['Federal Filing Bureau', 'Compliance Bureau North'],
        itemNoun: 'regulatory compliance subscription',
        annualAmounts: [2400, 3600, 4800],
      },
    ],
  },
];

export const unlockedLocations = (day: number): Location[] =>
  LOCATIONS.filter((l) => l.unlockDay <= day);

export const pickLocation = (day: number): Location => {
  const unlocked = unlockedLocations(day);
  return unlocked[Math.floor(Math.random() * unlocked.length)];
};
