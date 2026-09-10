# Orchify Environment Variables & Configuration Guide

This guide details all environment variables used across **Orchify**, instructions for obtaining third-party API credentials, and production secret management practices.

---

## 1. Quick Reference Matrix

| Variable | Required | Scope | Example / Default | Description |
| :--- | :---: | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | Server | `postgresql://...` | Connection string for PostgreSQL / Neon database. |
| `BETTER_AUTH_SECRET` | **Yes** | Server | `openssl rand -base64 32` | Master secret for session cookies and token signing. |
| `BETTER_AUTH_URL` | **Yes** | Server | `http://localhost:3000` | Canonical origin for authentication redirect callbacks. |
| `NEXT_PUBLIC_APP_URL`| **Yes** | Public/Client | `http://localhost:3000` | Client-accessible base URL for constructing webhook URLs. |
| `GITHUB_CLIENT_ID` | **Yes** | Server | `Ov23li...` | Client ID from GitHub OAuth App. |
| `GITHUB_CLIENT_SECRET`| **Yes** | Server | `a8427...` | Client Secret from GitHub OAuth App. |
| `GOOGLE_CLIENT_ID` | Optional | Server | `...apps.googleusercontent.com` | Google OAuth Client ID for social sign-in. |
| `GOOGLE_CLIENT_SECRET`| Optional| Server | `GOCSPX-...` | Google OAuth Client Secret. |
| `INNGEST_EVENT_KEY` | **Yes** | Server | `local` / `cloud_key` | Inngest Event Key for dispatching background jobs. |
| `INNGEST_SIGNING_KEY`| **Yes** | Server | `signkey-prod-...` | Inngest Signing Key for verifying webhook requests. |
| `INNGEST_BASE_URL` | Optional | Server | `https://api.inngest.com` | Base URL for self-hosted Inngest instances. |
| `ENCRYPTION_KEY` | **Yes** | Server | 32-character passphrase | Symmetrical AES-256 key for Cryptr credential vault. |
| `POLAR_ACCESS_TOKEN` | **Yes** | Server | `polar_oat_...` | Organization personal access token from Polar.sh. |
| `POLAR_SUCCESS_URL` | **Yes** | Server | `http://localhost:3000` | Target URL after completing a Polar checkout. |
| `POLAR_WEBHOOK_SECRET`| Optional| Server | `polar_whs_...` | Webhook verification secret for Polar events. |
| `NGROK_URL` | Optional | Dev Tooling | `https://your-domain.ngrok-free.app` | Public tunnel URL for testing webhooks locally. |
| `SENTRY_AUTH_TOKEN` | Optional | Build / CI | `sntrys_...` | Sentry authentication token for sourcemap uploads. |
| `NEXT_PUBLIC_SENTRY_DSN`| Optional| Public/Client | `https://...@sentry.io/...` | Public Sentry DSN for client-side crash reporting. |
| `SENTRY_ORG` | Optional | Build | `your-org-slug` | Sentry Organization slug. |
| `SENTRY_PROJECT` | Optional | Build | `orchify` | Sentry Project slug. |

---

## 2. Configuration Breakdown

### Database (`DATABASE_URL`)
Orchify utilizes **Prisma ORM** connecting to a PostgreSQL database. For production deployments with serverless compute (Vercel, AWS Lambda), a connection pooler like **Neon** or **Supabase PgBouncer** is strongly recommended.

- **Neon Connection String Example**:
  ```env
  DATABASE_URL="postgresql://neondb_owner:password@ep-sample-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  ```
- Make sure to append `?sslmode=require` when connecting to Neon.

---

### Authentication (`BETTER_AUTH_*`)
Orchify relies on **Better-Auth** for session handling, credentials verification, and OAuth.

- **`BETTER_AUTH_SECRET`**:
  Generate an authentic high-entropy key with:
  ```bash
  openssl rand -base64 32
  ```
- **`BETTER_AUTH_URL`**:
  In development: `http://localhost:3000`.
  In production: Your canonical custom domain (e.g. `https://orchify.dev`).

