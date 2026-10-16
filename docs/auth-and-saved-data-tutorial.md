# Login, Protected Pages and Saved Data — a walkthrough

This guide covers two features that touch the whole app:

1. **Saved data.** Suspending a user, editing a user, reading notifications,
   switching plans and being signed in all survive a page reload. A
   **"Reset demo data"** option in the profile menu starts everything fresh.
2. **Login and logout.** A `/login` page, an `AuthContext`, and **protected
   routes**: signed-out visitors are sent to the login page, then brought back
   to the page they wanted.

The edit-user form and invoice history were built at the same time. They're
covered in the [Users](users-page-tutorial.md) and
[Billing](billing-page-tutorial.md) tutorials.

```
src/
├── services/
│   ├── storage.ts                     ← 1. safe localStorage wrapper
│   ├── usersService.ts                ← 3. users saved by the fake API
│   └── authService.ts                 ← 4. fake login request
├── hooks/usePersistentState.ts        ← 2. useState that remembers
├── context/
│   ├── NotificationsContext.tsx       ← 2. now saved
│   ├── SubscriptionContext.tsx        ← 2. now saved
│   └── AuthContext.tsx                ← 4. the signed-in user
├── components/
│   ├── auth/RequireAuth.tsx           ← 5. the route guard
│   └── common/Logo.tsx                ← 6. shared by sidebar + login
├── pages/Login/index.tsx              ← 6. the login page
├── App.tsx                            ← 5. public vs protected routes
└── setupTests.ts                      ← 8. clears saved data between tests
```

---

## Part 1: Saved data

### 1. `storage.ts` — a wrapper that can't crash the app

```ts
const PREFIX = 'pulse:v1:';

export const readStorage = <T>(key: string): T | undefined => {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
};
```

`localStorage` stores **strings only**, so values go in with `JSON.stringify`
and come out with `JSON.parse`. Three details make it production-safe:

- **`try/catch` everywhere.** `localStorage` throws in some private browsing
  modes, when storage is full, or when the user has disabled it. Saving is a
  nice-to-have, so it must never break the app. On failure it quietly falls
  back to in-memory state.
- **A prefix on every key** (`pulse:v1:users`). Everything on `localhost:3000`
  shares one storage area. The prefix lets `clearAppStorage()` remove *only*
  Pulse's data.
- **A version in the prefix** (`v1`). If the shape of saved data changes later
  (say, users gain a required `department` field), old saved data could break
  the app. Bumping to `v2` makes the app ignore everything saved by `v1`.

### 2. `usePersistentState` — `useState` that remembers

```ts
export const usePersistentState = <T>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    const stored = readStorage<T>(key);
    return stored === undefined ? initialValue : stored;
  });

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  return [value, setValue] as const;
};
```

It's used exactly like `useState`, which is the point of a custom hook:

```ts
// before
const [notifications, setNotifications] = useState(initialNotifications);
// after
const [notifications, setNotifications] = usePersistentState('notifications', initialNotifications);
```

- **Lazy initial state**: passing a *function* to `useState` means it runs on
  the first render only. Reading storage is relatively slow, and React calls the
  component function on every render, so `useState(readStorage(key))` would read
  storage every time and then throw the result away.
- **Saving belongs in an effect.** Writing to `localStorage` is a side effect
  (it changes something outside React), so it runs in `useEffect` after
  each change, not during rendering.
- **`as const`** makes the return type a fixed pair `[T, setter]` rather than an
  array of "either", so destructuring keeps the right types.

`NotificationsContext` and `SubscriptionContext` each changed **one line** to
use it. Nothing that reads those contexts needed to change.

**A lint detail:** the contexts' `useCallback`s now list `setNotifications` /
`setSubscription` as dependencies. React guarantees a `useState` setter never
changes, and the lint rule knows that for `useState` itself. Through a custom
hook it can't tell, so the setter is listed. It never changes, so this costs
nothing.

### 3. Users are saved by the *service*, not the page

Notifications and the subscription live in React state, so the hook saves them.
Users are different: they come from `usersService`, which plays the role of
the server. So **the fake server saves them**, the way a real database would:

```ts
const loadUsers = (): User[] =>
  (readStorage<User[]>(USERS_KEY) ?? mockUsers).map((user) => ({ ...user }));

export const updateUser = async (id: string, changes: UserChanges): Promise<User> => {
  await delay(MOCK_SAVE_LATENCY_MS);
  const users = loadUsers();
  // …check the user exists and the email isn't taken…
  const updated = { ...existing, ...changes };
  writeStorage(USERS_KEY, users.map((user) => (user.id === id ? updated : user)));
  return { ...updated };
};
```

- **`??` (nullish coalescing)**: use saved users if there are any, otherwise the
  seed data. Unlike `||`, it only falls back on `null`/`undefined`, so a saved
  *empty* list would be kept.
