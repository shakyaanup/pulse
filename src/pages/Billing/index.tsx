import { useRef, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import {
  Badge,
  Card,
  Column,
  CurrentPlanCard,
  DataTable,
  PlanCard,
} from '../../components/common';
import { PageWrapper } from '../../components/layout';
import { useSubscription } from '../../context/SubscriptionContext';
import { mockInvoices, mockPlans } from '../../services/mockData';
import { Invoice, Plan } from '../../types';
import { formatCurrency, formatDate } from '../../utils';

const INVOICE_STATUS_BADGE: Record<
  Invoice['status'],
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  paid: { label: 'Paid', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  failed: { label: 'Failed', variant: 'danger' },
};

// Sorting uses the raw values (ISO dates sort correctly as text, amounts as
// numbers); render controls what's shown
const invoiceColumns: Column<Invoice>[] = [
  {
    key: 'id',
    header: 'Invoice',
    render: (invoice) => (
      <span className="billing__invoice-id">{invoice.id}</span>
    ),
  },
  {
    key: 'date',
    header: 'Date',
    render: (invoice) => formatDate(invoice.date),
  },
  { key: 'planName', header: 'Plan' },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    render: (invoice) => formatCurrency(invoice.amount),
  },
  {
    key: 'status',
    header: 'Status',
    align: 'right',
    render: (invoice) => {
      const badge = INVOICE_STATUS_BADGE[invoice.status];
      return <Badge label={badge.label} variant={badge.variant} />;
    },
  },
];

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

        <div className="billing__section">
          <h2 className="billing__section-title">Billing History</h2>
          <Card>
            <DataTable
              columns={invoiceColumns}
              rows={mockInvoices}
              rowKey="id"
              initialSort={{ key: 'date', direction: 'desc' }}
            />
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Billing;
