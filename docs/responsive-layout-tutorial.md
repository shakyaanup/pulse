# Making Pulse Responsive — a walkthrough

Pulse was built for a desktop screen. On a phone the 240px sidebar took up most
of the screen, and on an iPad the plan cards and the users table ran off the
right edge. This guide covers how every page was made to work at three sizes:

| Screen | Width | Sidebar | Example |
|---|---|---|---|
| **Desktop / laptop** | 1024px and up | Full sidebar with labels | MacBook, iPad landscape |
| **Tablet** | 768 – 1023px | Icon-only rail (72px) | iPad portrait |
| **Phone** | up to 767px | Hidden; slides in from a ☰ button | iPhone, Android |

```
src/
├── styles/
│   ├── variables.scss                   ← 1. breakpoint values
│   ├── mixins.scss                      ← 1. mobile / tablet-down / laptop-down mixins
│   ├── layout.scss                      ← 3. rail, drawer, overlay, navbar
│   ├── pages/*.scss                     ← 4. page grids
│   └── components/**/*.scss             ← 4–5. cards, tables, dropdowns
├── components/layout/
│   ├── PageWrapper.tsx                  ← 2. owns the drawer state
│   ├── Sidebar.tsx                      ← 2. drawer behaviour
│   ├── Navbar.tsx                       ← 2. ☰ button
│   └── PageWrapper.test.tsx             ← 7. drawer tests
└── components/
    ├── analytics/DataTable.tsx          ← 5. scroll wrapper
    └── common/UserTable.tsx             ← 5. cell classes for the card layout
```

---

## 1. One set of breakpoints, used everywhere

Before this work, the few media queries in the project used different numbers:
`1200px`, `600px` and `768px`. When every file picks its own widths, the layout
changes in small steps at slightly different sizes, and nobody can remember
which number to use.

Now the widths are defined **once**:

```scss
// variables.scss
$bp-mobile: 767px;   // phones
$bp-tablet: 1023px;  // tablets in portrait, e.g. iPad
$bp-laptop: 1199px;  // small laptops, iPad landscape
```

and wrapped in **mixins** so nobody writes raw media queries:

```scss
// mixins.scss
@mixin mobile {
  @media (max-width: $bp-mobile) { @content; }
}
@mixin tablet-down { … $bp-tablet … }
@mixin laptop-down { … $bp-laptop … }
```

Using one reads like plain English, and it sits **inside the rule it changes**:

```scss
.dashboard__metrics {
  grid-template-columns: repeat(4, 1fr);

  @include laptop-down { grid-template-columns: repeat(2, 1fr); }
  @include mobile      { grid-template-columns: 1fr; }
}
```

**`@content`** is the key mixin feature. Whatever you put between the braces
when you `@include` the mixin is placed where `@content` is. The mixin
supplies the `@media` wrapper and you supply the rules.

**Why 767 / 1023 / 1199?** They're the widths just below common device sizes
(768px is iPad portrait, 1024px is iPad landscape, 1200px is a typical laptop
breakpoint). `max-width: 767px` means "up to and including 767", so a 768px iPad
gets the tablet layout.

**Desktop-first:** the base styles are for big screens and the mixins *remove*
space as the screen shrinks. Mobile-first (base styles for phones, `min-width`
queries to add space) is just as valid. Desktop-first was the smaller change
here because the existing styles were all written for desktop.

---

## 2. The phone drawer — state, focus and scroll

### Where the state lives

The ☰ button is in `Navbar`, and the drawer is `Sidebar`. They're siblings,
so the open/closed state goes in their **shared parent**, `PageWrapper`:

```tsx
const PageWrapper = ({ pageTitle, children }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeNav = useCallback(() => {
    setIsNavOpen(false);
    menuButtonRef.current?.focus();          // back to the ☰ button
  }, []);

  return (
    <div className="layout">
      <Sidebar isOpen={isNavOpen} onClose={closeNav} />
      {isNavOpen && <div className="layout__overlay" onClick={closeNav} aria-hidden="true" />}
      <div className="layout__main">
        <Navbar
          pageTitle={pageTitle}
          isNavOpen={isNavOpen}
          onMenuClick={() => setIsNavOpen(true)}
          menuButtonRef={menuButtonRef}
        />
        …
```

