# SRS Traceability Matrix

This matrix maps SRS requirements to implemented code and current verification state.

## 1. Introduction and Scope

- **Corporate platform for job seekers and partners**: Implemented
  - Evidence: [hijira-frontend/app/page.tsx](hijira-frontend/app/page.tsx), [hijira-backend/routes/api.php](hijira-backend/routes/api.php)

## 2. User Classes

- **Public Visitors**: Implemented
  - Evidence: [hijira-frontend/app/About/page.tsx](hijira-frontend/app/About/page.tsx), [hijira-frontend/app/Services/page.tsx](hijira-frontend/app/Services/page.tsx), [hijira-frontend/app/Jobs/page.tsx](hijira-frontend/app/Jobs/page.tsx), [hijira-frontend/app/Contact/page.tsx](hijira-frontend/app/Contact/page.tsx)
- **Job Seekers**: Implemented
  - Evidence: [hijira-frontend/app/RegisterMultiStep/page.tsx](hijira-frontend/app/RegisterMultiStep/page.tsx), [hijira-frontend/app/Profile/page.tsx](hijira-frontend/app/Profile/page.tsx), [hijira-frontend/app/Jobs/[id]/apply/page.tsx](hijira-frontend/app/Jobs/[id]/apply/page.tsx)
- **Employers / Recruitment Partners**: Implemented
  - Evidence: [hijira-frontend/app/RegisterPartner/page.tsx](hijira-frontend/app/RegisterPartner/page.tsx), [hijira-frontend/app/Partner/page.tsx](hijira-frontend/app/Partner/page.tsx), [hijira-backend/app/Http/Controllers/Api/ApplicationController.php](hijira-backend/app/Http/Controllers/Api/ApplicationController.php)
- **Administrators**: Implemented
  - Evidence: [hijira-admin-panel/app/Dashboard/page.tsx](hijira-admin-panel/app/Dashboard/page.tsx), [hijira-admin-panel/app/Users/page.tsx](hijira-admin-panel/app/Users/page.tsx), [hijira-admin-panel/app/Applications/page.tsx](hijira-admin-panel/app/Applications/page.tsx), [hijira-admin-panel/app/Messages/page.tsx](hijira-admin-panel/app/Messages/page.tsx)

## 3. Website Features

### 3.1 Home Page
- Implemented
  - Evidence: [hijira-frontend/app/page.tsx](hijira-frontend/app/page.tsx)

### 3.2 About Us
- Implemented
  - Evidence: [hijira-frontend/app/About/page.tsx](hijira-frontend/app/About/page.tsx), [hijira-backend/app/Http/Controllers/Api/AboutPageController.php](hijira-backend/app/Http/Controllers/Api/AboutPageController.php)

### 3.3 Services
- Implemented
  - Evidence: [hijira-frontend/app/Services/page.tsx](hijira-frontend/app/Services/page.tsx), [hijira-backend/app/Http/Controllers/Api/ServiceController.php](hijira-backend/app/Http/Controllers/Api/ServiceController.php)

### 3.4 Job Listings
- Implemented
  - Evidence: [hijira-frontend/app/Jobs/page.tsx](hijira-frontend/app/Jobs/page.tsx), [hijira-backend/app/Http/Controllers/Api/JobController.php](hijira-backend/app/Http/Controllers/Api/JobController.php)

### 3.5 Job Seeker Registration
- Implemented
  - Evidence: [hijira-frontend/app/RegisterMultiStep/page.tsx](hijira-frontend/app/RegisterMultiStep/page.tsx), [hijira-backend/app/Http/Controllers/Api/AuthController.php](hijira-backend/app/Http/Controllers/Api/AuthController.php)

### 3.6 Job Seeker Profile and Documents
- Implemented
  - Evidence: [hijira-frontend/app/Profile/page.tsx](hijira-frontend/app/Profile/page.tsx), [hijira-backend/app/Http/Controllers/Api/ProfileController.php](hijira-backend/app/Http/Controllers/Api/ProfileController.php), [hijira-backend/app/Http/Controllers/Api/DocumentController.php](hijira-backend/app/Http/Controllers/Api/DocumentController.php)

