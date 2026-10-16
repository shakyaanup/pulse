import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { Plan, Subscription } from '../types';
import { mockSubscription } from '../services/mockData';
import { usePersistentState } from '../hooks/usePersistentState';

interface SubscriptionContextValue {
  subscription: Subscription;
  changePlan: (plan: Plan) => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null
);

interface SubscriptionProviderProps {
  children: ReactNode;
  initialSubscription?: Subscription;
}

// Shared so the Billing page and the profile menu always show the same plan
export const SubscriptionProvider = ({
  children,
  initialSubscription = mockSubscription,
}: SubscriptionProviderProps) => {
  // Saved, so a plan change survives a page reload
  const [subscription, setSubscription] = usePersistentState<Subscription>(
    'subscription',
    initialSubscription
  );

  // With a backend this would also call something like
  // apiClient.post('/subscription/change', { planId: plan.id })
  const changePlan = useCallback(
    (plan: Plan) => {
      setSubscription((current) => ({ ...current, plan }));
    },
    [setSubscription]
  );

  const value = useMemo(
    () => ({ subscription, changePlan }),
    [subscription, changePlan]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextValue => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      'useSubscription must be used inside <SubscriptionProvider>'
    );
  }
  return context;
};
