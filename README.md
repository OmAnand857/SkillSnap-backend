# SkillSnap Backend

Express backend with Firebase Authentication & Firestore and integration with Judge0 for code execution.

Endpoints overview:
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me
- GET /api/skills
- GET /api/assessments/:skillId
- POST /api/assessments/:skillId/submit
- POST /api/execute

Setup:
1. Copy `.env.example` to `.env` and fill required keys (see below).
2. npm install
3. npm run dev

Environment notes:
- `FIREBASE_PRIVATE_KEY` must preserve newlines; in `.env` escape newlines as `\\n` (see `.env.example`).
- `FIREBASE_API_KEY` is the Web API key (used for password login flow).
- `JUDGE0_URL` and `JUDGE0_KEY` are required to call Judge0 (RapidAPI or self-hosted URL).

Service account JSON:
- If you have a Firebase Admin service account JSON (e.g., `*-firebase-adminsdk-*.json`) in the project root, the server will auto-load it. For local development you can set `GOOGLE_APPLICATION_CREDENTIALS=./path-to-file.json` instead.
- **Do not** commit service account files to git. They have been added to `.gitignore`; remove them from history if already committed.

Enabling Email/Password auth:
1. Open Firebase Console → Authentication → Sign-in method.
2. Enable "Email/Password" provider so `/api/auth/signup` and `/api/auth/login` work.

Seed data:
- A helper script to seed a sample problem is available at `scripts/seed.js`.
  Run: `node scripts/seed.js` (ensure Firebase env vars or service account is set and project exists).

Security: ⚠️
- Rate limiting is enabled for `/api/execute` to prevent abuse.
- Keep your `.env` out of source control and add secrets to your hosting provider's secret store for production.