### 3.7 Job Application System
- Implemented
  - Evidence: [hijira-frontend/app/Jobs/[id]/apply/page.tsx](hijira-frontend/app/Jobs/[id]/apply/page.tsx), [hijira-backend/app/Http/Controllers/Api/ApplicationController.php](hijira-backend/app/Http/Controllers/Api/ApplicationController.php)

### 3.8 Contact System
- Implemented
  - Evidence: [hijira-frontend/app/Contact/page.tsx](hijira-frontend/app/Contact/page.tsx), [hijira-backend/app/Http/Controllers/Api/ContactController.php](hijira-backend/app/Http/Controllers/Api/ContactController.php)

### 3.9 Multilingual Support
- Implemented
  - Evidence: [hijira-frontend/lib/i18n.ts](hijira-frontend/lib/i18n.ts), [hijira-admin-panel/lib/i18n.ts](hijira-admin-panel/lib/i18n.ts)

### 3.10 Admin Portal
- **User Management (view/edit/delete/approve)**: Implemented
  - Evidence: [hijira-admin-panel/app/Users/page.tsx](hijira-admin-panel/app/Users/page.tsx), [hijira-backend/app/Http/Controllers/Api/AdminController.php](hijira-backend/app/Http/Controllers/Api/AdminController.php)
- **Job Management (create/edit/close)**: Implemented
  - Evidence: [hijira-admin-panel/app/Jobs/page.tsx](hijira-admin-panel/app/Jobs/page.tsx), [hijira-backend/app/Http/Controllers/Api/JobController.php](hijira-backend/app/Http/Controllers/Api/JobController.php)
- **Application Management**: Implemented
  - Evidence: [hijira-admin-panel/app/Applications/page.tsx](hijira-admin-panel/app/Applications/page.tsx), [hijira-backend/app/Http/Controllers/Api/ApplicationController.php](hijira-backend/app/Http/Controllers/Api/ApplicationController.php)
- **Content Management (home/about/services/policies/faq)**: Implemented
  - Evidence: [hijira-admin-panel/app/Homepage/page.tsx](hijira-admin-panel/app/Homepage/page.tsx), [hijira-admin-panel/app/About/page.tsx](hijira-admin-panel/app/About/page.tsx), [hijira-admin-panel/app/Services/page.tsx](hijira-admin-panel/app/Services/page.tsx), [hijira-admin-panel/app/Policies/page.tsx](hijira-admin-panel/app/Policies/page.tsx), [hijira-admin-panel/app/FAQ/page.tsx](hijira-admin-panel/app/FAQ/page.tsx)
- **Message Management (view/reply/resolve)**: Implemented
  - Evidence: [hijira-admin-panel/app/Messages/page.tsx](hijira-admin-panel/app/Messages/page.tsx), [hijira-backend/app/Http/Controllers/Api/AdminContactController.php](hijira-backend/app/Http/Controllers/Api/AdminContactController.php)

## 4. Non-Functional Requirements

- **Performance**: In progress verification
  - Evidence: [hijira-backend/tests/performance/k6-srs-load.js](hijira-backend/tests/performance/k6-srs-load.js)
- **Security**: Partially verified by implementation, pending formal test report
  - Evidence: [hijira-backend/routes/api.php](hijira-backend/routes/api.php), [hijira-backend/app/Http/Controllers/Api/DocumentController.php](hijira-backend/app/Http/Controllers/Api/DocumentController.php)
- **Scalability**: Partially verified by architecture and caching; pending load validation
  - Evidence: [hijira-frontend/lib/api.ts](hijira-frontend/lib/api.ts), [hijira-admin-panel/lib/api.ts](hijira-admin-panel/lib/api.ts)
- **Availability (99.5%)**: Pending deployment monitoring evidence
- **Mobile Responsiveness**: Implemented in UI layouts; pending full device QA signoff

## Final Status

- **Functional SRS**: Complete in code implementation.
- **Non-functional SRS**: Requires verification evidence collection using the performance and QA checklists.
