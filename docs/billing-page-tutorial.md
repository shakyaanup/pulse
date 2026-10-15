# The Billing Page — a walkthrough

The Billing page (`/billing`) shows the customer's subscription and the plans
they can move to. It has two parts:

1. **Current plan card**: plan name, status, price, billing dates, a team-seat
   usage meter and a "Change plan" button
2. **Available plans**: three pricing cards (Starter, Growth, Enterprise),
   with the current one outlined and the popular one highlighted

```
src/
├── types/index.ts                         ← 1. Plan + Subscription types
├── services/mockData.ts                   ← 2. mockPlans, mockSubscription
├── components/common/
│   ├── PlanCard.tsx                       ← 3. one pricing card
│   ├── CurrentPlanCard.tsx                ← 4. the subscription summary
│   └── CurrentPlanCard.test.tsx           ← 7. tests
├── pages/Billing/index.tsx                ← 5. the page
└── styles/
    ├── pages/billings.scss                ← 6. page layout
    └── components/common/
        ├── plancard.scss                  ← 6. pricing card styles
        └── current-plan-card.scss         ← 6. current plan styles
```

---

## 1. Types — a plan vs a subscription

```ts
export interface Plan {
  id: string;
  name: 'Starter' | 'Growth' | 'Enterprise';
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  seatLimit: number | null; // null = unlimited
  isPopular: boolean;
  isCurrent: boolean;
}

export interface Subscription {
  id: string;
  plan: Plan;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodEnd: string;
  nextBillingDate: string;
  seats: number;
}
```

There are two concepts here, and keeping them apart is the main design
decision on this page:

- A **`Plan`** is a product on the shelf: "Growth costs $79 and includes 25
  seats". It's the same for every customer.
- A **`Subscription`** is *this customer's* agreement: which plan, its status,
  when they're next billed and how many seats they use.

`seatLimit: number | null` uses **`null` for "unlimited"** rather than a large
number like `999999`. Code then has to handle the unlimited case on purpose
(`plan.seatLimit ? ... : 'Unlimited'`), and TypeScript points out every place
that forgets.

