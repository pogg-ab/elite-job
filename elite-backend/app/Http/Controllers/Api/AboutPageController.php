<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AboutPageSection;

class AboutPageController extends Controller
{
    public function index()
    {
        $sections = AboutPageSection::query()
            ->where('is_active', true)
            ->orderBy('order')
            ->get()
            ->keyBy('key');

        return response()->json([
            'data' => [
                'company_background' => $sections->get('company_background'),
                'mission' => $sections->get('mission'),
                'vision' => $sections->get('vision'),
                'legal_compliance' => $sections->get('legal_compliance'),
                'recruitment_standards' => $sections->get('recruitment_standards'),
                'certifications' => $sections->get('certifications'),
            ],
        ]);
    }
}