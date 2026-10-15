# Building the Analytics Page — a walkthrough

This guide explains how the Analytics page (`/analytics`) was built, one file at a
time, and why each piece is shaped the way it is. Read it alongside the code.

The page has four parts:

1. **A date range picker** (7D / 30D / 90D / 12M) that drives everything else
2. **Four KPI cards**: visitors, sign-ups, conversion rate, revenue
3. **Three charts**: visitors vs sign-ups (lines), traffic sources (donut), revenue by plan (stacked bars)
4. **Two sortable breakdown tables**: top pages and plan breakdown

```
src/
├── types/index.ts                        ← 1. data shapes
├── services/analyticsMockData.ts         ← 2. fake "API"
├── components/analytics/
│   ├── chartTheme.ts                     ← 3. shared chart colours
│   ├── ChartTooltip.tsx                  ← 4. one tooltip for all charts
│   ├── DateRangePicker.tsx               ← 5. the range buttons
│   ├── TrafficChart.tsx                  ← 6. line chart
│   ├── RevenueByPlanChart.tsx            ← 7. stacked bar chart
│   ├── TrafficSourcesChart.tsx           ← 8. donut chart
│   ├── DataTable.tsx                     ← 9. generic sortable table
│   └── index.ts                          ← barrel file
├── components/common/MetricCard.tsx      ← 10. small change
├── pages/Analytics/index.tsx             ← 11. the page itself
└── styles/
    ├── pages/analytics.scss              ← 12. page layout
    └── components/analytics/*.scss       ← component styles
```

---

## The big idea: one piece of state

The whole page is driven by **one** `useState`:

```tsx
const [range, setRange] = useState<DateRange>('30d');
const data = useMemo(() => getAnalyticsData(range), [range]);
```

Every chart, card and table reads from `data`. When you click "90D",
`setRange('90d')` runs → React re-renders → `useMemo` sees `range` changed and
calls `getAnalyticsData('90d')` → every child receives new props. No child keeps
its own copy of the data, so nothing can drift out of sync.

This is the most important React habit on the page: **keep the minimum state, and
derive everything else from it.**

---

## 1. `types/index.ts` — describe the data first

Before writing UI, we define what the data looks like:

```ts
export type DateRange = '7d' | '30d' | '90d' | '12m';

export interface TrafficPoint {
  label: string;
  visitors: number;
  signups: number;
}
// ...TopPage, PlanBreakdown, AnalyticsData, etc.
```

`DateRange` is a **union of string literals**. TypeScript will now reject
`setRange('1y')` at compile time, which is the point of writing types first.

`PlanBreakdown` uses `plan: Plan['name']`. That's an *indexed access type*: it
reuses the `'Starter' | 'Growth' | 'Enterprise'` union already defined on `Plan`
instead of repeating it. If a plan is renamed in one place, TypeScript flags the
other.

`AnalyticsData` is the full "API response" for one range. Every component
receives a slice of it.

---

## 2. `services/analyticsMockData.ts` — a fake API

The existing pages import plain arrays from `mockData.ts`. Analytics needs data
that **changes with the date range**, so this file exports a function instead:

```ts
export const getAnalyticsData = (range: DateRange): AnalyticsData => { ... }
```

The function has the same shape a real API call would have
(`apiClient.get<AnalyticsData>(`/analytics?range=${range}`)`), so the page won't
need to change when a backend exists.

Things worth reading in this file:

- **`RANGE_CONFIG`**: each range picks a number of points and a bucket size.
  7D and 30D use one bar per day, 90D uses one per week (13 points), 12M uses one
  per month. 90 daily bars would be unreadable, which is why real analytics
  tools do the same.
- **`wave()`**: uses `Math.sin` to make the numbers look organic but
  **deterministic**. `Math.random()` would give different numbers on every
  render, so the chart would jump around and couldn't be tested.
