# UI polish QA (10–15 min)

Run after **`pnpm` dashboard typecheck** and a successful **Xcode build** (`⌘B` on **PulseFill**).

**Pass bar:** polish feels **natural**, not performative. If anything feels cheesy or distracting, note it and trim (see “Cut list” at bottom).

---

## Prep (1 min)

- [ ] Dashboard: staff signed in, `NEXT_PUBLIC_*` env correct
- [ ] iOS: signed in on simulator or device
- [ ] Optional: `NEXT_PUBLIC_REALTIME_DEBUG` **off** unless debugging Realtime

---

## Dashboard (~6–8 min)

### Overview (`/overview`)

- [ ] Metrics **count up** on first load (not an instant pop of final numbers)
- [ ] **Refresh** updates numbers; **“Updated …”** time changes
- [ ] Brief **flash** on a card when counts change after refresh (subtle, not strobing)
- [ ] No layout jump while loading → loaded

### Claims (`/claims`)

- [ ] **“Updated …”** appears after load and after silent refresh (poll / Realtime)
- [ ] **Empty state**: headline + short explanation (not a single lonely line)
- [ ] **Claim cards**: status-colored **border** + **hover** lift feels stable, not “floaty”

### Open slots list (`/open-slots`)

- [ ] Rows use **accent border** by status; **hover** works on the whole row
- [ ] **Sidebar** badges (claims / open): soft pill, readable, not loud

### Slot detail (`/open-slots/[id]`)

- [ ] Top block uses **slot row shell** (accent border matches status)
- [ ] **“Updated …”** moves when you refresh / poll / Realtime fires
- [ ] **Confirm** / **Retry** buttons: slight **press scale**, disabled state obvious
- [ ] **Timeline** empty: dashed panel + helpful copy (not one vague line)
- [ ] **Notification logs** empty: explains what will appear after send-offers
- [ ] **Offers** empty: points to retry / workflow

### Global

- [ ] **Dark** theme: chips, borders, muted text still readable
- [ ] Nothing feels **wordy**: if an empty state is too long, flag for a shorter line

---

## iOS (~4–6 min)

### Claim result (after a test claim)

- [ ] Icon + title + body **fade/slide up** once (`.appearUp()`), not jittery
- [ ] **Back** / **View activity** / **Done** — no layout jump when appearing

### Activity

- [ ] Cards **appear up** when list loads; **not** re-animating oddly on pull-to-refresh alone (scroll position may re-trigger `onAppear` — note if annoying)

### Offers inbox (smoke)

- [ ] List scrolls normally; no broken navigation after polish

### Reduce motion (if you care)

- [ ] Optional: enable **Settings → Accessibility → Reduce Motion** and skim claim result + activity — acceptable fallback (SwiftUI won’t remove your animation entirely without extra code; note gaps only)

---

## Cut list (if something feels “extra”)

| If this feels off… | Consider… |
|--------------------|-------------|
| Flash on overview too often | Narrow flash to manual refresh only |
| Count-up too long | Lower `durationMs` in `AnimatedNumber` (~500) |
| `appearUp` on every activity row | Limit to first N rows or remove on refresh |
| Empty states too chatty | Shorten to headline + one line |

---

## Done when

- [ ] No build errors (Xcode + dashboard `tsc`)
- [ ] Tables above checked or issues logged
- [ ] You’d be okay showing this to a pilot operator **without apologizing for the UI**

Then: **internal dry run → staging smoke → first pilot** (see `docs/pilot-execution.md`).
