# SRS Performance Verification (k6)

This folder contains load and response-time checks for SRS non-functional requirements.

## Target Requirements

- Average user-facing routes should load within 3 seconds (measured as API/page response latency).
- Platform should sustain high concurrency without elevated error rate.

## Prerequisites

- Backend running on `http://127.0.0.1:8000`
- Frontend running on `http://127.0.0.1:3000`
- Admin panel running on `http://127.0.0.1:3001`
- k6 installed: `k6 version`

## Optional Test Users

Use real credentials to enable authenticated seeker/admin scenarios.

- `SEEKER_EMAIL`
- `SEEKER_PASSWORD`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Run

```powershell
k6 run .\tests\performance\k6-srs-load.js \
  -e BASE_URL=http://127.0.0.1:8000 \
  -e FRONTEND_URL=http://127.0.0.1:3000 \
  -e ADMIN_URL=http://127.0.0.1:3001 \
  -e SEEKER_EMAIL=seeker@example.com \
  -e SEEKER_PASSWORD=secret \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=secret
```

## Thresholds

- `http_req_failed < 2%`
- `p95(http_req_duration) < 3000 ms`
- `p99(http_req_duration) < 5000 ms`

## Interpreting Results

- If thresholds pass, performance requirement is provisionally satisfied for tested routes.
- If thresholds fail, optimize:
  - database indexes and query plans
  - API response payload size
  - frontend route prefetch/caching
  - server resources and scaling strategy
