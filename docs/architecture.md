# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep each capability in its existing React component and use the shared API client for relative `/api` requests. Every view exposes accessible loading, empty, and error states.
- Logic tier decision: Keep Express routes thin and put validation and business behavior in `octofitService.ts`. Return deliberate 4xx responses for invalid or unknown input; do not leak Mongoose cast errors as 500s.
- Data tier decision: Make required model fields explicit, give team members an empty-array default, and keep seed operations idempotent without deleting unrelated records.
- Activity tracking approach: Validate `userId` and `teamId` formats and confirm both records exist before creating an activity. Store the corresponding user/team references, type, minutes, server-generated points (initially one point per minute), and occurrence time.
- Team management approach: Require a non-empty name, preserve the submitted name and mascot, and store the provided member references; default omitted members to an empty array.
- Leaderboard approach: Sum persisted activity points per team, sort by total descending, and assign 1-based ranks in the service.
- Workout suggestions approach: Find the user by email, prefer a workout matching their fitness goal and otherwise use their recent activity focus, and include a concise reason. Return 404 when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`. A failure indicates a model validation/default or seed idempotency/data-preservation regression.
- API command: `npm run test:api --prefix octofit-tracker/backend`. A failure indicates an endpoint/service contract regression, including validation status codes, activity/team persistence, leaderboard totals/ranks, or recommendation matching/reasons.
- Frontend command: `npm test --prefix octofit-tracker/frontend`. A failure indicates a presentation/API-client regression, including rendered data, requested user, accessible loading/error states, or meaningful empty states.
- Backend build command: `npm run build --prefix octofit-tracker/backend`. A failure indicates a TypeScript compilation error in backend code.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`. A failure indicates a TypeScript or Vite production-build error.
- Implementation order: Run the data contract first; then implement and test activity/team services, followed by leaderboard/recommendations; then complete the frontend views and run frontend tests. Finish with both builds and all three test commands.
- Baseline observed on 2026-10-28: `npm test --prefix octofit-tracker/backend` had 8 failures and 1 pass (the seed test). `npm test --prefix octofit-tracker/frontend -- --reporter=dot` had 15 failures. The focused `test:data` and `test:api` scripts and both builds have not yet been run individually.
