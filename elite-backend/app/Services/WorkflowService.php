<?php

namespace App\Services;

use App\Models\Application;
use App\Models\IntegrationLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class WorkflowService
{
    public function notifyStatusChange(Application $application): void
    {
        $application->loadMissing(['user', 'job']);

        $subject = "Application status update: {$application->workflow_status}";
        $body = "Dear {$application->user->name}, your application for "
            . ($application->job->title['en'] ?? 'the selected job')
            . " is now '{$application->workflow_status}'.";

        Mail::raw($body, function ($mail) use ($application, $subject) {
            $mail->to($application->user->email)->subject($subject);
        });

        // SMS provider integration point.
        Log::info('SMS notification placeholder', [
            'to' => $application->user->phone,
            'message' => $body,
        ]);
    }

    public function syncToInternalSoftware(Application $application): void
    {
        $application->loadMissing(['user.profile', 'job.foreignAgency']);

        $payload = [
            'application_id' => $application->id,
            'workflow_status' => $application->workflow_status,
            'seeker' => [
                'id' => $application->user->id,
                'name' => $application->user->name,
                'email' => $application->user->email,
                'phone' => $application->user->phone,
                'profile' => $application->user->profile,
            ],
            'job' => [
                'id' => $application->job->id,
                'title' => $application->job->title,
                'country' => $application->job->country,
                'category' => $application->job->category,
            ],
            'foreign_agency' => $application->job->foreignAgency,
        ];

        $log = IntegrationLog::create([
            'application_id' => $application->id,
            'event' => 'candidate_finalized',
            'target_system' => 'our_software',
            'status' => 'pending',
            'payload' => $payload,
        ]);

        $url = env('INTERNAL_SOFTWARE_WEBHOOK_URL');

        if (! $url) {
            $log->update([
                'status' => 'failed',
                'response_message' => 'INTERNAL_SOFTWARE_WEBHOOK_URL not configured',
            ]);
            return;
        }

        $response = Http::timeout(15)->post($url, $payload);

        $log->update([
            'status' => $response->successful() ? 'success' : 'failed',
            'response_message' => $response->body(),
        ]);
    }

    public function refreshJobVacancyState(Application $application): void
    {
        $job = $application->job;

        $filledCount = $job->applications()
            ->whereIn('workflow_status', ['selected', 'hired', 'placed'])
            ->count();

        $job->vacancies_filled = $filledCount;

        if ($job->vacancies_total > 0 && $filledCount >= $job->vacancies_total) {
            $job->job_status = 'closed';
            $job->status = 'closed';
        }

        $job->save();
    }
}