This is "lifting state up" in its simplest form: the closest common parent owns
the state, and children get the value plus callbacks.

Unlike notifications and the subscription, this state **doesn't** need a
context. Each page renders its own `PageWrapper`, so going to another page
creates a fresh one with the drawer closed, which is exactly what should happen.

**`menuButtonRef`** is created in `PageWrapper` and passed to `Navbar` as a
normal prop, which attaches it to the ☰ button. Then `closeNav` can put focus
back on that button, wherever the close came from: the ✕ button, Escape or the
overlay.

### What happens while it's open — `Sidebar.tsx`

```tsx
useEffect(() => {
  if (!isOpen) return;

  closeButtonRef.current?.focus();                       // 1. focus into the drawer

  const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };   // 2. Escape
  const wideScreen = window.matchMedia?.('(min-width: 768px)');
  const handleResize = () => { if (wideScreen?.matches) onClose(); };   // 3. rotated / resized

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';               // 4. page behind can't scroll
  document.addEventListener('keydown', handleKeyDown);
  wideScreen?.addEventListener('change', handleResize);

  return () => {                                         // 5. undo all of it
    document.body.style.overflow = previousOverflow;
    document.removeEventListener('keydown', handleKeyDown);
    wideScreen?.removeEventListener('change', handleResize);
  };
}, [isOpen, onClose]);
```

1. **Focus moves into the drawer** (to its ✕ button), so keyboard and screen
   reader users start where the new content is.
2. **Escape closes it**, as with the header dropdowns.
3. **`matchMedia`** is JavaScript's version of a media query. If an iPad is
   rotated from portrait to landscape while the drawer is open, the drawer
   layout no longer applies, so it closes itself. `?.` keeps it from crashing
   in test environments that don't have `matchMedia`.
4. **Scroll lock**: with `body { overflow: hidden }`, swiping on the drawer
   doesn't scroll the page behind it.
5. **Cleanup restores everything**, including the *previous* overflow value
   rather than assuming it was empty.

Each nav link also gets `onClick={isOpen ? onClose : undefined}`. Navigating to
another page already closes the drawer, but tapping the page you're **already**
on doesn't navigate, so without this the drawer would stay open.

### The ☰ button — `Navbar.tsx`

```tsx
<button
  ref={menuButtonRef}
  className="navbar__icon-btn navbar__menu-btn"
  aria-label="Open menu"
  aria-controls="app-sidebar"
  aria-expanded={isNavOpen}
  onClick={onMenuClick}
>
  <Menu size={20} />
</button>
```

`aria-controls` points at the sidebar's `id`, and `aria-expanded` says whether
it's open. These are the same ARIA attributes the notification bell uses. The
button is always in the HTML, and CSS shows it only on phones.

---

## 3. Layout CSS — rail, drawer and overlay

### Tablet: the icon rail

```scss
@media (min-width: #{$bp-mobile + 1}) and (max-width: $bp-tablet) {
  .sidebar {
    width: 72px;
    &__app-name { display: none; }
    &__link     { justify-content: center; }
    &__label    { @include visually-hidden; }
  }
}
```

- **`#{$bp-mobile + 1}`** does maths inside a media query: 767 + 1 = 768. So
  "tablet" starts exactly where "phone" ends, with no gap or overlap.
- The labels are **visually hidden, not `display: none`**. `display: none`
  would remove "Dashboard", "Analytics"… from screen readers too, leaving
  links with only an icon and no name. `visually-hidden` (now a mixin, reused
  by the `.visually-hidden` class) keeps the text readable by assistive
  technology.
- Each `NavLink` has `title={item.label}`, so hovering an icon shows its name
  as a tooltip.

### Phone: the off-canvas drawer

```scss
@include mobile {
  .sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 50;
    width: min(280px, 85vw);
    transform: translateX(-100%);       // parked just off the left edge
    visibility: hidden;
    transition: transform 0.25s ease, visibility 0s linear 0.25s;

    &--open {
      transform: translateX(0);
      visibility: visible;
      transition: transform 0.25s ease;
    }
  }
}
```

