# Building the Profile Menu — a walkthrough

The circle in the top-right corner is now a button. Clicking it opens a menu
with:

- the user's **photo**, or their **initials** if there's no photo or it fails
  to load
- **name, email and role**
- their **plan** and **member since** date
- links to **Team members** and **Billing & plan**
- a **Log out** button (it only closes the menu for now, since there's no
  sign-in system yet)

It closes the same way the notification panel does: click outside, press
Escape, or pick an item.

```
src/
├── hooks/useDropdown.ts                    ← 1. shared open/close logic (new)
├── components/common/Avatar.tsx            ← 2. photo-or-initials (new)
├── services/mockData.ts                    ← 3. mockCurrentUser
├── components/layout/
│   ├── ProfileMenu.tsx                     ← 4. the menu (new)
│   ├── ProfileMenu.test.tsx                ← 6. tests (new)
│   ├── NotificationBell.tsx                ← now uses useDropdown
│   └── Navbar.tsx                          ← renders <ProfileMenu />
└── styles/
    ├── mixins.scss                         ← 5. dropdown-panel mixin (new)
    ├── components/common/avatar.scss       ← 5. (new)
    └── components/layout/profile-menu.scss ← 5. (new)
```

---

## 1. `useDropdown` — writing your own hook

The notification bell already had about 30 lines of open/close logic: a
`useState` for open, two refs, and an effect that listens for outside clicks and
Escape. The profile menu needs **exactly the same behaviour**. Copying it would
mean fixing every future bug twice, so it moved into a **custom hook**:

```ts
export const useDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const toggle = useCallback(() => setIsOpen((open) => !open), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    // …mousedown outside → close, Escape → close + focus trigger…
    return () => { /* remove listeners */ };
  }, [isOpen]);

  return { isOpen, toggle, close, containerRef, triggerRef };
};
```

What makes something a hook:

- **It's just a function whose name starts with `use`** and which calls other
  hooks. React has no special registration step. The `use` prefix is how React
  (and the lint rules) know to apply the
  [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks): only call
  hooks at the top level of a component or another hook.
- **Each component gets its own copy of the state.** The bell and the profile
  menu both call `useDropdown()` but have separate `isOpen` values. A hook shares
  *logic*, not *state*. (Shared state is what Context is for, as in the
  notifications tutorial.)
- **It returns the refs** for the component to attach:
  `<div ref={containerRef}>` and `<button ref={triggerRef}>`. The hook doesn't
  need to know what the markup looks like.
- **`useCallback`** keeps `toggle` and `close` the same functions between
  renders, so they're safe to pass to child components.

Using it is one line, and the menu's own code is left with only what's
specific to the menu:

```tsx
const { isOpen, toggle, close, containerRef, triggerRef } = useDropdown();
```

**A nice side effect:** the two menus already coordinate. With notifications
open, clicking the avatar counts as a mousedown *outside* the notification
panel, so it closes while the profile menu opens. No extra code was needed.

## 2. `Avatar.tsx` — photo or initials

```tsx
const Avatar = ({ name, src, size = 'md' }: AvatarProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <span className={clsx('avatar', `avatar--${size}`)} aria-hidden="true">
      {showImage
        ? <img className="avatar__image" src={src} alt="" onError={() => setFailedSrc(src ?? null)} />
        : getInitials(name)}
    </span>
  );
};
```

Three cases:

| `src` | Result |
|---|---|
| `undefined` or `''` | Initials straight away (`Boolean('')` is `false`) |
| A working URL | The photo |
| A broken URL | The photo tries, `onError` fires, then initials |

**Why remember *which* URL failed, not just `true/false`?** With a plain
`hasError` boolean, once one image failed the avatar would show initials forever,
even if the user uploaded a new photo and `src` changed. Storing the failed
URL means a *new* `src` is automatically compared against the old failure and
gets a fresh try. No `useEffect` to "reset on change" is needed.

**`alt=""` and `aria-hidden`**: the avatar is decorative. The person's name is
always written next to it, or given to the button's `aria-label`, so a screen
reader saying "image, Jane Doe" would just repeat it. An empty `alt` is the
correct way to mark an image as decorative. A missing `alt` is not, because
screen readers then read out the file name.

`getInitials()` already existed from the Users page, so the avatar reuses it.

## 3. The current user — `mockCurrentUser`

```ts
export const mockCurrentUser: User = {
  id: 'me',
  name: 'Jane Doe',
  email: 'jane.doe@pulse.dev',
  role: 'admin',
  status: 'active',
  createdAt: '2023-11-02',
  avatarUrl: 'https://i.pravatar.cc/150?img=47',
};
```

It reuses the existing **`User`** type. The signed-in user is a user like any
other, with the same fields. "JD" matches the initials the header showed
before. To see the initials fallback, delete `avatarUrl`.

The photo comes from **pravatar.cc**, a free placeholder-avatar service. If it's
ever unavailable, `Avatar` falls back to initials, which is exactly the case the
fallback exists for.

## 4. `ProfileMenu.tsx` — the menu

### Props, not imports

```tsx
interface ProfileMenuProps {
  user: User;
  planName: string;
}
```

