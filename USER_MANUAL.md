# TESDA CSM System User Manual (Handover Guide)

This guide is for the next person who will run and maintain this system, even with minimal technical background.

---

## 1) What this system does

The TESDA CSM system is a web app used to:
- collect feedback from clients,
- let admins view and manage feedback,
- generate reports and exports.

Main parts:
- **Frontend/UI**: pages users and admins open in the browser
- **API routes**: server-side logic for saving and reading data
- **Database**: stores users, feedback, metadata

---

## 2) Basic tools you need installed

- **Node.js 20+**
- **pnpm** (recommended via Corepack) or **npm**
- A terminal (PowerShell on Windows is fine)

Recommended setup command:

```bash
corepack enable
```

---

## 3) First-time setup (local machine)

From the project folder:

```bash
corepack pnpm install
```

If you prefer npm:

```bash
npm install
```

This installs dependencies and generates Prisma client automatically.

---

## 4) Everyday run commands

### Start development server

```bash
corepack pnpm dev
```

Open:

```text
http://localhost:3000
```

### Build for production

```bash
corepack pnpm build
```

### Start production server

```bash
corepack pnpm start
```

---

## 5) Quick health check before handing over each day

Run these in order:

```bash
corepack pnpm test
corepack pnpm build
```

Notes:
- `pnpm test` should ideally pass all tests.
- `pnpm build` must complete successfully before production deployment.
- If build fails due to blocked internet when downloading Google Fonts, retry on a network with normal internet access.

---

## 6) Debugging guide (step-by-step, non-technical friendly)

When something is broken, use this process:

### Step A — Confirm what is broken

1. Write down exactly what the user sees (error text, blank page, slow response, etc.).
2. Ask: Is this for **all users** or only one user?
3. Ask: Is it happening **all the time** or only at specific times?

### Step B — Restart safely

1. Stop server (`Ctrl + C` in terminal).
2. Start it again:
   ```bash
   corepack pnpm dev
   ```
3. Test the same action again.

If issue disappears, likely temporary.

### Step C — Check terminal errors

In the terminal where app is running, look for:
- `Error:`
- `Failed`
- `Cannot`
- `Unauthorized` or `401`
- `500`

Copy the full message before doing anything else.

### Step D — Run tests to isolate issue

```bash
corepack pnpm test
```

- If one test fails, read the failure block.
- Use the failing file path shown in output to locate related code.

### Step E — Check common problem types

#### 1) App will not start

Possible causes:
- Missing dependencies
- Wrong Node version

Fix:
```bash
corepack pnpm install
corepack pnpm dev
```

#### 2) Build fails

Run:
```bash
corepack pnpm build
```

Common cause in restricted networks:
- Google Fonts fetch error during Next build.

Action:
- Retry on internet-enabled network or deployment environment.

#### 3) PDF export fails

The project uses Puppeteer and may require Chrome/Chromium.

Check `CHROME_EXECUTABLE_PATH`.
- Linux example: `/usr/bin/chromium`
- If missing, install Chromium/Chrome and restart server.

Reference file: `PRODUCTION_SERVER_STEPS.md` (section: Enabling server-side PDF generation).

#### 4) User cannot log in

Check:
- username/password correctness,
- if seed/default users were created,
- session/cookie settings and server time.

#### 5) Slow response or temporary 429 errors

System may be rate-limiting too many requests.
- Wait and retry after a short time.
- If using Upstash rate limiter, verify Upstash environment variables.

Reference file: `README_UPSTASH.md`.

---

## 7) Maintenance guide

### Daily
- Confirm app can open.
- Submit one test feedback entry and verify it appears in admin side.
- Check terminal for recurring errors.

### Weekly
- Run:
  ```bash
  corepack pnpm test
  corepack pnpm build
  ```
- Review recent changes in Git before deployment.
- Ensure backups/exports are being generated as expected.

### Monthly
- Review environment variables and remove unused ones.
- Update dependencies carefully (in a separate maintenance branch).
- Re-test report export and PDF generation.

---

## 8) Safe change process (to avoid breaking production)

1. Pull latest code.
2. Run tests.
3. Make small changes only.
4. Run tests again.
5. Run build.
6. Deploy.
7. Do smoke test in production (login, submit feedback, generate report).

---

## 9) Important files and where to look first

- `package.json` — commands (`dev`, `build`, `test`, `lint`)
- `prisma/schema.prisma` — database models
- `prisma/seed.ts` — default seed users and metadata
- `app/api/**` — backend API routes
- `app/admin/**` — admin pages
- `PRODUCTION_SERVER_STEPS.md` — production/LAN run + PDF setup
- `README_UPSTASH.md` — distributed rate-limit setup

---

## 10) Handover checklist for the next maintainer

Before transfer is complete, make sure the new owner can do these tasks alone:

- [ ] Install dependencies
- [ ] Start dev server
- [ ] Run tests
- [ ] Build project
- [ ] Login as admin
- [ ] Generate/export report
- [ ] Locate and read terminal errors
- [ ] Restart server safely

---

## 11) Emergency fallback plan

If production is failing and users are affected:

1. Stop new deployments immediately.
2. Roll back to last known working deployment.
3. Capture error logs and exact timestamp.
4. Notify stakeholders with impact and estimated restoration time.
5. Fix in staging/local first, then redeploy.

---

## 12) Notes for non-technical maintainers

- Do not change many files at once.
- Keep a log of what you changed and when.
- If unsure, stop and ask for review before deploying.
- A small, tested fix is always safer than a big untested fix.
