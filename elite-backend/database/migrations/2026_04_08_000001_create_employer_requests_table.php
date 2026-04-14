<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('employer_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('company_name')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('country')->nullable();
            $table->string('status')->default('Pending');
            $table->timestampsTz();
        });
    }

    public function down()
    {
        Schema::dropIfExists('employer_requests');
    }
};
