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
        Schema::table('programs', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->unique()->after('name');
            $table->string('department')->nullable()->after('duration_semesters');
            $table->string('faculty')->nullable()->after('department');
            $table->unsignedSmallInteger('total_credits')->default(120)->after('duration_semesters');
            $table->string('status', 30)->default('active')->index()->after('total_credits');
            $table->text('description')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn([
                'code',
                'department',
                'faculty',
                'total_credits',
                'status',
                'description',
            ]);
        });
    }
};
