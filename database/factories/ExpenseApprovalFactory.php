<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\ExpenseApproval;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExpenseApproval>
 */
class ExpenseApprovalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'expense_id' => Expense::factory(),
            'approver_id' => User::factory(),
            'level' => 1,
            'action' => 'pending',
            'comment' => null,
            'acted_at' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'action' => 'approved',
            'acted_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'action' => 'rejected',
            'acted_at' => now(),
            'comment' => 'Rejected due to insufficient documentation',
        ]);
    }
}
