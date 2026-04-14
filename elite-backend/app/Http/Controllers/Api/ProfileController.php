<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load(['profile', 'documents', 'applications.job', 'foreignAgency']);

        return response()->json($user);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'regex:/^(\\+251|0)[0-9]{9}$/'],
            'preferred_language' => ['sometimes', 'in:en,am,ar,or'],
            'profile.full_name' => ['sometimes', 'string', 'max:255'],
            'profile.gender' => ['nullable', 'string', 'max:20'],
            'profile.age' => ['nullable', 'integer', 'min:18', 'max:65'],
            'profile.passport_status' => ['nullable', 'string', 'max:50'],
            'profile.date_of_birth' => ['nullable', 'date'],
            'profile.nationality' => ['nullable', 'string', 'max:100'],
            'profile.address' => ['nullable', 'string'],
            'profile.education_level' => ['nullable', 'string', 'max:255'],
            'profile.experience_summary' => ['nullable', 'string'],
            'profile.preferred_country' => ['nullable', 'string', 'max:100'],
            'profile.skills' => ['nullable', 'array'],
            'profile.skills.*' => ['string', 'max:100'],
            'foreign_agency.company_name' => ['sometimes', 'string', 'max:255'],
            'foreign_agency.company_email' => ['nullable', 'email', 'max:255'],
            'foreign_agency.company_phone' => ['nullable', 'string', 'max:50'],
            'foreign_agency.country' => ['nullable', 'string', 'max:100'],
        ]);

        $user = $request->user();

        $userData = array_filter(
            $validated,
            fn ($key) => in_array($key, ['name', 'phone', 'preferred_language'], true),
            ARRAY_FILTER_USE_KEY
        );

        if ($userData !== []) {
            $user->update($userData);
        }

        if (isset($validated['profile']) && $user->role === 'seeker') {
            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                $validated['profile']
            );
        }

        if (isset($validated['foreign_agency']) && $user->role === 'partner') {
            $user->foreignAgency()->updateOrCreate(
                ['owner_user_id' => $user->id],
                $validated['foreign_agency']
            );
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->load(['profile', 'foreignAgency']),
        ]);
    }
}
