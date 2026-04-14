<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EmployerRequest;
use App\Models\EmployerJobRequirement;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\EmployerRequestSubmitted;
use App\Mail\EmployerRequestStatusChanged;

class EmployerRequestController extends Controller
{
    public function store(Request $request)
    {
        try {
            // support multipart form where jobs may be JSON string
            $jobsInput = $request->input('jobs');
            if (is_string($jobsInput)) {
                $decoded = json_decode($jobsInput, true);
                $jobs = is_array($decoded) ? $decoded : [];
            } else {
                $jobs = $jobsInput ?? [];
            }

            // include request data (so uploaded files like 'license' are validated)
            $payload = $request->all();
            $payload['jobs'] = $jobs;

            $validator = Validator::make($payload, [
                'company_name' => 'required|string',
                'contact_person' => 'required|string',
                'email' => 'required|email',
                'phone' => 'required|string',
                'country' => 'required|string',
                'jobs' => 'required|array|min:1',
                'jobs.*.job_title' => 'required|string',
                'jobs.*.number_of_workers' => 'required|integer|min:1',
                'jobs.*.job_description' => 'required|string',
                'license' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);
            if ($validator->fails()) {
                return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
            }

            $reqData = [
                'company_name' => $payload['company_name'] ?? null,
                'contact_person' => $payload['contact_person'] ?? null,
                'email' => $payload['email'] ?? null,
                'phone' => $payload['phone'] ?? null,
                'country' => $payload['country'] ?? null,
            ];
            // handle license upload if present
            if ($request->hasFile('license')) {
                $file = $request->file('license');
                $path = $file->store('employer_requests/licenses', 'public');
                $reqData['license_path'] = $path;
            }

            $req = EmployerRequest::create($reqData);

            foreach ($jobs as $job) {
                EmployerJobRequirement::create([
                    'employer_request_id' => $req->id,
                    'job_title' => $job['job_title'],
                    'number_of_workers' => (int)($job['number_of_workers'] ?? 1),
                    'job_description' => $job['job_description'] ?? null,
                ]);
            }

            // send notification email only to the employer (if provided)
            try {
                if (env('ENABLE_EMPLOYER_EMAILS', true) && !empty($req->email)) {
                    Mail::to($req->email)->send(new EmployerRequestSubmitted($req->load('jobRequirements')));
                }
            } catch (\Exception $e) {
                Log::error('Failed to send employer request submitted email: '.$e->getMessage());
            }

            return response()->json(['message' => 'Request submitted', 'data' => $req], 201);
        } catch (\Exception $e) {
            Log::error('EmployerRequest store error: '.$e->getMessage(), ['exception' => $e]);
            $message = config('app.debug') ? $e->getMessage() : 'Internal Server Error';
            return response()->json(['message' => 'Server error', 'error' => $message], 500);
        }
    }

    // Admin list
    public function adminIndex(Request $request)
    {
        $q = EmployerRequest::query();
        if ($request->has('status')) {
            $q->where('status', $request->query('status'));
        }
        $items = $q->withCount('jobRequirements')->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($items);
    }

    public function show($id)
    {
        $item = EmployerRequest::with('jobRequirements')->find($id);
        if (!$item) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['data' => $item]);
    }

    public function downloadLicense($id)
    {
        $item = EmployerRequest::find($id);
        if (!$item || !$item->license_path) {
            return response()->json(['message' => 'Not found'], 404);
        }

        // Use Storage::path and response()->download to avoid method lookup issues
        $path = Storage::disk('public')->path($item->license_path);
        if (!file_exists($path)) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $filename = basename($item->license_path);
        return response()->download($path, $filename);
    }

    public function updateStatus(Request $request, $id)
    {
        $req = EmployerRequest::find($id);
        if (!$req) return response()->json(['message' => 'Not found'], 404);
        $status = $request->input('status');
        if (!in_array($status, ['Pending','Approved','Rejected','In Progress'])) {
            return response()->json(['message' => 'Invalid status'], 422);
        }
        $req->status = $status;
        $req->save();
        // notify employer about status change (only to employer email)
        try {
            if (env('ENABLE_EMPLOYER_EMAILS', true) && !empty($req->email)) {
                $payload = $req->load('jobRequirements');
                Mail::to($req->email)->send(new EmployerRequestStatusChanged($payload, $status));
            }
        } catch (\Exception $e) {
            Log::error('Failed to send employer request status email: '.$e->getMessage());
        }
        return response()->json(['message' => 'Status updated', 'data' => $req]);
    }

    public function destroy($id)
    {
        $req = EmployerRequest::find($id);
        if (!$req) return response()->json(['message' => 'Not found'], 404);
        try {
            $req->delete();
            return response()->json(['message' => 'Deleted']);
        } catch (\Exception $e) {
            Log::error('EmployerRequest delete error: '.$e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Delete failed'], 500);
        }
    }
}
