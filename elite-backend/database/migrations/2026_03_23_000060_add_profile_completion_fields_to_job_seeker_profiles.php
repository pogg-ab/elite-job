<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_seeker_profiles', function (Blueprint $table) {
            $table->string('nationality', 100)->nullable()->after('date_of_birth');
            $table->text('address')->nullable()->after('nationality');
            $table->string('preferred_country', 100)->nullable()->after('experience_summary');
        });
    }

    public function down(): void
    {
        Schema::table('job_seeker_profiles', function (Blueprint $table) {
            $table->dropColumn(['nationality', 'address', 'preferred_country']);
        });
    }
};