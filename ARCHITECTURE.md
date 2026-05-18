# GoalSync — System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React + Vite)                         │
│                                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │  Login   │  │ Employee │  │ Manager  │  │  Admin   │  │  Shared  ││
│  │  Page    │  │  Views   │  │  Views   │  │  Views   │  │  Comps   ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  AuthContext  │  ToastContext  │  Axios Instance (JWT headers)  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                          Port 5173 (dev)                               │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ HTTP (REST API)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SERVER (Node.js + Express)                       │
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ Middleware   │  │   Routes    │  │  Services   │  │   Models     │ │
│  │             │  │             │  │             │  │              │ │
│  │ • auth.js   │  │ • auth      │  │ • auditSvc  │  │ • User       │ │
│  │ • roleGuard │  │ • goals     │  │ • scoreSvc  │  │ • Goal       │ │
│  │             │  │ • checkins  │  │             │  │ • SharedGoal │ │
│  │             │  │ • shared    │  │             │  │ • CheckIn    │ │
│  │             │  │ • admin     │  │             │  │ • AuditLog   │ │
│  │             │  │ • ai        │  │             │  │              │ │
│  │             │  │ • reports   │  │             │  │              │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘ │
│                          Port 5000                                     │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ Mongoose ODM
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     MongoDB (goalsync database)                        │
│                                                                        │
│  Collections: users │ goals │ sharedgoals │ checkins │ auditlogs      │
└─────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ✗ | Login with email/password, returns JWT |
| GET | `/api/auth/me` | ✓ | Current user profile |

### Goals (Employee + Manager)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/goals/my` | Employee | My goals for current cycle |
| POST | `/api/goals` | Employee | Create goal (max 8, weightage ≥ 10) |
| PUT | `/api/goals/:id` | Employee | Update draft goal |
| DELETE | `/api/goals/:id` | Employee | Delete draft goal |
| POST | `/api/goals/:id/submit` | Employee | Submit for approval (weightage must = 100%) |
| POST | `/api/goals/:id/checkin` | Employee | Record quarterly achievement |
| GET | `/api/goals/:id/checkins` | Any | Check-in history for a goal |
| GET | `/api/goals/:id/audit` | Any | Audit trail for a goal |
| GET | `/api/goals/team` | Manager | All direct reports' goals |
| PUT | `/api/goals/:id/inline-edit` | Manager | Edit target/weightage of submitted goal |
| PUT | `/api/goals/:id/approve` | Manager | Approve goal → locks it |
| PUT | `/api/goals/:id/reject` | Manager | Reject with required comment |
| POST | `/api/goals/approve-all/:empId` | Manager | Bulk approve |

### Shared Goals
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/shared-goals` | Any | List all shared goals |
| GET | `/api/shared-goals/my` | Employee | My assigned shared goals |
| POST | `/api/shared-goals` | Manager/Admin | Create shared goal |
| POST | `/api/shared-goals/:id/assign` | Manager/Admin | Assign to employees |
| PUT | `/api/shared-goals/:id/sync-achievement` | Any | Sync achievement to linked goals |

### AI
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/improve-goal` | Any | Rewrite goal as SMART (OpenAI or mock engine) |

### Admin
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/dashboard-stats` | Admin | Org-wide KPIs, charts, top performers |
| GET | `/api/admin/users` | Admin | All users with goal counts |
| POST | `/api/admin/users` | Admin | Create user |
| PUT | `/api/admin/users/:id` | Admin | Edit user |
| PUT | `/api/admin/goals/:id/unlock` | Admin | Unlock a locked goal |
| GET | `/api/admin/audit-logs` | Admin | Paginated audit logs with filters |

### Reports
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/reports/achievement` | Admin/Manager | Per-goal achievement data |
| GET | `/api/reports/completion` | Admin/Manager | Per-employee completion summary |
| GET | `/api/reports/export-csv` | Admin/Manager | Download CSV report |

### System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | ✗ | Health check with DB status |

## Data Flow — Goal Lifecycle

```
Employee                    Manager                     System
────────                    ───────                     ──────
  │                           │                           │
  ├── Create Goal (draft) ────┤                           │
  │                           │                           │
  ├── Submit (weightage=100%) ┤                           │
  │                           │                           │
  │                           ├── Review + Inline Edit    │
  │                           │                           ├── AuditLog
  │                           ├── Approve → Lock          │
  │                           │                           ├── AuditLog
  ├── Q1 Check-in ───────────┤                           │
  │   (actual value + status) │                           ├── Score Calc
  │                           │                           ├── AuditLog
  │                           ├── Comment on Check-in     │
  │                           │                           │
  ├── Q2/Q3/Q4 Check-ins ───┤                           │
  │                           │                           │
  │                           │                    Admin: Export CSV
  │                           │                    Admin: View Reports
```

## Score Calculation Engine

| UoM Type | Formula | Example |
|----------|---------|---------|
| **min** (higher = better) | `(actual / target) × 100` | Target: 500K, Actual: 580K → 116% |
| **max** (lower = better) | `(target / actual) × 100` | Target: 24h, Actual: 18h → 133% |
| **zero** (zero = perfect) | `actual === 0 ? 100 : 0` | Target: 0, Actual: 0 → 100% |
| **timeline** | Deadline-based pass/fail | On time → 100%, Late → 0% |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Framer Motion |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| State | React Context (Auth + Toast) |
| HTTP | Axios with JWT interceptors |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT (8h expiry) + bcrypt |
| AI | OpenAI GPT-3.5 or built-in SMART engine |
| CSV | Server-side generation + Papaparse fallback |
