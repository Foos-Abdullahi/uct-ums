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
        Schema::table('students', function (Blueprint $table) {
            $table->unsignedInteger('current_semester')->default(1)->after('program_id');
            $table->string('phone')->nullable()->after('current_semester');
            $table->string('gender')->nullable()->after('phone');
            $table->date('date_of_birth')->nullable()->after('gender');
            $table->text('address')->nullable()->after('date_of_birth');
            $table->string('enrollment_status')->default('enrolled')->index()->after('fee_status');
            $table->decimal('gpa', 3, 2)->nullable()->after('enrollment_status');
            $table->date('graduation_date')->nullable()->after('enrollment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'current_semester',
                'phone',
                'gender',
                'date_of_birth',
                'address',
                'enrollment_status',
                'gpa',
                'graduation_date',
            ]);
        });
    }
};
