<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'job_id',
        'status',
        'workflow_status',
        'hired_at',
        'placed_at',
        'remarks',
        'cover_letter',
        'interview_datetime',
        'interview_response',
    ];

    protected $casts = [
        'hired_at' => 'datetime',
        'placed_at' => 'datetime',
        'interview_datetime' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function integrationLogs()
    {
        return $this->hasMany(IntegrationLog::class);
    }
}
