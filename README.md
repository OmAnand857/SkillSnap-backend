# SkillSnap Backend — Technical README 🔧

Comprehensive backend for SkillSnap: Express server with Firebase Authentication & Firestore, Judge0 integration for safe code execution, and Supabase Storage for certificates. This README describes architecture, features, routes, environment variables, setup, security notes, and operational guidance for developers.

---

## 🚀 Features

- Server
  - Node.js + Express API
  - Secure server-side Firebase Admin SDK for Authentication and Firestore
  - JWT-based auth via Firebase idToken (issued by Firebase client REST signIn)
  - Rate-limited, validated code execution using Judge0
  - Supabase Storage integration for certificate PDF uploads
  - Seed script to populate Firestore with sample skills / assessments / problems

- Data model (Firestore)
  - Collection: `skills` — skill catalog documents
  - Collection: `assessments` — assessment definitions per skill (contains questions)
  - Collection: `problems` — programming problems; each problem has `testcases` subcollection
  - Collection: `submissions` — user assessment & coding submissions
  - Collection: `certificates` — generated certificate metadata

- Developer conveniences
  - Health/debug endpoints (`/api/debug/*`) to quickly verify connectivity and env variables
  - Seed script: `scripts/seed.js` (idempotent per document IDs)

---

## 📐 Architecture & Flow

1. Client authenticates via Firebase Auth (web client) or calls `POST /api/auth/login` (server uses Firebase REST sign-in).
2. Protected routes require `Authorization: Bearer <idToken>`; server verifies idToken with Firebase Admin.
3. Code Execution Flow (`POST /api/execute`):
   - Backend fetches the problem by `question_id` and loads **hidden** test cases from Firestore (only hidden testcases are used for judging).
   - Backend constructs Judge0 submission payload (base64-encoded) and calls Judge0 endpoint (configured via `JUDGE0_URL` and `JUDGE0_KEY`).
   - Judge0 executes in sandbox (remote or RapidAPI); backend decodes results and returns a unified report to the frontend.

4. Certification Flow:
   - `POST /api/certificates` generates a PDF (using `pdfkit`) and uploads it to Supabase Storage (`SUPABASE_CERT_BUCKET`).
   - Metadata stored in Firestore `certificates` collection with a generated `verifiedId`.
   - `GET /api/certificates/:id` returns metadata and a signed/public URL to download the certificate.

5. Safety & Isolation:
   - Judge0 provides sandboxed execution; backend enforces payload limits and rate limiting.
   - Use a private Supabase service key on the server to upload files.

---

## 🔌 Routes (detail)

Authentication (`/api/auth`)
- POST `/api/auth/signup`
  - Body: `{ email, password, displayName? }` — creates Firebase user + Firestore user doc.
  - Returns: `{ uid, email }`.
- POST `/api/auth/login`
  - Body: `{ email, password }` — uses Firebase REST signInWithPassword; returns idToken.
  - Returns: `{ token: idToken, refreshToken, uid }`.
- GET `/api/auth/me` (auth required)
  - Returns user document.
- PUT `/api/auth/me` (auth required)
  - Body: `{ displayName?, password? }` — updates Firebase Auth & Firestore doc.

Skills & Assessments
- GET `/api/skills` — list skills from `skills` collection.
- GET `/api/assessments/:skillId` — returns assessment details with *non-hidden* testcases.
- POST `/api/assessments/:skillId/submit` (auth required) — store submissions in `submissions`.

Judge0 Code Execution
- POST `/api/execute` (auth required, rate limited)
  - Body: `{ language_id, source_code, question_id }`.
  - Server fetches hidden testcases, submits to Judge0, aggregates results:
    ```json
    {
      "status": "Accepted|Wrong Answer|Compilation Error|...",
      "results": [ { testcase_id, status, stdout, stderr, compile_output, execution_time, memory } ]
    }
    ```

