<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EmployerRequestSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public $requestData;

    public function __construct($requestData)
    {
        $this->requestData = $requestData;
    }

    public function build()
    {
        return $this->subject('Employer Request Submitted')
                    ->view('emails.employer_request_submitted');
    }
}
