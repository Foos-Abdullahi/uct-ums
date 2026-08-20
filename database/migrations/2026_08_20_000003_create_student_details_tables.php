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
        Schema::create('student_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('category')->default('other')->index();
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamps();
        });

        Schema::create('student_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('invoice_no')->unique();
            $table->string('title');
            $table->string('type')->default('tuition')->index();
            $table->decimal('amount', 10, 2);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->date('due_date')->nullable();
            $table->string('status')->default('unpaid')->index();
            $table->timestamps();
        });

        Schema::create('student_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained('student_invoices')->nullOnDelete();
            $table->string('transaction_no')->unique();
            $table->decimal('amount', 10, 2);
            $table->string('payment_method')->default('bank_transfer');
            $table->date('payment_date');
            $table->string('receipt_path')->nullable();
            $table->string('status')->default('pending')->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('student_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('course_code');
            $table->string('course_name');
            $table->unsignedInteger('semester')->default(1);
            $table->unsignedInteger('credits')->default(3);
            $table->string('grade')->nullable();
            $table->decimal('grade_point', 3, 2)->nullable();
            $table->string('status')->default('in_progress')->index();
            $table->timestamps();
        });

        Schema::create('student_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('certificate_no')->unique();
            $table->string('title');
            $table->string('type')->default('degree')->index();
            $table->date('issue_date');
            $table->string('status')->default('active')->index();
            $table->string('file_path')->nullable();
            $table->timestamps();
        });

        Schema::create('student_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('course_name');
            $table->date('date');
            $table->string('status')->default('present')->index();
            $table->string('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_attendances');
        Schema::dropIfExists('student_certificates');
        Schema::dropIfExists('student_grades');
        Schema::dropIfExists('student_payments');
        Schema::dropIfExists('student_invoices');
        Schema::dropIfExists('student_documents');
    }
};
