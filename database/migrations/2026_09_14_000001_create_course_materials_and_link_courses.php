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
        // Add course_id to student_attendances if not exists
        if (Schema::hasTable('student_attendances') && ! Schema::hasColumn('student_attendances', 'course_id')) {
            Schema::table('student_attendances', function (Blueprint $table) {
                $table->foreignId('course_id')->nullable()->after('student_id')->constrained('courses')->nullOnDelete();
            });
        }

        // Add course_id to student_grades if not exists
        if (Schema::hasTable('student_grades') && ! Schema::hasColumn('student_grades', 'course_id')) {
            Schema::table('student_grades', function (Blueprint $table) {
                $table->foreignId('course_id')->nullable()->after('student_id')->constrained('courses')->nullOnDelete();
            });
        }

        // Create course_materials table
        if (! Schema::hasTable('course_materials')) {
            Schema::create('course_materials', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->foreignId('lecturer_id')->nullable()->constrained('lecturers')->nullOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('category')->default('lecture_notes'); // syllabus, lecture_notes, assignment, lab_manual, reading, other
                $table->string('file_path');
                $table->string('file_name')->nullable();
                $table->unsignedBigInteger('file_size')->nullable(); // in bytes
                $table->string('file_type')->nullable(); // pdf, docx, etc.
                $table->string('academic_year')->nullable();
                $table->string('semester')->nullable();
                $table->boolean('is_published')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_materials');

        if (Schema::hasTable('student_grades') && Schema::hasColumn('student_grades', 'course_id')) {
            Schema::table('student_grades', function (Blueprint $table) {
                $table->dropForeign(['course_id']);
                $table->dropColumn('course_id');
            });
        }

        if (Schema::hasTable('student_attendances') && Schema::hasColumn('student_attendances', 'course_id')) {
            Schema::table('student_attendances', function (Blueprint $table) {
                $table->dropForeign(['course_id']);
                $table->dropColumn('course_id');
            });
        }
    }
};
