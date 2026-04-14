<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EmployerJobRequirement extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'employer_request_id',
        'job_title',
        'number_of_workers',
        'job_description',
    ];

    public function employerRequest()
    {
        return $this->belongsTo(EmployerRequest::class, 'employer_request_id');
    }
}