- **Totals are computed, not hard-coded.** The "Visitors" KPI is the sum of the
  chart points, conversion rate is `signups / visitors`, and each plan's revenue
  share is its revenue divided by the total. The cards, charts and tables
  therefore always agree with each other.
- **`END_DATE`** is fixed to 31 Dec 2024 to match the rest of the mock data
  (invoices, subscriptions), so date labels stay consistent across the app.

---

## 3. `components/analytics/chartTheme.ts` — no magic colours

All colours and axis styles live in one place:

```ts
export const CHART_COLORS = { primary: 'hsl(234, 89%, 64%)', accent: ..., ... };
export const AXIS_TICK = { fill: '#9999bb', fontSize: 12 };
```

`primary` and `accent` are the same values the Dashboard's `RevenueChart` already
uses, so both pages match. `compactNumber` turns `12400` into `12.4K` for axis
labels, using the built-in `Intl.NumberFormat`. No library is needed.

---

## 4. `ChartTooltip.tsx` — one tooltip, many charts

Recharts lets you replace its tooltip:

```tsx
<Tooltip content={<ChartTooltip valueFormatter={formatCurrency} />} />
```

When you pass an *element* (not a component), Recharts **clones it** and adds
`active`, `payload` and `label`. We only add our own prop, `valueFormatter`, so the
same tooltip shows `1,234` on the traffic chart and `$1,234` on the revenue chart.

---

## 5. `DateRangePicker.tsx` — a controlled component

```tsx
<DateRangePicker value={range} onChange={setRange} />
```

The picker **doesn't own the selected range**. It shows `value` and reports clicks
through `onChange`. This is called a *controlled component*, the same pattern as
`<input value onChange>`. Because the page owns the state, every other component
can read it.

Two accessibility details:
- `aria-pressed` tells screen readers which button is on.
- `role="group"` with `aria-label="Date range"` announces the buttons as one set.

`DATE_RANGE_OPTIONS` is exported so the page can show the long description
("Last 30 days") as the heading without duplicating the list.

---

## 6. `TrafficChart.tsx` — two Y axes

Visitors (~1,000/day) and sign-ups (~35/day) differ about 30×. On one axis the
sign-ups line would be flat along the bottom. The fix is a second axis:

```tsx
<YAxis yAxisId="visitors" />
<YAxis yAxisId="signups" orientation="right" />
<Line yAxisId="visitors" dataKey="visitors" ... />
<Line yAxisId="signups"  dataKey="signups"  ... />
```

Each `<Line>` declares which axis it's measured against.

`minTickGap={24}` on the X axis makes Recharts skip labels when they'd overlap.
That's why the 30-day view shows "Dec 2, Dec 5, Dec 8…" and not all 30 dates.

`itemSorter={null}` on `<Legend>`: Recharts 3 sorts legend entries A–Z by
default. `null` keeps them in the order the lines are drawn.

---

## 7. `RevenueByPlanChart.tsx` — stacked bars

```tsx
<Bar dataKey="starter"    stackId="revenue" ... />
<Bar dataKey="growth"     stackId="revenue" ... />
<Bar dataKey="enterprise" stackId="revenue" radius={[4, 4, 0, 0]} ... />
```

Bars that share a `stackId` are drawn on top of each other. The bar's total height
is total revenue, and each colour shows one plan's part. Only the top bar
gets rounded corners (`radius` = top-left, top-right, bottom-right, bottom-left),
otherwise you'd see rounded corners in the middle of the stack.

---

## 8. `TrafficSourcesChart.tsx` — a donut and its legend

A donut is a `<Pie>` with an `innerRadius`. Each slice gets its own colour through
`<Cell>` children:

```tsx
<Pie data={data} dataKey="visitors" nameKey="name" innerRadius={55} outerRadius={85}>
  {data.map((source, index) => <Cell key={source.name} fill={SERIES_COLORS[index]} />)}
</Pie>
```

