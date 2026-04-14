<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ForeignAgency extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_user_id',
        'company_name',
        'company_email',
        'company_phone',
        'country',
        'license_file_path',
        'status',
        'approved_by',
        'approved_at',
        'review_notes',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function jobs()
    {
        return $this->hasMany(Job::class);
    }
}