---

### OAuth Providers (GitHub & Google)
To configure GitHub OAuth:
1. Navigate to **GitHub Settings** > **Developer Settings** > **OAuth Apps** > **New OAuth App**.
2. Set **Application Name** to `Orchify`.
3. Set **Homepage URL** to `http://localhost:3000` (or your production URL).
4. Set **Authorization callback URL** to:
   ```text
   http://localhost:3000/api/auth/callback/github
   ```
5. Copy the generated **Client ID** and generate a new **Client Secret**.

---

### Credential Vault Encryption (`ENCRYPTION_KEY`)
API keys for AI providers (OpenAI, Gemini, Anthropic) saved by users are encrypted with **Cryptr** (AES-256-GCM).

> [!CAUTION]
> **CRITICAL**: The `ENCRYPTION_KEY` must never be lost or rotated without re-encrypting existing database rows. If this key is modified, all existing stored credentials in the `Credential` table will become unreadable!

Generate a strong passphrase (minimum 32 characters):
```bash
openssl rand -hex 16
```

---

### Inngest Durable Orchestration
Inngest coordinates workflow DAG steps and retries.

- **Local Development**:
  When using `inngest-cli dev`, you do not need live Cloud keys. Set placeholders:
  ```env
  INNGEST_EVENT_KEY="local"
  INNGEST_SIGNING_KEY="local"
  ```
  The Inngest Dev Server dashboard runs locally at `http://localhost:8288`.
- **Production**:
  1. Create an account at [inngest.com](https://www.inngest.com).
  2. Create an App named `orchify`.
  3. Retrieve the **Event Key** and **Signing Key** from the Inngest Cloud dashboard.
  4. Deploy Orchify and synchronize your endpoint with Inngest Cloud at:
     ```text
     https://your-domain.com/api/inngest
     ```

---

### Billing & Subscriptions (`POLAR_*`)
Orchify utilizes **Polar.sh** to gate premium features (creating workflows and credentials).

1. Log into your **Polar Dashboard** (or Polar Sandbox at `sandbox.polar.sh`).
2. Navigate to **Settings** > **Developers** > **Personal Access Tokens**.
3. Generate a token and set `POLAR_ACCESS_TOKEN="polar_oat_..."`.
4. Create a product named "Pro" and confirm the product slug / ID matches `productId` in [`src/lib/auth.ts`](file:///c:/Users/Abhijit%20Deshmane/Documents/Desktop/Projects/orchify/src/lib/auth.ts).
5. Set `POLAR_SUCCESS_URL` to your app URL (`http://localhost:3000`).

---

### Local Development Tunnel (`NGROK_URL`)
To test incoming webhooks (e.g. Stripe checkout events or Google Forms submissions) locally:
1. Create a free account at [ngrok.com](https://ngrok.com).
2. Install the ngrok CLI or run via `npx`.
3. Set `NGROK_URL="https://your-ngrok-subdomain.ngrok-free.app"` in your `.env`.
4. Running `npm run dev:all` automatically spawns the ngrok tunnel on port 3000 alongside Next.js and Inngest.

---

## 3. Production Deployment Checklist

Before deploying Orchify to production (e.g., on Vercel, Railway, AWS, or Docker):
1. [ ] Ensure `NODE_ENV=production` is set.
2. [ ] Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production HTTPS domain.
3. [ ] Configure production GitHub OAuth callback URLs to point to your live domain.
4. [ ] Ensure `DATABASE_URL` connects to a pooled PostgreSQL instance with SSL enforced.
5. [ ] Backup your `ENCRYPTION_KEY` in your enterprise secret manager (e.g., Doppler, AWS Secrets Manager, 1Password).
6. [ ] Connect production Inngest Cloud signing keys.
7. [ ] Switch Polar API mode from sandbox to production.
8. [ ] Provide Sentry DSN and auth tokens to capture production crashes and performance bottlenecks.
