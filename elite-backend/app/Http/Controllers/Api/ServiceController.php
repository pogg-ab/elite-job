<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    // Public list
    public function index()
    {
        $services = Service::where('is_active', true)->orderBy('order')->get();
        return response()->json(['data' => $services]);
    }

    // Admin: list all
    public function adminIndex()
    {
        $services = Service::orderBy('order')->get();
        return response()->json(['data' => $services]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', function (string $attribute, mixed $value, \Closure $fail) {
                $this->validateLocalizedRequired($attribute, $value, $fail);
            }],
            'slug' => 'nullable|string|max:255',
            'description' => ['nullable', function (string $attribute, mixed $value, \Closure $fail) {
                $this->validateLocalizedOptional($attribute, $value, $fail);
            }],
            'qualification_requirements' => 'nullable|array',
            'qualification_requirements.*' => 'string|max:500',
            'target_countries' => 'nullable|array',
            'target_countries.*' => 'string|max:255',
            'application_instructions' => 'nullable|array',
            'application_instructions.*' => 'string|max:500',
            'icon' => 'nullable|string|max:255',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $data['qualification_requirements'] = $this->normalizeList($request->input('qualification_requirements', []));
        $data['target_countries'] = $this->normalizeList($request->input('target_countries', []));
        $data['application_instructions'] = $this->normalizeList($request->input('application_instructions', []));

        $service = Service::create($data);
        return response()->json(['data' => $service], 201);
    }

    public function update(Request $request, Service $service)
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', function (string $attribute, mixed $value, \Closure $fail) {
                $this->validateLocalizedRequired($attribute, $value, $fail);
            }],
            'slug' => 'nullable|string|max:255',
            'description' => ['nullable', function (string $attribute, mixed $value, \Closure $fail) {
                $this->validateLocalizedOptional($attribute, $value, $fail);
            }],
            'qualification_requirements' => 'nullable|array',
            'qualification_requirements.*' => 'string|max:500',
            'target_countries' => 'nullable|array',
            'target_countries.*' => 'string|max:255',
            'application_instructions' => 'nullable|array',
            'application_instructions.*' => 'string|max:500',
            'icon' => 'nullable|string|max:255',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        if ($request->has('qualification_requirements')) {
            $data['qualification_requirements'] = $this->normalizeList($request->input('qualification_requirements', []));
        }

        if ($request->has('target_countries')) {
            $data['target_countries'] = $this->normalizeList($request->input('target_countries', []));
        }

        if ($request->has('application_instructions')) {
            $data['application_instructions'] = $this->normalizeList($request->input('application_instructions', []));
        }

        $service->update($data);
        return response()->json(['data' => $service]);
    }

    public function destroy(Service $service)
    {
        $service->delete();
        return response()->json(['message' => 'Deleted']);
    }

    private function normalizeList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter(array_map(static function ($item) {
            if (! is_string($item)) {
                return null;
            }

            $trimmed = trim($item);
            return $trimmed === '' ? null : $trimmed;
        }, $value)));
    }

    private function validateLocalizedRequired(string $attribute, mixed $value, \Closure $fail): void
    {
        if (is_string($value)) {
            if (trim($value) === '') {
                $fail("{$attribute} is required.");
            }
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

        $english = trim((string) ($value['en'] ?? ''));
        if ($english === '') {
            $fail("{$attribute}.en is required.");
        }
    }

    private function validateLocalizedOptional(string $attribute, mixed $value, \Closure $fail): void
    {
        if (is_null($value) || is_string($value)) {
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
    }
}
