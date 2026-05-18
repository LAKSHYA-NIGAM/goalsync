# GoalSync — Enterprise Goal Setting & Tracking Portal

GoalSync is a full-stack web application for corporate goal setting, tracking, and check-ins. Built with React, Express, and MongoDB.

---

## Tech Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | React 18 · Vite · Tailwind CSS · React Router · Axios · Framer Motion · Recharts |
| Backend    | Node.js · Express.js                                    |
| Database   | MongoDB Atlas · Mongoose                                |
| Auth       | JWT (jsonwebtoken + bcryptjs)                           |

---

## Project Structure

```
goalsync/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios base instance & interceptors
│   │   ├── components/      # Reusable UI components
│   │   │   ├── common/
│   │   │   ├── goals/
│   │   │   ├── checkins/
│   │   │   └── dashboard/
│   │   ├── context/         # React context providers (AuthContext)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Route-level page components
│   │   │   ├── auth/
│   │   │   ├── employee/
│   │   │   ├── manager/
│   │   │   └── admin/
│   │   └── utils/           # Helper functions & constants
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/                  # Express.js backend
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express route handlers
│   ├── middleware/           # Auth & validation middleware
│   ├── services/            # Business logic layer
│   └── index.js             # Server entry point
└── README.md
```

---

## Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MongoDB Atlas** account (or a local MongoDB instance)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repo-url>
cd goalsync
```

### 2. Setup the Server

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

The API server starts at **http://localhost:5000**.

### 3. Setup the Client

```bash
cd client
cp .env.example .env
# Edit .env if needed (defaults to http://localhost:5000/api)
npm install
npm run dev
```

The frontend dev server starts at **http://localhost:5173** and proxies API requests to the backend.

---

## Environment Variables

### Server (`server/.env`)

| Variable          | Description                        | Example                                      |
| ----------------- | ---------------------------------- | -------------------------------------------- |
| `PORT`            | Server port                        | `5000`                                       |
| `MONGO_URI`       | MongoDB connection string          | `mongodb+srv://user:pass@cluster.mongodb.net/goalsync` |
| `JWT_SECRET`      | Secret key for signing JWTs        | `your-super-secret-key`                      |
| `JWT_EXPIRES_IN`  | Token expiration duration          | `7d`                                         |
| `NODE_ENV`        | Environment mode                   | `development`                                |

### Client (`client/.env`)

| Variable          | Description                        | Example                           |
| ----------------- | ---------------------------------- | --------------------------------- |
| `VITE_API_URL`    | Backend API base URL               | `http://localhost:5000/api`       |

---

## Available Scripts

### Server

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm start`       | Start production server            |
| `npm run dev`     | Start dev server with nodemon      |

### Client

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start Vite dev server              |
| `npm run build`   | Build for production               |
| `npm run preview` | Preview production build locally   |

---

## License

MIT
