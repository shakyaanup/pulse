# Making the Users Page Dynamic — a walkthrough

The Users page (`/users`) used to show two hard-coded rows and filters that did
nothing. It now:

- **loads** users through an async service, with loading and error states
- **filters** live by search text (name or email), status and role
- **suspends / reactivates** users, and the stats update immediately
- shows **"Showing X of Y users"** and an empty state when nothing matches
- has **tests** for all of the above

```
src/
├── types/index.ts                         ← 1. UserFilterValues type
├── services/usersService.ts               ← 2. fetchUsers() — fake network call
├── constants/index.ts                     ← 3. USER_STATUS_BADGE (shared)
├── utils/index.ts                         ← 4. capitalize(), getInitials()
├── components/common/
│   ├── UserFilters.tsx                    ← 5. controlled filter inputs
│   ├── UserTable.tsx                      ← 6. renders rows from props
│   ├── RecentUsers.tsx                    ← uses the shared status map
│   └── Card.tsx                           ← title is now optional
├── pages/UserManagement/
│   ├── index.tsx                          ← 7. state, fetching, filtering
│   └── UserManagement.test.tsx            ← 8. tests
└── styles/pages/user-management.scss      ← count + error styles
```

---

## Why mock data and not a free API?

Free user APIs (randomuser.me, dummyjson) don't have the `role` and `status`
fields the page filters on. `mockUsers` already matches the `User` type, so the
mock data is wrapped in an **async function** that behaves like an API. The page
can't tell the difference, and switching to a real backend later changes one
line.

---

## 1. `UserFilterValues` — one object for all filters

```ts
export interface UserFilterValues {
  search: string;
  status: User['status'] | 'all';
  role: User['role'] | 'all';
}
```

`User['status'] | 'all'` reuses the existing union (`'active' | 'inactive' |
'suspended'`) and adds `'all'`. Keeping the three filters in **one object** means
one `useState`, one "reset" (`setFilters(DEFAULT_FILTERS)`), and one value to put
in the URL later if you want shareable filters.

---

## 2. `services/usersService.ts` — a fake network request

```ts
export const fetchUsers = async (): Promise<User[]> => {
  await delay(600);
  return mockUsers.map((user) => ({ ...user }));
};
```

- The **600 ms delay** makes the loading state real. Without it you'd never see
  "Loading users..." and might ship a page that breaks on a slow network.
- It returns **copies** of each user. If the page changed a user directly, it
  would also change the shared `mockUsers` array used by the Dashboard.
- To use a backend, replace the body with `return apiClient.get<User[]>('/users');`.

---

## 3 & 4. Small shared helpers

**`USER_STATUS_BADGE`** (in `constants`) maps a status to a badge colour:
`active → success`, `inactive → warning`, `suspended → danger`. `RecentUsers`
had its own private copy of this map. It now lives in one place and both
components import it.

**`getInitials('Sarah Connor')` → `"SC"`** for the avatar, and
**`capitalize('admin')` → `"Admin"`** for the role column. Both live in `utils`
because they're plain functions with no React in them, so they can be reused
and tested anywhere.

---

## 5. `UserFilters.tsx` — controlled inputs

Before, the inputs had no `value` or `onChange`, so typing did nothing.
Each input is now **controlled**: its value comes from props, and every change
goes back up to the page:

```tsx
<input
  value={filters.search}
  onChange={(e) => onChange({ ...filters, search: e.target.value })}
/>
```

`{ ...filters, search: ... }` creates a **new object** with one field changed.
React compares state by reference, so changing the existing object
(`filters.search = ...`) would not trigger a re-render.

Other details:
- The status `<select>` previously listed "Viewer", which is a role. It now has
  the real statuses plus "All statuses", and the role select gained "All roles".
- A **"Clear filters"** button appears only when a filter is active.
- Stats show `–` until data loads, so the page doesn't show "0 users" during
  loading.
- `aria-label`s give each input an accessible name, which the tests also use to
  find them.

---

## 6. `UserTable.tsx` — rows from props

