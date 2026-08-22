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
        // 1. Dedicated lecturers table
        Schema::create('lecturers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('lecturer_no')->unique();
            $table->string('department')->nullable();
            $table->string('faculty')->nullable();
            $table->string('designation')->default('Lecturer');
            $table->string('qualification')->nullable();
            $table->string('specialization')->nullable();
            $table->string('phone')->nullable();
            $table->string('gender')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('address', 500)->nullable();
            $table->date('hire_date')->nullable();
            $table->string('employment_status')->default('active'); // active, on_leave, sabbatical, terminated
            $table->string('contract_type')->default('full_time'); // full_time, part_time, adjunct, visiting
            $table->string('office_location')->nullable();
            $table->text('bio')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Courses table
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->unsignedSmallInteger('credit_hours')->default(3);
            $table->unsignedSmallInteger('semester')->default(1);
            $table->string('level')->default('undergraduate');
            $table->text('description')->nullable();
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Course Assignments (Teaching Assignments)
        Schema::create('course_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lecturer_id')->constrained('lecturers')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->string('academic_year')->default('2026/2027');
            $table->string('semester')->default('Semester 1');
            $table->string('section')->default('Section A');
            $table->string('role')->default('lead_lecturer'); // lead_lecturer, co_lecturer, assistant, lab_instructor
            $table->string('status')->default('assigned'); // assigned, active, completed, cancelled
            $table->unsignedSmallInteger('workload_hours')->default(3);
            $table->string('room')->nullable();
            $table->string('schedule_day')->nullable();
            $table->string('schedule_time')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_assignments');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('lecturers');
    }
};
