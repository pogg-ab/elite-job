<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'qualification_requirements',
        'target_countries',
        'application_instructions',
        'icon',
        'order',
        'is_active',
    ];

    protected $casts = [
        'qualification_requirements' => 'array',
        'target_countries' => 'array',
        'application_instructions' => 'array',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    protected function title(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->decodeLocalizedValue($value),
            set: fn ($value) => $this->encodeLocalizedValue($value),
        );
    }

    protected function description(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->decodeLocalizedValue($value),
            set: fn ($value) => $this->encodeLocalizedValue($value),
        );
    }

    private function decodeLocalizedValue(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return $value;
        }

        if (! str_starts_with($trimmed, '{') || ! str_ends_with($trimmed, '}')) {
            return $value;
        }

        $decoded = json_decode($trimmed, true);
        return is_array($decoded) ? $decoded : $value;
    }

    private function encodeLocalizedValue(mixed $value): mixed
    {
        if (is_array($value)) {
            $normalized = [];
            foreach ($value as $lang => $text) {
                if (! is_string($text)) {
                    continue;
                }
                $trimmed = trim($text);
                if ($trimmed === '') {
                    continue;
                }
                $normalized[(string) $lang] = $trimmed;
            }

            if ($normalized === []) {
                return null;
            }

            return json_encode($normalized, JSON_UNESCAPED_UNICODE);
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            return $trimmed === '' ? null : $trimmed;
        }

        return $value;
    }
}
