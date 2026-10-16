# The Billing Page — a walkthrough

The Billing page (`/billing`) shows the customer's subscription and the plans
they can move to. It has two parts:

1. **Current plan card**: plan name, status, price, billing dates, a team-seat
   usage meter and a "Change plan" button
2. **Available plans**: three pricing cards (Starter, Growth, Enterprise),
   with the current one outlined and the popular one highlighted. The
   **Upgrade / Downgrade** buttons switch the plan, and the whole app updates,
   including the plan shown in the profile menu.
3. **Billing history**: past invoices in a sortable table, newest first, with
   a status badge for each.

```
src/
├── types/index.ts                         ← 1. Plan + Subscription types
├── services/mockData.ts                   ← 2. mockPlans, mockSubscription
├── context/SubscriptionContext.tsx        ← 5. shared subscription state
├── constants/index.ts                     ← PLAN_INTERVAL_LABEL
├── components/common/
│   ├── PlanCard.tsx                       ← 3. one pricing card
│   ├── CurrentPlanCard.tsx                ← 4. the subscription summary
│   └── CurrentPlanCard.test.tsx           ← 7. tests
├── pages/Billing/index.tsx                ← 5. the page
├── pages/Billing/Billing.test.tsx         ← 7. plan switching tests
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

Plans used to have an `isCurrent` flag as well. Storing "current" in two
places (the plan's flag *and* the subscription) is how they ended up
disagreeing during development: Starter was flagged current while the
subscription still pointed at Growth. The flag has been **removed**. A plan
can't know whether it's current, because that depends on who's looking, so the
subscription is now the only source.

---

## 3. `PlanCard.tsx` — one pricing card

```tsx
interface PlanCardProps {
  plan: Plan;
  currentPlan: Plan;
  seatsInUse: number;
  onSelect: (plan: Plan) => void;
}

const isCurrent = plan.id === currentPlan.id;
const isUpgrade = plan.price > currentPlan.price;
const hasTooFewSeats = plan.seatLimit !== null && seatsInUse > plan.seatLimit;

const buttonLabel = isCurrent
  ? 'Current Plan'
  : hasTooFewSeats
    ? `Needs ${seatsInUse} seats`
    : `${isUpgrade ? 'Upgrade' : 'Downgrade'} to ${plan.name}`;
```

```tsx
<div className={clsx('plan-card', plan.isPopular && 'plan-card--popular', isCurrent && 'plan-card--current')}>
  {plan.isPopular && <div className="plan-card__popular-badge">Most Popular</div>}
  ...
  <span className="plan-card__price-interval">/ {PLAN_INTERVAL_LABEL[plan.interval]}</span>
  ...
  <Button
    variant={isCurrent || !isUpgrade ? 'secondary' : 'primary'}
    disabled={isCurrent || hasTooFewSeats}
    onClick={() => onSelect(plan)}
  >
    {buttonLabel}
  </Button>
