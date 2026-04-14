<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ForeignAgency;
use App\Models\Job;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function stats()
    {
        return response()->json([
            'total_users' => User::count(),
            'total_seekers' => User::where('role', 'seeker')->count(),
            'total_partners' => User::where('role', 'partner')->count(),
            'pending_partner_approvals' => ForeignAgency::where('status', 'pending_approval')->count(),
            'total_jobs' => Job::count(),
            'pending_jobs' => Job::where('job_status', 'pending')->count(),
            'published_jobs' => Job::where('job_status', 'published')->count(),
            'closed_jobs' => Job::where('job_status', 'closed')->count(),
            'pending_applications' => Application::where('workflow_status', 'applied')->count(),
            'shortlisted_applications' => Application::where('workflow_status', 'shortlisted')->count(),
            'hired_applications' => Application::where('workflow_status', 'hired')->count(),
            'placed_applications' => Application::where('workflow_status', 'placed')->count(),
        ]);
    }

    public function pendingAgencies()
    {
        $agencies = ForeignAgency::with('owner:id,name,email,phone')
            ->where('status', 'pending_approval')
            ->latest()
            ->paginate(20);

        return response()->json($agencies);
    }

    public function reviewAgency(Request $request, ForeignAgency $foreignAgency)
    {
        $validated = $request->validate([
            'action' => ['required', 'in:approve,reject'],
            'review_notes' => ['nullable', 'string'],
        ]);

        $isApprove = $validated['action'] === 'approve';

        $foreignAgency->update([
            'status' => $isApprove ? 'approved' : 'rejected',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'review_notes' => $validated['review_notes'] ?? null,
        ]);

        $foreignAgency->owner()->update([
            'account_status' => $isApprove ? 'active' : 'inactive',
        ]);

        return response()->json([
            'message' => $isApprove ? 'Foreign agency approved.' : 'Foreign agency rejected.',
            'agency' => $foreignAgency->fresh(['owner:id,name,email,account_status', 'approver:id,name,email']),
        ]);
    }

    public function downloadAgencyLicense(ForeignAgency $foreignAgency)
    {
        if (! Storage::disk('private')->exists($foreignAgency->license_file_path)) {
            return response()->json(['message' => 'License file not found.'], 404);
        }

        $stream = Storage::disk('private')->readStream($foreignAgency->license_file_path);
        $filename = basename($foreignAgency->license_file_path);

        return response()->streamDownload(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $filename);
    }

    public function createStaff(Request $request)
    {

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            // accept either international (+251...) or local (starting with 0) phone formats
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'preferred_language' => ['nullable', 'in:en,am,ar,or'],
        ]);

        $staff = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            // use normalized role value 'staff' (not 'admin') so it matches enum and middleware checks
            'role' => 'staff',
            'account_status' => 'active',
            'preferred_language' => $validated['preferred_language'] ?? 'en',
        ]);

        return response()->json([
            'message' => 'Staff account created successfully.',
            'staff' => $staff,
        ], 201);
    }

    /**
     * Return available role metadata for the system.
     */
    public function roles()
    {
        return response()->json([
            'roles' => ['superadmin', 'staff', 'partner', 'seeker'],
        ]);
    }

    /**
     * List users (paginated). Supports filtering by `role`.
     */
    public function users(Request $request)
    {
        $query = User::query()->select('id', 'name', 'email', 'phone', 'role', 'account_status', 'preferred_language', 'created_at');

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        // support filtering by role only now

        return response()->json($query->latest()->paginate(20));
    }

    /**
     * Update a user account (admin/staff use).
     */
    public function updateUser(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'preferred_language' => ['sometimes', 'in:en,am,ar,or'],
            'account_status' => ['sometimes', 'in:active,pending_approval,inactive'],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->fresh(['profile', 'foreignAgency']),
        ]);
    }

    /**
     * Mark a seeker candidate as approved (active).
     */
    public function approveCandidate(User $user)
    {
        if ($user->role !== 'seeker') {
            return response()->json(['message' => 'Only seekers can be approved as candidates.'], 422);
        }

        $user->update([
            'account_status' => 'active',
        ]);

        return response()->json([
            'message' => 'Candidate approved successfully',
            'user' => $user,
        ]);
    }

    /**
     * Delete a user account.
     */
    public function destroyUser(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        if ($user->role === 'superadmin') {
            return response()->json(['message' => 'Superadmin account cannot be deleted.'], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }
}
