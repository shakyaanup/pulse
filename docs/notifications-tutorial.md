# Building the Notification Dropdown — a walkthrough

The bell in the top bar now:

- shows a **red badge** with the number of unread notifications ("9+" above nine)
- opens a **dropdown** listing each notification with an icon, title, message
  and a relative time ("12 minutes ago")
- marks a notification **read** when you click it, and takes you to the related
  page
- has a **"Mark all as read"** button
- closes on **a click outside** or the **Escape key**
- **remembers** read/unread state when you move between pages

```
src/
├── types/index.ts                           ← 1. Notification type
├── services/mockData.ts                     ← 2. mockNotifications
├── utils/index.ts                           ← 3. formatRelativeTime()
├── context/NotificationsContext.tsx         ← 4. shared state (React Context)
├── App.tsx                                  ← 4. provider wraps the routes
├── components/layout/
│   ├── NotificationBell.tsx                 ← 5. bell + badge + dropdown
│   ├── NotificationBell.test.tsx            ← 7. tests
│   └── Navbar.tsx                           ← uses <NotificationBell />
└── styles/
    ├── components/layout/notifications.scss ← 6. badge + panel styles
    └── global.scss                          ← 6. .visually-hidden helper
```

---

## The key problem: where does the state live?

The obvious place for "which notifications are read" is a `useState` inside the
bell. **That doesn't work in this app.** Look at how pages are built:

```tsx
// every page:
<PageWrapper pageTitle="Billing">   →   <Navbar />   →   <NotificationBell />
```

Each page renders **its own** `PageWrapper`, and so its own `Navbar` and bell.
When you go from Billing to Users, React unmounts the Billing page and
everything inside it, including the bell and its state. You'd mark everything
read, change page, and all three notifications would be unread again.

The fix is to **lift the state above the routes** so it outlives any single
page. Passing it down through props would mean threading it through every page
→ `PageWrapper` → `Navbar` → bell. That pattern is called *prop drilling*.
**React Context** lets any component read shared state directly.

---

## 1. The `Notification` type

```ts
export interface Notification {
  id: string;
  type: 'user' | 'billing' | 'alert' | 'report';
  title: string;
  message: string;
  createdAt: string; // ISO date-time
  read: boolean;
  link?: string;     // route to open when the notification is clicked
}
```

- **`type`** decides the icon and colour, so data and presentation stay
  separate. The data says *what kind* of notification it is, and the UI decides
  how that looks.
- **`createdAt` is a timestamp**, not text like "12 minutes ago". Store the
  facts and format them when displaying. "12 minutes ago" would be wrong a
  minute later.
- **`link?`** is optional (`?`), because not every notification has to go
  somewhere.

## 2. Mock data with "live" timestamps

```ts
const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

{ id: 'n1', type: 'alert', title: 'Payment failed', createdAt: minutesAgo(12), read: false, link: ROUTES.BILLING }
```

Fixed dates like `'2024-12-31T10:00'` would show "2 years ago" in a demo.
Building times **relative to when the app loads** means the dropdown always
looks current. Links use the `ROUTES` constants rather than typed strings, so
they can't point at a URL that doesn't exist.

## 3. `formatRelativeTime()` — "5 minutes ago"

```ts
const units = [['year', 31536000], ['month', 2592000], …, ['minute', 60]];
const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

for (const [unit, secondsInUnit] of units) {
  if (Math.abs(seconds) >= secondsInUnit) {
    return formatter.format(Math.round(seconds / secondsInUnit), unit);
  }
}
return 'just now';
```

- The loop goes from the **largest unit down** and uses the first one that
  fits, so 90 minutes becomes "2 hours ago", not "90 minutes ago".
- **`Intl.RelativeTimeFormat`** is built into the browser and handles the wording.
  `numeric: 'auto'` gives natural phrases like "yesterday" instead of "1 day
  ago". No date library is needed.
- `seconds` is **negative** for the past, and `RelativeTimeFormat` turns `-2,
  'hour'` into "2 hours ago".
- `now` is a parameter (defaulting to `new Date()`) so a test can pass a fixed
  time.

## 4. `NotificationsContext.tsx` — shared state

A context file has three parts.

**1. Create the context.**

```ts
const NotificationsContext = createContext<NotificationsContextValue | null>(null);
```

**2. A provider component that owns the state:**

