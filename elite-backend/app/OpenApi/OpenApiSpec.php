<?php

namespace App\OpenApi;

use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *     version="1.0.0",
 *     title="Hijra Global API",
 *     description="Backend API for HIJRA Foreign Employment Agency recruitment platform"
 * )
 * @OA\Server(
 *     url="http://127.0.0.1:8000",
 *     description="API Server"
 * )
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="Token",
 *     description="Use Sanctum bearer token: Bearer {token}"
 * )
 *
 * @OA\Tag(name="Auth", description="Authentication endpoints")
 * @OA\Tag(name="Jobs", description="Public and admin job endpoints")
 * @OA\Tag(name="Profile", description="Seeker profile endpoints")
 * @OA\Tag(name="Documents", description="Document upload and secure access")
 * @OA\Tag(name="Applications", description="Job application endpoints")
 * @OA\Tag(name="Admin", description="Admin-only endpoints")
 * @OA\Tag(name="Contact", description="Public contact form endpoint")
 * @OA\Tag(name="Partner", description="Foreign partner agency endpoints")
 * @OA\Tag(name="Super Admin", description="Super admin approval endpoints")
 */
class OpenApiSpec
{
    /**
     * @OA\Post(
     *     path="/api/register",
     *     tags={"Auth"},
     *     summary="Register a seeker account with profile",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","email","password","password_confirmation","phone","profile"},
     *             @OA\Property(property="name", type="string", example="Abel Tadesse"),
     *             @OA\Property(property="email", type="string", format="email", example="abel@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="password123"),
     *             @OA\Property(property="password_confirmation", type="string", format="password", example="password123"),
     *             @OA\Property(property="phone", type="string", example="+251911223344"),
     *             @OA\Property(property="preferred_language", type="string", example="en"),
     *             @OA\Property(
     *                 property="profile",
     *                 type="object",
     *                 @OA\Property(property="full_name", type="string", example="Abel Tadesse"),
     *                 @OA\Property(property="gender", type="string", example="male"),
     *                 @OA\Property(property="date_of_birth", type="string", format="date", example="1998-08-16"),
     *                 @OA\Property(property="education_level", type="string", example="Bachelor"),
     *                 @OA\Property(property="experience_summary", type="string", example="3 years in housekeeping roles"),
     *                 @OA\Property(property="skills", type="array", @OA\Items(type="string", example="Housekeeping"))
     *             )
     *         )
     *     ),
     *     @OA\Response(response=201, description="Registration successful"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function registerDoc(): void {}

    /**
     * @OA\Post(
     *     path="/api/partner/register",
     *     tags={"Partner"},
     *     summary="Register foreign agency partner (pending super admin approval)",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 required={"name","email","password","password_confirmation","phone","company_name","license_file"},
     *                 @OA\Property(property="name", type="string"),
     *                 @OA\Property(property="email", type="string", format="email"),
     *                 @OA\Property(property="password", type="string", format="password"),
     *                 @OA\Property(property="password_confirmation", type="string", format="password"),
     *                 @OA\Property(property="phone", type="string", example="+251911223344"),
     *                 @OA\Property(property="company_name", type="string", example="Dubai Partner LLC"),
     *                 @OA\Property(property="company_email", type="string", format="email"),
     *                 @OA\Property(property="company_phone", type="string"),
     *                 @OA\Property(property="country", type="string", example="UAE"),
        *                 @OA\Property(property="license_file", type="string", format="binary")
     *             )
     *         )
     *     ),
        *     @OA\Response(
        *         response=201,
        *         description="Partner registration submitted",
        *         @OA\MediaType(
        *             mediaType="application/json",
        *             @OA\Schema(
        *                 type="object",
        *                 @OA\Property(property="message", type="string", example="Partner registration received and pending super admin approval."),
        *                 @OA\Property(property="agency", type="object")
        *             )
        *         )
        *     ),
        *     @OA\Response(
        *         response=422,
        *         description="Validation error",
        *         @OA\MediaType(
        *             mediaType="application/json",
        *             @OA\Schema(
        *                 type="object",
        *                 @OA\Property(property="message", type="string", example="Validation failed"),
        *                 @OA\Property(property="errors", type="object")
        *             )
        *         )
        *     )
     * )
     */
    public function partnerRegisterDoc(): void {}

