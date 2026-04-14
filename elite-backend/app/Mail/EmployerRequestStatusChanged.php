<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EmployerRequestStatusChanged extends Mailable
{
    use Queueable, SerializesModels;

    public $requestData;
    public $status;

    public function __construct($requestData, $status)
    {
        $this->requestData = $requestData;
        $this->status = $status;
    }

    public function build()
    {
        return $this->subject('Employer Request Status Updated')
                    ->view('emails.employer_request_status_changed');
    }
}