</div>
```

Things to notice:

- **The card works out its own state from props.** It gets the plan it shows
  and the plan the customer is on, and calculates `isCurrent` and `isUpgrade`
  from them. Nothing is stored twice.
- **The label is honest about what the button does.** A cheaper plan says
  "Downgrade", not "Upgrade". Downgrades use the quieter `secondary` style, so
  the more expensive options stand out, which is a common pricing-page pattern.
- **Business rules live in one place.** You can't move to a plan with fewer
  seats than your team already uses. Instead of letting the click happen and
  showing an error afterwards, the button is disabled and says why
  ("Needs 12 seats").
- **`onSelect` hands the decision up.** The card doesn't change the
  subscription itself. It reports "this plan was chosen", and the page decides
  what that means.
- **Conditional rendering with `&&`**: the "Most Popular" badge only exists in
  the DOM when `isPopular` is true.
- **`key={feature}`**: the feature text is unique within a plan, so it can be the
  key. Avoid the array index as a key when items can be reordered or removed.
- **`PLAN_INTERVAL_LABEL`** (in `constants`) turns `'monthly'` into "month". The
  current plan card uses the same map, so both say "/ month".

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
The shared `PLAN_INTERVAL_LABEL` map does the same to turn `'monthly'` into
"/ month".

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

## 5. The page and shared subscription state

### Why the subscription lives in a context

Changing plan has to update **two places**: the Billing page and the "Plan"
line in the profile menu in the header. If the page kept the subscription in
its own `useState`, the header would still show the old plan, and the page's
state would also be lost when you navigated away.

So the subscription lives in **`SubscriptionContext`**, built the same way as
`NotificationsContext` (see the notifications tutorial):

```tsx
export const SubscriptionProvider = ({ children, initialSubscription = mockSubscription }) => {
  const [subscription, setSubscription] = useState<Subscription>(initialSubscription);

  const changePlan = useCallback((plan: Plan) => {
    setSubscription((current) => ({ ...current, plan }));
  }, []);

  const value = useMemo(() => ({ subscription, changePlan }), [subscription, changePlan]);
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};
```

- **`{ ...current, plan }`** copies the subscription and replaces only the plan.
  Status, dates and seats stay the same.
- The provider wraps the routes in `App.tsx`. `Navbar` reads
  `useSubscription()` and passes `subscription.plan.name` to the profile menu,
  so the header updates the moment the plan changes.
- With a backend, `changePlan` would also send the change to the server.
  Components wouldn't change, because they only ever call `changePlan(plan)`.

### `pages/Billing/index.tsx`

```tsx
const { subscription, changePlan } = useSubscription();
const [confirmation, setConfirmation] = useState<string | null>(null);
const plansSectionRef = useRef<HTMLDivElement>(null);

const handleSelectPlan = (plan: Plan) => {
  changePlan(plan);
  setConfirmation(`You're now on the ${plan.name} plan.`);
};

<CurrentPlanCard subscription={subscription} onChangePlan={scrollToPlans} />

<div className="billing__section" ref={plansSectionRef}>
  <div role="status" className="billing__status">
    {confirmation && <p className="billing__confirmation">…{confirmation}</p>}
  </div>
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
```

### Both cards update together

When you click "Upgrade to Growth", `changePlan` updates the context, and React
re-renders everything that reads it:

- the **current plan card** shows Growth, $79, and the seat meter re-measures
  against 25 seats ("4 of 25 used", so the amber warning disappears)
- the **pricing grid** moves the teal outline to Growth, and Starter's button
  becomes "Downgrade to Starter"
- the **profile menu** shows "Plan: Growth"

None of these components talk to each other. They all read the same state.
This is the rule used throughout the project: **one source of truth,
everything else calculated from it.**

### The confirmation message

`role="status"` is a **live region**: screen readers announce text that appears
inside it, without moving focus. The wrapper `<div role="status">` is always
rendered and only its *contents* change, because a live region that appears
together with its text may not be announced. The empty wrapper is hidden with
`.billing__status:empty { display: none; }`, so it doesn't add a gap.

### `useRef` for the DOM

`useRef` holds a value that persists between renders **without** causing a
re-render when it changes. When passed as `ref={...}`, React fills
`plansSectionRef.current` with the actual `<div>`, so we can call the browser's
`scrollIntoView` on it. `?.` (optional chaining) guards against it being `null`
before the first render.

The card gets a callback rather than the ref itself. `CurrentPlanCard` only
knows "someone wants to change plan", and the page decides that means
scrolling. Later it could open a modal instead, without touching the card.

---

## 5b. Billing history

```tsx
const invoiceColumns: Column<Invoice>[] = [
  { key: 'id', header: 'Invoice', render: (invoice) => <span className="billing__invoice-id">{invoice.id}</span> },
  { key: 'date', header: 'Date', render: (invoice) => formatDate(invoice.date) },
  { key: 'planName', header: 'Plan' },
  { key: 'amount', header: 'Amount', align: 'right', render: (invoice) => formatCurrency(invoice.amount) },
  { key: 'status', header: 'Status', align: 'right', render: (invoice) => <Badge … /> },
];