Below it, instead of Recharts' `<Legend>`, there's a plain `<ul>` showing name,
count and percentage. Donut slices are hard to compare by eye, so printing the
numbers next to the colour makes the chart readable. It also acts as a small
breakdown table.

---

## 9. `DataTable.tsx` — one table component, any data

Both tables on the page use one **generic** component. The caller describes the
columns and the table handles rendering and sorting:

```tsx
const topPageColumns: Column<TopPage>[] = [
  { key: 'path', header: 'Page', render: (row) => <span>{row.path}</span> },
  { key: 'views', header: 'Views', align: 'right', render: (row) => row.views.toLocaleString() },
  ...
];

<DataTable columns={topPageColumns} rows={data.topPages} rowKey="path"
           initialSort={{ key: 'views', direction: 'desc' }} />
```

Key ideas:

- **Generics: `<T,>`.** `Column<TopPage>` means `key` must be a real field of
  `TopPage`, so `key: 'veiws'` is a compile error. In a `.tsx` file a bare `<T>`
  is read as a JSX tag, and the trailing comma (`<T,>`) tells TypeScript it's a
  type parameter.
- **Sorting raw values, displaying formatted ones.** Sorting uses `row[key]`
  (the number `28673`), while `render` displays `"28,673"`. Sorting the formatted
  strings would put `"9,000"` after `"10,000"`.
- **`[...rows].sort()`**: `Array.prototype.sort` sorts *in place*. Sorting
  `rows` directly would mutate a prop, which is a common React bug. We copy
  first.
- **`useMemo`** re-sorts only when `rows` or the sort settings change.
- **Click behaviour**: the first click on a column sorts biggest-first, and
  clicking the same column again flips the direction. `aria-sort` on the `<th>`
  tells screen readers the current order.

---

## 10. `MetricCard.tsx` — a small, backwards-compatible change

The existing card always said "than last month". On Analytics the comparison is
"vs previous period" (7 days vs the 7 before, and so on), so we added an
**optional** prop with the old text as its default:

```tsx
const MetricCard = ({ metric, comparisonLabel = 'than last month' }: MetricCardProps) => ...
```

The Dashboard doesn't pass the prop, so its output is unchanged. When you extend
a shared component, add optional props with sensible defaults so existing
callers keep working.

---

## 11. `pages/Analytics/index.tsx` — putting it together

The page itself contains very little logic:

1. Hold `range` in state.
2. Derive `data` from it with `useMemo`.
3. Lay out `Card`s and pass each one the slice of `data` it needs.

The column definitions (`topPageColumns`, `planColumns`) are declared **outside**
the component. They never change, so there's no reason to rebuild them on every
render.

The churn column renders the existing `Badge` component and turns red at 10% or
more. Existing components are reused here, not rewritten.

---

## 12. Styles

`styles/pages/analytics.scss` handles layout:

- `analytics__metrics`: four-column grid
- `analytics__grid`: `2fr 1fr` (big chart + sidebar chart), and
  `analytics__grid--even` for the two tables side by side
- `> * { min-width: 0; }`: grid items default to `min-width: auto`, so a wide
  table or chart can push its column wider than the grid allows. Setting
  `0` lets them shrink.
- **Media queries** collapse to two columns, then one, on smaller screens.

The component styles in `styles/components/analytics/` follow the same BEM
naming as the rest of the project (`date-range-picker__option--active`) and only
use variables from `variables.scss`.

---

## Where to take it next

- **Real data**: replace the body of `getAnalyticsData` with
  `apiClient.get<AnalyticsData>(...)`. Because it becomes async, the page would
  need `useEffect` (or a library like TanStack Query) plus loading and error
  states.
- **Range in the URL**: store the range in a query string
  (`/analytics?range=90d`) using `useSearchParams` from react-router, so a
  chosen view can be bookmarked and shared.
- **Custom date range**: add a "Custom" option with two date inputs.
- **CSV export**: the `DataTable` columns already describe the data, so
  generating a CSV from them is straightforward.
