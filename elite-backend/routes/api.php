<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AboutPageAdminController;
use App\Http\Controllers\Api\AboutPageController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\HomePageAdminController;
use App\Http\Controllers\Api\HomePageController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/partner/register', [AuthController::class, 'registerPartner']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/refresh', [AuthController::class, 'refresh']);
Route::get('/jobs', [JobController::class, 'index']);
Route::get('/jobs/{job}', [JobController::class, 'show']);
Route::get('/homepage', [HomePageController::class, 'index']);
Route::get('/about-page', [AboutPageController::class, 'index']);
Route::get('/services', [\App\Http\Controllers\Api\ServiceController::class, 'index']);
Route::get('/policies', [\App\Http\Controllers\Api\PolicyController::class, 'index']);
Route::get('/policies/{policy}/download', [\App\Http\Controllers\Api\PolicyController::class, 'download']);
Route::get('/policies/{type}', [\App\Http\Controllers\Api\PolicyController::class, 'showByType']);
Route::get('/faqs', [\App\Http\Controllers\Api\FaqController::class, 'index']);
Route::post('/faqs', [\App\Http\Controllers\Api\FaqController::class, 'store']);
Route::post('/contact', [ContactController::class, 'store']);
// Public employer request submission (public - moved out of auth middleware)
Route::post('/employer-requests', [\App\Http\Controllers\Api\EmployerRequestController::class, 'store']);

