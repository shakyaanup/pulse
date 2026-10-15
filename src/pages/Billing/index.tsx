import { useRef } from 'react';
import { CurrentPlanCard, PlanCard } from '../../components/common';
import { PageWrapper } from '../../components/layout';
import { mockPlans, mockSubscription } from '../../services/mockData';

const Billing = () => {
  const subscription = mockSubscription;
  const plansSectionRef = useRef<HTMLDivElement>(null);

  // A ref gives direct access to the DOM node, so we can scroll to it
  const scrollToPlans = () => {
    plansSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          {/* mockPlans is an array -- loop it to build one PlanCard per plan */}
          <div className="billing__plans-grid">
            {mockPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                // The subscription decides which plan is current, so the
                // grid and the current plan card can never disagree
                plan={{ ...plan, isCurrent: plan.id === subscription.plan.id }}
              />
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Billing;