    /**
     * @OA\Post(
     *     path="/api/login",
     *     tags={"Auth"},
     *     summary="Login and receive Sanctum token",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","password"},
     *             @OA\Property(property="email", type="string", format="email", example="abel@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="password123")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Login successful"),
     *     @OA\Response(response=422, description="Invalid credentials")
     * )
     */
    public function loginDoc(): void {}

    /**
     * @OA\Post(
     *     path="/api/logout",
     *     tags={"Auth"},
     *     summary="Logout current token",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Logout successful"),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function logoutDoc(): void {}

    /**
     * @OA\Get(
     *     path="/api/jobs",
     *     tags={"Jobs"},
     *     summary="List published jobs with filters",
     *     @OA\Parameter(name="category", in="query", required=false, @OA\Schema(type="string")),
     *     @OA\Parameter(name="country", in="query", required=false, @OA\Schema(type="string")),
     *     @OA\Parameter(name="status", in="query", required=false, @OA\Schema(type="string", enum={"published","closed"})),
     *     @OA\Response(response=200, description="Job list")
     * )
     */
    public function jobsIndexDoc(): void {}

    /**
     * @OA\Get(
     *     path="/api/jobs/{job}",
     *     tags={"Jobs"},
     *     summary="Get single published job",
     *     @OA\Parameter(name="job", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Job details"),
     *     @OA\Response(response=404, description="Job not found")
     * )
     */
    public function jobsShowDoc(): void {}

    /**
     * @OA\Post(
     *     path="/api/contact",
     *     tags={"Contact"},
     *     summary="Submit contact message",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","email","subject","message"},
     *             @OA\Property(property="name", type="string", example="Abebe"),
     *             @OA\Property(property="email", type="string", format="email", example="abebe@example.com"),
     *             @OA\Property(property="subject", type="string", example="Need recruitment support"),
     *             @OA\Property(property="message", type="string", example="Please contact us about staffing")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Message sent")
     * )
     */
    public function contactDoc(): void {}

    /**
     * @OA\Get(
     *     path="/api/profile",
     *     tags={"Profile"},
     *     summary="Get own profile, documents, and applications",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Profile response"),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function profileShowDoc(): void {}

   /**
    * @OA\Put(
    *     path="/api/profile",
    *     tags={"Profile"},
    *     summary="Update own user/profile info",
    *     security={{"bearerAuth":{}}},
    *     @OA\RequestBody(
    *         required=true,
    *         @OA\JsonContent(
    *             @OA\Property(property="name", type="string", example="Abel Tadesse"),
    *             @OA\Property(property="phone", type="string", example="+251911223344"),
    *             @OA\Property(property="preferred_language", type="string", example="en"),
    *             @OA\Property(
    *                 property="profile",
    *                 type="object",
    *                 @OA\Property(property="full_name", type="string", example="Abel Tadesse"),
    *                 @OA\Property(property="education_level", type="string", example="Bachelor")
    *             )
    *         )
    *     ),
    *     @OA\Response(response=200, description="Updated")
    * )
    */
   public function profileUpdateDoc(): void {}

    /**
     * @OA\Post(
     *     path="/api/documents/upload",
     *     tags={"Documents"},
     *     summary="Upload private document (PDF/JPG/PNG up to 5MB)",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 required={"document_type","file"},
     *                 @OA\Property(property="document_type", type="string", enum={"Passport","ID","Certificate"}),
     *                 @OA\Property(property="file", type="string", format="binary")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=201, description="Document uploaded")
     * )
     */
    public function documentUploadDoc(): void {}

    /**
     * @OA\Get(
     *     path="/api/admin/documents",
     *     tags={"Admin","Documents"},
     *     summary="List seeker documents for verification",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="status", in="query", required=false, @OA\Schema(type="string", enum={"pending","verified","rejected"})),
     *     @OA\Parameter(name="document_type", in="query", required=false, @OA\Schema(type="string", enum={"Passport","ID","Certificate"})),
     *     @OA\Response(response=200, description="Document list")
     * )
     */
    public function adminDocumentsDoc(): void {}

