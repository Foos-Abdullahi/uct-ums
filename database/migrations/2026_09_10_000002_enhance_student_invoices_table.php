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
            $table->text('description')->nullable()->after('title');
            $table->decimal('tax_amount', 10, 2)->default(0)->after('amount');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('tax_amount');
            $table->date('issue_date')->nullable()->after('due_date');
            $table->string('approved_by')->nullable()->after('status');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_invoices', function (Blueprint $table) {
            $table->dropColumn(['description', 'tax_amount', 'discount_amount', 'issue_date', 'approved_by', 'approved_at']);
        });
    }
};
