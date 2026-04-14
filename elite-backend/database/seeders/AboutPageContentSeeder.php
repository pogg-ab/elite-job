<?php

namespace Database\Seeders;

use App\Models\AboutPageSection;
use Illuminate\Database\Seeder;

class AboutPageContentSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'key' => 'company_background',
                'title' => 'Company Background',
                'description' => 'Hijra is an Ethiopian recruitment agency and platform connecting qualified candidates with verified international employers through compliant and ethical hiring processes.',
                'content' => [
                    'founded_year' => '2018',
                    'hq' => 'Addis Ababa, Ethiopia',
                ],
                'order' => 1,
                'is_active' => true,
            ],
            [
                'key' => 'mission',
                'title' => 'Mission',
                'description' => 'Empower job seekers with safe, transparent, and fair access to global employment opportunities.',
                'content' => null,
                'order' => 2,
                'is_active' => true,
            ],
            [
                'key' => 'vision',
                'title' => 'Vision',
                'description' => 'Be the most trusted cross-border recruitment partner for Ethiopian talent and international employers.',
                'content' => null,
                'order' => 3,
                'is_active' => true,
            ],
            [
                'key' => 'legal_compliance',
                'title' => 'Legal Compliance',
                'description' => 'All recruitment operations follow Ethiopian labor laws, destination-country regulations, contract transparency, and worker-rights protection policies.',
                'content' => [
                    'compliance_points' => [
                        'Licensed agency operations',
                        'Document verification and record auditability',
                        'Contract and employer vetting controls',
                    ],
                ],
                'order' => 4,
                'is_active' => true,
            ],
            [
                'key' => 'recruitment_standards',
                'title' => 'Recruitment Standards',
                'description' => 'Hijra applies structured candidate screening, employer validation, skills matching, and pre-departure orientation to maintain quality placements.',
                'content' => [
                    'standards' => [
                        'Competency and profile screening',
                        'Health and identity checks',
                        'Interview and matching workflow',
                        'Pre-departure briefing',
                    ],
                ],
                'order' => 5,
                'is_active' => true,
            ],
            [
                'key' => 'certifications',
                'title' => 'Certifications',
                'description' => 'Recognized and accredited for compliant recruitment practice.',
                'content' => [
                    'items' => [
                        'Level 1 Recruitment Status',
                        'Registered Overseas Placement License',
                        'Internal Quality and Compliance Program',
                    ],
                ],
                'order' => 6,
                'is_active' => true,
            ],
        ];

        foreach ($items as $item) {
            AboutPageSection::query()->updateOrCreate(
                ['key' => $item['key']],
                [
                    'title' => $item['title'],
                    'description' => $item['description'],
                    'content' => $item['content'],
                    'order' => $item['order'],
                    'is_active' => $item['is_active'],
                ]
            );
        }
    }
}