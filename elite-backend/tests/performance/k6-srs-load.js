import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8000';
const FRONTEND_URL = __ENV.FRONTEND_URL || 'http://127.0.0.1:3000';
const ADMIN_URL = __ENV.ADMIN_URL || 'http://127.0.0.1:3001';

// Optional authenticated flows.
const SEEKER_EMAIL = __ENV.SEEKER_EMAIL || '';
const SEEKER_PASSWORD = __ENV.SEEKER_PASSWORD || '';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || '';

export const options = {
  scenarios: {
    public_browse: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 250 },
        { duration: '30s', target: 0 },
      ],
      exec: 'publicBrowseScenario',
    },
    seeker_flow: {
      executor: 'ramping-vus',
      startVUs: 2,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 50 },
        { duration: '20s', target: 0 },
      ],
      exec: 'seekerFlowScenario',
    },
    admin_flow: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 20 },
        { duration: '20s', target: 0 },
      ],
      exec: 'adminFlowScenario',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
  },
};

function jsonHeaders(token = '') {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function login(email, password) {
  if (!email || !password) return '';

  const res = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders() }
  );

  const ok = check(res, {
    'login status 200': (r) => r.status === 200,
  });

  if (!ok) return '';

  const body = res.json();
  return body?.auth?.access_token || body?.token || '';
}

export function publicBrowseScenario() {
  const home = http.get(`${BASE_URL}/api/homepage`, { headers: { Accept: 'application/json' } });
  check(home, { 'homepage API 200': (r) => r.status === 200 });

  const about = http.get(`${BASE_URL}/api/about-page`, { headers: { Accept: 'application/json' } });
  check(about, { 'about API 200': (r) => r.status === 200 });

  const services = http.get(`${BASE_URL}/api/services`, { headers: { Accept: 'application/json' } });
  check(services, { 'services API 200': (r) => r.status === 200 });

  const jobs = http.get(`${BASE_URL}/api/jobs?q=driver&country=UAE`, { headers: { Accept: 'application/json' } });
  check(jobs, { 'jobs API 200': (r) => r.status === 200 });

  // Frontend route render checks (SSR/page response only)
  const feJobs = http.get(`${FRONTEND_URL}/Jobs`);
  check(feJobs, { 'frontend jobs page 200': (r) => r.status === 200 });

  const feAbout = http.get(`${FRONTEND_URL}/About`);
  check(feAbout, { 'frontend about page 200': (r) => r.status === 200 });

  const feServices = http.get(`${FRONTEND_URL}/Services`);
  check(feServices, { 'frontend services page 200': (r) => r.status === 200 });

  sleep(1);
}

export function seekerFlowScenario() {
  const token = login(SEEKER_EMAIL, SEEKER_PASSWORD);
  if (!token) {
    sleep(1);
    return;
  }

  const profile = http.get(`${BASE_URL}/api/profile`, { headers: jsonHeaders(token) });
  check(profile, { 'seeker profile 200': (r) => r.status === 200 });

  const myApps = http.get(`${BASE_URL}/api/my-applications`, { headers: jsonHeaders(token) });
  check(myApps, { 'seeker applications 200': (r) => r.status === 200 });

  const messages = http.get(`${BASE_URL}/api/my-contacts`, { headers: jsonHeaders(token) });
  check(messages, { 'seeker contacts 200': (r) => r.status === 200 });

  sleep(1);
}

export function adminFlowScenario() {
  const token = login(ADMIN_EMAIL, ADMIN_PASSWORD);
  if (!token) {
    sleep(1);
    return;
  }

  const stats = http.get(`${BASE_URL}/api/admin/stats`, { headers: jsonHeaders(token) });
  check(stats, { 'admin stats 200': (r) => r.status === 200 });

  const users = http.get(`${BASE_URL}/api/admin/users`, { headers: jsonHeaders(token) });
  check(users, { 'admin users 200': (r) => r.status === 200 });

  const applications = http.get(`${BASE_URL}/api/admin/applications`, { headers: jsonHeaders(token) });
  check(applications, { 'admin applications 200': (r) => r.status === 200 });

  const messages = http.get(`${BASE_URL}/api/admin/contacts`, { headers: jsonHeaders(token) });
  check(messages, { 'admin contacts 200': (r) => r.status === 200 });

  const adminUi = http.get(`${ADMIN_URL}/Dashboard`);
  check(adminUi, { 'admin dashboard page 200': (r) => r.status === 200 });

  sleep(1);
}