Certificates
- POST `/api/certificates` (open by default — consider locking to auth in production)
  - Body: `{ userName, skillId, skillName, userId? }` — generates PDF, uploads to Supabase, stores metadata.
  - Returns: `{ id, url, verifiedId }`.
- GET `/api/certificates/:id` — returns certificate metadata and downloadable URL.

Debug & Utilities
- GET `/api/debug/firebase` — shows non-sensitive Firebase status and Firestore accessibility.
- GET `/api/debug/env` — shows presence of required environment variables (does not return secret values).
- CLI: `npm run seed` to populate Firestore with `skills`, `assessments`, and `problems`.

---

## 🔑 Environment Variables

Essential:
- `PORT` (default 4000)
- Firebase Admin (or provide service account JSON via `GOOGLE_APPLICATION_CREDENTIALS`):
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY` (escape newlines as `\\n` in `.env`)
- Firebase Auth client key:
  - `FIREBASE_API_KEY` (Web API key used for password login REST calls)
- Judge0:
  - `JUDGE0_URL` (e.g., `https://judge0-ce.p.rapidapi.com` or your self-hosted endpoint)
  - `JUDGE0_KEY` (optional, RapidAPI key if using RapidAPI)
- Supabase (certificates):
  - `SUPABASE_URL` (your project URL, e.g., `https://<ref>.supabase.co`)
  - `SUPABASE_KEY` (use **service role** key for server uploads — keep secret)
  - `SUPABASE_CERT_BUCKET` (defaults to `certificates`)

Optional / Dev:
- `INTERNAL_SECRET` — optional internal trigger secret (not used if certificates are open)
- `NODE_ENV`

Security note: Keep secrets out of source control and use your platform secret manager in production.

---

## 🛠 Setup & Local Development

1. Copy `.env.example` → `.env` and fill values.
2. Install:
   ```bash
   npm install
   ```
3. Seed Firestore (optional):
   ```bash
   npm run seed
   ```
4. Start server:
   ```bash
   npm run dev  # nodemon
   # or
   npm start
   ```
5. Health endpoints:
   - `GET /api/debug/env` — check required env vars presence
   - `GET /api/debug/firebase` — check Firebase accessibility

---

## 🧪 Judge0 — Running safely (dev/prod)

Options:
- Use a public Judge0 instance (RapidAPI) — set `JUDGE0_URL` and `JUDGE0_KEY` and watch quotas.
- Self-host Judge0 in Docker (recommended for production/test control):
  - Official repo: https://github.com/judge0/judge0
  - Run via Docker Compose and expose API to your backend. Example quick-start:
    ```bash
    # Example (see upstream repo for full config)
    docker run -d --name judge0 -p 2358:2358 judge0/api
    ```
  - Set `JUDGE0_URL` to `http://localhost:2358` and leave `JUDGE0_KEY` empty.

Security:
- Judge0 sandboxing is handled by Judge0 internals; restrict payload sizes, enforce rate limits, and sanitize inputs on the server. Use async execution for high throughput.

---

## ♻️ Data Seeding

Run the included seed script to populate Firestore for local testing:
```bash
npm run seed
```
It will create `skills`, `assessments`, `problems` and `problems/{id}/testcases` (hidden and public), and will overwrite those document IDs.

---

## ✅ Security & Operational Notes

- Production recommendations:
  - Require authentication for certificate generation or use `INTERNAL_SECRET`/admin role checks.
  - Store secrets in a secure KV (AWS Secrets Manager, GCP Secret Manager, Vercel/Netlify secrets).
  - Monitor Judge0 usage and enforce stricter rate limits and quotas.
  - Rotate service account keys if they were exposed.

- Limitations & TODOs:
  - `POST /api/certificates` is open for testing; secure it for production.
  - Add richer PDF templates (branding, QR verification), certificate verification endpoint, and admin RBAC for certificate generation.

---

## 📞 Want help with next steps?
- I can lock certificate creation to an admin role, add QR-code verification, or produce a Postman collection and frontend examples for all routes.

---

Made with ❤️ by your backend automation — reach out if you want any of the optional improvements implemented.
