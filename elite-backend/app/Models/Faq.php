<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    use HasFactory;

    protected $fillable = [
        'question',
        'answer',
        'asker_name',
        'asker_email',
        'is_public',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];
}
