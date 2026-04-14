<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $query = Document::query()->with('user:id,name,email,phone');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('document_type')) {
            $query->where('document_type', $request->string('document_type'));
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function upload(Request $request)
    {
        $validated = $request->validate([
            'document_type' => ['required', 'in:Passport Copy,Certificates,Training Documents,Profile Photo'],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $path = $request->file('file')->store('documents', 'private');

        $document = Document::create([
            'user_id' => $request->user()->id,
            'document_type' => $validated['document_type'],
            'file_path' => $path,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Document uploaded successfully',
            'document' => $document,
        ], 201);
    }

    public function updateStatus(Request $request, Document $document)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,verified,rejected'],
        ]);

        $document->update([
            'status' => $validated['status'],
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Document status updated',
            'document' => $document->load('verifiedBy:id,name,email'),
        ]);
    }

    // Allow owner to update document metadata (e.g., document_type)
    public function update(Request $request, Document $document)
    {
        // ensure the authenticated user owns the document
        if ($request->user()->id !== $document->user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'document_type' => ['required', 'in:Passport Copy,Certificates,Training Documents,Profile Photo'],
        ]);

        $document->update([
            'document_type' => $validated['document_type'],
        ]);

        return response()->json([
            'message' => 'Document updated',
            'document' => $document,
        ]);
    }

    // Allow owner to delete their document and remove file
    public function destroy(Request $request, Document $document)
    {
        if ($request->user()->id !== $document->user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // delete file if exists
        if (
            $document->file_path &&
            \Illuminate\Support\Facades\Storage::disk('private')->exists($document->file_path)
        ) {
            \Illuminate\Support\Facades\Storage::disk('private')->delete($document->file_path);
        }

        $document->delete();

        return response()->json(['message' => 'Document deleted']);
    }

    public function download(Document $document)
    {
        if (! Storage::disk('private')->exists($document->file_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $path = Storage::disk('private')->path($document->file_path);
        $filename = basename($document->file_path);

        return response()->file($path, [
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
            'Cache-Control' => 'private, must-revalidate',
        ]);
    }
}
