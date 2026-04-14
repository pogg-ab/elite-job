<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Policy;
use Illuminate\Http\Request;

class PolicyController extends Controller
{
    // Public: get active policy by type (terms | privacy)
    public function showByType($type)
    {
        $policy = Policy::where('type', $type)->where('is_active', true)->orderByDesc('updated_at')->first();
        if (!$policy) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['data' => $policy]);
    }

    // Public: list all active policies
    public function index()
    {
        $list = Policy::where('is_active', true)->orderBy('order')->get();
        return response()->json(['data' => $list]);
    }

    // Admin: list all
    public function adminIndex()
    {
        $list = Policy::orderBy('order')->get();
        return response()->json(['data' => $list]);
    }

    public function store(Request $request)
    {
        $rules = [
            'type' => 'required|string|in:terms,privacy',
            'title' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'file' => 'nullable|file|mimes:pdf|max:10240',
        ];

        $data = $request->validate($rules);

        // handle optional file upload (policy PDF)
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('policies', 'private');
            $data['file_path'] = $path;
        }

        $policy = Policy::create($data);
        return response()->json(['data' => $policy], 201);
    }

    public function update(Request $request, Policy $policy)
    {
        $rules = [
            'type' => 'nullable|string|in:terms,privacy',
            'title' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'file' => 'nullable|file|mimes:pdf|max:10240',
        ];

        $data = $request->validate($rules);

        if ($request->hasFile('file')) {
            // delete existing file if present
            if ($policy->file_path && \Illuminate\Support\Facades\Storage::disk('private')->exists($policy->file_path)) {
                \Illuminate\Support\Facades\Storage::disk('private')->delete($policy->file_path);
            }
            $path = $request->file('file')->store('policies', 'private');
            $data['file_path'] = $path;
        }

        $policy->update($data);
        return response()->json(['data' => $policy]);
    }

    // download policy PDF (public)
    public function download(Policy $policy)
    {
        if (! $policy->file_path || ! \Illuminate\Support\Facades\Storage::disk('private')->exists($policy->file_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $stream = \Illuminate\Support\Facades\Storage::disk('private')->readStream($policy->file_path);
        $filename = basename($policy->file_path);
        $mime = \Illuminate\Support\Facades\Storage::disk('private')->mimeType($policy->file_path) ?? 'application/pdf';

        $headers = [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
            'Cache-Control' => 'public, max-age=86400',
        ];

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) fclose($stream);
        }, 200, $headers);
    }

    public function destroy(Policy $policy)
    {
        $policy->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
