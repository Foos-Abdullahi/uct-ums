<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $prefixes = ['SWE', 'CS', 'NET', 'SEC', 'DSA', 'WEB', 'DAT'];

        return [
            'program_id' => Program::factory(),
            'code' => fake()->unique()->randomElement($prefixes).fake()->unique()->numerify('###'),
            'name' => fake()->words(3, true).' '.fake()->randomElement(['Fundamentals', 'Advanced', 'Architecture', 'Systems', 'Design', 'Practicum']),
            'credit_hours' => fake()->randomElement([2, 3, 4]),
            'semester' => fake()->numberBetween(1, 8),
            'level' => 'undergraduate',
            'description' => fake()->paragraph(),
            'status' => 'active',
        ];
    }
}