- **`position: fixed`** takes the sidebar out of the page layout, so the content
  gets the full screen width.
- **`transform: translateX(-100%)`** slides it left by its own width.
  Animating `transform` is smooth because the browser can move the element
  without recalculating the page layout.
- **`width: min(280px, 85vw)`**: 280px normally, but never more than 85% of a
  very small screen, so a strip of the page always shows behind the drawer.
- **The `visibility` trick**: a drawer that's only *moved* off-screen still has
  focusable links, so a keyboard user pressing Tab would focus invisible
  links. `visibility: hidden` removes them from the Tab order. The
  `0s linear 0.25s` transition **delays** hiding until the slide-out
  animation finishes, so you see it slide away. When opening, `--open`
  overrides the transition so it becomes visible immediately.

### The overlay

```scss
.layout__overlay {
  position: fixed;
  inset: 0;                                   // top/right/bottom/left: 0
  z-index: 40;                                // under the drawer (50), over the page
  background-color: rgba(0, 0, 0, 0.6);

  @media (min-width: #{$bp-mobile + 1}) { display: none; }
}
```

It dims the page and catches the "tap outside to close" click. It's
`aria-hidden` because it's purely visual, and the ✕ button and Escape are the
accessible ways to close.

### Two layout fixes that made everything else work

```scss
.layout__main { min-width: 0; }
.sidebar      { height: 100vh; flex-shrink: 0; }
```

- **`min-width: 0`**: a flex child is never narrower than its content by
  default. One wide chart or table would push `layout__main`, and the whole
  page, wider than the screen. That's what made content run off the right
  edge. `min-width: 0` lets it shrink, and the wide content handles its own
  overflow (section 5).
- **`flex-shrink: 0`** stops the flex container from squashing the sidebar when
  space is tight.

### A CSS order bug worth knowing about

The first version showed the ☰ button on iPad as well, even though its CSS said
`display: none` above 767px. The reason:

```scss
.navbar__menu-btn { display: none; }      // written first
.navbar__icon-btn { display: flex; }      // written later in the same file
```

The button has **both** classes. They have equal specificity (one class each),
so **the rule that comes later wins**, and `display: flex` overrode
`display: none`. The fix was to move `.navbar__menu-btn` after
`.navbar__icon-btn`, with a comment explaining why. When two rules have equal
specificity, order decides, so check order before reaching for `!important`.

---

## 4. Page grids

### Dashboard and Analytics — fewer columns as space shrinks

```scss
.dashboard__metrics {
  grid-template-columns: repeat(4, 1fr);
  @include laptop-down { grid-template-columns: repeat(2, 1fr); }  // 2 × 2
  @include kpi-scroll-row;                                         // phones: swipe
}

.dashboard__grid {
  grid-template-columns: 2fr 1fr;                // chart + recent users
  > * { min-width: 0; }
  @include laptop-down { grid-template-columns: 1fr; }
}
```

`> * { min-width: 0; }` is the same fix as `layout__main`. Recharts'
`ResponsiveContainer` measures its parent, and a grid cell that won't shrink
leaves the chart stuck at its old width.

### KPI cards on phones: one swipeable row

Stacking four KPI cards on a phone pushed the charts a whole screen down. So on
phones the cards become **one horizontal row you swipe**, as in many banking
and analytics apps. It's a mixin shared by Dashboard and Analytics:

```scss
@mixin kpi-scroll-row {
  @include mobile {
    display: flex;
    gap: $space-3;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-padding: 0 $space-4;
    margin: 0 (-$space-4);
    padding: 0 $space-4;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }

    > * {
      flex: 0 0 78%;
      scroll-snap-align: start;
    }
  }
}
```

- **`flex: 0 0 78%`**: each card is 78% of the row, never growing or
  shrinking. The **next card peeks in** from the right edge, and that visible
  slice is what tells people the row scrolls. A card at exactly 100% would hide
  it, and with the scrollbar hidden nobody would know there's more.
