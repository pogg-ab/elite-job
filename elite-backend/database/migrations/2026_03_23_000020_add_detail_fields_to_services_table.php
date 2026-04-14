<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->json('qualification_requirements')->nullable()->after('description');
            $table->json('target_countries')->nullable()->after('qualification_requirements');
            $table->json('application_instructions')->nullable()->after('target_countries');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn([
                'qualification_requirements',
                'target_countries',
                'application_instructions',
            ]);
        });
    }
};