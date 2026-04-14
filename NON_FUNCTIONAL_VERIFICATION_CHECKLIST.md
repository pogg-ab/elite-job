# Non-Functional Verification Checklist

## 1. Performance

- [ ] Run k6 script: [hijira-backend/tests/performance/k6-srs-load.js](hijira-backend/tests/performance/k6-srs-load.js)
- [ ] Confirm `p95 < 3000ms`
- [ ] Confirm `error rate < 2%`
- [ ] Test both cold start and warm cache runs

## 2. Security

- [ ] HTTPS enabled in deployment
- [ ] Password hashing confirmed (Laravel default hashing)
- [ ] JWT auth required on protected routes
- [ ] Role middleware enforcement verified (`isAdmin`, `isPartner`, `isSuperAdmin`)
- [ ] File upload mime/size validation tested
- [ ] SQL injection checks with malformed input on search/filter endpoints

## 3. Scalability

- [ ] Database indexes reviewed for high-traffic filters (`jobs`, `applications`, `contacts`)
- [ ] Caching verified for common GET endpoints (frontend/admin API clients)
- [ ] API and frontend instances can be horizontally scaled

## 4. Availability

- [ ] Health checks configured for backend/frontend/admin services
- [ ] Monitoring and alerting configured
- [ ] Backup and restore procedure tested
- [ ] Uptime target tracked against 99.5%

## 5. Mobile Responsiveness

- [ ] Test critical pages on mobile widths:
  - [ ] Home
  - [ ] Jobs
  - [ ] About
  - [ ] Services
  - [ ] Contact
  - [ ] Profile
  - [ ] Admin dashboard

## 6. Evidence to Collect

- [ ] k6 output report screenshots/files
- [ ] Browser performance traces for key pages
- [ ] Security test report summary
- [ ] Uptime dashboard snapshot
