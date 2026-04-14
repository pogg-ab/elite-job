<?php

namespace Database\Seeders;

use App\Models\HomePageSection;
use App\Models\PartnerCountry;
use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class HomePageContentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        HomePageSection::query()->updateOrCreate(
            ['key' => 'company_introduction'],
            [
                'title' => 'Company Introduction',
                'subtitle' => 'Trusted global recruitment agency',
                'description' => 'Hijra connects Ethiopian talent with verified employers through safe, transparent, and compliant recruitment.',
                'content' => [
                    'primary_cta_text' => 'Explore Jobs',
                    'primary_cta_link' => '/Jobs',
                    'secondary_cta_text' => 'Create Profile',
                    'secondary_cta_link' => '/RegisterMultiStep',
                ],
                'is_active' => true,
            ]
        );

        HomePageSection::query()->updateOrCreate(
            ['key' => 'mission_vision'],
            [
                'title' => 'Mission & Vision',
                'description' => 'Our mission is to deliver safe and ethical employment pathways. Our vision is to be the most trusted international recruitment partner for Ethiopian workers.',
                'content' => [
                    'mission_title' => 'Mission',
                    'mission_text' => 'Connect skilled candidates with verified international opportunities.',
                    'vision_title' => 'Vision',
                    'vision_text' => 'Lead with trust, fairness, and professional support across borders.',
                ],
                'is_active' => true,
            ]
        );

        HomePageSection::query()->updateOrCreate(
            ['key' => 'quick_job_search'],
            [
                'title' => 'Quick Job Search',
                'description' => 'Find opportunities by keyword and destination country.',
                'content' => [
                    'placeholder_keyword' => 'Job title or keyword',
                    'placeholder_country' => 'Country',
                    'search_button_text' => 'Search',
                ],
                'is_active' => true,
            ]
        );

        HomePageSection::query()->updateOrCreate(
            ['key' => 'latest_job_listings'],
            [
                'title' => 'Latest Job Listings',
                'description' => 'Recently published opportunities.',
                'content' => [
                    'jobs_limit' => 6,
                    'view_all_text' => 'View all',
                    'view_all_link' => '/Jobs',
                ],
                'is_active' => true,
            ]
        );

        HomePageSection::query()->updateOrCreate(
            ['key' => 'contact_section'],
            [
                'title' => 'Contact Section',
                'description' => 'Reach our team for support and partnership inquiries.',
                'content' => [
                    'email' => 'info@hijra.global',
                    'phone' => '+251110000000',
                    'address' => 'Addis Ababa, Ethiopia',
                    'submit_button_text' => 'Send Message',
                ],
                'is_active' => true,
            ]
        );

        $countries = [
            ['country_name' => 'Saudi Arabia', 'country_code' => 'SA', 'order' => 1],
            ['country_name' => 'UAE', 'country_code' => 'AE', 'order' => 2],
            ['country_name' => 'Qatar', 'country_code' => 'QA', 'order' => 3],
            ['country_name' => 'Oman', 'country_code' => 'OM', 'order' => 4],
            ['country_name' => 'Jordan', 'country_code' => 'JO', 'order' => 5],
            ['country_name' => 'Lebanon', 'country_code' => 'LB', 'order' => 6],
        ];

        foreach ($countries as $country) {
            PartnerCountry::query()->updateOrCreate(
                ['country_name' => $country['country_name']],
                [
                    'country_code' => $country['country_code'],
                    'order' => $country['order'],
                    'is_active' => true,
                ]
            );
        }

        $testimonials = [
            [
                'author_name' => 'Amanuel H.',
                'author_role' => 'Placed Candidate',
                'quote' => 'The recruitment journey was clear and professional from start to finish.',
                'rating' => 5,
                'order' => 1,
            ],
            [
                'author_name' => 'Selam M.',
                'author_role' => 'Caregiver',
                'quote' => 'I appreciated the transparent process and responsive support team.',
                'rating' => 5,
                'order' => 2,
            ],
            [
                'author_name' => 'Meron T.',
                'author_role' => 'Hospitality Worker',
                'quote' => 'Document verification and job updates were smooth and trustworthy.',
                'rating' => 4,
                'order' => 3,
            ],
        ];

        foreach ($testimonials as $item) {
            Testimonial::query()->updateOrCreate(
                ['author_name' => $item['author_name']],
                $item + ['is_active' => true]
            );
        }
    }
}