    /**
     * @OA\Patch(
     *     path="/api/admin/documents/{document}/status",
     *     tags={"Admin","Documents"},
     *     summary="Verify or reject seeker document",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="document", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"status"},
     *             @OA\Property(property="status", type="string", enum={"pending","verified","rejected"})
     *         )
     *     ),
     *     @OA\Response(response=200, description="Document status updated")
     * )
     */
    public function adminDocumentStatusDoc(): void {}

    /**
     * @OA\Post(
     *     path="/api/jobs/{job}/apply",
     *     tags={"Applications"},
     *     summary="Apply for a published job",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="job", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=201, description="Application created"),
     *     @OA\Response(response=200, description="Already applied")
     * )
     */
    public function applyDoc(): void {}

    /**
     * @OA\Get(
     *     path="/api/my-applications",
     *     tags={"Applications"},
     *     summary="List authenticated seeker applications",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Applications list")
     * )
     */
    public function myApplicationsDoc(): void {}

    /**
     * @OA\Get(
     *     path="/api/admin/stats",
     *     tags={"Admin"},
     *     summary="Admin dashboard stats",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Stats response"),
     *     @OA\Response(response=403, description="Forbidden")
     * )
     */
    public function adminStatsDoc(): void {}

    /**
     * @OA\Get(
     *     path="/api/admin/roles",
     *     tags={"Admin"},
     *     summary="Get available roles and admin types",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Roles metadata")
     * )
     */
    public function adminRolesDoc(): void {}

    /**
   * @OA\Get(
   *     path="/api/admin/users",
   *     tags={"Admin"},
   *     summary="List users (paginated). Supports role filters",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="role", in="query", required=false, @OA\Schema(type="string")),
    *     
     *     @OA\Response(response=200, description="Paginated users list")
     * )
     */
    public function adminUsersDoc(): void {}

    /**
     * @OA\Post(
     *     path="/api/admin/jobs",
     *     tags={"Admin","Jobs"},
     *     summary="Create job listing (admin)",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"title","description","category","country"},
     *             @OA\Property(property="title", type="object", example={"en":"Driver","ar":"سائق","am":"ሹፌር"}),
     *             @OA\Property(property="description", type="object", example={"en":"Experienced driver needed"}),
     *             @OA\Property(property="category", type="string", example="Driver"),
     *             @OA\Property(property="country", type="string", example="Saudi Arabia"),
     *             @OA\Property(property="salary_range", type="string", example="$500-$700"),
     *             @OA\Property(property="status", type="string", enum={"published","closed"})
     *         )
     *     ),
     *     @OA\Response(response=201, description="Job created")
     * )
     */
    public function adminCreateJobDoc(): void {}

    /**
     * @OA\Post(
     *     path="/api/partner/jobs",
     *     tags={"Partner","Jobs"},
     *     summary="Partner creates job order (pending publication)",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"title","description","category","country","vacancies_total"},
     *             @OA\Property(property="title", type="object", example={"en":"Driver"}),
     *             @OA\Property(property="description", type="object", example={"en":"Need 20 drivers"}),
     *             @OA\Property(property="category", type="string"),
     *             @OA\Property(property="country", type="string"),
     *             @OA\Property(property="salary_range", type="string"),
     *             @OA\Property(property="is_high_level", type="boolean"),
     *             @OA\Property(property="vacancies_total", type="integer", example=20)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Job order submitted")
     * )
     */
    public function partnerCreateJobDoc(): void {}

    /**
     * @OA\Patch(
     *     path="/api/admin/jobs/{job}",
     *     tags={"Admin","Jobs"},
     *     summary="Update/close job (admin)",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="job", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", enum={"published","closed"})
     *         )
     *     ),
     *     @OA\Response(response=200, description="Job updated")
     * )
     */
    public function adminUpdateJobDoc(): void {}

    /**
     * @OA\Patch(
     *     path="/api/admin/jobs/{job}/publish",
     *     tags={"Admin","Jobs"},
     *     summary="Publish pending job",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="job", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Job published")
     * )
     */
    public function adminPublishJobDoc(): void {}

