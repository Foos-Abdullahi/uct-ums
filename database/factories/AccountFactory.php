<?php

namespace Database\Factories;

use App\Enums\AccountCategoryType;
use App\Enums\AccountStatus;
use App\Models\Account;
use App\Models\AccountCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Account>
 */
class AccountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $category = AccountCategory::first()
            ?? AccountCategory::factory()->type(AccountCategoryType::ExpensesOperating)->create();

        return [
            'account_category_id' => $category->id,
            'code' => fake()->unique()->numberBetween($category->code_range_start, $category->code_range_end),
            'name' => fake()->words(3, true),
            'type' => $category->type->accountType(),
            'normal_balance' => $category->type->normalBalance(),
            'description' => fake()->optional()->sentence(),
            'status' => AccountStatus::Active,
            'is_system' => false,
            'sort_order' => 0,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'status' => AccountStatus::Inactive,
        ]);
    }

    /**
     * Create (once per type) or reuse an expense category for the account.
     */
    public function expenseAccount(AccountCategoryType $type = AccountCategoryType::ExpensesOperating, ?int $code = null): static
    {
        return $this->state(function () use ($type, $code) {
            $category = AccountCategory::firstOrCreate(['type' => $type->value], [
                'name' => $type->label(),
                'normal_balance' => $type->normalBalance(),
                'code_range_start' => $type->codeRangeStart(),
                'code_range_end' => $type->codeRangeEnd(),
                'description' => $type->legend(),
                'sort_order' => 0,
            ]);

            return [
                'account_category_id' => $category->id,
                'code' => $code ?? fake()->unique()->numberBetween($type->codeRangeStart(), $type->codeRangeEnd()),
                'name' => 'Electricity & Utilities',
                'type' => $category->type->accountType(),
                'normal_balance' => $category->type->normalBalance(),
            ];
        });
    }
}
