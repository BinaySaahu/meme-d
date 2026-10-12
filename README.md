# Campaign Payout Platform

Project URL: [URL](https://meme-d.vercel.app/)

Note: As the Backend is deployed in render so it may cold start as result of which the apis may take longer than expected.

A campaign marketplace with an Express/MongoDB API and a Next.js frontend.
Brands create campaigns with view-based payout milestones; creators browse
campaigns, submit post URLs, and update simulated views to calculate payouts.

## Project structure

```text
backend/
  config/       Database connection
  controllers/  Auth, campaign, and submission handlers
  middleware/   Authentication, role checks, and error handling
  models/       Mongoose user, campaign, and submission models
  routes/       Express API route definitions
  tests/        API and payout tests
  utils/        Shared errors and payout calculations
  index.ts      Express app and server startup
frontend/
  my-app/
    src/app/        Next.js routes and global Tailwind CSS
    src/components/ Shared auth, session, route-guard, and workspace UI
```

## Requirements

- Node.js 20 or later and npm.
- MongoDB that supports transactions. MongoDB Atlas is supported; a local
  MongoDB server must run as a replica set for transactional payout updates.
- A modern browser with local storage enabled.

## Local setup

### 1. Configure MongoDB and the backend

From the repository root:

```powershell
cd backend
npm install
```

Create `backend/.env` with the following values:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/campaign-api?replicaSet=rs0
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=1d
FRONTEND_URL=http://localhost:3000
REDIS_HOST="<your-redis-host>"
REDIS_PORT=<your-redis-port>
REDIS_USERNAME="<your-redis-username>"
REDIS_PASSWORD="<your-redis-password>"
```

Start the API in development mode:

```powershell
npm run dev
```

The API listens on `http://localhost:5000`. Check that it is available at
`http://localhost:5000/api/health`.

Backend scripts, run from `backend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the API with `tsx` watch mode |
| `npm run start` | Run the API with `tsx` |
| `npm run typecheck` | Type-check backend TypeScript |
| `npm test` | Run backend API and payout tests |

### 2. Configure and run the frontend

In a second terminal, from the repository root:

```powershell
cd frontend\my-app
npm install
```

Create `frontend/my-app/.env`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend:

```powershell
npm run dev
```

Open `http://localhost:3000/signup` to create a brand or creator account.
Sign-in is available at `/login`. After authentication, brands are sent to
`/brand` and creators to `/creator`.

Frontend scripts, run from `frontend/my-app/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest unit tests for frontend payout and budget calculations |
| `npm run test:watch` | Run frontend Jest tests in watch mode |

Set real secrets in local ignored `.env` / `.env.local` files or the hosting
provider's environment settings. The `NEXT_PUBLIC_` prefix means the API URL is
publicly visible in the client bundle; never put secrets in it.

## Routes and roles

Frontend pages:

| Route | Access |
| --- | --- |
| `/login` | Public |
| `/signup` | Public |
| `/brand` | Signed-in brand |
| `/creator` | Signed-in creator |

Unauthenticated users visiting a workspace are redirected to `/login`. A signed
in user who visits the other role's workspace is redirected to their own
workspace. The API independently validates the JWT and role; frontend route
guards are not a replacement for backend authorization.

API base URL is `/api`:

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/auth/signup` | Public |
| `POST` | `/auth/login` | Public |
| `POST` | `/campaigns` | Brand |
| `GET` | `/campaigns` | Public |
| `GET` | `/campaigns/mine` | Brand |
| `POST` | `/submissions` | Creator |
| `PATCH` | `/submissions/:id/views` | Owning creator |
| `GET` | `/submissions/mine` | Creator |
| `GET` | `/health` | Public |

## Assumptions and behavior

- The only account roles are `brand` and `creator`. There is no administrator
  role, password reset, email verification, or social login in this version.
- The backend owns authorization and payout decisions. The browser sends a
  Bearer JWT from `Authorization` for protected API calls.
- The frontend persists the returned token and user profile in browser
  `localStorage`. Signing out clears the local session. This is a simple
  initial setup and is not an HttpOnly-cookie session.
- CORS accepts one configured frontend origin through `FRONTEND_URL`.
- Each milestone payout cannot exceed the campaign's total budget.
- `targetPayout` is the cumulative amount specified by the highest milestone
  crossed. `paidAmount` is the amount actually allocated from the campaign
  budget. An update pays only the positive difference between these values;
  multiple crossed milestones are not summed.
- The initial insufficient-budget policy is all-or-nothing. If the full
  difference is unavailable, the view update is rejected and neither the
  submission nor campaign budget changes.
- Campaign budget allocation and submission updates use a MongoDB transaction
  to prevent concurrent updates from over-allocating funds. A standalone local
  MongoDB instance without replica-set mode will not support this behavior.
- Creator view updates are simulated through the API; no social platform API
  is connected to verify views.
- The same post URL cannot be submitted twice to one campaign. View counts are
  non-negative integers and cannot be decreased.
- The browse list includes live campaigns with budget remaining. The frontend
  selects among available campaigns and lets creators submit a valid HTTP(S)
  post URL.
- Money values are numeric amounts in rupees; the UI formats them as INR.
- Redis is used as an optional cache for the public live-campaign list.
Here I have used Redis SDK to connect and store values in Redis.
Redis is used as an optional cache because as we donot have a steady traffic in our application the Redis DB might get deleted. To tackle this case our api will be falling back to primary DB.

## Deploying to Render

Create a **Web Service** for the backend:

- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run typecheck`
- **Start Command:** `npm run start`
- **Health Check Path:** `/api/health`

## API verification

Frontend calculation tests, run from `frontend/my-app/`:

```powershell
npm test
```

The backend tests can be run locally with:

```powershell
cd backend
npm test
npm run typecheck
```

`npm test` runs the Jest suites configured in `backend/jest.config.cjs`,
including payout calculation, budget-cap, and API validation tests.