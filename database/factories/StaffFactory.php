<?php

namespace Database\Factories;

use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Staff>
 */
class StaffFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'department' => fake()->randomElement(['Academic Affairs', 'Finance', 'HR', 'IT']),
            'position' => fake()->jobTitle(),
            'hire_date' => now()->subYears(2)->toDateString(),
        ];
    }
}