```tsx
export const NotificationsProvider = ({ children, initialNotifications = mockNotifications }) => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAsRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead,
    markAllAsRead,
  }), [notifications, markAsRead, markAllAsRead]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};
```

**3. A custom hook to read it:**

```ts
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used inside <NotificationsProvider>');
  return context;
};
```

Why each piece is there:

- **`unreadCount` is derived**, not stored. It's calculated from
  `notifications`, so it can never be out of sync. This is the same rule used on
  every other page.
- **Immutable updates**: `.map()` returns a new array and `{ ...n, read: true }`
  a new object. React decides whether to re-render by comparing references, so
  changing `n.read = true` in place would silently fail to update the screen.
- **`useCallback`** keeps `markAsRead` the **same function** between renders.
  **`useMemo`** keeps `value` the same object until `notifications` actually
  changes. Every component using the context re-renders whenever `value` is a
  new object, and without these two that would happen on every render of the
  provider.
- **The `null` default + throwing hook**: if someone uses the bell outside the
  provider, they get a clear error message instead of
  `Cannot read properties of null`.
- **`initialNotifications` prop**: the app uses the mock data by default, and
  tests pass their own list.

**Placing the provider** in `App.tsx`:

```tsx
<NotificationsProvider>
  <Suspense fallback={…}>
    <Routes>…</Routes>
  </Suspense>
</NotificationsProvider>
```

It sits *outside* `<Routes>`, so it stays mounted while pages swap
underneath it. That's what makes read state survive navigation. It sits
*inside* `BrowserRouter` (in `index.tsx`), so its children can still use
routing.

## 5. `NotificationBell.tsx` — the component

### The badge

```tsx
<button
  aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
  aria-haspopup="dialog"
  aria-expanded={isOpen}
  onClick={() => setIsOpen((open) => !open)}
>
  <Bell size={18} />
  {unreadCount > 0 && <span className="notifications__badge" aria-hidden="true">{badgeText}</span>}
</button>
```

- **The badge only renders when there's something unread.** A "0" badge would
  draw attention for no reason.
- **`badgeText` caps at "9+"** so the circle never stretches into a pill.
- **Accessibility**: a screen reader can't see a red circle, so the count goes in
  the button's `aria-label` ("Notifications, 3 unread"), and the visual badge is
  `aria-hidden` so the number isn't read out twice. `aria-expanded` tells
  assistive tech whether the panel is open.
- **`setIsOpen((open) => !open)`**: the function form toggles from the latest
  value.

### Closing on outside click and Escape

> **Update:** this logic has since moved into a shared hook,
> `hooks/useDropdown.ts`, so the profile menu can use it too (see
> [profile-menu-tutorial.md](profile-menu-tutorial.md)). The bell now calls
> `const { isOpen, toggle, close, containerRef, triggerRef } = useDropdown();`.
> The code below is what runs inside the hook.

```tsx
useEffect(() => {
  if (!isOpen) return;

  const handlePointerDown = (event: MouseEvent) => {
    if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      bellRef.current?.focus();
    }
  };

  document.addEventListener('mousedown', handlePointerDown);
  document.addEventListener('keydown', handleKeyDown);
  return () => {
    document.removeEventListener('mousedown', handlePointerDown);
    document.removeEventListener('keydown', handleKeyDown);
  };
}, [isOpen]);
```

This is the most important pattern in the component.

- **Effects are for talking to things outside React.** The `document` is
  outside React, so listening to it belongs in `useEffect`.
- **Listeners only exist while open.** `if (!isOpen) return;` means nothing is
  attached when the dropdown is closed.
- **The cleanup function** (`return () => …`) removes the listeners when the
  dropdown closes or the component unmounts. Without it, every open would add
  another listener that never goes away (a memory leak), and old ones would keep
  firing.
- **`containerRef.contains(target)`**: the ref wraps both the bell and the panel.
  A click inside either one isn't "outside". That stops the bell's own click
  from closing the panel and immediately reopening it.
- **`mousedown`, not `click`**: it fires earlier, so the panel closes as soon as
  you press somewhere else.
- **Returning focus to the bell on Escape**: keyboard users would otherwise lose
  their place on the page.

### The list

```tsx
const TYPE_ICON: Record<Notification['type'], LucideIcon> = {
  user: UserPlus, billing: CreditCard, alert: TriangleAlert, report: BarChart3,
};
…
const Icon = TYPE_ICON[notification.type];
<Icon size={16} />
```

