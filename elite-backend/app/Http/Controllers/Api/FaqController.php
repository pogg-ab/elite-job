<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    // public list - only public FAQs
    public function index()
    {
        $faqs = Faq::where('is_public', true)->orderBy('created_at', 'desc')->get();
        return response()->json(['data' => $faqs]);
    }

    // allow anyone (guest or user) to submit a question - stored as not public
    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:2000'],
            'asker_name' => ['nullable', 'string', 'max:255'],
            'asker_email' => ['nullable', 'email', 'max:255'],
        ]);

        $faq = Faq::create([
            'question' => $validated['question'],
            'asker_name' => $validated['asker_name'] ?? null,
            'asker_email' => $validated['asker_email'] ?? null,
            'is_public' => false,
        ]);

        return response()->json(['message' => 'Question submitted', 'faq' => $faq], 201);
    }

    // Admin: list all FAQs
    public function adminIndex()
    {
        $faqs = Faq::orderBy('created_at', 'desc')->paginate(50);
        return response()->json($faqs);
    }

    // Admin: create FAQ (can be published immediately)
    public function adminStore(Request $request)
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:2000'],
            'answer' => ['nullable', 'string', 'max:5000'],
            'is_public' => ['nullable', 'boolean'],
        ]);

        $faq = Faq::create([
            'question' => $validated['question'],
            'answer' => $validated['answer'] ?? null,
            'is_public' => $validated['is_public'] ?? false,
        ]);

        return response()->json(['message' => 'FAQ created', 'faq' => $faq], 201);
    }

    public function adminUpdate(Request $request, Faq $faq)
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:2000'],
            'answer' => ['nullable', 'string', 'max:5000'],
            'is_public' => ['nullable', 'boolean'],
        ]);

        $faq->update([
            'question' => $validated['question'],
            'answer' => $validated['answer'] ?? null,
            'is_public' => $validated['is_public'] ?? false,
        ]);

        return response()->json(['message' => 'FAQ updated', 'faq' => $faq]);
    }

    public function adminDestroy(Faq $faq)
    {
        $faq->delete();
        return response()->json(['message' => 'FAQ deleted']);
    }
}