```tsx
// Navbar.tsx
const { subscription } = useSubscription();
<ProfileMenu user={mockCurrentUser} planName={subscription.plan.name} />
```

The menu doesn't import mock data. `Navbar` passes it in. So:

- **tests** can pass any user (with or without a photo) without touching mock
  data
- when real sign-in arrived, only `Navbar` changed: it now reads the user
  from `AuthContext` instead of `mockCurrentUser`

`planName` comes from `SubscriptionContext`, the same shared state the Billing
page uses. When you switch plans on Billing, the menu shows the new plan
straight away (see the Billing tutorial).

### The trigger button

```tsx
<button
  ref={triggerRef}
  aria-label={`Account menu for ${user.name}`}
  aria-haspopup="dialog"
  aria-controls="profile-menu-panel"
  aria-expanded={isOpen}
  onClick={toggle}
>
  <Avatar name={user.name} src={user.avatarUrl} size="sm" />
</button>
```

Before this change the avatar was a `<div>` with `cursor: pointer`. It looked
clickable, but a keyboard couldn't reach it and screen readers didn't know it was
a button. A real `<button>` gets focus, Enter/Space and an accessible name for
free. `aria-controls` connects the button to the panel's `id`.

### Details, links and log out

- **Details** use a `<dl>` (label/value pairs), the same pattern as the
  current plan card on the Billing page.
- **Links** are React Router **`<Link>`s**, not buttons that call `navigate()`.
  Moving to another page is what links are for. They show the URL on hover, can
  be opened in a new tab, and are announced as links. Each one calls `close` on
  click, so the menu doesn't stay open on the new page. (The notification items
  use `navigate()` because clicking them does two things: marks the item as read
  *and* navigates.)
- **Log out** is a `<button>`, because it's an action, not a destination.
  When this menu was built there was no sign-in yet, so it only closed the
  menu:

  ```tsx
  const handleLogout = () => {
    // TODO: sign the user out once authentication exists
    close();
  };
  ```

  It now receives an `onLogout` prop and calls it, and a **Reset demo data**
  item was added above it. See the
  [login and saved data tutorial](auth-and-saved-data-tutorial.md).

## 5. Styles

### A mixin for the shared panel look

Both dropdowns need the same panel: position under the trigger, surface colour,
border, shadow, z-index, fade-in. That now lives in one **mixin**:

```scss
// styles/mixins.scss
@mixin dropdown-panel($width) {
  position: absolute;
  top: calc(100% + #{$space-2});
  right: 0;
  width: $width;
  …
  animation: dropdown-in 0.12s ease-out;
}
```

```scss
.notifications__panel { @include dropdown-panel(360px); }
.profile-menu__panel  { @include dropdown-panel(280px); }
```

A mixin is like a function for CSS. It takes arguments (here, the width) and
writes its rules wherever it's included. `mixins.scss` is imported in
`global.scss` right after `variables.scss`, so every later file can use it. This
mirrors the JavaScript side: a hook for shared behaviour, a mixin for shared
looks.

### The avatar circle

```scss
.avatar {
  border-radius: $radius-full;
  overflow: hidden;           // clips the square photo into a circle
  &__image {
    width: 100%; height: 100%;
    object-fit: cover;        // fill without stretching
  }
}
```

**`object-fit: cover`** scales the photo to fill the circle and crops whatever
overflows, like a background image with `background-size: cover`. Without it,
a portrait photo would be squashed.

### Small touches

- The avatar shows a **ring on hover and while open** (`[aria-expanded='true']`).
  The style reads the same attribute screen readers use, so how it looks and
  what assistive tech is told can't get out of sync.
- `:focus-visible` gives keyboard users a purple ring, while mouse clicks
  don't show one.
- The email gets `text-overflow: ellipsis` so a very long address can't stretch
  the panel.

## 6. Tests — `ProfileMenu.test.tsx`

`Link` from React Router is replaced with a plain `<a>` (CRA's Jest can't load
Router v7):

```tsx
jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
}), { virtual: true });
```

The tests can still check each link's `href`, which is all we need.

| Test | What it checks |
|---|---|
| shows the photo | `<img>` uses `avatarUrl`, no initials |
| no photo | `avatarUrl: ''` shows "JD", no `<img>` |
| broken photo | `fireEvent.error(img)` switches to "JD" |
| opens with details | Name, email, role, plan, member-since date |
| links | Correct `href`s, and clicking one closes the menu |
| log out | Closes the menu |
| Escape / outside | Both close it, and Escape returns focus to the avatar button |

`fireEvent.error` simulates the browser failing to load the image, which
would be awkward to test by hand.

Run them with `npm test`.

---

## Where to take it next

- ~~**Real sign-out**~~: done. See the
  [login and saved data tutorial](auth-and-saved-data-tutorial.md).
- **Profile page**: a `/profile` route where the user can edit their name and
  upload a photo. `Avatar` already handles the new `src`.
- **Reuse `Avatar`**: the Users table and Recent Users list still have their own
  avatar styles. Switching them to `<Avatar>` would give them photo support.
- **Keyboard arrows**: ↑/↓ to move between menu items.