`status` is a union of the states a billing system uses (these names match
Stripe's). Any `Record<Subscription['status'], ...>` must cover all four, so
adding a fifth status shows you every place that needs updating.

---

## 2. Mock data

`mockPlans` is an array of three plans. `mockSubscription` points at one of
them:

```ts
export const mockSubscription: Subscription = {
  id: 'sub_abc123',
  plan: mockPlans[0],          // Starter
  status: 'active',
  currentPeriodEnd: '2025-01-31',
  nextBillingDate: '2025-02-01',
  seats: 4,
};
```

`plan: mockPlans[0]` **refers to** the plan object instead of copying its fields,
so the subscription can't hold an outdated price.

Each plan also has an `isCurrent` flag. Storing "current" in two places (the
plan's flag *and* the subscription) is how they ended up disagreeing during
development: Starter was flagged current while the subscription still pointed
at Growth. Section 5 shows how the page now uses only the subscription.

---

## 3. `PlanCard.tsx` — one pricing card

```tsx
<div className={clsx(
  'plan-card',
  plan.isPopular && 'plan-card--popular',
  plan.isCurrent && 'plan-card--current'
)}>
  {plan.isPopular && <div className="plan-card__popular-badge">Most Popular</div>}
  ...
  <ul className="plan-card__features">
    {plan.features.map((feature) => (
      <li key={feature}>…<Check size={14} />{feature}</li>
    ))}
  </ul>
  <Button
    variant={plan.isCurrent ? 'secondary' : 'primary'}
    disabled={plan.isCurrent}
  >
    {plan.isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
  </Button>
</div>
```

Things to notice:

- **Conditional rendering with `&&`**: the "Most Popular" badge only exists in
  the DOM when `isPopular` is true.
- **`key={feature}`**: the feature text is unique within a plan, so it can be the
  key. Avoid the array index as a key when items can be reordered or removed.
- **One flag drives three things**: `isCurrent` sets the border colour (through
  the `--current` class), the button style, and whether the button is disabled.
  A button that would do nothing should be disabled, not just labelled
  differently.
- **Template literal for the label**: `` `Upgrade to ${plan.name}` ``.

### The floating "Most Popular" badge

```scss
.plan-card {
  position: relative;                  // 1. the card becomes the anchor
  &__popular-badge {
    position: absolute;                // 2. badge is placed relative to the card
    top: -12px;                        // 3. moved up to sit on the top border
    left: 50%;
    transform: translateX(-50%);       // 4. centred on its own width
  }
}
```

`left: 50%` moves the badge's *left edge* to the middle, and
`translateX(-50%)` then moves it back by half its own width, which centres it
whatever the text length.

### Equal-height cards with the button at the bottom

The grid makes all three cards the same height. Inside each card,
`flex-direction: column` plus **`flex: 1` on the feature list** makes the list
take up the leftover space, so the buttons line up at the bottom even though
Enterprise has eight features and Starter has five.

---

## 4. `CurrentPlanCard.tsx` — the subscription summary

```tsx
interface CurrentPlanCardProps {
  subscription: Subscription;
  onChangePlan: () => void;
}
```

The card receives data and a callback. It doesn't import mock data or know
how scrolling works, which keeps it easy to reuse and to test.

### Lookup tables instead of `if` chains

```ts
const STATUS_BADGE: Record<Subscription['status'], { label: string; variant: ... }> = {
  active:    { label: 'Active',    variant: 'success' },
  trialing:  { label: 'Trial',     variant: 'neutral' },
  past_due:  { label: 'Past due',  variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};
```

`past_due` is a fine value for code but not something to show a user, so the
table maps each status to a human label *and* a badge colour in one place.
`INTERVAL_LABEL` does the same to turn `'monthly'` into "/ month".

### Label/value pairs with `<dl>`

```tsx
<dl className="current-plan__details">
  <div className="current-plan__detail">
    <dt>Next payment</dt>
    <dd>{isCancelled ? 'None' : `${formatCurrency(plan.price)} on ${formatDate(...)}`}</dd>
  </div>
</dl>
```

A **description list** (`<dl>`, `<dt>` term, `<dd>` description) is the HTML
element for label/value pairs. Screen readers announce them as pairs. A
`<div>` around each pair is allowed inside `<dl>` and makes grid layout easy.

The card adapts to state. A cancelled subscription says **"Access ends"**
instead of "Current period ends", and "None" for the next payment.

### The seat meter

```ts
const seatUsage = plan.seatLimit ? seats / plan.seatLimit : null;   // 4 / 5 = 0.8
const isNearSeatLimit = seatUsage !== null && seatUsage >= SEAT_WARNING_THRESHOLD;
```

```tsx
<div className="current-plan__meter" role="progressbar"
     aria-valuemin={0} aria-valuemax={plan.seatLimit} aria-valuenow={seats}>
  <div className={clsx('current-plan__meter-fill', isNearSeatLimit && '...--warning')}
       style={{ width: `${Math.min(seatUsage, 1) * 100}%` }} />
</div>
```

- The **width is the only inline style**, because it's the only value that's
  truly dynamic. Colours stay in SCSS and switch with a modifier class.
- **`Math.min(seatUsage, 1)`** caps the bar at 100%, so an over-limit account
  doesn't overflow the track.
- **`role="progressbar"` + `aria-value*`** tells assistive technology "4 of 5",
  which a coloured `<div>` alone can't.
- **`SEAT_WARNING_THRESHOLD = 0.8`** is a named constant rather than a bare
  `0.8`, so the rule is easy to find and change.
- When the meter turns amber, a hint suggests upgrading. That's a common
  pattern in SaaS products, because nudging customers at the moment they hit a
  limit drives upgrades.

---

## 5. `pages/Billing/index.tsx` — the page

```tsx
const subscription = mockSubscription;
const plansSectionRef = useRef<HTMLDivElement>(null);

const scrollToPlans = () => {
  plansSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
};

<CurrentPlanCard subscription={subscription} onChangePlan={scrollToPlans} />

<div className="billing__section" ref={plansSectionRef}>
  {mockPlans.map((plan) => (
    <PlanCard
      key={plan.id}
      plan={{ ...plan, isCurrent: plan.id === subscription.plan.id }}
    />
  ))}
</div>
```

### `useRef` for the DOM

`useRef` holds a value that persists between renders **without** causing a
re-render when it changes. When passed as `ref={...}`, React fills
`plansSectionRef.current` with the actual `<div>`, so we can call the browser's
`scrollIntoView` on it. `?.` (optional chaining) guards against it being `null`
before the first render.

The card gets a callback rather than the ref itself. `CurrentPlanCard` only
knows "someone wants to change plan", and the page decides that means
scrolling. Later it could open a modal instead, without touching the card.

### One source of truth for "current"

```tsx
plan={{ ...plan, isCurrent: plan.id === subscription.plan.id }}
```

Instead of trusting each plan's stored `isCurrent` flag, the page **works it
out** from the subscription. `{ ...plan, isCurrent: ... }` makes a copy with that
one field overwritten, leaving the original `mockPlans` untouched. The pricing
grid and the current plan card now read from the same place, so they can't
disagree.

This is the same rule as on the other pages: if one value can be calculated
from another, calculate it rather than storing both.

---

## 6. Styles

- **`billings.scss`**: the page is a column with `$space-8` gaps, and the plans
  are `grid-template-columns: repeat(3, 1fr)`, which gives three equal columns.
- **`plancard.scss`**: `--popular` gets a purple border and a faint purple tint
  (`rgba(108, 99, 255, 0.05)`, the primary colour at 5% opacity), and
  `--current` gets the teal accent border.
- **`current-plan-card.scss`**: the details row collapses from three columns to
  one below 768px. The meter is a rounded track (`overflow: hidden` clips
  the fill to the rounded corners) with a `transition: width`, so it animates if
  the seat count changes.

---

## 7. Tests — `CurrentPlanCard.test.tsx`

```tsx
const renderCard = (overrides: Partial<Subscription> = {}) => {
  const onChangePlan = jest.fn();
  render(<CurrentPlanCard subscription={{ ...mockSubscription, ...overrides }} onChangePlan={onChangePlan} />);
  return { onChangePlan };
};
```

- **`Partial<Subscription>`** makes every field optional, so each test only
  states what it changes: `renderCard({ status: 'cancelled' })`.
- **`jest.fn()`** is a fake function that records its calls, which lets us check
  that clicking "Change plan" called `onChangePlan` exactly once.

The tests cover the plan and dates, the near-limit warning, unlimited plans (no
meter), the cancelled state, and the button callback. The card's props make
these states easy to set up, which is another reason to keep components
free of imported data.

---

## Things worth fixing

| Where | Issue | Fix |
|---|---|---|
| `PlanCard.tsx` | "Upgrade to …" buttons don't do anything (`onSelect` is commented out) | See "Where to take it next" |
| `plancard.scss` | `.plan-card:hover` is more specific than `.plan-card--current`, so hovering the current plan turns its teal border purple | Add `&--current:hover { border-color: $color-accent; }` |
| `billings.scss` | Three fixed columns get very narrow on small screens | Add a media query that drops to 1 column below ~900px |
| `PlanCard.tsx` | Shows "/ monthly" while the current plan card shows "/ month" | Reuse the same `INTERVAL_LABEL` map in both |
| `types/index.ts` | `Plan.isCurrent` is now ignored by the page (it's calculated from the subscription) | Remove it from the data and calculate it everywhere, or rename the prop to make the intent clear |

## Where to take it next

- **Make "Upgrade" work**: move the subscription into state with
  `const [subscription, setSubscription] = useState(mockSubscription)`, pass
  `onSelect` to `PlanCard`, and in the handler call
  `setSubscription({ ...subscription, plan })`. Both cards update together
  because they read from the same state.
- **Confirm before changing**: show a modal with the price difference before
  switching plans.
- **Monthly/yearly toggle**: add a switch above the grid that shows yearly
  prices (for example, two months free).
- **Invoice history**: `mockInvoices` already exists. Show it in a table below
  the plans, using `Badge` for paid/pending/failed.
