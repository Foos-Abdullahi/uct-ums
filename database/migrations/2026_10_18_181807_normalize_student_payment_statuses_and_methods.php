<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('student_payments')
            ->where('status', 'approved')
            ->update(['status' => 'paid']);

        DB::table('student_payments')
            ->where('payment_method', 'card')
            ->update(['payment_method' => 'credit_card']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {}
};
