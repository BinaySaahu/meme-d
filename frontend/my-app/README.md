# Meme'd campaign frontend

Next.js frontend for the brand and creator campaign API.

Styling uses Tailwind CSS v4. Shared component styles are composed from
Tailwind utilities in `src/app/globals.css` using the components layer.

## Run locally

1. Start the backend from `backend/` and make sure MongoDB is configured as
   documented in `backend/API.md`.
2. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_API_URL` to the backend
   API base URL (default: `http://localhost:5000/api`).
3. Run `npm install` if dependencies are not installed, then start the frontend:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000/signup`, create a brand or creator account, and sign in.

The frontend stores the returned JWT and user profile in browser local storage.
The route structure separates `/login`, `/signup`, `/brand`, and `/creator`.
Brand and creator workspace routes are protected against unauthenticated and
wrong-role access. The brand workspace creates campaigns and shows
spent/remaining budget. The creator workspace browses live campaigns, submits
post URLs, simulates view updates, and displays target payouts separately from
paid earnings.