    /**
     * @OA\Patch(
     *     path="/api/admin/jobs/{job}/close",
     *     tags={"Admin","Jobs"},
     *     summary="Close job listing",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="job", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Job closed")
     * )
     */
    public function adminCloseJobDoc(): void {}

    /**
     * @OA\Get(
     *     path="/api/admin/applications",
     *     tags={"Admin","Applications"},
     *     summary="List applications with filters (admin)",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="status", in="query", required=false, @OA\Schema(type="string", enum={"applied","shortlisted","rejected"})),
     *     @OA\Parameter(name="job_id", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="applicant_name", in="query", required=false, @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Applications list")
     * )
     */
    public function adminApplicationsDoc(): void {}

    /**
     * @OA\Patch(
     *     path="/api/admin/applications/{application}/status",
     *     tags={"Admin","Applications"},
     *     summary="Update application status (admin)",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="application", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"status"},
     *             @OA\Property(property="status", type="string", enum={"applied","shortlisted","rejected"}),
     *             @OA\Property(property="remarks", type="string", example="Strong profile")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Status updated")
     * )
     */
    public function adminUpdateApplicationStatusDoc(): void {}

    /**
     * @OA\Get(
     *     path="/api/partner/applications/shortlisted",
     *     tags={"Partner","Applications"},
     *     summary="Partner view shortlisted/interview/selected candidates",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Candidate list")
     * )
     */
    public function partnerShortlistedDoc(): void {}

    /**
     * @OA\Patch(
     *     path="/api/partner/applications/{application}/action",
     *     tags={"Partner","Applications"},
     *     summary="Partner requests interview or selects candidate",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="application", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"action"},
     *             @OA\Property(property="action", type="string", enum={"request_interview","select_candidate"}),
     *             @OA\Property(property="remarks", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Partner action recorded")
     * )
     */
    public function partnerActionDoc(): void {}

    /**
     * @OA\Get(
     *     path="/api/admin/documents/{document}/download",
     *     tags={"Admin","Documents"},
     *     summary="Download seeker document (admin only)",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="document", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="File stream"),
     *     @OA\Response(response=404, description="File not found")
     * )
     */
    public function adminDownloadDocumentDoc(): void {}

    /**
     * @OA\Get(
     *     path="/api/super-admin/foreign-agencies/pending",
     *     tags={"Super Admin"},
     *     summary="List pending foreign agency approvals",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Pending agencies")
     * )
     */
    public function superAdminPendingAgenciesDoc(): void {}

    /**
     * @OA\Patch(
     *     path="/api/super-admin/foreign-agencies/{foreignAgency}/review",
     *     tags={"Super Admin"},
     *     summary="Approve or reject foreign agency",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="foreignAgency", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"action"},
     *             @OA\Property(property="action", type="string", enum={"approve","reject"}),
     *             @OA\Property(property="review_notes", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Agency reviewed")
     * )
     */
    public function superAdminReviewAgencyDoc(): void {}

    /**
     * @OA\Get(
     *     path="/api/super-admin/foreign-agencies/{foreignAgency}/license",
     *     tags={"Super Admin"},
     *     summary="Download foreign agency license",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="foreignAgency", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="License file stream")
     * )
     */
    public function superAdminAgencyLicenseDoc(): void {}

    /**
     * @OA\Post(
     *     path="/api/super-admin/staff",
     *     tags={"Super Admin"},
     *     summary="Create staff account (super admin only)",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","email","phone","password","password_confirmation"},
     *             @OA\Property(property="name", type="string", example="Staff User"),
     *             @OA\Property(property="email", type="string", format="email", example="staff2@hijra.local"),
     *             @OA\Property(property="phone", type="string", example="+251955555555"),
     *             @OA\Property(property="password", type="string", format="password", example="Password@123"),
     *             @OA\Property(property="password_confirmation", type="string", format="password", example="Password@123"),
     *             @OA\Property(property="preferred_language", type="string", enum={"en","am","ar","or"})
     *         )
     *     ),
     *     @OA\Response(response=201, description="Staff account created")
     * )
     */
    public function superAdminCreateStaffDoc(): void {}
}