- **Scroll snap**: `scroll-snap-type: x mandatory` on the row plus
  `scroll-snap-align: start` on each card makes a swipe always come to rest
  with a card's left edge lined up. `scroll-padding` moves that resting point
  16px in, so it matches the page's padding instead of touching the screen edge.
- **Edge to edge**: the negative margin + equal padding (the same trick as the
  analytics tables) lets cards slide under the screen edge while the first one
  still lines up with the content below.
- **Hidden scrollbar**: on touch screens the swipe and the peeking card are
  enough. `scrollbar-width` covers Firefox and `::-webkit-scrollbar` covers
  Chrome and Safari.
- **Keyboard access**: the row has `role="region"`, `aria-label="Key metrics"` and
  `tabIndex={0}`. A scrollable area with nothing focusable inside can't be
  scrolled by keyboard unless it can receive focus itself. With focus, the
  arrow keys scroll it, and screen readers announce it as "Key metrics".

### Billing — "3 or 1, never 2 + 1"

The first attempt used a self-adjusting grid:

```scss
grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
```

It created as many 260px+ columns as fit, which is clever, but at iPad width
that was **two**, leaving Enterprise alone on a second row. With exactly three
pricing cards, a 2 + 1 layout looks broken. So the rule is explicit:

```scss
.billing__plans-grid {
  grid-template-columns: repeat(3, 1fr);
  @include mobile { grid-template-columns: 1fr; }
}
```

The cards get slightly less padding on tablets (`@include tablet-down` in
`plancard.scss`) so the narrower columns still fit their feature lists. Auto-fit
grids work well for **lists of unknown length**, like the user cards below.
For a fixed set of items, choose the column counts yourself.

### Smaller tweaks

| Where | Phone change |
|---|---|
| `layout__content`, `.card` | Padding 24px → 16px, which gives more room for content |
| Navbar | Smaller padding and title, and a long title ends in "…" |
| KPI values | 28px → 24px, in a swipeable row (above) |
| Analytics header | Title above a **full-width** date range picker (each button `flex: 1`) |
| User filters | Search on its own row, and the two selects share the next |
| Recent users | Join date hidden, because name + email + badge use the space |

---

## 5. Tables on small screens

Tables are the hardest part of responsive design, because columns can't wrap.
Pulse uses **two different strategies**, chosen by what the table is for.

### Analytics tables: scroll sideways

The Top Pages and Plan Breakdown tables are **numbers you compare across
columns**. Turning them into cards would make that comparison harder, so they
keep their shape and scroll inside a wrapper:

```tsx
<div className="data-table__scroll">
  <table className="data-table">…</table>
</div>
```

```scss
.data-table__scroll {
  overflow-x: auto;
  @include mobile {
    margin: 0 (-$space-4);     // stretch to the card's edges…
    padding: 0 $space-4;       // …but keep the content aligned
  }
}
.data-table { @include mobile { min-width: 420px; } }
```

The negative margin + matching padding lets the scroll area use the card's full
width while the first column still lines up with the card title.
`min-width: 420px` stops the columns from squashing into unreadable slivers
before scrolling starts.

The scroll is on the **wrapper, not the page**. Only the table scrolls, and
the rest of the page stays put.

### Users table: becomes cards

The users table is a **list of people with actions**. Nobody compares joined
dates across rows. Scrolling sideways to reach the Suspend button would be
annoying, so below 1200px each row becomes a card:

```
┌───────────────────────────────┐
│ (SC) Sarah Connor     ACTIVE  │   user     status
│      sarah@acme.com           │
│ Admin           Jan 12, 2024  │   role     date
│ [   Edit   ] [  Suspend   ]   │   actions  actions
└───────────────────────────────┘
```

This uses **CSS Grid template areas**. Each cell got a class in
`UserTable.tsx` (`user-table__cell--user`, `--status`, …), and the CSS
arranges them:

