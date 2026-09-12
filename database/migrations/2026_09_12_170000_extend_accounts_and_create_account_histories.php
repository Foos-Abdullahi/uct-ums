<?php

use App\Enums\AccountType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->foreignId('parent_account_id')->nullable()->after('account_category_id')
                ->constrained('accounts')->nullOnDelete();
            $table->string('type')->default(AccountType::Asset->value)->after('normal_balance')->index();
            $table->string('status')->default('active')->after('type')->index();
            $table->boolean('is_system')->default(false)->after('status');
        });

        $typeByCategory = [
            'assets' => AccountType::Asset->value,
            'liabilities' => AccountType::Liability->value,
            'equity' => AccountType::Equity->value,
            'revenue' => AccountType::Revenue->value,
            'expenses_direct_academic' => AccountType::Expense->value,
            'expenses_operating' => AccountType::Expense->value,
            'finance_costs_other' => AccountType::Expense->value,
        ];

        foreach ($typeByCategory as $categoryType => $accountType) {
            DB::table('accounts')
                ->where('account_category_id', function ($query) use ($categoryType) {
                    $query->select('id')->from('account_categories')->where('type', $categoryType);
                })
                ->update(['type' => $accountType]);
        }

        DB::table('accounts')->where('is_active', true)->update(['status' => 'active']);
        DB::table('accounts')->where('is_active', false)->update(['status' => 'inactive']);

        Schema::table('accounts', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
        });

        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });

        Schema::create('account_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // created, updated, deactivated, reactivated, imported
            $table->json('changes')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_histories');

        Schema::table('accounts', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->index();
        });

        DB::table('accounts')->where('status', 'active')->update(['is_active' => true]);
        DB::table('accounts')->where('status', 'inactive')->update(['is_active' => false]);

        Schema::table('accounts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_account_id');
            $table->dropColumn(['type', 'status', 'is_system']);
        });
    }
};
