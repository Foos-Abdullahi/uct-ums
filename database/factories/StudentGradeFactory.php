<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\StudentGrade;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentGrade>
 */
class StudentGradeFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'];
        $gradePoints = ['A' => 4.0, 'A-' => 3.7, 'B+' => 3.3, 'B' => 3.0, 'B-' => 2.7, 'C+' => 2.3, 'C' => 2.0, 'D' => 1.0, 'F' => 0.0];
        $grade = fake()->randomElement($grades);

        return [
            'student_id' => Student::factory(),
            'course_name' => fake()->words(4, true),
            'course_code' => strtoupper(fake()->bothify('??###')),
            'semester' => fake()->numberBetween(1, 8),
            'credits' => fake()->randomElement([2, 3, 4]),
            'grade' => $grade,
            'grade_point' => $gradePoints[$grade],
            'status' => 'passed',
        ];
    }
}
