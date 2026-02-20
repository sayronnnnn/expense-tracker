# Smart Expense Tracker — UX Audit & Improvement Plan

## 1. Audit summary

The app has a solid base: sidebar navigation, card-based content, and a clear light theme. The audit below identifies **refinements** (not a full redesign) to improve scannability, hierarchy, and consistency.

---

## 2. UX weaknesses identified

### 2.1 Spacing
- **Issue:** Mixed spacing values (0.5rem, 0.75rem, 1rem, 1.25rem, 1.5rem) without a clear scale. Content padding and card gaps are inconsistent.
- **Impact:** Layout feels slightly uneven; vertical rhythm is weak.
- **Proposal:** Introduce a **4px-base spacing scale** in CSS variables (e.g. 4, 8, 12, 16, 24, 32, 40, 48) and use it consistently for padding, gaps, and margins.

### 2.2 Typography
- **Issue:** Font sizes are ad hoc (0.75rem–2rem). No clear type scale for headings vs body vs supporting text. Financial numbers don’t always stand out.
- **Impact:** Hierarchy is okay but not crisp; amounts can get lost in body text.
- **Proposal:** Define a **typography scale** (--text-xs through --text-2xl) and a **number/amount** class (tabular figures, semibold, slightly larger). Use one size for “primary amount” and one for “secondary amount”.

### 2.3 Hierarchy
- **Issue:** Section titles (e.g. “SPENDING STATISTICS”) are small and muted; hero amount is strong but other key numbers (stat cards, classification amounts) compete with labels.
- **Impact:** Dashboard takes more than 10 seconds to scan; the eye doesn’t land on “total” and “by category” in a fixed order.
- **Proposal:** Keep a single **hero** (total this month). Group content into **two clear tiers**: (1) Key metric + spending stats, (2) Classification + transactions + trend. Use one consistent **section title** style and slightly stronger **card titles**.

### 2.4 Dashboard density
- **Issue:** Many sections (hero, 6 stat cards, classification list, transactions, 6-month trend, export) in one scroll. Charts/lists don’t dominate but the number of blocks is high.
- **Impact:** Risk of feeling busy; “under 10 seconds” scan is borderline.
- **Proposal:** Keep structure; **reduce visual weight** of secondary sections (e.g. trend as compact list, export as subtle link row). Ensure **financial numbers** (hero, stat amounts, transaction amounts) use the same “amount” styling so they pop.

### 2.5 Budget warnings
- **Issue:** Over-budget state uses red bar and “Over budget” label; danger color is defined but not used consistently (e.g. no left border or light background on stat card when exceeded).
- **Impact:** Warnings are visible but could be more immediately distinguishable.
- **Proposal:** When a category is over budget: **light red background** (e.g. --danger-subtle) on the stat card and/or a **left border accent** in --danger, in addition to red bar and label.

### 2.6 Forms
- **Issue:** Inline forms (Expenses, Budgets, Recurring) use flex-wrap and similar-looking inputs; “Add” vs “Cancel” vs “Save” are clear but structure (grouping, required vs optional) could be clearer.
- **Impact:** Forms work but don’t feel “structured and simple.”
- **Proposal:** Keep single-row/inline where it fits; **group related fields** with a small label group (e.g. “Time period”, “Amount”). Use **consistent label + input spacing** from the spacing scale. Optional fields: add “(optional)” in muted text.

### 2.7 Empty states
- **Issue:** Empty states are a short line of text inside a card (e.g. “No expenses this month. Use …”). No icon or gentle CTA.
- **Impact:** Functional but not inviting; clarity is okay.
- **Proposal:** **Reusable empty state**: icon (optional) + one line of copy + primary action button when relevant (e.g. “Add expense”). Keep minimal; no illustration needed.

### 2.8 Loading and error states
- **Issue:** Loading: single line “Loading …” in a div. Error: single line in red. No skeleton; no retry.
- **Impact:** Clear but bare; errors feel dead-end.
- **Proposal:** **Loading:** use a small spinner (CSS-only) + “Loading…” for full-page; optional skeleton for lists later. **Error:** same message + **“Try again”** button that refetches. Keep styles consistent (centered, padding from spacing scale).