The table no longer contains any data. It receives `users` and renders one row
per user with `.map()`, using `user.id` as the `key`. The body has three states:

```tsx
{isLoading ? <LoadingRow/> : users.length === 0 ? <EmptyRow/> : users.map(...)}
```

The loading and empty rows use `colSpan={5}` so the message spans the full
table width. The empty-state style (`user-table__empty`) already existed in the
SCSS and was just unused.

The action button changes with the status: **Suspend** (red) for active users,
**Reactivate** for suspended ones. The table doesn't change any data itself. It
calls `onToggleSuspend(user.id)` and the page decides what happens. "Edit" is
disabled with a "coming soon" tooltip, because a button that does nothing when
clicked looks broken.

---

## 7. `pages/UserManagement/index.tsx` — where the logic lives

### Fetching with `useEffect`

```tsx
useEffect(() => {
  let ignore = false;
  fetchUsers()
    .then((data) => { if (!ignore) setUsers(data); })
    .catch(() => { if (!ignore) setError('Could not load users.'); })
    .finally(() => { if (!ignore) setIsLoading(false); });
  return () => { ignore = true; };
}, [reloadKey]);
```

- **The `ignore` flag**: if you leave the page before the request finishes, the
  cleanup function sets `ignore = true`, so the late response doesn't update
  state on a page that's gone. In development, React's StrictMode runs effects
  twice on purpose to catch missing cleanup like this.
- **`reloadKey`**: "Try again" increments this number. Because it's in the
  dependency array, the effect runs again and re-fetches.
- **Why `setIsLoading(true)` isn't inside the effect**: the project's React Hooks
  lint rule flags calling `setState` directly in an effect body, because it
  causes an extra render. On the first load `isLoading` already starts as
  `true`; on retry, `handleRetry` resets it in the click handler.

### Derived state with `useMemo`

```tsx
const filteredUsers = useMemo(() => users.filter(...), [users, filters]);
```

`filteredUsers` is **not** stored in state. It's calculated from `users` +
`filters` whenever either one changes. If it were stored separately, every
suspend or filter change would have to update two pieces of state, and missing
one would show stale rows. The stats (`total / active / suspended`) are derived
the same way, which is why suspending someone updates the "Active" count
immediately.

### Updating a user immutably

```tsx
setUsers((current) =>
  current.map((user) =>
    user.id === userId ? { ...user, status: newStatus } : user
  )
);
```

- `setUsers(current => ...)`, the **function form**, always works from the
  latest state, even if several updates happen together.
- `.map` builds a new array, and `{ ...user, status }` builds a new object for
  the changed user only. The other users keep the same object, which React can
  use to skip work.

---

## 8. `UserManagement.test.tsx` — testing what the user sees

The tests use React Testing Library, which finds elements the way a user
would: by text, label and role.

```tsx
userEvent.type(screen.getByLabelText('Search users'), 'shield');
expect(tableRows()).toHaveLength(2);
```

What's covered:
1. "Loading users..." appears, then all 10 users load
2. Searching by email matches the right people
3. Status + role filters combine, the empty state shows, and "Clear filters" resets
4. Suspend → status badge and "Active" count update → Reactivate reverses it

`await screen.findByText(...)` waits for the 600 ms fake request. `findBy*`
retries until the element appears, while `getBy*` checks once.

The layout is mocked (`jest.mock('../../components/layout', ...)`) for two
reasons: the sidebar isn't what's being tested, and Create React App's Jest 27
can't load React Router v7.

Run the tests with:

```bash
npm test
```

---

## Where to take it next

- **Edit user**: a modal with a form (name, role) that updates state the same
  way suspend does.
- **Pagination**: once there are more than ~20 users, slice `filteredUsers` per
  page. Since it's already derived, pagination is just one more step.
- **Filters in the URL**: put `filters` in the query string with
  `useSearchParams` so a filtered view can be bookmarked.
- **Debounced search**: with a real API, wait ~300 ms after typing stops
  before sending a request.
