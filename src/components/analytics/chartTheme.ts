// Shared colours and axis styling so every analytics chart looks the same
export const CHART_COLORS = {
  primary: 'hsl(234, 89%, 64%)',
  accent: 'hsl(173, 58%, 39%)',
  amber: '#f59e0b',
  sky: '#38bdf8',
  pink: '#f472b6',
};

export const SERIES_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.amber,
  CHART_COLORS.sky,
  CHART_COLORS.pink,
];

export const GRID_COLOR = '#2e2e4a';

export const AXIS_TICK = { fill: '#9999bb', fontSize: 12 };

export const LEGEND_STYLE = { fontSize: '13px', color: '#9999bb' };

export const compactNumber = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
