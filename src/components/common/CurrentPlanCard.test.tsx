import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CurrentPlanCard from './CurrentPlanCard';
import { mockPlans, mockSubscription } from '../../services/mockData';
import { Subscription } from '../../types';

const renderCard = (overrides: Partial<Subscription> = {}) => {
  const onChangePlan = jest.fn();
  render(
    <CurrentPlanCard
      subscription={{ ...mockSubscription, ...overrides }}
      onChangePlan={onChangePlan}
    />
  );
  return { onChangePlan };
};

test('shows the plan, price and billing dates', () => {
  renderCard({ plan: mockPlans[0] });

  expect(screen.getByRole('heading', { name: 'Starter' })).toBeInTheDocument();
  expect(screen.getByText('Active')).toBeInTheDocument();
  expect(screen.getByText('$29 on Feb 1, 2025')).toBeInTheDocument();
  expect(screen.getByText('Jan 31, 2025')).toBeInTheDocument();
});

test('warns when seats are close to the limit', () => {
  renderCard({ plan: mockPlans[0], seats: 4 });

  expect(screen.getByText('4 of 5 used')).toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4');
  expect(screen.getByText(/close to your seat limit/)).toBeInTheDocument();
});

test('has no meter or warning on an unlimited plan', () => {
  renderCard({ plan: mockPlans[2], seats: 40 });

  expect(screen.getByText('40 used · Unlimited')).toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(
    screen.queryByText(/close to your seat limit/)
  ).not.toBeInTheDocument();
});

test('shows when access ends for a cancelled subscription', () => {
  renderCard({ status: 'cancelled' });

  expect(screen.getByText('Cancelled')).toBeInTheDocument();
  expect(screen.getByText('Access ends')).toBeInTheDocument();
  expect(screen.getByText('None')).toBeInTheDocument();
});

test('calls onChangePlan when "Change plan" is clicked', () => {
  const { onChangePlan } = renderCard();

  userEvent.click(screen.getByRole('button', { name: 'Change plan' }));
  expect(onChangePlan).toHaveBeenCalledTimes(1);
});
