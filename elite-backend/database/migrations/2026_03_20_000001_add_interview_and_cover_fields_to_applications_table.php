<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->text('cover_letter')->nullable()->after('status');
            $table->timestamp('interview_datetime')->nullable()->after('remarks');
            $table->string('interview_response')->nullable()->after('interview_datetime');
        });
    }

    public function down()
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn(['cover_letter', 'interview_datetime', 'interview_response']);
        });
    }
};
