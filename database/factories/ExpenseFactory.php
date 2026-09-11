<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'expense_no' => 'EXP-'.date('Y').'-'.str_pad((string) fake()->unique()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'expense_type' => fake()->randomElement(['salary', 'utilities', 'equipment', 'maintenance', 'supplies', 'others']),
            'amount' => fake()->randomFloat(2, 100, 50000),
            'expense_date' => fake()->date(),
            'vendor' => fake()->company(),
            'budget_line' => fake()->optional()->word(),
            'status' => 'pending_approval',
            'created_by' => User::factory(),
            'approved_by' => null,
            'approved_at' => null,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => 'approved',
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn () => [
            'status' => 'paid',
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => 'rejected',
        ]);
    }
}
