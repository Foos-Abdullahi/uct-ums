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
        Schema::table('student_invoices', function (Blueprint $table) {
            $table->string('academic_year', 20)->nullable()->after('type');
            $table->unsignedTinyInteger('semester')->nullable()->after('academic_year');
            $table->unique(
                ['student_id', 'academic_year', 'semester', 'type'],
                'student_invoice_semester_fee_unique',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_invoices', function (Blueprint $table) {
            $table->dropUnique('student_invoice_semester_fee_unique');
            $table->dropColumn(['academic_year', 'semester']);
        });
    }
};
