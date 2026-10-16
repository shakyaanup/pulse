# Making the Users Page Dynamic — a walkthrough

The Users page (`/users`) used to show two hard-coded rows and filters that did
nothing. It now:

- **loads** users through an async service, with loading and error states
- **filters** live by search text (name or email), status and role
- **suspends / reactivates** users, and the stats update immediately
- **edits** users (name, email, role) in a modal form with validation
- **saves** every change, so it survives a page reload
- shows **"Showing X of Y users"** and an empty state when nothing matches
- has **tests** for all of the above

```
src/
├── types/index.ts                         ← 1. UserFilterValues type
├── services/usersService.ts               ← 2. fetchUsers(), updateUser() — fake API
├── constants/index.ts                     ← 3. USER_STATUS_BADGE (shared)
├── utils/index.ts                         ← 4. capitalize(), getInitials()
├── components/common/
│   ├── UserFilters.tsx                    ← 5. controlled filter inputs
│   ├── UserTable.tsx                      ← 6. renders rows from props
│   ├── Modal.tsx                          ← 9. reusable <dialog> modal
│   ├── EditUserModal.tsx                  ← 9. the edit form
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
calls `onToggleSuspend(user.id)` and the page decides what happens. **Edit**
works the same way: it calls `onEdit(user)` (see section 9). Its
`aria-label` is `Edit Sarah Connor`, because a screen reader listing ten
buttons all called "Edit" wouldn't say which user each one belongs to.

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

### Saving the change — an *optimistic* update

Suspensions are now saved through the service (see the
[saved data tutorial](auth-and-saved-data-tutorial.md)):

```tsx
const handleToggleSuspend = (userId: string) => {
  const user = users.find((u) => u.id === userId);
  if (!user) return;

  const status = user.status === 'suspended' ? 'active' : 'suspended';
  replaceUser({ ...user, status });                               // 1. show it now
  updateUser(userId, { status }).catch(() => replaceUser(user));  // 2. save; undo on failure
};
```

This is an **optimistic update**: the screen changes immediately, *assuming*
the save will work, and quietly reverts if it doesn't. It suits small, easily
undone actions like a toggle. Waiting 400 ms after every click would make the
app feel slow.

---

## 9. Editing a user — `Modal` and `EditUserModal`

### A modal built on `<dialog>`

```tsx
const Modal = ({ isOpen, onClose, title, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}
    >
      …
```

The browser's **`<dialog>` element with `showModal()`** provides what a modal
needs, which used to take a library or a lot of code:

| You get | Why it matters |
|---|---|
| A backdrop (`::backdrop` in CSS) | The page behind dims |
| Focus moves into the dialog and **can't Tab out** | Keyboard users can't get lost behind it |
| Escape closes it | Expected keyboard behaviour |
| It sits above everything (the "top layer") | No `z-index` battles |
| Focus returns to the Edit button on close | Keyboard users keep their place |

The React parts:

- **`isOpen` is the source of truth.** `<dialog>` has its own open/closed
  state, and the effect keeps it matching React's. It's the same "effects
  connect React to things outside it" idea as the dropdowns.
- **`onCancel` + `preventDefault()`**: Escape fires a `cancel` event, and the
  browser would close the dialog itself. Preventing that and calling `onClose`
  lets React make the change, so the two never disagree.
- **Backdrop clicks**: the visible box (`.modal__content`) fills the dialog, so
  a click whose target is the `<dialog>` element itself must have landed on the
  backdrop.
- **`useId()`** generates a unique id to connect the title to the dialog
  (`aria-labelledby`), so a screen reader announces "Edit user, dialog".

### The form

```tsx
const EditUserModal = ({ user, onClose, onSave }) => (
  <Modal isOpen={user !== null} onClose={onClose} title="Edit user">
    {user && <EditUserForm key={user.id} user={user} onCancel={onClose} onSave={onSave} />}
  </Modal>
);
```

- **`user: User | null`** means one prop says both *whether* it's open and *who*
  is being edited. They can't disagree.
- **`key={user.id}`** is important. The form copies the user into its own
  state (`useState(user.name)`), and that initial value is only read on
  the **first** render. Without the key, editing Sarah and then John would show
  Sarah's details. A different `key` tells React it's a *different* form, so it
  starts fresh.

### Two layers of validation

```tsx
// 1. In the browser: instant, no request
const fieldErrors = validate(name, email);   // empty name? malformed email?
setErrors(fieldErrors);
if (Object.keys(fieldErrors).length > 0) return;

// 2. On the "server": things only it can know
try {
  await onSave({ name: name.trim(), email: email.trim(), role });
} catch (err) {
  setSaveError(err.message);   // "Another user already has that email address."
}
```

Some things the browser can check instantly (is this an email?). Others only
the server knows (is this email already used by *anyone*?), because the browser
may not have every user, or they may have changed since it loaded. Real apps
need both, and the server's check is the one that actually protects the data.

Errors are tied to their fields: `aria-invalid` on the input, and
`aria-describedby` pointing at the message under it, so a screen reader reads
"Email, invalid entry, Enter a valid email address…".

### The page

```tsx
const [editingUser, setEditingUser] = useState<User | null>(null);

const handleSaveUser = async (changes: UserChanges) => {
  if (!editingUser) return;
  const updated = await updateUser(editingUser.id, changes);
  replaceUser(updated);
  setEditingUser(null);
};
```

This one is **not** optimistic, unlike suspend. The form waits for the save,
because the save can fail with an error the user must fix (a taken email), and
the form has to stay open to show it. If `updateUser` throws, the two lines after
it never run and the error goes back to the form's `catch`.

`UserChanges` is `Partial<Omit<User, 'id' | 'createdAt'>>`: "some of the
user's fields, but never the id or join date". The type itself prevents editing
fields that shouldn't change.

---

## 10. `UserManagement.test.tsx` — testing what the user sees

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
5. A suspension survives a "reload" (unmount, then render again)
6. Edit opens with the user's details, saves name + role, checks the fields,
   shows the server's "email taken" error while staying open, and Cancel
   discards changes

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

- **Add / delete users**: the modal and `updateUser` pattern extend naturally
  to `createUser` and `deleteUser` (with a confirmation modal).
- **Pagination**: once there are more than ~20 users, slice `filteredUsers` per
  page. Since it's already derived, pagination is just one more step.
- **Filters in the URL**: put `filters` in the query string with
  `useSearchParams` so a filtered view can be bookmarked.
- **Debounced search**: with a real API, wait ~300 ms after typing stops
  before sending a request.
