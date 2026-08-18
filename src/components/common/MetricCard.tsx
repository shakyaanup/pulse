import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MetricCard as MetricCardType } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils';
import clsx from 'clsx';

interface MetricCardProps {
  metric: MetricCardType;
}

const formatValue = (
  value: number,
  format: MetricCardType['format']
): string => {
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percentage') return `${value}%`;
  return value.toLocaleString();
};

const MetricCard = ({ metric }: MetricCardProps) => {
  const TrendIcon =
    metric.trend === 'up'
      ? TrendingUp
      : metric.trend === 'down'
        ? TrendingDown
        : Minus;

  return (
    <div className="metric-card">
      <span className="metric-card__label">{metric.label}</span>
      <span className="metric-card__value">
        {formatValue(metric.value, metric.format)}
      </span>
      <div
        className={clsx(
          'metric-card__trend',
          metric.trend === 'up' && 'metric-card__trend--up',
          metric.trend === 'down' && 'metric-card__trend--down',
          metric.trend === 'neutral' && 'metric-card__trend--down'
        )}
      >
        <TrendIcon size={18} />
        <span>{formatPercentage(metric.change)} than last month</span>
      </div>
    </div>
  );
};

export default MetricCard;
