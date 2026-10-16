import { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Billing from '.';
import { SubscriptionProvider } from '../../context/SubscriptionContext';
import { mockPlans, mockSubscription } from '../../services/mockData';
import { Subscription } from '../../types';

// The sidebar/navbar aren't under test (and need a router)
jest.mock('../../components/layout', () => ({
  PageWrapper: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const renderBilling = (subscription: Subscription = mockSubscription) =>
  render(
    <SubscriptionProvider initialSubscription={subscription}>
      <Billing />
    </SubscriptionProvider>
  );

const currentPlanName = () =>
  screen.getAllByRole('heading', { level: 2 })[0].textContent;

test('labels each plan relative to the current one', () => {
  renderBilling(); // Starter

  expect(screen.getByRole('button', { name: 'Current Plan' })).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Upgrade to Growth' })
  ).toBeEnabled();
  expect(
    screen.getByRole('button', { name: 'Upgrade to Enterprise' })
  ).toBeEnabled();
});

test('upgrading switches the current plan and confirms it', () => {
  renderBilling();

  userEvent.click(screen.getByRole('button', { name: 'Upgrade to Growth' }));

  expect(currentPlanName()).toBe('Growth');
  expect(screen.getByRole('status')).toHaveTextContent(
    "You're now on the Growth plan."
  );
  expect(
    screen.getByRole('button', { name: 'Downgrade to Starter' })
  ).toBeEnabled();
  // The seat meter now measures against Growth's 25 seats
  expect(screen.getByText('4 of 25 used')).toBeInTheDocument();
});

test("can't downgrade to a plan with fewer seats than are in use", () => {
  renderBilling({ ...mockSubscription, plan: mockPlans[1], seats: 12 });

  const starterCard = screen
    .getByRole('heading', { level: 3, name: 'Starter' })
    .closest('.plan-card') as HTMLElement;
  expect(
    within(starterCard).getByRole('button', { name: 'Needs 12 seats' })
  ).toBeDisabled();
});

test('lists past invoices, newest first, with their status', () => {
  renderBilling();

  const history = screen
    .getByRole('heading', { name: 'Billing History' })
    .closest('.billing__section') as HTMLElement;
  const rows = within(history).getAllByRole('row').slice(1); // skip header

  expect(rows).toHaveLength(6);
  expect(rows[0]).toHaveTextContent('INV-2024-012');
  expect(rows[0]).toHaveTextContent('Dec 1, 2024');
  expect(rows[0]).toHaveTextContent('$29');
  expect(
    within(history).getByText('INV-2024-009').closest('tr')
  ).toHaveTextContent('Failed');
});
