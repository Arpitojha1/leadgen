# Sales Dashboard Redesign & Feature Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Lead Manager application into a polished, responsive, and pixel-accurate sales dashboard matching reference designs `/design/ref-1.webp` through `ref-4.webp` with real data, interactive Recharts visualizations, activity logging, and demo data reset.

**Architecture:** Extended SQLite backend with `deal_value` and `activity_logs`, REST APIs for stats, activity, and demo reset. React 19 frontend with CSS variable design tokens (`:root`), Poppins typography, responsive sidebar navigation, Recharts donut/bar charts, zebra-striped leads table with enabled actions, and Playwright visual verification.

**Tech Stack:** Node.js, Express, better-sqlite3, Zod, React 19, Vite, Recharts, Playwright.

## Global Constraints

- Design tokens defined in a single `:root` block in `frontend/src/index.css`.
  - `--color-bg: #F3F8FB`
  - `--color-surface: #FFFFFF`
  - `--color-border: #E2E8F0`
  - `--color-text: #0F172A`
  - `--color-text-muted: #475569`
  - `--color-primary: #0F172A`
  - `--color-accent: #8BBFD0`
  - `--color-footer: #263340`
  - Status colors: New `#8BBFD0`, Contacted `#A3B98A`, Qualified `#22C55E`, Lost `#F97316`
- Typography: Poppins (Google Fonts) weights 400, 500, 600, 700 with system fallback.
- Multi-tenant data isolation strictly enforced per `user_id`.
- Dual indicators: every status color accompanied by explicit text label.
- WCAG keyboard accessibility: focus rings and aria-labels on interactive elements.

---

### Task 1: Backend Database & Schema Extension (`deal_value` & `activity_logs`)

**Files:**
- Modify: `backend/src/db/schema.js`
- Modify: `backend/src/schemas/leadSchemas.js`
- Modify: `backend/src/controllers/leadController.js`
- Test: `backend/tests/leads.test.js`

**Interfaces:**
- Consumes: SQLite database connection from `backend/src/db/connection.js`.
- Produces: Updated `leads` table with `deal_value NUMERIC DEFAULT 0`, new `activity_logs` table, updated Zod schemas accepting `deal_value`.

- [ ] **Step 1: Write failing test in `backend/tests/leads.test.js` for `deal_value`**

```javascript
test('POST /api/leads creates lead with deal_value and rejects negative deal_value', async () => {
  const token = await getAuthToken(app, 'dealvalue@example.com');
  const validRes = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test Deal',
      email: 'deal@example.com',
      phone: '+1 555-0199',
      company: 'Deal Corp',
      source: 'Website',
      status: 'New',
      deal_value: 12500,
    });
  expect(validRes.status).toBe(201);
  expect(validRes.body.data.deal_value).toBe(12500);

  const invalidRes = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Negative Deal',
      email: 'neg@example.com',
      phone: '+1 555-0199',
      company: 'Deal Corp',
      source: 'Website',
      status: 'New',
      deal_value: -50,
    });
  expect(invalidRes.status).toBe(400);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend; npm test tests/leads.test.js`
Expected: FAIL (Zod error or unexpected deal_value behavior).

- [ ] **Step 3: Update schema and controller for `deal_value` and `activity_logs`**

Update `backend/src/db/schema.js` to include:
```javascript
deal_value NUMERIC DEFAULT 0 CHECK(deal_value >= 0)
```
in `leads` table, and create `activity_logs` table:
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

Update `backend/src/schemas/leadSchemas.js`:
```javascript
deal_value: z.coerce.number().min(0, 'Deal value must be greater than or equal to 0').optional().default(0),
```

Update `backend/src/controllers/leadController.js` to handle `deal_value` in insert, select, and update queries.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend; npm test`
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat(backend): add deal_value and activity_logs schema with validation"
```

---

### Task 2: Backend Activity Feed, Stats Aggregations, and Demo Reset API

**Files:**
- Modify: `backend/src/controllers/leadController.js`
- Modify: `backend/src/routes/leadRoutes.js`
- Test: `backend/tests/leads.test.js`

**Interfaces:**
- Consumes: Authenticated user from `req.user`.
- Produces:
  - `POST /api/leads/demo-reset`: seeds the 10 canonical leads & 3 activity items.
  - `GET /api/leads/activity`: returns latest 10 events.
  - `GET /api/leads/stats`: returns `{ total, byStatus, qualifiedValue, pipelineValue, bySource }`.

- [ ] **Step 1: Write test for Demo Reset and Stats in `backend/tests/leads.test.js`**

