import clsx from 'clsx';
import { Subscription } from '../../types';
import { PLAN_INTERVAL_LABEL } from '../../constants';
import { formatCurrency, formatDate } from '../../utils';
import Badge from './Badge';
import Button from './Button';

interface CurrentPlanCardProps {
  subscription: Subscription;
  onChangePlan: () => void;
}

const STATUS_BADGE: Record<
  Subscription['status'],
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  active: { label: 'Active', variant: 'success' },
  trialing: { label: 'Trial', variant: 'neutral' },
  past_due: { label: 'Past due', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

// Above this share of seats used, the meter turns amber as an upgrade nudge
const SEAT_WARNING_THRESHOLD = 0.8;

const CurrentPlanCard = ({
  subscription,
  onChangePlan,
}: CurrentPlanCardProps) => {
  const { plan, status, seats } = subscription;
  const statusBadge = STATUS_BADGE[status];
  const isCancelled = status === 'cancelled';

  const seatUsage = plan.seatLimit ? seats / plan.seatLimit : null;
  const isNearSeatLimit =
    seatUsage !== null && seatUsage >= SEAT_WARNING_THRESHOLD;

  return (
    <div className="current-plan">
      <div className="current-plan__header">
        <div className="current-plan__heading">
          <span className="current-plan__eyebrow">Current plan</span>
          <div className="current-plan__title-row">
            <h2 className="current-plan__name">{plan.name}</h2>
            <Badge label={statusBadge.label} variant={statusBadge.variant} />
          </div>
        </div>
        <div className="current-plan__price">
          <span className="current-plan__price-value">
            {formatCurrency(plan.price)}
          </span>
          <span className="current-plan__price-interval">
            / {PLAN_INTERVAL_LABEL[plan.interval]}
          </span>
        </div>
      </div>

      {/* <dl> is the semantic element for label/value pairs */}
      <dl className="current-plan__details">
        <div className="current-plan__detail">
          <dt>Billing cycle</dt>
          <dd>{plan.interval === 'monthly' ? 'Monthly' : 'Yearly'}</dd>
        </div>
        <div className="current-plan__detail">
          <dt>{isCancelled ? 'Access ends' : 'Current period ends'}</dt>
          <dd>{formatDate(subscription.currentPeriodEnd)}</dd>
        </div>
        <div className="current-plan__detail">
          <dt>Next payment</dt>
          <dd>
            {isCancelled
              ? 'None'
              : `${formatCurrency(plan.price)} on ${formatDate(subscription.nextBillingDate)}`}
          </dd>
        </div>
      </dl>

      <div className="current-plan__seats">
        <div className="current-plan__seats-header">
          <span className="current-plan__seats-label">Team seats</span>
          <span className="current-plan__seats-count">
            {plan.seatLimit
              ? `${seats} of ${plan.seatLimit} used`
              : `${seats} used · Unlimited`}
          </span>
        </div>
        {seatUsage !== null && plan.seatLimit && (
          <div
            className="current-plan__meter"
            role="progressbar"
            aria-label="Team seats used"
            aria-valuemin={0}
            aria-valuemax={plan.seatLimit}
            aria-valuenow={seats}
          >
            <div
              className={clsx(
                'current-plan__meter-fill',
                isNearSeatLimit && 'current-plan__meter-fill--warning'
              )}
              style={{ width: `${Math.min(seatUsage, 1) * 100}%` }}
            />
          </div>
        )}
        {isNearSeatLimit && (
          <p className="current-plan__seats-hint">
            You&apos;re close to your seat limit. Upgrade to add more team
            members.
          </p>
        )}
      </div>

      <div className="current-plan__actions">
        <Button variant="primary" size="md" onClick={onChangePlan}>
          Change plan
        </Button>
      </div>
    </div>
  );
};

export default CurrentPlanCard;
