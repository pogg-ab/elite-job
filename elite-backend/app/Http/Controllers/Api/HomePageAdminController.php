<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HomePageSection;
use App\Models\PartnerCountry;
use App\Models\Testimonial;
use Illuminate\Http\Request;

class HomePageAdminController extends Controller
{
    private array $allowedSectionKeys = [
        'company_introduction',
        'mission_vision',
        'quick_job_search',
        'latest_job_listings',
        'contact_section',
    ];

    public function sectionsIndex()
    {
        $sections = HomePageSection::query()->orderBy('key')->get();

        return response()->json(['data' => $sections]);
    }

    public function upsertSection(Request $request, string $key)
    {
        if (! in_array($key, $this->allowedSectionKeys, true)) {
            return response()->json([
                'message' => 'Invalid homepage section key.',
                'allowed_keys' => $this->allowedSectionKeys,
            ], 422);
        }

        $data = $request->validate([
            'title' => $this->localizedTextRules(),
            'subtitle' => $this->localizedTextRules(),
            'description' => $this->localizedTextRules(),
            'content' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $section = HomePageSection::query()->updateOrCreate(
            ['key' => $key],
            [
                'title' => $data['title'] ?? null,
                'subtitle' => $data['subtitle'] ?? null,
                'description' => $data['description'] ?? null,
                'content' => $data['content'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]
        );

        return response()->json(['data' => $section]);
    }

    private function localizedTextRules(): array
    {
        return [
            'nullable',
            function (string $attribute, mixed $value, \Closure $fail) {
                if (is_null($value)) {
                    return;
                }

                if (is_string($value)) {
                    return;
                }

                if (! is_array($value)) {
                    $fail("{$attribute} must be a string or translation object.");
                    return;
                }

                foreach ($value as $lang => $text) {
                    if (! is_string($text)) {
                        $fail("{$attribute}.{$lang} must be a string.");
                        return;
                    }
                }
            },
        ];
    }

    public function countriesIndex()
    {
        $items = PartnerCountry::query()->orderBy('order')->get();

        return response()->json(['data' => $items]);
    }

    public function countriesStore(Request $request)
    {
        $data = $request->validate([
            'country_name' => ['required', 'string', 'max:255'],
            'country_code' => ['nullable', 'string', 'max:8'],
            'flag_image' => ['nullable', 'string', 'max:255'],
            'order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $item = PartnerCountry::create($data);

        return response()->json(['data' => $item], 201);
    }

    public function countriesUpdate(Request $request, PartnerCountry $country)
    {
        $data = $request->validate([
            'country_name' => ['sometimes', 'required', 'string', 'max:255'],
            'country_code' => ['nullable', 'string', 'max:8'],
            'flag_image' => ['nullable', 'string', 'max:255'],
            'order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $country->update($data);

        return response()->json(['data' => $country]);
    }

    public function countriesDestroy(PartnerCountry $country)
    {
        $country->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function testimonialsIndex()
    {
        $items = Testimonial::query()->orderBy('order')->get();

        return response()->json(['data' => $items]);
    }

    public function testimonialsStore(Request $request)
    {
        $data = $request->validate([
            'author_name' => ['required', 'string', 'max:255'],
            'author_role' => ['nullable', 'string', 'max:255'],
            'quote' => ['required', 'string'],
            'author_image' => ['nullable', 'string', 'max:255'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $item = Testimonial::create($data);

        return response()->json(['data' => $item], 201);
    }

    public function testimonialsUpdate(Request $request, Testimonial $testimonial)
    {
        $data = $request->validate([
            'author_name' => ['sometimes', 'required', 'string', 'max:255'],
            'author_role' => ['nullable', 'string', 'max:255'],
            'quote' => ['sometimes', 'required', 'string'],
            'author_image' => ['nullable', 'string', 'max:255'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $testimonial->update($data);

        return response()->json(['data' => $testimonial]);
    }

    public function testimonialsDestroy(Testimonial $testimonial)
    {
        $testimonial->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
