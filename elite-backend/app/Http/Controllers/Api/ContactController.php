<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\ContactReply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $contact = Contact::create($validated);

        Mail::raw(
            "New contact message from {$contact->name} ({$contact->email})\nPhone: {$contact->phone}\nSubject: {$contact->subject}\n\n{$contact->message}",
            function ($mail) {
                $mail->to('hijraglobal7@gmail.com')
                    ->subject('Hijra Website Contact Message');
            }
        );

        $this->sendSmsPlaceholder($contact->message);

        return response()->json([
            'message' => 'Contact message submitted successfully',
            'contact' => $contact,
        ], 201);
    }

    public function myContacts(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $contacts = Contact::where('email', $user->email)
            ->with('replies')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $contacts]);
    }

    public function reply(Request $request, Contact $contact)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($contact->email !== $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $reply = ContactReply::create([
            'contact_id' => $contact->id,
            'sender' => 'user',
            'message' => $validated['message'],
        ]);

        // Mark unread so admin can notice new user follow-up reply.
        $contact->is_read = false;
        $contact->save();

        $contact->load('replies');

        return response()->json([
            'message' => 'Reply sent',
            'reply' => $reply,
            'contact' => $contact,
        ], 201);
    }

    public function destroy(Request $request, Contact $contact)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($contact->email !== $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $contact->delete();

        return response()->json(['message' => 'Contact deleted']);
    }

    private function sendSmsPlaceholder(string $message): void
    {
        Log::info('SMS placeholder invoked', [
            'to' => '+251999422222',
            'message' => $message,
        ]);
    }
}
