<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IntegrationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'event',
        'target_system',
        'status',
        'response_message',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }
}