The lookup table is typed with `Record<Notification['type'], …>`, so adding a
new notification type is a **compile error** until it has an icon. The colour
comes from a modifier class built from the type:
`` `notifications__icon--${notification.type}` ``.

Each notification is a **`<button>`** (not a clickable `<div>`), so it gets keyboard
focus, Enter/Space activation and screen reader support for free.

```tsx
const handleSelect = (notification: Notification) => {
  markAsRead(notification.id);
  setIsOpen(false);
  if (notification.link) navigate(notification.link);
};
```

`useNavigate()` from React Router changes the page from code, which is what you
use when navigation happens as a *result* of an action rather than from a plain
link.

The unread dot includes `<span className="visually-hidden">(unread)</span>`. A
screen reader announces "Payment failed (unread)", while sighted users just see
the dot.

## 6. Styles — `notifications.scss`

### Positioning the badge and the panel

> **Update:** the panel rules below now live in a `dropdown-panel` mixin in
> `styles/mixins.scss`, shared with the profile menu. The panel is just
> `@include dropdown-panel(360px);`.

```scss
.notifications { position: relative; }        // anchor

.notifications__badge {
  position: absolute;
  top: 0; right: 0;
  transform: translate(35%, -35%);            // nudge onto the bell's corner
  border: 2px solid $color-bg;                // "cut-out" ring
}

.notifications__panel {
  position: absolute;
  top: calc(100% + #{$space-2});              // just below the bell
  right: 0;                                   // right edges line up
  max-width: calc(100vw - #{$space-8});       // never wider than the screen
  z-index: 20;                                // above page content (navbar is 10)
}
```

- **`position: relative` on the wrapper** makes it the reference point for
  everything `absolute` inside it.
- **The 2px ring in the navbar's background colour** makes the badge look cut
  out of the bell instead of pasted on top.
- **`#{$space-2}`** is SCSS *interpolation*. Inside `calc()` the SCSS variable
  has to be wrapped like this so its value is written into the CSS.
- **`right: 0`** opens the panel leftwards, because the bell is near the right
  edge of the screen.

### Small touches

- **Unread items** get a faint purple tint and a dot. Read items look plain.
- **`max-height: 400px; overflow-y: auto`** on the list keeps a long history
  scrolling inside the panel instead of running off the screen.
- **A 120 ms fade-and-slide** (`@keyframes notifications-in`) makes the panel
  feel smoother without slowing anything down.

### `.visually-hidden` (in `global.scss`)

This is the standard "screen-reader only" utility. It shrinks text to 1×1px and
clips it. `display: none` would hide it from screen readers too.

## 7. Tests — `NotificationBell.test.tsx`

```tsx
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
```

Create React App's Jest 27 can't load React Router v7. The bell only needs
`useNavigate`, so the test replaces the module with a fake. `{ virtual: true }`
tells Jest not to look for the real file. As a bonus, `mockNavigate` records
where the bell tried to navigate, which the test checks.

Each test renders the bell inside a real `NotificationsProvider` with its own
`initialNotifications`, so the tests don't depend on the mock data.

| Test | What it checks |
|---|---|
| unread count | Badge shows "2", accessible name is "Notifications, 2 unread" |
| all read | No badge, name is just "Notifications" |
| open/close | Bell toggles the dialog, and `aria-expanded` updates |
| Escape / outside | Both close it, and Escape returns focus to the bell |
| click a notification | Marks it read (count drops to 1), closes, navigates to `/billing` |
| mark all as read | Badge disappears, and the button hides itself |

The tests find elements **the way a user would**: by role and accessible name
(`getByRole('button', { name: /^Notifications/ })`). So the tests also check
that the accessibility labels are correct.

Run them with `npm test`.

---

## Where to take it next

- **Real-time updates**: with a backend, push new notifications over WebSockets
  and add them with `setNotifications((current) => [incoming, ...current])`.
  The badge updates automatically because `unreadCount` is calculated from the
  list.
- ~~**Persist read state**~~: done. The provider now uses
  `usePersistentState` (see the
  [saved data tutorial](auth-and-saved-data-tutorial.md)), so read state
  survives a reload.
- **Dismiss / delete**: add `removeNotification(id)` to the context, following
  the same pattern as `markAsRead`.
- **"View all" page**: a `/notifications` route with filters (unread only, by
  type) that reads the same context.
- **Keyboard arrows**: move focus between items with ↑/↓ for a full menu
  experience.
