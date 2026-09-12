<?php

namespace Database\Factories;

use App\Enums\AccountCategoryType;
use App\Models\AccountCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AccountCategory>
 */
class AccountCategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = AccountCategoryType::ExpensesOperating;

        return [
            'type' => $type,
            'name' => $type->label(),
            'normal_balance' => $type->normalBalance(),
            'code_range_start' => $type->codeRangeStart(),
            'code_range_end' => $type->codeRangeEnd(),
            'sort_order' => 0,
            'description' => $type->legend(),
        ];
    }

    public function type(AccountCategoryType $type): static
    {
        return $this->state(fn () => [
            'type' => $type,
            'name' => $type->label(),
            'normal_balance' => $type->normalBalance(),
            'code_range_start' => $type->codeRangeStart(),
            'code_range_end' => $type->codeRangeEnd(),
            'description' => $type->legend(),
        ]);
    }
}
