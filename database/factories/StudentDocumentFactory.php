<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\StudentDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentDocument>
 */
class StudentDocumentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'category' => fake()->randomElement(['academic', 'financial', 'administrative', 'other']),
            'title' => fake()->sentence(),
            'file_path' => fake()->filePath(),
            'file_type' => fake()->randomElement(['pdf', 'jpg', 'png', 'docx']),
            'file_size' => fake()->randomNumber(6),
        ];
    }
}