- **`updateUser` behaves like `PATCH /users/:id`**: it takes only the changed
  fields, returns the full updated user, and **rejects with an error** when a
  server would (the user doesn't exist, or the email is taken).
- The pages don't know any of this. The Users page calls `updateUser`, and when a
  real backend exists, only this file changes.

The Dashboard's "Recent Users" now loads through `fetchUsers()` too, so edits
and suspensions made on the Users page show up there.

### Reset demo data

```ts
const handleResetDemo = () => {
  clearAppStorage();
  window.location.reload();
};
```

Clearing storage alone wouldn't change what's on screen, because React state
still holds the old values. A reload restarts the app, and every
`usePersistentState` then finds nothing saved and starts from the mock data.
The session is cleared too, so you're signed out, which is why the menu item
sits next to "Log out".

---

## Part 2: Login and protected pages

### 4. `authService.ts` and `AuthContext.tsx`

```ts
// authService.ts — pretends to be POST /auth/login
export const login = async (email: string, password: string): Promise<User> => {
  await delay(MOCK_LATENCY_MS);
  const emailMatches = email.trim().toLowerCase() === mockCurrentUser.email.toLowerCase();
  if (!emailMatches || password !== DEMO_PASSWORD) {
    throw new Error('Incorrect email or password.');
  }
  return { ...mockCurrentUser };
};
```

**One error message for both mistakes.** "No account with that email" would
let anyone check which emails are registered (called *user enumeration*).
"Incorrect email or password" doesn't reveal which part was wrong.

The context follows the same pattern as the other two:

```tsx
export const AuthProvider = ({ children, initialUser = null }) => {
  const [user, setUser] = usePersistentState<User | null>('session', initialUser);

  const login = useCallback(async (email, password) => {
    setUser(await loginRequest(email, password));
  }, [setUser]);

  const logout = useCallback(() => setUser(null), [setUser]);
  …
};
```

- **`user === null` means signed out.** There's no separate `isLoggedIn` flag
  that could disagree with it.
- **`login` doesn't catch errors.** It lets the wrong-password error reach the
  login form, which is the place that can show it. Handling errors where you can
  do something useful with them is the general rule.
- **The session is saved**, so a reload keeps you signed in.

> **This is a demo, not real security.** A real app would never accept a
> password checked in the browser, and would store a **session token** (ideally
> in an `httpOnly` cookie that JavaScript can't read) rather than the user
> object. Anyone can open DevTools and edit `localStorage`. Real protection
> always happens on the server, which refuses requests without a valid
> session. Front-end route protection only decides *what to show*.

`AuthProvider` is the **outermost** provider in `App.tsx`, because everything
else, including which pages you may see, depends on who's signed in.

### 5. Protected routes — `RequireAuth` and `App.tsx`

```tsx
// RequireAuth.tsx
const RequireAuth = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }
  return <Outlet />;
};
```

```tsx
// App.tsx
<Routes>
  <Route path={ROUTES.LOGIN} element={<Login />} />

  <Route element={<RequireAuth />}>
    {routeConfig.map(({ path, component: Component }) => (
      <Route key={path} path={path} element={<Component />} />
    ))}
    <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
  </Route>
</Routes>
```

This is a **layout route**: a `<Route>` with an `element` but no `path`.
It wraps the routes nested inside it.

- **`<Outlet />`** is where the matched child page renders. So when signed in,
  `RequireAuth` renders nothing of its own, only the page.
- **One guard covers every page.** Adding a new page to `routeConfig` protects
  it automatically, with no chance of forgetting a check on one page.
- **`state={{ from: location }}`** attaches the page the visitor was trying to
  reach to the redirect. The login page reads it afterwards.
- **`replace`**: the guarded URL is *replaced* by `/login` in the history, so
  pressing Back after signing in doesn't bounce off the guard again.

**Logging out needs no navigation code.** `logout()` sets `user` to `null`,
React re-renders, `RequireAuth` sees no user, and it redirects to `/login`.
The guard turns "signed out" into "on the login page" automatically.

### 6. The login page

```tsx
const redirectTo =
  (location.state as LocationState | null)?.from?.pathname ?? ROUTES.DASHBOARD;

if (user) {
  return <Navigate to={redirectTo} replace />;
}

const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!email.trim() || !password) {
    setError('Enter your email and password.');
    return;
  }
  setError(null);
  setIsSubmitting(true);
  try {
    await login(email, password);
    navigate(redirectTo, { replace: true });
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Something went wrong.');
    setIsSubmitting(false);
  }
};
```

- **`event.preventDefault()`** stops the browser's built-in form submission,
  which would reload the page and lose all React state.
- **A real `<form>` with `onSubmit`** (not a button `onClick`) means pressing
  Enter in either field signs in, and password managers recognise the form.
  `autoComplete="email"` / `"current-password"` help them fill it in.
- **`noValidate`** turns off the browser's own validation bubbles, so errors
  appear in the app's style instead. The checks still happen, in our code.
- **`isLoading` on the button** (a `Button` prop that's existed since the
  start) shows a spinner and disables it, so the form can't be sent twice.
- **Errors are announced**: the message has `role="alert"`, and the inputs get
  `aria-invalid` plus `aria-describedby` pointing at the message, so a screen
  reader announces the problem and connects it to the fields. The red border
  comes from CSS on `[aria-invalid='true']`, the same attribute again.
- **`err instanceof Error`**: in TypeScript a caught value is `unknown`, since
  anything can be thrown. Checking before reading `.message` keeps it type-safe.

**The demo account box.** A portfolio visitor can't guess a password, so the
page shows the demo credentials and a **"Fill in demo account"** button.
They're kept in `mockData.ts` (`DEMO_PASSWORD`), next to the user they belong
to, so the login page and the fake service can't disagree.

**`Logo.tsx`**: the animated Pulse mark used to be written out inside
`Sidebar`. The login page needed it too, so it became a component. Its unused
`id="pulsePath"` was removed, because two copies on one page would mean two
elements with the same id, which HTML doesn't allow.

**Form styles are shared.** `.form-field` and `.form-error` live in
`styles/components/common/form.scss`. The edit-user form uses the same classes.

### 7. The header uses the real user

```tsx
// Navbar.tsx
const { user, logout } = useAuth();
…
{user && (
  <ProfileMenu
    user={user}
    planName={subscription.plan.name}
    onLogout={logout}
    onResetDemo={handleResetDemo}
  />
)}
```

The profile menu was already built to receive its user as a prop (see the
profile menu tutorial), so switching from `mockCurrentUser` to the signed-in
user was a change in `Navbar` only. Its "Log out" button now calls `onLogout`
instead of a `TODO`.

---

## 8. Testing

### Saved data must not leak between tests

```ts
// setupTests.ts
afterEach(() => {
  window.localStorage.clear();
});
```

Without this, a test that suspends Sarah would leave her suspended for every
test after it, and tests would pass or fail depending on their order. Clearing
storage after every test keeps each one independent.

### What's covered

| File | Checks |
|---|---|
| `usePersistentState.test.tsx` | Starts from the initial value; a change survives a remount (a stand-in for a reload); invalid saved JSON is ignored; `clearAppStorage` leaves other sites' keys alone |
| `usersService.test.ts` | Updates are saved and returned by the next fetch; a taken email is rejected (case-insensitive); keeping your own email is fine |
| `RequireAuth.test.tsx` | Signed out → redirect to `/login` carrying the original page; signed in → the page |
| `Login.test.tsx` | Empty form → error; wrong password → error, no navigation; demo account → signed in and sent to the remembered page; already signed in → redirected |
| `NotificationBell.test.tsx` | Read notifications stay read after a remount |
| `UserManagement.test.tsx` | A suspension survives a remount |

**`renderHook`** (from Testing Library) tests a hook directly, with no
component around it. **Unmounting and rendering again** stands in for a page
reload: React state is gone, and only what's in `localStorage` remains.

Router pieces are replaced with tiny fakes that **show what they would do**:

```tsx
Navigate: ({ to, state }) => <p>Redirect to {to} from {JSON.stringify(state)}</p>,
Outlet: () => <p>Protected page</p>,
```

The test then just reads the screen: "Redirect to /login from
{"pathname":"/billing"}".

---

## Trying it

1. Open the app. You land on **`/login`**.
2. Type a wrong password: "Incorrect email or password."
3. Click **Fill in demo account** → **Sign in**.
4. Suspend someone, edit someone, mark notifications read, switch plan.
   **Reload the page.** Everything is as you left it, and you're still signed in.
5. Sign out, then open `/billing` directly. You're sent to the login page, and
   after signing in you land **on Billing**, not the Dashboard.
6. Profile menu → **Reset demo data** to start fresh.

You can watch the saved data in Chrome DevTools → **Application** →
**Local Storage** → `http://localhost:3000`. Look for the `pulse:v1:` keys.

---

## Where to take it next

- **A real backend**: swap the bodies of `authService.login`, `fetchUsers` and
  `updateUser` for `apiClient` calls. No component changes.
- **Session expiry**: save an `expiresAt` with the session and treat an expired
  one as signed out.
- **Roles**: a `RequireRole role="admin"` guard (same pattern as `RequireAuth`)
  so viewers can't open the Users page.
- **Sync across tabs**: listen for the `storage` event, which fires in *other*
  tabs when `localStorage` changes, so logging out in one tab signs out all of them.
