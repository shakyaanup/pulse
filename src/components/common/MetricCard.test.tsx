import { render, screen } from '@testing-library/react';
import MetricCard from './MetricCard';
import { MetricCard as MetricCardType } from '../../types';

const trendOf = (metric: MetricCardType) => {
  render(<MetricCard metric={metric} />);
  return screen.getByText(/than last month/).parentElement;
};

const base: MetricCardType = {
  label: 'Revenue',
  value: 100,
  change: 5,
  trend: 'up',
  format: 'currency',
};

test('a rise is good news by default', () => {
  expect(trendOf(base)).toHaveClass('metric-card__trend--positive');
});

test('a fall is bad news by default', () => {
  expect(trendOf({ ...base, change: -5, trend: 'down' })).toHaveClass(
    'metric-card__trend--negative'
  );
});

test('a fall is good news when lower is better (e.g. churn)', () => {
  expect(
    trendOf({ ...base, change: -0.5, trend: 'down', higherIsBetter: false })
  ).toHaveClass('metric-card__trend--positive');
});

test('a neutral trend uses the neutral style', () => {
  expect(trendOf({ ...base, change: 0, trend: 'neutral' })).toHaveClass(
    'metric-card__trend--neutral'
  );
});