```javascript
test('POST /api/leads/demo-reset seeds 10 leads, stats match ref-1 ($56k Qualified, $148.5k Pipeline)', async () => {
  const token = await getAuthToken(app, 'demouser@example.com');
  const resetRes = await request(app)
    .post('/api/leads/demo-reset')
    .set('Authorization', `Bearer ${token}`);
  expect(resetRes.status).toBe(200);
  expect(resetRes.body.count).toBe(10);

  const statsRes = await request(app)
    .get('/api/leads/stats')
    .set('Authorization', `Bearer ${token}`);
  expect(statsRes.status).toBe(200);
  expect(statsRes.body.total).toBe(10);
  expect(statsRes.body.byStatus.Contacted).toBe(3);
  expect(statsRes.body.qualifiedValue).toBe(56000);
  expect(statsRes.body.pipelineValue).toBe(148500);
  expect(statsRes.body.bySource.length).toBeGreaterThan(0);

  const actRes = await request(app)
    .get('/api/leads/activity')
    .set('Authorization', `Bearer ${token}`);
  expect(actRes.status).toBe(200);
  expect(actRes.body.data.length).toBe(3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend; npm test`
Expected: FAIL (404 on demo-reset and activity endpoints).

- [ ] **Step 3: Implement controller and routes**

Implement:
- `resetDemoData(req, res, next)` in `leadController.js` inserting the exact 10 leads:
  1. Alice Chen (TechFlow Solutions, LinkedIn, New, 14500)
  2. Marcus Johnson (GreenLeaf Organics, Referral, Contacted, 7500)
  3. Sophia Ramirez (BuildRite Construction, Website, Qualified, 32000)
  4. David Kim (NovaCore Analytics, Cold Call, Lost, 8000)
  5. Emma Patel (Horizon Media Group, Event, New, 10000)
  6. James O'Connor (SteelBridge Logistics, Other, Contacted, 12500)
  7. Priya Nair (BrightPath Education, Website, Qualified, 24000)
  8. Liam Brooks (Velocity Sports, Referral, Lost, 6500)
  9. Olivia Torres (Urban Design Studio, LinkedIn, New, 15500)
  10. Noah Singh (CloudFirst AI, Cold Call, Contacted, 8000)
  And seed 3 activity items from ref-3.
- `getActivity(req, res, next)` in `leadController.js`.
- Enhance `getStats(req, res, next)` to compute `qualifiedValue`, `pipelineValue`, and `bySource` array:
  `[{ source: 'Website', value: ... }, { source: 'LinkedIn', value: ... }, ...]`.
- Update `backend/src/routes/leadRoutes.js` to register `POST /demo-reset` and `GET /activity`.

- [ ] **Step 4: Run tests to verify it passes**

Run: `cd backend; npm test`
Expected: PASS (all tests pass, 30+ tests).

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat(backend): implement demo-reset, activity log, and enriched stats API"
```

---

### Task 3: Frontend Design Tokens, Poppins Typography & Left Sidebar (ref-4)

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.css`
- Create: `frontend/src/components/Sidebar.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: Current active view state (`'overview'`, `'leads'`, `'pipeline'`, `'reports'`), collapse state.
- Produces: Responsive sidebar adhering to ref-4 with active pill #8BBFD0, collapse toggle, and mobile drawer toggle.

- [ ] **Step 1: Configure Google Fonts Poppins and CSS variables in `index.html` & `index.css`**

Add Google Fonts Poppins in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Add CSS variables in `:root` in `frontend/src/index.css`.

- [ ] **Step 2: Build `Sidebar.jsx` matching ref-4**

Create `frontend/src/components/Sidebar.jsx`:
- "LM" rounded-square badge with `#8BBFD0` background and white bold text.
- Title: "Lead Manager", subtext: "CRM".
- Navigation items: Overview, Leads, Pipeline, Reports with SVG icons.
- Active item styled as filled `#8BBFD0` pill with white text and white icon.
- Circular collapse toggle `<` / `>` on the right border.
- Mobile drawer overlay when viewport < 768px.

- [ ] **Step 3: Integrate Sidebar into `App.jsx` and verify responsive layout**

- [ ] **Step 4: Run Vite build to ensure zero compile errors**

Run: `cd frontend; npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): add design tokens, Poppins font, and responsive left sidebar"
```

---

### Task 4: Overview Header, Stat Cards, and Recharts Components (ref-1)

**Files:**
- Modify: `frontend/package.json` (add recharts)
- Create: `frontend/src/components/OverviewHeader.jsx`
- Create: `frontend/src/components/StatCards.jsx`
- Create: `frontend/src/components/ChartsGrid.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: Stats data from `api.leads.getStats()`.
- Produces: Header block, 4 stat cards, Donut chart by status, Bar chart by source.

- [ ] **Step 1: Install `recharts`**

Run: `cd frontend; npm install recharts --save`

- [ ] **Step 2: Build `OverviewHeader.jsx` matching ref-1**

- Label: Uppercase 11px bold "SALES DASHBOARD"
- H1: 36px bold "Overview"
- Description: "Track your pipeline health, spot trends, and act on the leads that need attention today."
- CTA button: "Add lead" (dark `#0F172A`, white text, ~8px radius).

- [ ] **Step 3: Build `StatCards.jsx` matching ref-1**

4 cards in grid:
- "10" / "Total leads"
- "3" / "Contacted"
- "$56,000" / "Qualified value"
- "$148,500" / "Pipeline value"
Cards have white background, 1px `#E2E8F0` border, 16px radius, 24px padding.

- [ ] **Step 4: Build `ChartsGrid.jsx` with Recharts matching ref-1**

