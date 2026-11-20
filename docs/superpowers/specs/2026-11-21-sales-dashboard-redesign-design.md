# Sales Dashboard Redesign & Feature Enhancement Specification

**Date:** 2026-11-21  
**Status:** Approved  
**Author:** Pair Programming Agent  

---

## 1. Executive Summary

This specification governs the UI overhaul and backend enhancement of the **Lead Manager CRM** to match reference designs (`/design/ref-1.webp` through `/design/ref-4.webp`). The objective is to build a responsive, pixel-accurate, and accessible sales dashboard featuring real metrics, real activity history, live charts (Recharts donut and bar chart), enhanced leads management with deal values, and a reliable demo data reset mechanism.

---

## 2. Design Tokens & Styling Foundation

All styling variables are defined once inside a single `:root` block in `frontend/src/index.css`:

```css
:root {
  --color-bg: #F3F8FB;          /* Page background, pale blue-grey */
  --color-surface: #FFFFFF;     /* Cards, modals, white surfaces */
  --color-border: #E2E8F0;      /* Card, divider & table borders (1px) */
  --color-text: #0F172A;        /* Headings, primary text, near-black navy */
  --color-text-muted: #475569;  /* Secondary / body text */
  --color-primary: #0F172A;     /* Primary CTA button ("Add lead") */
  --color-accent: #8BBFD0;      /* Active sidebar pill, chart bars, accents */
  --color-footer: #263340;      /* Dark footer background */

  /* Status Colors */
  --color-status-new: #8BBFD0;
  --color-status-contacted: #A3B98A;
  --color-status-qualified: #22C55E;
  --color-status-lost: #F97316;

  /* Typography */
  --font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --radius-card: 16px;
  --radius-btn: 8px;
  --radius-badge: 9999px;
}
```

### Typography & Polish
- Google Fonts `Poppins` with weights 400, 500, 600, 700.
- Small uppercase label: 11px bold, letter-spaced (`SALES DASHBOARD`).
- Main page title: 36px bold (`Overview`).
- Description: 14px muted (`#475569`).
- Cards: white surface, 1px border (`#E2E8F0`), ~16px radius, ~24px padding, clean subtle elevation (`box-shadow: 0 1px 3px rgba(0,0,0,0.03)`).
- Action buttons: ~8px radius, bold 13-14px font, active focus ring for accessibility.

---

## 3. Reference Fixes & Accessibility

1. **Table Action Buttons (ref-2 fix):** Buttons must not appear disabled or faded. Provide visible contrast with distinct hover, active, and focus-visible outlines.
2. **Table Bottom Gap (ref-2 fix):** Eliminate artificial bottom dead-space under the table so cards naturally hug their content.
3. **Status Distinction (ref-1/ref-2 fix):** Pair every status color with a visible text label or legend icon to guarantee WCAG compliance (never color alone).
4. **Activity Spacing (ref-3 fix):** Enforce consistent 16px gaps between activity feed items.
5. **Keyboard & Screen Reader Support:** Focus rings (`outline: 2px solid var(--color-accent)`) on all interactive controls and descriptive `aria-label`s on icon-only buttons.

---

## 4. Backend Architecture & Database Extensions

### 4.1 Database Schema (`backend/src/db/schema.js`)
- **`leads` Table Update:** Add `deal_value NUMERIC DEFAULT 0 CHECK(deal_value >= 0)`.
- **`activity_logs` Table Creation:**
```sql
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  lead_id INTEGER,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_activity_user_created ON activity_logs (user_id, created_at);
```

### 4.2 API Endpoints
1. `POST /api/leads` and `PUT /api/leads/:id`:
   - Accept optional `deal_value` validated via Zod (`z.number().min(0).optional().default(0)`).
   - Log activity into `activity_logs` (e.g., `"Lead [name] was created"`, `"Lead [name] moved to [status]"`).
2. `GET /api/leads/stats`:
   - Returns:
     - `total`: total lead count
     - `byStatus`: `{ New: x, Contacted: y, Qualified: z, Lost: w }`
     - `qualifiedValue`: sum of `deal_value` for leads with status `'Qualified'`
     - `pipelineValue`: sum of `deal_value` for all active leads (`status != 'Lost'`)
     - `bySource`: array of `{ source, value }` grouped by lead source
