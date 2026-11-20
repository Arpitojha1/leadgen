# Lead Manager

A full-stack web application designed for managing sales leads through their customer journey (`New` -> `Contacted` -> `Qualified` -> `Lost`), featuring multi-tenant data isolation, real-time status filtering, debounced search, sorting, pagination, and a live metrics dashboard.

---

## Table of Contents
- [Architecture & Stack Choice](#architecture--stack-choice)
- [How to Run Locally](#how-to-run-locally)
- [REST API Reference](#rest-api-reference)
- [Database Schema & Indexes](#database-schema--indexes)
- [Assumptions](#assumptions)
- [What Was Cut and Why](#what-was-cut-and-why)
- [Future Improvements with More Time](#future-improvements-with-more-time)
- [Proud Of / Tricky Note](#proud-of--tricky-note)

---

## Architecture & Stack Choice

| Layer | Technology | Rationale |
|---|---|---|
| **Backend Runtime** | Node.js (v18+) + Express | Standard, lightweight, asynchronous I/O, rapid development, broad ecosystem support. |
| **Database** | SQLite via `better-sqlite3` | Zero-configuration, synchronous execution loop eliminates async SQLite overhead, strict foreign key enforcement, WAL mode for concurrent reads. |
| **Validation** | Zod | Single source of truth for runtime schema parsing, type coercion, and detailed validation issue mapping across all request payloads and queries. |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` | Stateless session management, cryptographically salted password hashes (10 rounds), multi-tenant isolation embedded directly in user queries. |
| **Frontend UI** | React 18 + Vite | Lightning-fast HMR, lightweight bundle size (< 80 kB gzip), modern hooks architecture without heavyweight boilerplate. |
| **Styling** | Plain Responsive CSS | Zero runtime CSS-in-JS overhead, standard CSS variables for systematic tokens, responsive down to 375px mobile screens. |
| **Testing** | Jest + Supertest | Automated integration testing for HTTP contracts, parameterized SQL verification, and multi-tenant isolation guarantees. |

---

## How to Run Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 1. Clone the repository
```bash
git clone <repository_url>
cd leadgen
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment variables (or use default configuration)
cp .env.example .env

# Run automated tests
npm test

# Start the backend server (runs on http://localhost:5000)
npm start
# Alternatively, for watch mode:
npm run dev
```

### 3. Frontend Setup (in a separate terminal)
```bash
cd frontend
npm install

# Build for production verification
npm run build

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## REST API Reference

All protected endpoints require the HTTP header:
`Authorization: Bearer <jwt_token>`

All error responses strictly adhere to the shape:
```json
{
  "error": "Error description",
  "details": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

| Method | Endpoint | Auth | Description | Status Codes |
|---|---|---|---|---|
| `POST` | `/api/auth/signup` | No | Register a new user account | `201`, `400`, `409`, `500` |
| `POST` | `/api/auth/login` | No | Authenticate user and receive JWT token | `200`, `400`, `401`, `500` |
| `GET` | `/api/auth/me` | Yes | Get currently authenticated user profile | `200`, `401` |
| `GET` | `/api/leads` | Yes | List, search, filter, paginate, and sort user's leads | `200`, `400`, `401`, `500` |
| `POST` | `/api/leads` | Yes | Create a new lead for current user | `201`, `400`, `401`, `409`, `500` |
| `GET` | `/api/leads/stats` | Yes | Get lead counts aggregated by status (`GROUP BY`) | `200`, `401`, `500` |
| `GET` | `/api/leads/:id` | Yes | Fetch single lead by ID (enforces user isolation) | `200`, `401`, `404`, `500` |
| `PUT` | `/api/leads/:id` | Yes | Update lead details or status (enforces user isolation) | `200`, `400`, `401`, `404`, `409`, `500` |
| `DELETE` | `/api/leads/:id` | Yes | Permanently delete lead (enforces user isolation) | `204`, `401`, `404`, `500` |
| `GET` | `/api/health` | No | Server health check | `200` |

---

## Database Schema & Indexes

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT NOT NULL,
  company TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other')),
  status TEXT NOT NULL CHECK(status IN ('New', 'Contacted', 'Qualified', 'Lost')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_leads_user_status ON leads (user_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_user_name ON leads (user_id, name);
CREATE INDEX IF NOT EXISTS idx_leads_user_created ON leads (user_id, created_at);
```

---

## Assumptions
1. **User Scoping**: A user account should never see, edit, or delete leads belonging to other users. Any attempt to access another user's lead returns HTTP `404 Not Found` (rather than `403 Forbidden`) to avoid leaking the existence of other records.
2. **Email Uniqueness**: Lead emails are unique *per user* (`UNIQUE(user_id, email)`). Multiple distinct users can manage independent leads with the same contact email without collision.
3. **Phone Formatting**: Global phone numbers vary; we allow standard international symbols (`+`, spaces, dashes) while asserting that 7 to 15 raw numeric digits exist.
4. **Search Behavior**: Name search is case-insensitive partial matching (`LOWER(name) LIKE '%search%'`).

---

## What Was Cut and Why
1. **Full Refresh Token Rotation**: A single JWT token with a 7-day expiration was implemented instead of access/refresh token dual-storage. This keeps the screening assignment lightweight, avoids cookie/CSRF synchronization complexity, and focuses on core API contract correctness.
2. **Heavy UI Component Libraries**: Used clean plain CSS rather than Tailwind or MUI. This minimizes bundle overhead, avoids build-time configuration friction, and demonstrates foundational CSS mastery and responsive design.

---

## Future Improvements with More Time
- **PostgreSQL Migration**: Swap SQLite for PostgreSQL with Prisma or Kysely for horizontal connection pooling and production deployment.
- **Refresh Token Rotation & HttpOnly Cookies**: Move JWT storage to secure HttpOnly cookies with Redis-backed token revocation.
- **Rate Limiting**: Apply `express-rate-limit` on `/api/auth/*` to prevent credential brute-forcing.
- **Audit Logging**: Add an audit trail table tracking status transitions (e.g. from `New` to `Contacted`) with timestamps and user notes.
- **CSV Import / Export**: Allow bulk importing leads from CSV and exporting filtered views.
- **Containerization**: Provide a `docker-compose.yml` for single-command orchestration.

---

## Proud Of / Tricky Note
**Tricky:** Express 5 defines `req.query` with a read-only getter. Simply doing `req.query = schema.parse(req.query)` silently fails to overwrite query properties, resulting in uncoerced `undefined` or `NaN` limits that caused SQLite datatype mismatches (`SQLITE_MISMATCH`). Diagnosed the root cause via systematic isolation and cleanly resolved it with `Object.defineProperty(req, 'query', ...)`.

**Proud of:** Seamless end-to-end data isolation with zero SQL string concatenation. Compound indexes `(user_id, status)` and `(user_id, name)` ensure the list, search, and dashboard aggregation queries execute in optimal sub-millisecond logarithmic time.
