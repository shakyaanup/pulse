import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MetricCard as MetricCardType } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils';
import clsx from 'clsx';

interface MetricCardProps {
  metric: MetricCardType;
  comparisonLabel?: string;
}

const formatValue = (
  value: number,
  format: MetricCardType['format']
): string => {
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percentage') return `${value}%`;
  return value.toLocaleString();
};

const MetricCard = ({
  metric,
  comparisonLabel = 'than last month',
}: MetricCardProps) => {
  // Colour shows whether the change is good news, not which way it moved:
  // churn going down is green, revenue going down is red
  const isGoodChange =
    metric.trend === 'up'
      ? metric.higherIsBetter !== false
      : metric.higherIsBetter === false;

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
          metric.trend === 'neutral'
            ? 'metric-card__trend--neutral'
            : isGoodChange
              ? 'metric-card__trend--positive'
              : 'metric-card__trend--negative'
        )}
      >
        <TrendIcon size={18} />
        <span>
          {formatPercentage(metric.change)} {comparisonLabel}
        </span>
      </div>
    </div>
  );
};

export default MetricCard;
