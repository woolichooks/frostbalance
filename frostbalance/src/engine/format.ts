export const fmt = (n: number): string =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const signedFmt = (n: number): string => {
  const sign = n >= 0 ? '+' : '−';
  return `${sign}${fmt(Math.abs(n))}`;
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const monthEndLabel = (monthIndex: number, year = 2027): string => {
  const m = ((monthIndex % 12) + 12) % 12;
  const yr = year + Math.floor(monthIndex / 12);
  return `${MONTHS[m]} ${DAYS_IN_MONTH[m]}, ${yr}`;
};

export const monthStartLabel = (monthIndex: number, year = 2027): string => {
  const m = ((monthIndex % 12) + 12) % 12;
  const yr = year + Math.floor(monthIndex / 12);
  return `${MONTHS[m]} 1, ${yr}`;
};

export const round2 = (n: number): number => Math.round(n * 100) / 100;
