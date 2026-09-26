<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\StudentCertificate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentCertificate>
 */
class StudentCertificateFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'certificate_no' => strtoupper(fake()->bothify('CERT-####-####')),
            'type' => fake()->randomElement(['academic', 'attendance', 'achievement', 'completion']),
            'title' => fake()->sentence(),
            'issue_date' => fake()->date(),
            'status' => fake()->randomElement(['issued', 'pending', 'revoked']),
            'file_path' => fake()->optional()->filePath(),
        ];
    }
}