```scss
@include laptop-down {
  display: block;                                // the <table> stops being a table
  thead { @include visually-hidden; }

  tbody {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));   // 2 per row on iPad, 1 on phones
    gap: $space-3;
  }

  tbody tr {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'user status'
      'role date'
      'actions actions';
    …
  }

  &__cell--user    { grid-area: user; }
  &__cell--status  { grid-area: status; justify-self: end; }
  …
}
```

- **`grid-template-areas`** works like a little map. Each string is a row and
  each word a named cell. `'actions actions'` makes the buttons span both
  columns.
- **`auto-fill` is the right tool here**: unlike the three pricing cards, this
  is a list of any length, so "as many 280px+ columns as fit" gives two cards
  per row on an iPad and one on a phone.
- **`thead` is visually hidden, not removed**, so screen readers still hear the
  column headers.
- **`:has()`**: the loading and empty rows contain a single wide cell.
  `tr:has(.user-table__empty)` (a row *that contains* the empty cell) spans
  the full width and drops the card styling. `:has()` is the "parent
  selector" CSS lacked for years, and all current browsers support it.
- The **markup didn't change**, apart from class names. It's still a real
  `<table>` with `<th>`s, so desktop gets the normal table and smaller screens
  get cards from the same HTML.

---

## 6. Dropdowns on phones

On a phone the bell and avatar aren't at the screen's edge, so a 360px panel
anchored to the bell would hang off the left side. The shared
`dropdown-panel` mixin handles this once for both menus:

```scss
@mixin dropdown-panel($width) {
  position: absolute; top: calc(100% + 8px); right: 0; width: $width;
  …
  @include mobile {
    position: fixed;            // relative to the screen, not the bell
    top: calc(64px + #{$space-2});   // just below the 64px navbar
    left: $space-4;
    right: $space-4;
    width: auto;                // left + right decide the width
  }
}
```

Setting both `left` and `right` with `width: auto` makes the panel exactly as
wide as the screen minus 16px each side, on any phone. Because both dropdowns
use the mixin, both were fixed in one place.

---

## 7. Testing

### Automated tests — `PageWrapper.test.tsx`

jsdom (the browser stand-in Jest uses) **doesn't apply CSS**, so these tests
check behaviour and accessibility, not appearance:

| Test | What it checks |
|---|---|
| opens | ☰ adds `sidebar--open`, `aria-expanded` becomes true, focus moves to ✕, overlay appears |
| scroll lock | `body` overflow is `hidden` while open and restored after |
| Escape | Closes, and focus returns to ☰ |
| overlay | Clicking it closes the drawer and removes the overlay |
| link | Choosing a page closes the drawer |

The tests render the real `Navbar`, notification bell and profile menu, so they
need the real providers (`SubscriptionProvider`, `NotificationsProvider`) and a
fake React Router. Inside `jest.mock()`, only variables whose names start with
`mock` may be used (Jest moves mocks above the imports, so other variables
wouldn't exist yet). That's why the type is called `MockLinkProps`.

### Checking the layout by eye

Every page was screenshotted at **390px** (iPhone), **820px** (iPad portrait),
**1024px** (iPad landscape) and **1440px** (desktop), checking that
`document.documentElement.scrollWidth` equals the screen width, which means
nothing scrolls sideways.

To try it yourself:

1. In Chrome, open DevTools → **Toggle device toolbar** (Cmd+Shift+M).
2. Pick **iPhone 12 Pro**, then **iPad Air**, and switch orientation.
3. Or drag the responsive width slowly from wide to narrow and watch each
   breakpoint change.

Desktop browsers have a minimum window width (often around 500px), so making
the window narrow won't show the real phone layout. Use the device toolbar
instead.

---

## Where to take it next

- **Swipe to close**: listen for `touchstart` / `touchmove` on the drawer and close
  it when the user swipes left.
- **Focus trap**: while the drawer is open, keep Tab cycling inside it (the
  overlay already blocks clicks, but Tab can still reach the page behind).
- **Card layout for analytics tables on very small phones**, if scrolling feels
  awkward in testing on real devices.
- **Test on real devices**: emulation is close but not perfect, especially for
  touch, safe areas around the notch, and the mobile browser's address bar
  changing the height of `100vh`.
