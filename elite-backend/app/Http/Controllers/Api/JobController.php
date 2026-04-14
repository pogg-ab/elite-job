<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ForeignAgency;
use App\Models\Job;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function adminIndex(Request $request)
    {
        $query = Job::query()->with(['foreignAgency:id,company_name', 'createdBy:id,name,email']);

        if ($request->filled('q')) {
            $q = trim((string) $request->input('q'));
            $query->where(function ($inner) use ($q) {
                $inner->where('title->en', 'like', "%{$q}%")
                    ->orWhere('employer_name', 'like', "%{$q}%")
                    ->orWhere('description->en', 'like', "%{$q}%");
            });
        }

        if ($request->filled('country')) {
            $query->where('country', $request->string('country'));
        }

        if ($request->filled('job_type')) {
            $query->where('job_type', $request->string('job_type'));
        }

        if ($request->filled('status')) {
            $query->where('job_status', $request->string('status'));
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function index(Request $request)
    {
        $query = Job::query()->where('job_status', 'published');

        if ($request->filled('q')) {
            $q = trim((string) $request->input('q'));
            $query->where(function ($inner) use ($q) {
                $inner->where('title->en', 'like', "%{$q}%")
                    ->orWhere('employer_name', 'like', "%{$q}%")
                    ->orWhere('description->en', 'like', "%{$q}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('country')) {
            $query->where('country', $request->string('country'));
        }

        if ($request->filled('job_type')) {
            $query->where('job_type', $request->string('job_type'));
        }

        if ($request->filled('skill_category')) {
            $query->where('skill_category', $request->string('skill_category'));
        }

        if ($request->filled('status')) {
            $query->where('job_status', $request->string('status'));
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function show(Job $job)
    {
        if ($job->job_status !== 'published') {
            return response()->json(['message' => 'Job not available.'], 404);
        }

        return response()->json($job);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'array'],
            'title.en' => ['required', 'string', 'max:255'],
            'description' => ['required', 'array'],
            'description.en' => ['required', 'string'],
            'category' => ['required', 'string', 'max:100'],
            'country' => ['required', 'string', 'max:100'],
            'employer_name' => ['nullable', 'string', 'max:255'],
            'job_type' => ['nullable', 'string', 'max:60'],
            'skill_category' => ['nullable', 'string', 'max:100'],
            'salary_range' => ['nullable', 'string', 'max:100'],
            'required_qualifications' => ['nullable', 'array'],
            'required_qualifications.*' => ['string', 'max:255'],
            'application_deadline' => ['nullable', 'date'],
            'status' => ['nullable', 'in:published,closed'],
            'job_status' => ['nullable', 'in:pending,published,closed'],
            'is_high_level' => ['nullable', 'boolean'],
            'vacancies_total' => ['required', 'integer', 'min:1'],
            'foreign_agency_id' => ['nullable', 'exists:foreign_agencies,id'],
        ]);

        $validated['job_status'] = $validated['job_status'] ?? 'published';
        $validated['status'] = $validated['job_status'] === 'closed' ? 'closed' : 'published';
        $validated['created_by_user_id'] = $request->user()->id;

        if (empty($validated['employer_name']) && ! empty($validated['foreign_agency_id'])) {
            $agency = ForeignAgency::query()->find($validated['foreign_agency_id']);
            $validated['employer_name'] = $agency?->company_name;
        }

        $job = Job::create($validated);

        return response()->json([
            'message' => 'Job created successfully',
            'job' => $job,
        ], 201);
    }

    public function update(Request $request, Job $job)
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'array'],
            'title.en' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'array'],
            'description.en' => ['sometimes', 'string'],
            'category' => ['sometimes', 'string', 'max:100'],
            'country' => ['sometimes', 'string', 'max:100'],
            'employer_name' => ['nullable', 'string', 'max:255'],
            'job_type' => ['nullable', 'string', 'max:60'],
            'skill_category' => ['nullable', 'string', 'max:100'],
            'salary_range' => ['nullable', 'string', 'max:100'],
            'required_qualifications' => ['nullable', 'array'],
            'required_qualifications.*' => ['string', 'max:255'],
            'application_deadline' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:published,closed'],
            'job_status' => ['sometimes', 'in:pending,published,closed'],
            'is_high_level' => ['sometimes', 'boolean'],
            'vacancies_total' => ['sometimes', 'integer', 'min:1'],
        ]);

        if (isset($validated['job_status'])) {
            $validated['status'] = $validated['job_status'] === 'closed' ? 'closed' : 'published';
        }

        $job->update($validated);

        return response()->json([
            'message' => 'Job updated successfully',
            'job' => $job,
        ]);
    }

    public function partnerStore(Request $request)
    {
        $user = $request->user();
        $agency = ForeignAgency::where('owner_user_id', $user->id)->where('status', 'approved')->first();

        if (! $agency) {
            return response()->json([
                'message' => 'Approved foreign agency profile is required to create job orders.',
            ], 422);
        }

        $validated = $request->validate([
            'title' => ['required', 'array'],
            'title.en' => ['required', 'string', 'max:255'],
            'description' => ['required', 'array'],
            'description.en' => ['required', 'string'],
            'category' => ['required', 'string', 'max:100'],
            'country' => ['required', 'string', 'max:100'],
            'employer_name' => ['nullable', 'string', 'max:255'],
            'job_type' => ['nullable', 'string', 'max:60'],
            'skill_category' => ['nullable', 'string', 'max:100'],
            'salary_range' => ['nullable', 'string', 'max:100'],
            'required_qualifications' => ['nullable', 'array'],
            'required_qualifications.*' => ['string', 'max:255'],
            'application_deadline' => ['nullable', 'date'],
            'is_high_level' => ['nullable', 'boolean'],
            'vacancies_total' => ['required', 'integer', 'min:1'],
        ]);

        if (empty($validated['employer_name'])) {
            $validated['employer_name'] = $agency->company_name;
        }

        $job = Job::create([
            ...$validated,
            'status' => 'published',
            'job_status' => 'published',
            'created_by_user_id' => $user->id,
            'foreign_agency_id' => $agency->id,
        ]);

        return response()->json([
            'message' => 'Job created and published.',
            'job' => $job,
        ], 201);
    }

    public function partnerUpdate(Request $request, Job $job)
    {
        $user = $request->user();
        $agency = ForeignAgency::where('owner_user_id', $user->id)->where('status', 'approved')->first();

        // Allow update if the job belongs to this agency or was created by this user
        $owns = ($agency && $job->foreign_agency_id === $agency->id) || ($job->created_by_user_id === $user->id);
        if (! $owns) {
            return response()->json(['message' => 'Not authorized to update this job.'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'array'],
            'title.en' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'array'],
            'description.en' => ['sometimes', 'string'],
            'category' => ['sometimes', 'string', 'max:100'],
            'country' => ['sometimes', 'string', 'max:100'],
            'employer_name' => ['nullable', 'string', 'max:255'],
            'job_type' => ['nullable', 'string', 'max:60'],
            'skill_category' => ['nullable', 'string', 'max:100'],
            'salary_range' => ['nullable', 'string', 'max:100'],
            'required_qualifications' => ['nullable', 'array'],
            'required_qualifications.*' => ['string', 'max:255'],
            'application_deadline' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:published,closed'],
            'job_status' => ['sometimes', 'in:pending,published,closed'],
            'is_high_level' => ['sometimes', 'boolean'],
            'vacancies_total' => ['sometimes', 'integer', 'min:1'],
        ]);

        if (isset($validated['job_status'])) {
            $validated['status'] = $validated['job_status'] === 'closed' ? 'closed' : 'published';
        }

        $job->update($validated);

        return response()->json([
            'message' => 'Job updated successfully',
            'job' => $job,
        ]);
    }

    public function publish(Job $job)
    {
        $job->update([
            'job_status' => 'published',
            'status' => 'published',
        ]);

        return response()->json([
            'message' => 'Job published successfully',
            'job' => $job,
        ]);
    }

    public function close(Job $job)
    {
        $job->update([
            'job_status' => 'closed',
            'status' => 'closed',
        ]);

        return response()->json([
            'message' => 'Job closed successfully',
            'job' => $job,
        ]);
    }
}
