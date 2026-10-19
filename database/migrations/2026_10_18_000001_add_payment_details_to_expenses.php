<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('status');
            $table->foreignId('payment_account_id')->nullable()->after('payment_method')->constrained('accounts')->nullOnDelete();
            $table->string('reference_no')->nullable()->after('payment_account_id');
            $table->date('paid_at')->nullable()->after('reference_no');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['payment_account_id']);
            $table->dropColumn(['payment_method', 'payment_account_id', 'reference_no', 'paid_at']);
        });
    }
};
