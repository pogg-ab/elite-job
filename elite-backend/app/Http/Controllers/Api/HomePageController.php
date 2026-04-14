<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HomePageSection;
use App\Models\Job;
use App\Models\PartnerCountry;
use App\Models\Service;
use App\Models\Testimonial;

class HomePageController extends Controller
{
    /**
     * Public homepage content payload.
     */
    public function index()
    {
        $sections = HomePageSection::query()
            ->where('is_active', true)
            ->get()
            ->keyBy('key');

        $latestConfig = $sections->get('latest_job_listings');
        $jobsLimit = (int) data_get($latestConfig?->content, 'jobs_limit', 6);

        if ($jobsLimit < 1 || $jobsLimit > 24) {
            $jobsLimit = 6;
        }

        $latestJobs = Job::query()
            ->where('job_status', 'published')
            ->latest()
            ->limit($jobsLimit)
            ->get([
                'id',
                'title',
                'description',
                'category',
                'country',
                'salary_range',
                'job_status',
                'created_at',
            ]);

        return response()->json([
            'data' => [
                'company_introduction' => $sections->get('company_introduction'),
                'mission_vision' => $sections->get('mission_vision'),
                'featured_services' => Service::query()
                    ->where('is_active', true)
                    ->orderBy('order')
                    ->get(),
                'quick_job_search' => $sections->get('quick_job_search'),
                'latest_job_listings' => [
                    'config' => $latestConfig,
                    'items' => $latestJobs,
                ],
                'partner_countries' => PartnerCountry::query()
                    ->where('is_active', true)
                    ->orderBy('order')
                    ->get(),
                'testimonials' => Testimonial::query()
                    ->where('is_active', true)
                    ->orderBy('order')
                    ->get(),
                'contact_section' => $sections->get('contact_section'),
                'stats' => [
                    'latest_open_jobs' => Job::query()
                        ->where('job_status', 'published')
                        ->count(),
                    'partner_countries' => PartnerCountry::query()
                        ->where('is_active', true)
                        ->count(),
                    'featured_services' => Service::query()
                        ->where('is_active', true)
                        ->count(),
                ],
            ],
        ]);
    }
}
