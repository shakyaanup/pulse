# The Dashboard Page and App Foundations — a walkthrough

The Dashboard (`/`) was the first page built, so building it also set up the
parts every other page uses: how the app starts, routing, the sidebar/navbar
layout, the SCSS system and the shared components. This guide covers both,
starting with the foundations.

The Dashboard itself shows:

1. **Four KPI cards**: MRR, active users, churn rate, average revenue per user
2. **A revenue vs target chart**: a Recharts area chart over 12 months
3. **A recent users list**: the latest five sign-ups with status badges

```
src/
├── index.tsx                         ← 1. app entry point
├── App.tsx                           ← 2. routes
├── config/routes.tsx                 ← 2. route list + lazy loading
├── constants/index.ts                ← 2. ROUTES, NAV_ITEMS
├── components/layout/
│   ├── PageWrapper.tsx               ← 3. the shell around every page
│   ├── Sidebar.tsx                   ← 3. navigation
│   └── Navbar.tsx                    ← 3. top bar
├── styles/                           ← 4. SCSS system
├── types/index.ts                    ← 5. MetricCard type
├── services/mockData.ts              ← 5. mockMetrics, mockRevenueChart, mockRecentUsers
├── utils/index.ts                    ← 5. formatCurrency, formatPercentage, formatDate
├── components/common/
│   ├── Card.tsx                      ← 6. generic container
│   ├── MetricCard.tsx                ← 7. KPI card
│   ├── RevenueChart.tsx              ← 8. area chart
│   ├── RecentUsers.tsx               ← 9. user list
│   ├── Badge.tsx / Button.tsx        ← 10. small building blocks
│   └── index.ts                      ← barrel file
└── pages/Dashboard/index.tsx         ← 11. the page itself
```

---

## Part 1: App foundations

### 1. `index.tsx` — where React starts

```tsx
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- `createRoot` attaches React to the `<div id="root">` in `public/index.html`.
- **`BrowserRouter`** wraps the whole app so any component can use routing
  (`NavLink`, `useNavigate`, and so on). It needs to sit *above* everything that
  uses it.
- **`StrictMode`** is development-only. It runs components and effects twice
  on purpose to surface bugs such as missing effect cleanup. That's why
  you may see console logs twice while developing. It does nothing in a
  production build.
- `import './styles/index.scss'` is the **only** stylesheet import. All SCSS is
  pulled in through that one file (see section 4).

### 2. Routing — `App.tsx`, `config/routes.tsx`, `constants/index.ts`

Routes are described **as data** rather than written out as JSX:

```tsx
// config/routes.tsx
const Dashboard = lazy(() => import('../pages/Dashboard'));

export const routeConfig: RouteConfig[] = [
  { path: ROUTES.DASHBOARD, component: Dashboard },
  ...
];
```

```tsx
// App.tsx
<Suspense fallback={<div className="page-loader">Loading...</div>}>
  <Routes>
    {routeConfig.map(({ path, component: Component }) => (
      <Route key={path} path={path} element={<Component />} />
    ))}
    <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
  </Routes>
</Suspense>
```

What's going on:

- **`lazy()` + `Suspense` = code splitting.** Each page becomes its own
  JavaScript file that's only downloaded when you visit it. Recharts is large, so
  someone opening `/users` doesn't have to download the chart code. While a page's
  file is loading, `Suspense` shows its `fallback`.
- **`component: Component`** renames the property while destructuring. JSX
  needs a capitalised name to treat it as a component rather than an HTML tag.
- **`path="*"`** catches unknown URLs and redirects to the Dashboard. `replace`
  swaps the history entry so the browser's Back button doesn't return to the
  broken URL.
- **`ROUTES` uses `as const`**, which makes the values literal types
  (`'/billing'` rather than `string`) and read-only, so a typo like
  `ROUTES.BILLNG` is a compile error.

### 3. The layout — `PageWrapper`, `Sidebar`, `Navbar`

Every page wraps its content in `PageWrapper`:

```tsx
<PageWrapper pageTitle="Dashboard">
  ...page content...
</PageWrapper>
```

```tsx
// PageWrapper.tsx
<div className="layout">
  <Sidebar />
  <div className="layout__main">
    <Navbar pageTitle={pageTitle} />
    <main className="layout__content">{children}</main>
  </div>
