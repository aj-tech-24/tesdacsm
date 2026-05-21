Upstash distributed rate-limiter — Vercel setup & verification
=============================================================

This project supports an optional Upstash-backed distributed rate limiter. When enabled, rate limits apply across all Vercel serverless instances.

1) Add environment variables in Vercel (UI)
- Open your Vercel Project → Settings → Environment Variables
- Add the following names and values (set for `Production` and `Preview` as needed):
  - `UPSTASH_REDIS_REST_URL` → (value from your Upstash Redis instance)
  - `UPSTASH_REDIS_REST_TOKEN` → (value from your Upstash Redis instance)

2) Add environment variables via Vercel CLI (alternative)
- Install/vercel and log in: `npm i -g vercel` and `vercel login`
- Add variables (each command prompts for the value):
```
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add UPSTASH_REDIS_REST_URL preview
vercel env add UPSTASH_REDIS_REST_TOKEN preview
```

3) Deploy
- Push to your Git branch and let Vercel build and deploy, or run `vercel --prod`.

4) Verify (basic)
- Check that the app responds normally:
```
curl -i -X POST https://your-deployment-url/api/submit-feedback \
  -H 'Content-Type: application/json' -d '{}'
```
- Look for a `200` (or `4xx` for bad payload) and normal response body.

5) Verify rate-limiting behavior (burst test)
- Run a small burst loop (bash):
```
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code} %{time_total}\n" -X POST https://your-deployment-url/api/submit-feedback \
    -H 'Content-Type: application/json' -d '{}' &
done; wait
```
- PowerShell equivalent:
```
1..20 | ForEach-Object { Start-Job -ScriptBlock { curl -s -o $null -w "%{http_code} %{time_total}\n" -X POST "https://your-deployment-url/api/submit-feedback" -H "Content-Type: application/json" -d '{}' } }
Get-Job | Wait-Job | Receive-Job
```
- Expected: some requests will return `429` once burst/sustained limits are exceeded. When a 429 is returned, response headers include `Retry-After` and `X-RateLimit-*`.

6) Troubleshooting
- If no distributed limiting occurs (still per-instance only):
  - Confirm `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in Vercel and spelled exactly.
  - Ensure `@upstash/ratelimit` and `@upstash/redis` are installed (`pnpm install`).
  - Check function logs in Vercel for warnings about falling back to the local limiter.

7) Rollback
- Remove the environment variables and re-deploy to return to local in-memory limiting.

That's it — once configured the app will use Upstash automatically and apply rate limits across instances.
