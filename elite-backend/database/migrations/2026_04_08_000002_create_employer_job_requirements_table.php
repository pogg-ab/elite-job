<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('employer_job_requirements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employer_request_id');
            $table->string('job_title')->nullable();
            $table->integer('number_of_workers')->default(1);
            $table->text('job_description')->nullable();
            $table->timestampsTz();

            $table->foreign('employer_request_id')->references('id')->on('employer_requests')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('employer_job_requirements');
    }
};
