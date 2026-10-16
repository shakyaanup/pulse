import { Check } from 'lucide-react';
import clsx from 'clsx';
import { Plan } from '../../types';
import { PLAN_INTERVAL_LABEL } from '../../constants';
import { formatCurrency } from '../../utils';
import Button from './Button';

interface PlanCardProps {
  plan: Plan;
  currentPlan: Plan;
  seatsInUse: number;
  onSelect: (plan: Plan) => void;
}

const PlanCard = ({
  plan,
  currentPlan,
  seatsInUse,
  onSelect,
}: PlanCardProps) => {
  const isCurrent = plan.id === currentPlan.id;
  const isUpgrade = plan.price > currentPlan.price;
  // Can't move to a plan with fewer seats than the team already uses
  const hasTooFewSeats = plan.seatLimit !== null && seatsInUse > plan.seatLimit;

  const buttonLabel = isCurrent
    ? 'Current Plan'
    : hasTooFewSeats
      ? `Needs ${seatsInUse} seats`
      : `${isUpgrade ? 'Upgrade' : 'Downgrade'} to ${plan.name}`;

  return (
    <div
      className={clsx(
        'plan-card',
        plan.isPopular && 'plan-card--popular',
        isCurrent && 'plan-card--current'
      )}
    >
      {/* Popular badge - only renders when isPopular is true */}
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
          <span className="plan-card__price-interval">
            / {PLAN_INTERVAL_LABEL[plan.interval]}
          </span>
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
        variant={isCurrent || !isUpgrade ? 'secondary' : 'primary'}
        size="md"
        disabled={isCurrent || hasTooFewSeats}
        onClick={() => onSelect(plan)}
      >
        {buttonLabel}
      </Button>
    </div>
  );
};

export default PlanCard;
