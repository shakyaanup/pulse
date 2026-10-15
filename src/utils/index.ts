export const formatCurrency = (value: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  // new Date('2025-02-01') is midnight UTC, which is still Jan 31 in the
  // Americas. Build date-only strings as local dates so the day never shifts.
  const [year, month, day] = dateString.split('-').map(Number);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? new Date(year, month - 1, day)
    : new Date(dateString);

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const formatPercentage = (value: number): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

export const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
