<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Lecturer;
use App\Models\TeachingSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeachingSession>
 */
class TeachingSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'lecturer_id' => Lecturer::factory(),
            'course_id' => Course::factory(),
            'session_date' => now()->toDateString(),
            'hours' => fake()->randomElement([1, 1.5, 2, 3]),
            'hourly_rate' => TeachingSession::DEFAULT_HOURLY_RATE,
            'notes' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => ['paid_at' => now()]);
    }
}