</div>
```

`children` is whatever you put between the opening and closing tags. This
is **composition**: the wrapper doesn't know or care what the page contains.

**`Sidebar`** builds its links from `NAV_ITEMS`:

```tsx
<NavLink
  to={item.path}
  className={({ isActive }) => isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'}
>
```

`NavLink` is like `<a>`, but it changes the URL **without reloading the page**,
and its `className` can be a function that receives `isActive`. That's how
the current page's link gets highlighted. `const Icon = item.icon` stores a
component in a capitalised variable so it can be rendered as `<Icon size={18} />`.

The logo is an inline **SVG with `<animate>`**. Animating `stroke-dashoffset`
from 300 to 0 makes the pulse line look like it's being drawn, with no CSS or
JavaScript.

**`Navbar`** shows the page title as the page's `<h1>`. The bell has an
`aria-label` because an icon-only button has no text for a screen reader to
read out.

### 4. The SCSS system — `styles/`

```
styles/
├── index.scss          ← imported once by index.tsx; imports everything below
├── variables.scss      ← design tokens: colours, spacing, radius, shadows
├── global.scss         ← reset + body defaults (imports variables first)
├── layout.scss         ← sidebar, navbar, page shell
├── pages/*.scss        ← one file per page
└── components/**/*.scss
```

Three ideas run through all of it:

1. **Design tokens.** Nothing hard-codes `16px` or `#6c63ff`. Files use
   `$space-4` and `$color-primary` from `variables.scss`. Changing the brand
   colour is then a one-line change, and spacing stays consistent because
   everything uses the same 4px-based scale (`$space-1` = 4px … `$space-12` =
   48px).
2. **BEM naming**: `block__element--modifier`, for example
   `metric-card__trend--positive`. Class names describe *what* something is, so
   styles don't accidentally leak between components. SCSS's `&` keeps it short:

   ```scss
   .metric-card {
     &__trend {          // → .metric-card__trend
       &--positive { ... }  // → .metric-card__trend--positive
     }
   }
   ```
3. **Import order matters.** `global.scss` imports `variables.scss` first, and
   `index.scss` imports `global` first, so every later file can use `$color-...`.
   That's why a new stylesheet only needs one `@import` line in the right
   `index.scss`.

---

## Part 2: The Dashboard

### 5. Data — types, mock data and formatters

```ts
export interface MetricCard {
  label: string;
  value: number;
  change: number;                        // percentage, positive or negative
  trend: 'up' | 'down' | 'neutral';
  format: 'currency' | 'percentage' | 'number';
  // false for metrics where a fall is good news, e.g. churn
  higherIsBetter?: boolean;
}
```

The key design choice is that **`value` is always a raw number** and `format`
says how to display it. The data stays usable for maths, and formatting
happens only in the UI. `mockMetrics` is an array of four of these, so the page
renders them with one `.map()`.

`mockRecentUsers` is `mockUsers.slice(0, 5)`, which is derived from the main list
rather than copied, so the Dashboard and Users page always show the same people.
Its type is `Pick<User, 'id' | 'name' | 'email' | 'status' | 'createdAt'>`.
**`Pick`** builds a smaller type from an existing one, listing only the fields
this list needs.

The formatters in `utils/index.ts` use the built-in **`Intl`** API:

```ts
formatCurrency(48250)   // "$48,250"
formatPercentage(12.5)  // "+12.5%"  (adds the + sign for positives)
formatDate('2024-01-12') // "Jan 12, 2024"
```

`Intl` handles thousands separators, currency symbols and month names, so
there's no need for a library like moment.js.

### 6. `Card.tsx` — the container

```tsx
const Card = ({ title, children }: CardProps) => (
  <div className="card">
    {title && <h3 className="card__title">{title}</h3>}
    <div className="card__body">{children}</div>
  </div>
);
```

A small component that's used everywhere. `{title && ...}` renders the heading
only when a title is given. (Before the Users page work it always rendered an
empty `<h3>`, which added a gap above untitled cards.)

### 7. `MetricCard.tsx` — one KPI

```tsx
const TrendIcon =
  metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;
...
<TrendIcon size={18} />
```

Picking a **component** into a variable and rendering it is the same trick the
Sidebar uses for icons. `formatValue()` switches on `metric.format`.

**The colour shows whether the change is good news, not which way it moved.**
Revenue going down is bad (red), but churn going down is good (green). The
arrow follows the direction, and the colour follows the meaning:

```tsx
const isGoodChange =
  metric.trend === 'up'
    ? metric.higherIsBetter !== false   // a rise is good unless lower is better
    : metric.higherIsBetter === false;  // a fall is good only when lower is better

className={clsx(
  'metric-card__trend',
  metric.trend === 'neutral'
    ? 'metric-card__trend--neutral'
    : isGoodChange
      ? 'metric-card__trend--positive'
      : 'metric-card__trend--negative'
)}
```

`higherIsBetter` is **optional and defaults to "true"** (`!== false` treats
`undefined` as true), so only metrics where lower is better, like
`Churn Rate` in `mockMetrics`, need to set it. The classes are named
`--positive`/`--negative` rather than `--up`/`--down` because they describe
the meaning, not the direction.

**`clsx`** builds the class list. It drops anything falsy, so `false && 'x'`
adds nothing, which is tidier than building class strings with template literals.

(The optional `comparisonLabel` prop was added later for the Analytics page. It
defaults to "than last month", so the Dashboard didn't need to change.)

### 8. `RevenueChart.tsx` — the area chart

Recharts charts are built from **nested components**, each adding one layer:

```tsx
<ResponsiveContainer width="100%" height={300}>   // fills the card's width
  <AreaChart data={data}>
    <defs>…linearGradient…</defs>                 // SVG gradient definitions
    <CartesianGrid vertical={false} />           // horizontal guide lines only
    <XAxis dataKey="month" />                    // which field goes along the bottom
    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
    <Tooltip content={<CustomTooltip />} />
    <Area dataKey="revenue" fill="url(#revGradient)" />
    <Area dataKey="target"  fill="url(#expGradient)" />
    <Legend />
  </AreaChart>
</ResponsiveContainer>
```

- **`ResponsiveContainer`** measures its parent and passes the size down. The
  chart needs a parent with a width, which the card provides.
- **The gradient fade**: `<linearGradient>` goes from 30% opacity at the top to
  0% at the bottom, and `fill="url(#revGradient)"` points the area at it by
  `id`. This makes a soft glow under the line instead of a solid block of colour.
- **`dataKey`** connects each part to a field in the data objects
  (`{ month, revenue, target }`).
- **`CustomTooltip`** replaces the default tooltip. Recharts passes it `active`,
  `payload` (the hovered values) and `label` (the month). It returns `null` when
  nothing is hovered.

### 9. `RecentUsers.tsx` — a list with status badges

Each row shows an avatar initial, name and email, the join date and a `Badge`.
The badge colour comes from a lookup object rather than an `if` chain:

```ts
export const USER_STATUS_BADGE = { active: 'success', inactive: 'warning', suspended: 'danger' };
...
<Badge label={user.status} variant={USER_STATUS_BADGE[user.status]} />
```

A lookup typed with `Record<Status, Variant>` must cover **every** status, so
adding a new one is a compile error until it gets a colour. (This map now
lives in `constants` and is shared with the Users page table.)

In the SCSS, `min-width: 1px` on `__info` plus `text-overflow: ellipsis` on the
email lets long emails end in "…" instead of pushing the date off the card. A
flex child won't shrink below its content without a `min-width`.

### 10. `Badge` and `Button` — small building blocks

Both follow the same pattern: a `variant` prop mapped to a BEM modifier class
with `clsx`.

`Button` is worth a closer look:

```tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?; size?; isLoading? }

const Button = ({ variant = 'primary', size = 'md', isLoading = false, children, disabled, ...rest }) => (
  <button className={clsx(...)} disabled={disabled || isLoading} {...rest}>
    {isLoading ? <span className="btn__spinner" /> : children}
  </button>
);
```

- **`extends ButtonHTMLAttributes`** means `Button` accepts everything a normal
  `<button>` does (`onClick`, `type`, `title`, `aria-*`…) without listing them.
- **`...rest`** collects those extra props and passes them on with `{...rest}`.
- **`isLoading`** swaps the label for a CSS spinner and disables the button, so
  a form can't be submitted twice.

### 11. `pages/Dashboard/index.tsx` — putting it together

```tsx
<PageWrapper pageTitle="Dashboard">
  <div className="dashboard">
    <div className="dashboard__metrics">
      {mockMetrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
    </div>
    <div className="dashboard__grid">
      <Card title="Revenue vs Target"><RevenueChart data={mockRevenueChart} /></Card>
      <Card title="Recent Users"><RecentUsers users={mockRecentUsers} /></Card>
    </div>
  </div>
</PageWrapper>
```

The page has no state and no logic. It only arranges components and passes
them data. `key={metric.label}` gives React a stable identity for each card in
the list. Labels are unique, so they work as keys.

The layout lives in `dashboard.scss`: `repeat(4, 1fr)` for the KPI row and
`2fr 1fr` for chart + list, so the chart gets two-thirds of the width.

---

## Fixed since this tutorial was first written

These issues came up while writing this guide and have since been fixed:

| Where | What was wrong | What changed |
|---|---|---|
| `pages/Dashboard/index.tsx` | Card title typo "Renenue vs Target" | Now "Revenue vs Target" |
| `MetricCard.tsx` | A `neutral` trend got the red `--down` class | Uses `--neutral` |
| `MetricCard.tsx` + `mockMetrics` | Churn going **down** showed in red | Colour now follows `higherIsBetter` (see section 7) |
| `RevenueChart.tsx` | `contentStyle` on `<Tooltip>` was ignored because a custom `content` is passed | Removed |
| `styles/global.scss` | `var(--color-bg)` / `var(--color-text-secondary)` were never defined | Use the SCSS `$color-bg` / `$color-text-secondary` |
| `recent-users.scss` | `text-overflow: ellipse` isn't valid CSS | `ellipsis` |
| `src/index.css` | Create React App leftover, never imported | Deleted |
| `config/routes.tsx` | Unused `label` field with typos | Removed (the sidebar reads `NAV_ITEMS`) |

Still open: **`dashboard.scss` has no media queries**, so the four KPI cards
squeeze together on small screens. That's part of the planned mobile layout
work.

## Where to take it next

- **Responsive sidebar**: collapse it to icons, or a hamburger menu, below ~900px.
- **Use real data**: the Dashboard could call `fetchUsers()` like the Users
  page does. "Active Users" and "Recent Users" would then come from the same
  source.
- **Clickable KPI cards**: link "Active Users" to `/users?status=active`.
