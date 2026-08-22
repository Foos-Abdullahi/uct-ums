<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Lecturer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CourseAssignment>
 */
class CourseAssignmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        $times = ['08:00 - 10:00', '10:00 - 12:00', '13:00 - 15:00', '15:00 - 17:00'];

        return [
            'lecturer_id' => Lecturer::factory(),
            'course_id' => Course::factory(),
            'academic_year' => '2026/2027',
            'semester' => fake()->randomElement(['Semester 1', 'Semester 2']),
            'section' => fake()->randomElement(['Section A', 'Section B', 'Section C']),
            'role' => fake()->randomElement(['lead_lecturer', 'co_lecturer', 'assistant', 'lab_instructor']),
            'status' => 'active',
            'workload_hours' => fake()->randomElement([2, 3, 4, 6]),
            'room' => 'Hall '.fake()->numberBetween(1, 10).', Room '.fake()->numberBetween(101, 305),
            'schedule_day' => fake()->randomElement($days),
            'schedule_time' => fake()->randomElement($times),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
