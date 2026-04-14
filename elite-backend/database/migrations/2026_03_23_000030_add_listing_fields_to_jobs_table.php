<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->string('employer_name')->nullable()->after('country');
            $table->string('job_type', 60)->nullable()->after('employer_name')->index();
            $table->string('skill_category', 100)->nullable()->after('job_type')->index();
            $table->json('required_qualifications')->nullable()->after('salary_range');
            $table->date('application_deadline')->nullable()->after('required_qualifications');
        });
    }

    public function down(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->dropColumn([
                'employer_name',
                'job_type',
                'skill_category',
                'required_qualifications',
                'application_deadline',
            ]);
        });
    }
};