Route::middleware('auth:api')->group(function () {
    // allow authenticated users to list their contact messages
    Route::get('/my-contacts', [ContactController::class, 'myContacts']);
    Route::post('/my-contacts/{contact}/reply', [ContactController::class, 'reply']);
    Route::delete('/my-contacts/{contact}', [ContactController::class, 'destroy']);

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    Route::post('/documents/upload', [DocumentController::class, 'upload']);
    Route::put('/documents/{document}', [DocumentController::class, 'update']);
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);

    Route::post('/jobs/{job}/apply', [ApplicationController::class, 'apply']);
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
    Route::post('/applications/{application}/respond', [ApplicationController::class, 'respond']);

    Route::prefix('partner')->middleware('isPartner')->group(function () {
        Route::post('/jobs', [JobController::class, 'partnerStore']);
        Route::patch('/jobs/{job}', [JobController::class, 'partnerUpdate']);
        Route::get('/applications/shortlisted', [ApplicationController::class, 'partnerShortlisted']);
        Route::patch('/applications/{application}/action', [ApplicationController::class, 'partnerAction']);
    });


    Route::prefix('admin')->middleware('isAdmin')->group(function () {
        // Admin homepage content management
        Route::get('/homepage/sections', [HomePageAdminController::class, 'sectionsIndex']);
        Route::put('/homepage/sections/{key}', [HomePageAdminController::class, 'upsertSection']);

        Route::get('/homepage/countries', [HomePageAdminController::class, 'countriesIndex']);
        Route::post('/homepage/countries', [HomePageAdminController::class, 'countriesStore']);
        Route::patch('/homepage/countries/{country}', [HomePageAdminController::class, 'countriesUpdate']);
        Route::delete('/homepage/countries/{country}', [HomePageAdminController::class, 'countriesDestroy']);

        Route::get('/homepage/testimonials', [HomePageAdminController::class, 'testimonialsIndex']);
        Route::post('/homepage/testimonials', [HomePageAdminController::class, 'testimonialsStore']);
        Route::patch('/homepage/testimonials/{testimonial}', [HomePageAdminController::class, 'testimonialsUpdate']);
        Route::delete('/homepage/testimonials/{testimonial}', [HomePageAdminController::class, 'testimonialsDestroy']);

        // Admin about page content management
        Route::get('/about-page/sections', [AboutPageAdminController::class, 'sectionsIndex']);
        Route::put('/about-page/sections/{key}', [AboutPageAdminController::class, 'upsertSection']);

        // Admin services management
        Route::get('/services', [\App\Http\Controllers\Api\ServiceController::class, 'adminIndex']);
        Route::post('/services', [\App\Http\Controllers\Api\ServiceController::class, 'store']);
        Route::patch('/services/{service}', [\App\Http\Controllers\Api\ServiceController::class, 'update']);
        Route::delete('/services/{service}', [\App\Http\Controllers\Api\ServiceController::class, 'destroy']);
        // Admin policies management
        Route::get('/policies', [\App\Http\Controllers\Api\PolicyController::class, 'adminIndex']);
        Route::post('/policies', [\App\Http\Controllers\Api\PolicyController::class, 'store']);
        Route::patch('/policies/{policy}', [\App\Http\Controllers\Api\PolicyController::class, 'update']);
        Route::delete('/policies/{policy}', [\App\Http\Controllers\Api\PolicyController::class, 'destroy']);
        // Admin FAQs management
        Route::get('/faqs', [\App\Http\Controllers\Api\FaqController::class, 'adminIndex']);
        Route::post('/faqs', [\App\Http\Controllers\Api\FaqController::class, 'adminStore']);
        Route::patch('/faqs/{faq}', [\App\Http\Controllers\Api\FaqController::class, 'adminUpdate']);
        Route::delete('/faqs/{faq}', [\App\Http\Controllers\Api\FaqController::class, 'adminDestroy']);
        // Admin contacts/messages
        Route::get('/contacts', [\App\Http\Controllers\Api\AdminContactController::class, 'index']);
        Route::get('/contacts/{contact}', [\App\Http\Controllers\Api\AdminContactController::class, 'show']);
        Route::patch('/contacts/{contact}/read', [\App\Http\Controllers\Api\AdminContactController::class, 'markRead']);
        Route::patch('/contacts/{contact}/resolve', [\App\Http\Controllers\Api\AdminContactController::class, 'markResolved']);
        Route::post('/contacts/{contact}/reply', [\App\Http\Controllers\Api\AdminContactController::class, 'reply']);
        Route::delete('/contacts/{contact}', [\App\Http\Controllers\Api\AdminContactController::class, 'destroy']);
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/roles', [AdminController::class, 'roles']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{user}', [AdminController::class, 'updateUser']);
        Route::patch('/users/{user}/approve-candidate', [AdminController::class, 'approveCandidate']);
        Route::delete('/users/{user}', [AdminController::class, 'destroyUser']);

        Route::get('/jobs', [JobController::class, 'adminIndex']);
        Route::post('/jobs', [JobController::class, 'store']);
        Route::patch('/jobs/{job}', [JobController::class, 'update']);
        Route::patch('/jobs/{job}/publish', [JobController::class, 'publish']);
        Route::patch('/jobs/{job}/close', [JobController::class, 'close']);

        Route::get('/applications', [ApplicationController::class, 'adminIndex']);
        Route::patch('/applications/{application}/status', [ApplicationController::class, 'updateStatus']);

        Route::get('/documents', [DocumentController::class, 'index']);
        Route::patch('/documents/{document}/status', [DocumentController::class, 'updateStatus']);
        Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
        // Admin contacts/messages
        Route::get('/contacts', [\App\Http\Controllers\Api\AdminContactController::class, 'index']);
        Route::get('/contacts/{contact}', [\App\Http\Controllers\Api\AdminContactController::class, 'show']);
        Route::patch('/contacts/{contact}/read', [\App\Http\Controllers\Api\AdminContactController::class, 'markRead']);
        Route::delete('/contacts/{contact}', [\App\Http\Controllers\Api\AdminContactController::class, 'destroy']);
        
        // Employer requests management
        Route::get('/employer-requests', [\App\Http\Controllers\Api\EmployerRequestController::class, 'adminIndex']);
        Route::get('/employer-requests/{id}', [\App\Http\Controllers\Api\EmployerRequestController::class, 'show']);
        Route::get('/employer-requests/{id}/license', [\App\Http\Controllers\Api\EmployerRequestController::class, 'downloadLicense']);
        Route::delete('/employer-requests/{id}', [\App\Http\Controllers\Api\EmployerRequestController::class, 'destroy']);
        Route::patch('/employer-requests/{id}/status', [\App\Http\Controllers\Api\EmployerRequestController::class, 'updateStatus']);
    });

    Route::prefix('super-admin')->middleware('isSuperAdmin')->group(function () {
        Route::post('/staff', [AdminController::class, 'createStaff']);
        Route::get('/foreign-agencies/pending', [AdminController::class, 'pendingAgencies']);
        Route::patch('/foreign-agencies/{foreignAgency}/review', [AdminController::class, 'reviewAgency']);
        Route::get('/foreign-agencies/{foreignAgency}/license', [AdminController::class, 'downloadAgencyLicense']);
    });
});