<DataTable columns={invoiceColumns} rows={mockInvoices} rowKey="id"
           initialSort={{ key: 'date', direction: 'desc' }} />
```

**Reusing `DataTable`.** The sortable table was built for the Analytics page.
It was generic from the start (it takes any row type plus column definitions),
so showing invoices needed **no new table code**, only a list of columns. It
moved from `components/analytics/` to `components/common/` because it's no
longer specific to Analytics. On phones it scrolls sideways inside its card,
as on Analytics.

**Sorting works on raw values.** The table sorts by `invoice.date` (the stored
`'2024-12-01'`) and *displays* `render`'s "Dec 1, 2024". ISO dates
(`YYYY-MM-DD`) sort correctly as plain text, because the biggest unit comes
first. "Dec 1, 2024" would sort alphabetically, putting April before December.

**`{ key: 'planName', header: 'Plan' }`** has no `render`. The table falls back
to showing the raw value, which is already readable.

**Statuses use a lookup table** like the subscription status:
`paid → Paid / green`, `pending → Pending / amber`, `failed → Failed / red`.

**Fixed along the way:** `mockInvoices` still listed Growth at $79, while the
subscription is Starter at $29. The history now matches the current plan.

---

## 6. Styles

- **`billings.scss`**: the page is a column with `$space-8` gaps, and the plans
  are `grid-template-columns: repeat(3, 1fr)`, which gives three equal columns.
- **`plancard.scss`**: `--popular` gets a purple border and a faint purple tint
  (`rgba(108, 99, 255, 0.05)`, the primary colour at 5% opacity), and
  `--current` gets the teal accent border. `.plan-card:hover` (a class *plus* a
  pseudo-class) is more specific than `.plan-card--current` (one class), so
  hovering used to turn the current plan's border purple. Listing
  `&--current:hover` alongside `&--current` keeps it teal.
- The confirmation message is a soft teal box (`rgba` of the accent colour)
  with a check icon.
- **`current-plan-card.scss`**: the details row collapses from three columns to
  one below 768px. The meter is a rounded track (`overflow: hidden` clips
  the fill to the rounded corners) with a `transition: width`, so it animates if
  the seat count changes.

---

## 7. Tests — `CurrentPlanCard.test.tsx` and `Billing.test.tsx`

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

**`Billing.test.tsx`** renders the real page inside a `SubscriptionProvider`
with a chosen `initialSubscription`, and checks:

| Test | What it checks |
|---|---|
| labels | On Starter: "Current Plan" is disabled, and "Upgrade to Growth" and "Upgrade to Enterprise" are enabled |
| upgrading | Clicking "Upgrade to Growth" makes Growth current, shows the confirmation, offers "Downgrade to Starter", and the meter reads "4 of 25 used" |
| seat rule | On Growth with 12 seats, Starter's button says "Needs 12 seats" and is disabled |

---

## Fixed since this tutorial was first written

| Where | What was wrong | What changed |
|---|---|---|
| `PlanCard.tsx` | "Upgrade to …" buttons did nothing | They switch plans through `SubscriptionContext` (section 5) |
| `plancard.scss` | Hovering the current plan turned its teal border purple | `&--current:hover` keeps it teal |
| `PlanCard.tsx` | "/ monthly" vs "/ month" on the current plan card | Both use `PLAN_INTERVAL_LABEL` |
| `types/index.ts` | `Plan.isCurrent` duplicated what the subscription says | Removed. `PlanCard` works it out from `currentPlan` |

The **three fixed columns** in `billings.scss` now drop to one column on
phones. See [responsive-layout-tutorial.md](responsive-layout-tutorial.md) for
why it's "3 or 1, never 2 + 1".

## Where to take it next

- **Confirm before changing**: show a modal with the price difference before
  switching plans. Right now a click switches immediately.
- **Monthly/yearly toggle**: add a switch above the grid that shows yearly
  prices (for example, two months free).
- **New invoices on plan change**: when the plan changes, add a prorated
  invoice to the history.
- **Invoice details**: open an invoice in the `Modal` component (see the Users
  tutorial) with line items and a Print button.
