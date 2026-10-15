import { Check } from 'lucide-react';
import clsx from 'clsx';
import { Plan } from '../../types';
import { formatCurrency } from '../../utils';
import Button from './Button';

interface PlanCardProps {
  plan: Plan;
  //onSelect: (planId: string) => void;
}

const PlanCard = ({ plan }: PlanCardProps) => {
  return (
    <div
      className={clsx(
        'plan-card',
        plan.isPopular && 'plan-card--popular',
        plan.isCurrent && 'plan-card--current'
      )}
    >
      {/* Popular badge - only renders when isPopulat is true */}
      {plan.isPopular && (
        <div className="plan-card__popular-badge">Most Popular</div>
      )}

      {/* Plan name and price */}
      <div className="plan-card__header">
        <h3 className="plan-card__name">{plan.name}</h3>
        <div className="plan-card__price">
          <span className="plan-card__price-value">
            {formatCurrency(plan.price)}
          </span>
          <span className="plan-card__price-interval">/ {plan.interval}</span>
        </div>
      </div>

      {/* Features - array looped with map */}
      {/* plan.features is an array - each item is a string */}

      <ul className="plan-card__features">
        {plan.features.map((feature) => (
          <li key={feature} className="plan-card__feature">
            <Check size={14} className="plan-card__feature-icon" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA button - changes based on plan state */}
      <Button
        variant={plan.isCurrent ? 'secondary' : 'primary'}
        size="md"
        disabled={plan.isCurrent}
      >
        {plan.isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
      </Button>
    </div>
  );
};

export default PlanCard;
