<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Policy extends Model
{
    use HasFactory;

    protected $fillable = [
        'type', // 'terms' | 'privacy'
        'title',
        'slug',
        'content', // markdown
        'file_path',
        'order',
        'is_active',
    ];
}
