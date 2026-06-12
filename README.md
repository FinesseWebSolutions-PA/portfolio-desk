# Portfolio Desk — Lovable-ready React conversion

A 1:1 port of the single-file Portfolio Desk demo (Lapp Holdings, Lobelville TN) into Lovable's stack: **React 18 + TypeScript + Vite**. Same look, same demo data, same behavior (in-memory state, resets on refresh).

## File map

```
src/
  pages/Index.tsx                      ← main page: tabs, state, all form/save handlers
  components/portfolio/
    DashboardView.tsx                  ← equity hero, stat cards, asset-class breakdown, recent movement
    PropertiesView.tsx                 ← all-properties table
    LandView.tsx                       ← development projects, lot bars, lot tables
    LoansView.tsx                      ← loans table + leverage meters
    DealPanel.tsx                      ← slide-out deal sheet (flip P&L, rental income, land rollup)
    FormModal.tsx                      ← generic field-driven add/edit modal
  lib/portfolio.ts                     ← fmt, pct, debtOf, ltvOf, eqOf, lotRollup, realizedPL, nid
  data/seed.ts                         ← demo properties/loans/lots
  types.ts                             ← Property, Loan, Lot, FieldDef, ModalConfig
  styles/portfolio.css                 ← the bespoke "paper ledger" theme (imported by Index.tsx)
```

## How to bring it into Lovable

**Option A — GitHub sync (cleanest).** In Lovable: project → Settings → GitHub → connect/create the repo. Clone it, copy this `src/` folder over the project's `src/` (Index.tsx replaces `src/pages/Index.tsx`), commit, push. Lovable picks it up automatically.

**Option B — Dev Mode paste.** Open Dev Mode (toggle top-left, requires paid plan), create each file under `src/` and paste its contents.

**Option C — Chat paste.** Paste files into Lovable chat with: "Create these exact files in my project, replacing src/pages/Index.tsx. Don't restyle or convert the CSS to Tailwind — keep it as-is."

## Notes for Lovable

- **No extra dependencies.** Plain React + the CSS file. Works in a fresh Lovable project as-is.
- **Styling is intentionally plain CSS**, not Tailwind. The design is a bespoke serif "paper ledger" theme (~400 lines, fully responsive with a mobile bottom-nav). Tell Lovable not to refactor it to Tailwind unless you want to risk visual drift.
- **Keep default routing.** Lovable's template already routes `/` → `src/pages/Index.tsx`.
- **State is in-memory by design** (demo flag in the footer). If you later want persistence, ask Lovable to "move the properties state into Supabase with tables for properties, loans, lots, and cost lines, keyed to the logged-in user" — the data model in `src/types.ts` maps 1:1 to tables.