### 2.9 Responsiveness
- **Issue:** Sidebar is fixed 260px; two-column dashboard stacks at 900px; stat grid goes 2-col then 1-col. Top bar and forms could be tighter on small screens.
- **Impact:** Usable but not polished on small viewports.
- **Proposal:** **Sidebar:** collapse to narrow icon-only bar (e.g. 64px) with tooltips, or drawer on very small. **Content:** reduce horizontal padding on small screens; ensure buttons and inputs don’t overflow. **Dashboard:** keep current breakpoints; ensure stat cards and classification list don’t overflow (min-width: 0 where needed).

### 2.10 Visual noise
- **Issue:** Multiple accent colors in stat bars (6 colors); classification bars use same palette. Export section has two prominent buttons.
- **Impact:** Slightly noisy; not overwhelming.
- **Proposal:** **Reduce palette** for charts: 2–3 colors (e.g. primary, primary-muted, neutral) or one primary with opacity steps. **Export:** style as **secondary actions** (outline or link style) so they don’t compete with primary CTAs.

---

## 3. Proposed system (before code)

### 3.1 Spacing scale (CSS variables)
- `--space-1` … `--space-12` (4px base: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128).
- Use for: padding (e.g. card = --space-4/--space-5), gaps (e.g. --space-3, --space-4), section margins (--space-6).

### 3.2 Typography scale
- `--text-xs` (0.75rem), `--text-sm` (0.875rem), `--text-base` (1rem), `--text-lg` (1.125rem), `--text-xl` (1.25rem), `--text-2xl` (1.5rem), `--text-3xl` (2rem).
- **Amounts:** `font-variant-numeric: tabular-nums;` plus `--text-lg` or `--text-xl` and `font-weight: 600` for primary amounts; `--text-sm` + 600 for secondary amounts.

### 3.3 Color
- Keep existing semantic tokens (--primary, --danger, --success, --text-*).
- Add: `--danger-subtle: #fef2f2` (or similar) for over-budget card background.
- Use **one primary and one muted** for bars when possible; reserve **danger** for over-budget and alerts only.

### 3.4 Card hierarchy
- **Primary card:** hero (total month) — existing gradient, single focus.
- **Secondary cards:** white, border, light shadow; one clear title per card.
- **Tertiary:** e.g. export as a low-emphasis block (links or outline buttons).

### 3.5 Data grouping
- **Dashboard:** (1) Hero. (2) “This month” group: spending stat cards. (3) “Breakdown” group: classification + transactions side by side. (4) “Trend” group: 6-month list. (5) “Export” group.
- Use **section titles** consistently and optional subtle dividers or extra margin between groups (e.g. --space-6) so the 10-second scan has a clear order.

### 3.6 Component structure (optional, minimal)
- **Shared:** `Page` (max-width + padding), `Card` (already implicit; could be a single wrapper with .card class), `EmptyState` (message + optional action), `LoadingState` (spinner + text), `ErrorState` (message + retry). Implement as presentational components + CSS; no new UI library.
- **Forms:** Keep in page; ensure they use the same label/input/button styles and spacing variables.

### 3.7 Micro-interactions
- **Recommendation:** Only where they aid clarity: e.g. **focus states** on inputs/buttons (already present), **hover on rows** (e.g. list rows) for affordance. No decorative animations.

---

## 4. Implementation checklist (refine, not rebuild)

1. **Design tokens:** Add spacing and typography CSS variables; add `--danger-subtle`.
2. **Global:** Apply spacing variables to Layout (sidebar, content padding), and typography to body/base.
3. **Financial numbers:** Introduce `.amount` / `.amount--primary` (and use where appropriate) with tabular-nums and weight/size.
4. **Budget warnings:** On over-budget stat card: light red background and/or left border; keep red bar and “Over budget” label.
5. **Dashboard:** Apply spacing scale; reduce chart colors to 2–3; style export as secondary; add section grouping margins.
6. **Empty states:** Reusable block (icon optional, message, primary button when relevant).
7. **Loading:** Full-page loading with small CSS spinner + text.
8. **Error:** Full-page and inline error with “Try again” where applicable.
9. **Forms:** Consistent spacing and optional “(optional)” for optional fields; group labels where it helps.
10. **Responsiveness:** Tighter padding on small screens; ensure sidebar/content don’t break (collapse or drawer if needed).
11. **Consistency pass:** Ensure every page uses the same card style, section title style, and button hierarchy (primary vs secondary).

---

## 5. Out of scope (by design)

- No full redesign; no new UI library.
- No heavy charts; keep lists and small bars.
- No extra micro-interactions beyond focus/hover where useful.
- Styling stays CSS (modules + variables); no mixing with Tailwind or other systems.
