<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'category',
        'country',
        'employer_name',
        'job_type',
        'skill_category',
        'salary_range',
        'required_qualifications',
        'application_deadline',
        'status',
        'job_status',
        'is_high_level',
        'vacancies_total',
        'vacancies_filled',
        'created_by_user_id',
        'foreign_agency_id',
    ];

    protected $casts = [
        'title' => 'array',
        'description' => 'array',
        'required_qualifications' => 'array',
        'application_deadline' => 'date',
        'is_high_level' => 'boolean',
    ];

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function foreignAgency()
    {
        return $this->belongsTo(ForeignAgency::class);
    }
}