3. `GET /api/leads/activity`:
   - Returns the latest 10 activity log entries for the authenticated user.
4. `POST /api/leads/demo-reset`:
   - Wipes current user's leads and activity records.
   - Re-seeds the 10 canonical leads from `ref-2.webp`:
     1. Alice Chen (alice@techflow.io, 555-0142, TechFlow Solutions, LinkedIn, New, deal_value: 14500)
     2. Marcus Johnson (marcus@greenleaf.com, 555-0187, GreenLeaf Organics, Referral, Contacted, deal_value: 7500)
     3. Sophia Ramirez (sophia.ramirez@buildrite.net, 555-0163, BuildRite Construction, Website, Qualified, deal_value: 32000)
     4. David Kim (david.kim@novacore.io, 555-0199, NovaCore Analytics, Cold Call, Lost, deal_value: 8000)
     5. Emma Patel (emma@horizonmedia.com, 555-0134, Horizon Media Group, Event, New, deal_value: 10000)
     6. James O'Connor (james.oconnor@steelbridge.co, 555-0175, SteelBridge Logistics, Other, Contacted, deal_value: 12500)
     7. Priya Nair (priya.nair@brightpath.edu, 555-0151, BrightPath Education, Website, Qualified, deal_value: 24000)
     8. Liam Brooks (liam.brooks@velocitysports.com, 555-0129, Velocity Sports, Referral, Lost, deal_value: 6500)
     9. Olivia Torres (olivia.torres@urbandesign.studio, 555-0182, Urban Design Studio, LinkedIn, New, deal_value: 15500)
     10. Noah Singh (noah.singh@cloudfirst.ai, 555-0148, CloudFirst AI, Cold Call, Contacted, deal_value: 8000)
     - Note: Sum of Qualified = $32,000 + $24,000 = **$56,000** (matches ref-1!).
     - Total Pipeline Value = **$148,500** (matches ref-1!).
   - Seeds initial activity logs matching ref-3:
     - "Alice Chen from TechFlow Solutions was moved to Contacted."
     - "Marcus Johnson from GreenLeaf Organics was added as a Referral lead."
     - "A new Website lead requested a demo for a $12,000 opportunity."

---

## 5. Frontend Component Hierarchy

```
App
├── LeftSidebar (ref-4: Logo "LM", Title, Subtext "CRM", Nav: Overview, Leads, Pipeline, Reports, Collapse Toggle)
└── MainContent
    ├── OverviewHeader (ref-1: SALES DASHBOARD, "Overview", description, "Add lead" button)
    ├── StatCardsRow (ref-1: 4 cards: Total leads, Contacted, Qualified value, Pipeline value)
    ├── ChartsGrid (ref-1: 2 Recharts cards)
    │   ├── LeadsByStatusCard (Donut chart + bottom custom colored legend)
    │   └── PipelineBySourceCard (Bar chart + legend)
    ├── RecentLeadsCard (ref-2)
    │   ├── CardHeader (Title, subtitle)
    │   ├── FilterToolbar (Search input, Status dropdown, Source dropdown)
    │   └── LeadsTable (Zebra striped, colored badges, accessible action buttons)
    ├── RecentActivityCard (ref-3: clean event list with equal spacing)
    └── DarkFooter (ref-3: centered LM branding, Reset demo data button, copyright)
├── LeadModal (Create / Edit with deal_value and inline validation)
├── ConfirmModal (Delete lead confirmation)
└── ResetDemoModal (Reset demo data confirmation)
```

---

## 6. Visual Verification Loop (Playwright)

1. Automated script navigates to the app, logs in, resets demo data.
2. Captures full-page screenshots:
   - Desktop: 1280px viewport
   - Mobile: 375px viewport
3. Multi-round comparison against `/design/ref-1.webp` through `/design/ref-4.webp`:
   - Inspect layout grid, card padding, typography scale, chart aspect ratios, sidebar pill, table zebra striping, footer centering.
   - Refine CSS and rerun verification.
   - Present final artifacts and transparent comparison notes.
