# EXPLAINME: Codebase Architecture & Technical Deep-Dive

This document provides a plain-English explanation for every major file in the Lead Manager application, why it was designed that way, and a comprehensive Big-O algorithmic analysis of the queries and index effects.

---

## 1. Backend Architecture

### `backend/src/config/env.js`
- **What it does:** Centralizes environment variable extraction (`PORT`, `JWT_SECRET`, `DB_PATH`, `CORS_ORIGIN`, `NODE_ENV`) using `dotenv` with safe fallbacks.
- **Why it was designed that way:** Prevents scattered `process.env` calls throughout the codebase. Makes testing straightforward by allowing configuration overrides without touching business logic.

### `backend/src/db/schema.js`
- **What it does:** Declares the SQLite DDL strings (`users`, `leads`) and allowed enum constants (`SOURCES`, `STATUSES`).
- **Why it was designed that way:** Isolates database definitions from connection logic. Enforces relational integrity at the database engine level (foreign keys `ON DELETE CASCADE`, check constraints on statuses/sources, and unique composite index `(user_id, email)`).

### `backend/src/db/connection.js`
- **What it does:** Initializes the `better-sqlite3` database singleton, turns on foreign keys (`PRAGMA foreign_keys = ON`), enables Write-Ahead Logging (`PRAGMA journal_mode = WAL`), and creates tables/indexes. Supports in-memory mode (`:memory:`) for automated tests.
- **Why it was designed that way:** `better-sqlite3` is synchronous and operates directly on the V8 engine thread without event loop hopping or promise overhead. Enabling WAL mode allows concurrent read operations while writes occur.

### `backend/src/schemas/authSchemas.js` & `leadSchemas.js`
- **What it does:** Defines strict validation rules using Zod for signup, login, lead creation, updates, and list queries.
- **Why it was designed that way:** Ensures all inputs are type-safe and validated *before* reaching controller code. Encapsulates business constraints (e.g. phone must contain 7–15 digits while allowing standard formatting like `+`, spaces, and `-`).

### `backend/src/middleware/validate.js`
- **What it does:** Higher-order middleware functions (`validateBody`, `validateQuery`) that run requests against Zod schemas. Extracts field-level validation issues into `{ field, message }` arrays.
- **Why it was designed that way:** In Express 5, `req.query` is a getter property. This middleware uses `Object.defineProperty` to ensure coerced numeric defaults (like `page: 1`, `limit: 10`) are safely bound and accessible.

### `backend/src/middleware/auth.js`
- **What it does:** Extracts the JWT from `Authorization: Bearer <token>`, cryptographically verifies it, checks if the user still exists in the database, and injects `req.user = { id, email }`.
- **Why it was designed that way:** Enforces complete authorization across all protected routes. Rejects expired or forged tokens with HTTP 401.

### `backend/src/middleware/errorHandler.js`
- **What it does:** Centralized Express error handler. Translates custom `AppError`s, Zod validation errors, SQLite constraint errors (like duplicate emails `SQLITE_CONSTRAINT_UNIQUE`), and unexpected exceptions into a unified JSON format: `{ "error": "...", "details": [...] }`.
- **Why it was designed that way:** Eliminates duplicate `try/catch` boilerplate in controllers and ensures the client always receives a predictable, actionable error format with appropriate HTTP status codes (400, 401, 404, 409, 500).

### `backend/src/controllers/authController.js`
- **What it does:** Handles user signup and login. Hashes passwords using `bcryptjs` with 10 salt rounds, verifies passwords, and signs 7-day JWT tokens. Excludes `password_hash` from all output responses.
- **Why it was designed that way:** Separates authentication HTTP request/response handling from route declarations.

### `backend/src/controllers/leadController.js`
- **What it does:** Implements CRUD, search, filter, pagination, whitelist sorting, and stats operations. Crucially, **every query explicitly filters by `user_id = ?`**.
- **Why it was designed that way:** Guarantees multi-tenant isolation. If User A attempts to view, edit, or delete User B's lead, the query returns 0 rows and the controller emits a `404 Not Found`. Strictly validates `sortBy` against an allowed column whitelist to prevent SQL injection.

### `backend/src/routes/authRoutes.js` & `leadRoutes.js`
- **What it does:** Maps HTTP verbs and URL paths to validation middleware and controller functions.
- **Why it was designed that way:** Note that `/api/leads/stats` is defined *before* `/api/leads/:id` to prevent Express from treating the literal string `"stats"` as a route parameter ID.

### `backend/src/app.js` & `server.js`
- **What it does:** `app.js` configures Express, CORS, JSON parsing, routes, and error handling. `server.js` initializes the database and listens on the configured port.
- **Why it was designed that way:** Decoupling `app` from `server` allows Supertest to test the full HTTP middleware pipeline in-memory without binding actual network ports.

---

## 2. Frontend Architecture

### `frontend/src/api.js`
- **What it does:** Lightweight, zero-dependency `fetch` wrapper. Automatically manages JWT storage in `localStorage`, attaches `Authorization: Bearer <token>` to outbound requests, and catches network failures to format graceful error objects.
- **Why it was designed that way:** Keeps network and authentication logic in a single module rather than repeating `fetch()` calls in individual components.

### `frontend/src/constants.js`
- **What it does:** Houses status/source lists, badge color tokens, and the client-side `validateLeadForm()` helper.
- **Why it was designed that way:** Shares identical validation rules with the backend so the user receives instantaneous feedback before making a network round-trip.

