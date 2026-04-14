<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('admin_type', ['super_admin', 'staff', 'partner'])->nullable()->after('role');
            $table->enum('account_status', ['active', 'pending_approval', 'inactive'])->default('active')->after('admin_type');
        });

        Schema::create('foreign_agencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('company_name');
            $table->string('company_email')->nullable();
            $table->string('company_phone')->nullable();
            $table->string('country')->nullable();
            $table->string('license_file_path');
            $table->enum('status', ['pending_approval', 'approved', 'rejected'])->default('pending_approval')->index();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();
        });

        Schema::table('jobs', function (Blueprint $table) {
            $table->enum('job_status', ['pending', 'published', 'closed'])->default('pending')->after('status')->index();
            $table->boolean('is_high_level')->default(false)->after('job_status');
            $table->unsignedInteger('vacancies_total')->default(1)->after('is_high_level');
            $table->unsignedInteger('vacancies_filled')->default(0)->after('vacancies_total');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete()->after('vacancies_filled');
            $table->foreignId('foreign_agency_id')->nullable()->constrained('foreign_agencies')->nullOnDelete()->after('created_by_user_id');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete()->after('status');
            $table->timestamp('verified_at')->nullable()->after('verified_by');
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->enum('workflow_status', ['applied', 'shortlisted', 'interview_requested', 'selected', 'hired', 'placed', 'rejected'])
                ->default('applied')
                ->after('status')
                ->index();
            $table->timestamp('hired_at')->nullable()->after('workflow_status');
            $table->timestamp('placed_at')->nullable()->after('hired_at');
        });

        Schema::create('integration_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->nullable()->constrained('applications')->nullOnDelete();
            $table->string('event');
            $table->string('target_system');
            $table->enum('status', ['pending', 'success', 'failed'])->default('pending')->index();
            $table->text('response_message')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integration_logs');

        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn(['workflow_status', 'hired_at', 'placed_at']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('verified_by');
            $table->dropColumn('verified_at');
        });

        Schema::table('jobs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('foreign_agency_id');
            $table->dropConstrainedForeignId('created_by_user_id');
            $table->dropColumn(['job_status', 'is_high_level', 'vacancies_total', 'vacancies_filled']);
        });

        Schema::dropIfExists('foreign_agencies');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['admin_type', 'account_status']);
        });
    }
};
