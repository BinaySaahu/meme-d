# Backend API and payout rules

Base URL: `http://localhost:5000/api`

## Payout and budget policy

- A campaign's milestones are ordered by increasing view threshold. The target payout is the payout attached to the highest threshold reached; crossing multiple thresholds in one update does not add milestone payouts together.
- `targetPayout` is the cumulative amount indicated by the milestone ladder for one submission. `paidAmount` is the amount actually allocated to that submission from the campaign budget. They are separate values.
- When a target rises above the amount already paid, allocate only `targetPayout - paidAmount`. Repeating an update at the same or a lower target never allocates the same payout twice.
- Below the first milestone, the target payout is ₹0.
- Views must be non-negative whole numbers and cannot move backwards. Post links must be valid HTTP(S) URLs.
- A campaign's remaining budget is `totalBudget - spentBudget`. The initial insufficient-budget policy is **all-or-nothing**: if the full incremental payout is unavailable, reject the update with `409 Conflict` and leave the submission and campaign unchanged.
- Budget allocation and the submission update are committed in one MongoDB transaction. The campaign's allocated amount is updated atomically, so concurrent submissions cannot over-allocate its budget. MongoDB must support transactions (for example, a replica set or Atlas deployment).
- Campaigns are browseable while live and while budget remains. A campaign with no remaining budget is not returned by the browse endpoint.

## Authentication

### `POST /auth/signup`

Registers a brand or creator.

```json
{ "name": "A. User", "email": "user@example.com", "password": "password123", "role": "creator" }
```

Returns `201` with a safe user object and a JWT.

### `POST /auth/login`

```json
{ "email": "user@example.com", "password": "password123" }
```

Returns `200` with a safe user object and a JWT. Authenticated routes require
`Authorization: Bearer <token>`.

## Campaigns

### `POST /campaigns` — brand only

```json
{
  "name": "Summer launch",
  "platform": "instagram",
  "totalBudget": 10000,
  "milestones": [
    { "views": 1000, "payout": 500 },
    { "views": 5000, "payout": 2000 }
  ]
}
```

Milestone thresholds must strictly increase and payouts cannot decrease.
A milestone payout cannot exceed the campaign's total budget. Returns `201`.

### `GET /campaigns`

Lists live campaigns that have remaining budget. Returns `200`.

### `GET /campaigns/mine` — brand only

Lists the authenticated brand's campaigns with `spentBudget` and
`remainingBudget`. Returns `200`.

## Submissions

### `POST /submissions` — creator only

```json
{ "campaignId": "<campaign id>", "postUrl": "https://example.com/post/1" }
```

Creates one submission for a campaign and post URL. Reusing the same URL for
the same campaign returns `409`. Returns `201`.

### `PATCH /submissions/:id/views` — creator who owns the submission only

```json
{ "views": 5000 }
```

Updates the view count and returns the submission, including both payout
amounts, plus the campaign budget summary. The endpoint validates the body,
submission ownership, campaign availability, and budget; it is not a validation
bypass even when used to simulate views. Insufficient budget returns `409`
without partially applying the update.

### `GET /submissions/mine` — creator only

Lists the authenticated creator's submissions, including `targetPayout` and
`paidAmount`, plus the total amount actually allocated. Returns `200`.

## Error responses

Errors use a consistent JSON shape: `{ "error": "message" }`. Invalid input
returns `400`, missing or invalid authentication returns `401`, wrong roles
return `403`, missing resources return `404`, conflicts (including insufficient
budget) return `409`, and unexpected server errors return `500`.

## Local setup and Postman

Copy `.env.example` to `.env`, provide a MongoDB URI for a deployment that
supports transactions, and set a private JWT secret. Start the backend with
`npm run dev`. Import `postman/collection.json` into Postman, set its
`baseUrl` if needed, and run the requests in order; the collection creates
temporary example brand/creator accounts and verifies signup, login, campaign
creation/browsing/ownership, submission creation, view updates, and creator
earnings. A local MongoDB must be initialized as a replica set (`rs0`) for
transactional payout allocation; Atlas deployments support transactions.