### `frontend/src/components/StatusBadge.jsx`
- **What it does:** Renders a color-coded pill badge with an accent dot for each status (`New` - blue, `Contacted` - amber, `Qualified` - emerald, `Lost` - rose).
- **Why it was designed that way:** Provides immediate visual hierarchy and status recognition in data tables and mobile cards.

### `frontend/src/components/ConfirmModal.jsx`
- **What it does:** A custom modal dialog for confirming destructive actions (lead deletion). Supports ESC key, click-outside dismissal, and loading state.
- **Why it was designed that way:** Replaces un-stylable, blocking browser `window.confirm()` with an accessible, keyboard-friendly UI component.

### `frontend/src/components/StatsBar.jsx`
- **What it does:** Displays total leads and count per status from the `/api/leads/stats` endpoint. Clicking any card automatically toggles filtering by that status.
- **Why it was designed that way:** Acts simultaneously as a summary dashboard and quick-filter control.

### `frontend/src/components/SearchFilterBar.jsx`
- **What it does:** Provides the search input and status dropdown. Debounces search keystrokes by 300ms using a `useEffect` timer.
- **Why it was designed that way:** Prevents firing an API request on every keystroke, reducing server load while maintaining a fluid typing experience.

### `frontend/src/components/LeadForm.jsx`
- **What it does:** Shared modal dialog for both adding new leads and editing existing ones. Pre-populates on edit, validates fields inline on blur and submit, and displays backend field errors.
- **Why it was designed that way:** DRY principle: sharing form layout, input handlers, and error displays between create and update prevents divergent bugs.

### `frontend/src/components/LeadTable.jsx`
- **What it does:** Renders leads in an accessible table with sortable column headers, pagination controls (page navigation and rows-per-page selection), and inline action buttons. Displays custom loading spinner and empty states.
- **Why it was designed that way:** Responsive container with horizontal scroll support allows full usability on viewports down to 375px.

### `frontend/src/components/AuthForm.jsx`
- **What it does:** Handles Login and Signup in a single clean card with tab toggling, field validation, and error banners.
- **Why it was designed that way:** Streamlined user onboarding without requiring client-side routing libraries.

### `frontend/src/App.jsx`
- **What it does:** Root application state container. Coordinates authentication state, leads collection, pagination, sorting, active filters, and modal visibility.
- **Why it was designed that way:** Single source of truth. Any CRUD operation triggers a coordinated re-fetch of both the leads table and the stats dashboard.

---

## 3. Big-O Complexity & Index Analysis

### The Query Under Examination
```sql
SELECT id, user_id, name, email, phone, company, source, status, created_at, updated_at
FROM leads
WHERE user_id = ? AND leads.status = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

Let:
- $N$ = Total leads in the database across all users.
- $M$ = Total leads belonging to the querying user ($M \ll N$).
- $K$ = Number of leads matching the user's filters.
- $P$ = Page limit (e.g. 10).

---

### Scenario A: Without Indexes (Full Table Scan)
1. **Filtering ($WHERE$):**
   Without indexes, SQLite must scan every row in the table:
   $$\mathcal{O}(N)$$
   Every row across all users must be read from disk into memory to evaluate `user_id = ?` and `status = ?`.
2. **Sorting ($ORDER BY$):**
   SQLite must collect all $K$ matching rows and perform an in-memory or temporary disk Sort:
   $$\mathcal{O}(K \log K)$$
3. **Total Time Complexity:**
   $$\mathcal{O}(N + K \log K)$$
   **Degradation:** As the platform grows to millions of total leads, queries become noticeably sluggish because every query scans the entire dataset ($N$).

---

### Scenario B: With Compound Index `idx_leads_user_status ON leads (user_id, status)`
1. **Filtering ($WHERE$):**
   The B-Tree index is structured hierarchically by `(user_id, status)`. SQLite seeks directly to the first index entry where `user_id = ? AND status = ?` in:
   $$\mathcal{O}(\log N)$$
   It then scans only the contiguous slice of index leaves matching that user and status ($K$ entries). It **never examines other users' data**.
2. **Sorting & Pagination:**
   The filtered set ($K$) is sorted by `created_at`.
   $$\mathcal{O}(K \log K)$$
3. **Total Time Complexity:**
   $$\mathcal{O}(\log N + K \log K)$$

---

### Scenario C: Name Search Query (`LOWER(name) LIKE '%term%'`)
```sql
SELECT ... FROM leads WHERE user_id = ? AND LOWER(name) LIKE '%term%'
```
1. Because the search term has a leading wildcard (`%term%`), standard B-Tree prefix matching cannot locate the exact substring offset.
2. **However, because `idx_leads_user_name ON leads (user_id, name)` exists:**
   SQLite performs an index range scan constrained strictly to `user_id = ?`.
3. It only scans $M$ index entries (the current user's leads), **not $N$ (the whole table)**:
   $$\mathcal{O}(\log N + M)$$
   The index provides complete partition isolation: User A's search never scans User B's rows.

---

### Scenario D: Dashboard Stats Query (`GROUP BY status`)
```sql
SELECT status, COUNT(*) as count FROM leads WHERE user_id = ? GROUP BY status;
```
1. SQLite uses `idx_leads_user_status (user_id, status)`.
2. It seeks to `user_id = ?` in $\mathcal{O}(\log N)$.
3. Because all statuses for that user are adjacent and ordered in the index leaf nodes, SQLite performs a **Covering Index Scan**: it computes the count directly from the index without reading table pages from disk.
4. **Time Complexity:** $\mathcal{O}(\log N + M)$, where $M$ is current user's leads.
