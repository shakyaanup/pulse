import { useRef, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { CurrentPlanCard, PlanCard } from '../../components/common';
import { PageWrapper } from '../../components/layout';
import { useSubscription } from '../../context/SubscriptionContext';
import { mockPlans } from '../../services/mockData';
import { Plan } from '../../types';

const Billing = () => {
  const { subscription, changePlan } = useSubscription();
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const plansSectionRef = useRef<HTMLDivElement>(null);

  // A ref gives direct access to the DOM node, so we can scroll to it
  const scrollToPlans = () => {
    plansSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectPlan = (plan: Plan) => {
    changePlan(plan);
    setConfirmation(`You're now on the ${plan.name} plan.`);
  };

  return (
    <PageWrapper pageTitle="Billing">
      <div className="billing">
        <CurrentPlanCard
          subscription={subscription}
          onChangePlan={scrollToPlans}
        />

        {/* Available plans section */}
        <div className="billing__section" ref={plansSectionRef}>
          <h2 className="billing__section-title">Available Plans</h2>

          {/* role="status" makes screen readers announce the message */}
          <div role="status" className="billing__status">
            {confirmation && (
              <p className="billing__confirmation">
                <CheckCircle size={16} />
                {confirmation}
              </p>
            )}
          </div>

          {/* mockPlans is an array -- loop it to build one PlanCard per plan */}
          <div className="billing__plans-grid">
            {mockPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlan={subscription.plan}
                seatsInUse={subscription.seats}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Billing;
