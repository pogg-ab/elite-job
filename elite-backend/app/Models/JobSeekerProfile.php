<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobSeekerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'full_name',
        'gender',
        'age',
        'passport_status',
        'date_of_birth',
        'nationality',
        'address',
        'education_level',
        'experience_summary',
        'preferred_country',
        'skills',
    ];

    protected $casts = [
        'age' => 'integer',
        'date_of_birth' => 'date',
        'skills' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
