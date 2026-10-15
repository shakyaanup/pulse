import { PlanCard } from '../../components/common';
import { PageWrapper } from '../../components/layout';
import { mockPlans } from '../../services/mockData';

const Billing = () => {
  return (
    <PageWrapper pageTitle="Billing">
      <div className="billing">
        {/* CurrentPlanCard goes here */}

        {/* Available plans section */}
        <div className="billing__section">
          <h2 className="billing__section-title">Available Plans</h2>
          {/* mockPlans is an array -- loop it to build one PlaCard per plan */}
          <div className="billing__plans-grid">
            {mockPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Billing;
