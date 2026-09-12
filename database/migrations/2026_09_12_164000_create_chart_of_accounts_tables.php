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
        Schema::create('account_categories', function (Blueprint $table) {
            $table->id();
            $table->string('type')->unique(); // asset, liability, equity, revenue, expenses_direct_academic, expenses_operating, finance_costs_other
            $table->string('name');
            $table->string('normal_balance')->default('debit'); // debit | credit
            $table->unsignedInteger('code_range_start');
            $table->unsignedInteger('code_range_end');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_category_id')->constrained('account_categories')->cascadeOnDelete();
            $table->unsignedInteger('code')->unique();
            $table->string('name');
            $table->string('normal_balance')->default('debit'); // debit | credit
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['account_category_id', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
        Schema::dropIfExists('account_categories');
    }
};
