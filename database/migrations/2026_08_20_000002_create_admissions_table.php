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
        Schema::create('admissions', function (Blueprint $table) {
            $table->id();
            $table->string('application_no')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('gender')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->text('address')->nullable();
            $table->foreignId('program_id')->nullable()->constrained()->nullOnDelete();
            $table->string('entry_semester')->nullable();
            $table->string('previous_qualification')->nullable();
            $table->decimal('previous_gpa', 3, 2)->nullable();
            $table->string('status')->default('pending')->index();
            $table->date('application_date');
            $table->text('notes')->nullable();
            $table->text('review_notes')->nullable();
            $table->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admissions');
    }
};
