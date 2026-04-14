<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EmployerRequest extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'company_name',
        'contact_person',
        'email',
        'phone',
        'country',
        'license_path',
        'status',
    ];

    public function jobRequirements()
    {
        return $this->hasMany(EmployerJobRequirement::class, 'employer_request_id');
    }
}