- Donut Chart card: "Leads by status"
  - `PieChart` with `innerRadius={45}`, `outerRadius={70}`, slices colored New (`#8BBFD0`), Contacted (`#A3B98A`), Qualified (`#22C55E`), Lost (`#F97316`).
  - Legend underneath with colored dots and labels.
- Bar Chart card: "Pipeline value by source"
  - `BarChart` with `Bar` in `#8BBFD0`, rounded top corners `radius={[4, 4, 0, 0]}`, `XAxis` showing sources, `YAxis` (0, 30000, 60000), grid lines, legend.

- [ ] **Step 5: Verify build**

Run: `cd frontend; npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): implement overview header, stat cards, and status/source recharts"
```

---

### Task 5: Recent Leads Card, Recent Activity & Dark Footer (ref-2, ref-3)

**Files:**
- Modify: `frontend/src/components/LeadTable.jsx`
- Create: `frontend/src/components/RecentActivity.jsx`
- Create: `frontend/src/components/Footer.jsx`
- Create: `frontend/src/components/ResetDemoModal.jsx`
- Modify: `frontend/src/components/LeadForm.jsx`
- Modify: `frontend/src/api.js`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: Leads, activity logs, demo reset API.
- Produces: Polished leads table with visible actions & zebra striping, real activity feed, dark footer with reset demo modal.

- [ ] **Step 1: Extend `api.js` with `resetDemoData()` and `getActivity()`**

- [ ] **Step 2: Polish `LeadTable.jsx` matching ref-2 & user fixes**

- Card title: "Recent leads", subtitle: "Browse, filter, and update your latest opportunities."
- Filter toolbar: Search input ("Search..."), Status dropdown, Source dropdown.
- Table: 13px text, zebra striping (`#F8FAFC` on alternating rows), no vertical borders.
- Status badges: colored pill badge with background and text pairing.
- Action buttons: visible, enabled quick status buttons ("Contact", "Qualify", "Lost") and Edit / Delete with active/hover/focus states and `aria-label`s.
- Remove empty bottom gap.

- [ ] **Step 3: Build `RecentActivity.jsx` matching ref-3**

- Card title: "Recent activity".
- Equal 16px spacing between events.
- Displays events from `api.leads.getActivity()`.

- [ ] **Step 4: Build `Footer.jsx` matching ref-3 and `ResetDemoModal.jsx`**

- Dark footer `#263340` with centered "Lead Manager", "Reset demo data" link, and copyright.
- Clicking "Reset demo data" opens `ResetDemoModal` confirmation dialog.
- Upon confirmation, calls `api.leads.resetDemoData()` and reloads leads, stats, and activity.

- [ ] **Step 5: Add `deal_value` field to `LeadForm.jsx`**

- [ ] **Step 6: Verify build**

Run: `cd frontend; npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): complete recent leads table, recent activity, and dark footer with demo reset"
```

---

### Task 6: Progressive Pipeline & Reports Pages

**Files:**
- Create: `frontend/src/components/PipelineView.jsx`
- Create: `frontend/src/components/ReportsView.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: Active navigation tab (`overview`, `leads`, `pipeline`, `reports`).
- Produces: Kanban status board for Pipeline and analytics summary for Reports.

- [ ] **Step 1: Create `PipelineView.jsx` with status columns (New, Contacted, Qualified, Lost)**
- [ ] **Step 2: Create `ReportsView.jsx` with pipeline metrics breakdown**
- [ ] **Step 3: Connect navigation switching in `App.jsx`**
- [ ] **Step 4: Verify build**

Run: `cd frontend; npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): add progressive pipeline kanban and reports view"
```

---

### Task 7: Visual Verification Loop via Playwright (Screenshots, Diff Comparisons & Iterative Fixes)

**Files:**
- Create: `scripts/verify-ui.mjs`
- Test: Playwright screenshot comparison against `/design/ref-1.webp` through `/design/ref-4.webp`

**Interfaces:**
- Consumes: Running frontend & backend servers.
- Produces: Viewport 1280px (`overview-1280.png`) and 375px (`overview-375.png`) screenshots, visual diff inspection report, and 2 comparison rounds.

- [ ] **Step 1: Install playwright**

Run: `npm install playwright --save-dev`

- [ ] **Step 2: Create automated screenshot verification script `scripts/verify-ui.mjs`**

Script logs in, resets demo data, navigates to Overview, and captures:
- `screenshots/overview-1280.png` at 1280px x 900px
- `screenshots/overview-375.png` at 375px x 812px

- [ ] **Step 3: Execute Round 1 Visual Verification**

Compare against `ref-1.webp`, `ref-2.webp`, `ref-3.webp`, `ref-4.webp`.
Identify any padding, font-weight, color, or alignment discrepancies.

- [ ] **Step 4: Implement adjustments and execute Round 2 Visual Verification**

Re-run screenshot script, verify fixes, generate final comparison report.

- [ ] **Step 5: Commit verification scripts and final documentation**

```bash
git add scripts/ README.md
git commit -m "test(visual): add playwright visual verification script and comparison report"
```
