<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ForeignAgency;
use App\Models\Job;
use App\Services\WorkflowService;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function __construct(private readonly WorkflowService $workflowService)
    {
    }

    public function apply(Request $request, Job $job)
    {
        if ($job->job_status !== 'published') {
            return response()->json([
                'message' => 'This job is not open for applications.',
            ], 422);
        }

        // If the job has a vacancies limit and it's already full, block apply
        if ($job->vacancies_total > 0 && $job->vacancies_filled >= $job->vacancies_total) {
            return response()->json([
                'message' => 'No vacancies available for this job.',
            ], 422);
        }

        // NOTE: Documents no longer carry a verification status for application gating.
        // Applications are accepted regardless of document "status"; partners will
        // receive applicant documents along with the application for review.

        $validated = $request->validate([
            'cover_letter' => ['nullable', 'string'],
        ]);

        // Prevent duplicate applications
        $existing = Application::where('user_id', $request->user()->id)
            ->where('job_id', $job->id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You have already applied for this job.',
            ], 409);
        }

        $application = Application::create([
            'user_id' => $request->user()->id,
            'job_id' => $job->id,
            'status' => 'applied',
            'workflow_status' => 'applied',
            'remarks' => null,
            'cover_letter' => $validated['cover_letter'] ?? null,
        ]);

        $application->load(['user.profile', 'user.documents', 'job']);

        return response()->json([
            'message' => 'Application submitted successfully',
            'application' => $application,
        ], 201);
    }

    public function myApplications(Request $request)
    {
        $applications = Application::with('job')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json($applications);
    }

    public function adminIndex(Request $request)
    {
        $query = Application::query()->with(['user:id,name,email,phone', 'job:id,title,country,category,status']);

        if ($request->filled('status')) {
            $query->where('workflow_status', $request->string('status'));
        }

        if ($request->filled('job_id')) {
            $query->where('job_id', $request->integer('job_id'));
        }

        if ($request->filled('applicant_name')) {
            $name = (string) $request->string('applicant_name');
            $query->whereHas('user', function ($userQuery) use ($name) {
                $userQuery->where('name', 'like', "%{$name}%");
            });
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function updateStatus(Request $request, Application $application)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:applied,shortlisted,interview_requested,selected,hired,placed,rejected'],
            'remarks' => ['nullable', 'string'],
        ]);

        $updatePayload = [
            'status' => in_array($validated['status'], ['applied', 'shortlisted', 'rejected'], true)
                ? $validated['status']
                : $application->status,
            'workflow_status' => $validated['status'],
            'remarks' => $validated['remarks'] ?? $application->remarks,
        ];

        if ($validated['status'] === 'hired') {
            $updatePayload['hired_at'] = now();
        }

        if ($validated['status'] === 'placed') {
            $updatePayload['placed_at'] = now();
        }

        $application->update($updatePayload);

        if (in_array($validated['status'], ['hired', 'placed'], true)) {
            $this->workflowService->notifyStatusChange($application);
            $this->workflowService->syncToInternalSoftware($application);
        }

        $this->workflowService->refreshJobVacancyState($application);

        return response()->json([
            'message' => 'Application status updated',
            'application' => $application->load(['user:id,name,email', 'job:id,title']),
        ]);
    }

    public function partnerShortlisted(Request $request)
    {
        $agency = ForeignAgency::where('owner_user_id', $request->user()->id)
            ->where('status', 'approved')
            ->first();

        if (! $agency) {
            return response()->json(['message' => 'Approved agency profile not found.'], 404);
        }

        $applications = Application::with(['user.profile', 'user.documents', 'job'])
            ->whereHas('job', function ($jobQuery) use ($agency) {
                $jobQuery->where('foreign_agency_id', $agency->id);
            })
            ->whereIn('workflow_status', ['applied', 'shortlisted', 'interview_requested', 'selected'])
            ->latest()
            ->paginate(20);

        $applications->getCollection()->transform(function (Application $application) {
            $data = $application->toArray();
            $data['applicant_profile'] = $application->user?->profile;
            $data['applicant_documents'] = $application->user?->documents ?? [];

            return $data;
        });

        return response()->json($applications);
    }

    public function partnerAction(Request $request, Application $application)
    {
        $agency = ForeignAgency::where('owner_user_id', $request->user()->id)
            ->where('status', 'approved')
            ->first();

        if (! $agency || $application->job->foreign_agency_id !== $agency->id) {
            return response()->json(['message' => 'Application not found for your agency.'], 404);
        }

        $validated = $request->validate([
            'action' => ['required', 'in:request_interview,select_candidate,shortlist,decline,accept_proposal,decline_proposal'],
            'remarks' => ['nullable', 'string'],
        ]);

        // Map partner actions to workflow statuses
        // Map partner actions to workflow statuses or interview responses
        $map = [
            'request_interview' => 'interview_requested',
            'select_candidate' => 'selected',
            'shortlist' => 'shortlisted',
            'decline' => 'rejected',
        ];

        // Handle accept/decline of a user's proposed rearrange
        if (in_array($validated['action'], ['accept_proposal', 'decline_proposal'], true)) {
            $application->update([
                'interview_response' => $validated['action'] === 'accept_proposal' ? 'accepted' : 'partner_declined',
                'remarks' => $validated['remarks'] ?? $application->remarks,
            ]);

            // keep workflow_status as interview_requested when partner responds to proposal
            $this->workflowService->notifyStatusChange($application);

            return response()->json([
                'message' => 'Partner response recorded',
                'application' => $application->fresh(['user:id,name,email', 'job:id,title']),
            ]);
        }

        $nextStatus = $map[$validated['action']] ?? $application->workflow_status;

        $application->update([
            'workflow_status' => $nextStatus,
            'remarks' => $validated['remarks'] ?? $application->remarks,
        ]);

        // if partner requested an interview with datetime, save it
        if ($validated['action'] === 'request_interview' && $request->filled('interview_datetime')) {
            $application->update([
                'interview_datetime' => $request->input('interview_datetime'),
                'interview_response' => 'pending',
            ]);
        }

        $this->workflowService->notifyStatusChange($application);
        // Refresh job vacancy counters if the workflow status may affect vacancies
        $this->workflowService->refreshJobVacancyState($application);

        return response()->json([
            'message' => 'Partner action recorded',
            'application' => $application->fresh(['user:id,name,email', 'job:id,title']),
        ]);
    }

    // Allow applicant to respond to an interview request
    public function respond(Request $request, Application $application)
    {
        // only the applicant may respond
        if ($request->user()->id !== $application->user_id) {
            return response()->json(['message' => 'Not allowed'], 403);
        }

        $validated = $request->validate([
            'action' => ['required', 'in:accept,rearrange'],
            'new_datetime' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
        ]);

        if ($validated['action'] === 'accept') {
            $application->update([
                'interview_response' => 'accepted',
                'remarks' => $validated['remarks'] ?? $application->remarks,
            ]);
        } else {
            // rearrange
            if (! $validated['new_datetime']) {
                return response()->json(['message' => 'new_datetime is required for rearrange'], 422);
            }

            $application->update([
                'interview_response' => 'rearrange_requested',
                'interview_datetime' => $validated['new_datetime'],
                'remarks' => $validated['remarks'] ?? $application->remarks,
            ]);
        }

        // notify partner
        $this->workflowService->notifyStatusChange($application);

        return response()->json([
            'message' => 'Response recorded',
            'application' => $application->fresh(['user:id,name,email', 'job:id,title']),
        ]);
    }
}
