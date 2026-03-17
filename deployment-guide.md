## PranaPredict AI – Deployment Guide (Render + Vercel + GitHub Actions)

This guide walks you through deploying the **backend to Render**, the **frontend to Vercel**, and wiring up **GitHub Actions** for CI/CD. Keep your secrets in GitHub/Vercel/Render – never commit them.

---

### 1) Prerequisites
- GitHub repository access with permission to add Actions secrets.
- Accounts on **Render** and **Vercel**.
- Required external services configured (Supabase, Hugging Face, SMTP).
- Node.js 20+ locally (matches the workflow runner).

---

### 2) Environment variables
Backend (`backend/.env.example`):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `HUGGINGFACE_API_KEY` (and optional `HUGGINGFACE_MODEL`, `HF_API_URL`)
- `FRONTEND_URL` (comma-separated allowlist, include your Vercel domain)
- `EMAIL_USER`, `EMAIL_APP_PASSWORD` (SMTP credentials)
- `PORT` (Render provides, but keep default fallback)
- `NODE_ENV` (`production` in Render)

Frontend (`frontend/.env.example`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BACKEND_URL` (set to the Render backend URL)

Copy the examples, fill values, and place them as service-level environment variables in Render and Vercel (not in the repo).

---

### 3) Deploy the backend to Render
1. **Create service**: New Web Service → connect this repo → select `backend` directory.
2. **Runtime**: Node 20.
3. **Build command**: `npm ci`
4. **Start command**: `npm start`
5. **Env vars**: Add all backend vars listed above. Render will inject `PORT`; keep it unset or default to `5000`.
6. **Health check**: `/api/health` (optional in Render settings).
7. **Deploy hook**: In Render service → Settings → Deploy Hooks → create hook URL. Save it for GitHub Actions as `RENDER_DEPLOY_HOOK`.

---

### 4) Deploy the frontend to Vercel
1. In Vercel, create a **New Project** and link this GitHub repo. Set the root to `/frontend`.
2. **Framework**: Vite (auto-detected). Build command `npm run build`, Output `dist`.
3. **Env vars**: Add the frontend vars above. Set `VITE_BACKEND_URL` to the Render backend URL.
4. **Domains**: Assign your Vercel domain/custom domain.
5. **Project IDs**: From Project Settings → General, note `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` for GitHub Actions. Create a **Vercel token** for CI and store as `VERCEL_TOKEN`.

---

### 5) GitHub Actions CI/CD
We provide `.github/workflows/deploy.yml` to lint/build and deploy. It triggers on pushes to `main` and on manual dispatch.

**Secrets to add in GitHub repo settings → Secrets and variables → Actions:**
- `RENDER_DEPLOY_HOOK` – Render deploy hook URL (backend)
- `VERCEL_TOKEN` – Vercel token with deploy access
- `VERCEL_ORG_ID` – Vercel org ID for the project
- `VERCEL_PROJECT_ID` – Vercel project ID

Workflow highlights:
- **Backend job**: install deps, then POST to Render deploy hook.
- **Frontend job**: install deps, run `npm run lint`, then `vercel build` and deploy via `vercel deploy --prebuilt --prod`.

```yaml
# .github/workflows/deploy.yml
name: CI/CD (Render + Vercel)

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  backend:
    name: Deploy backend to Render
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      - name: Trigger Render deploy
        env:
          RENDER_DEPLOY_HOOK: ${{ secrets.RENDER_DEPLOY_HOOK }}
        run: |
          if [ -z "$RENDER_DEPLOY_HOOK" ]; then
            echo "RENDER_DEPLOY_HOOK secret is missing" && exit 1
          fi
          curl -X POST "$RENDER_DEPLOY_HOOK"

  frontend:
    name: Deploy frontend to Vercel
    runs-on: ubuntu-latest
    needs: backend
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
       cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          npm install -g vercel@latest
          vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
          vercel build --prod --token="$VERCEL_TOKEN"
          vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"
```

> Tip: You can run the workflow manually from the **Actions** tab (workflow_dispatch) after updating secrets.

---

### 6) Verifying deployments
- Backend: `GET https://<render-app-url>/api/health` should return `{ status: "ok", ... }`.
- Frontend: Vercel domain should load and communicate with the Render backend (check console/network for CORS).

---

### 7) Troubleshooting
- CORS errors: ensure `FRONTEND_URL` on the backend includes your Vercel domain(s).
- Deploy hook failures: rotate the Render deploy hook and update `RENDER_DEPLOY_HOOK`.
- Vercel deploy errors: confirm `VERCEL_TOKEN/ORG_ID/PROJECT_ID` secrets and that env vars are set in Vercel.
