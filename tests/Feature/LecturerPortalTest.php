<?php

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\CourseMaterial;
use App\Models\Lecturer;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentGrade;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->program = Program::factory()->create();
    $this->course = Course::factory()->create([
        'program_id' => $this->program->id,
        'semester' => 1,
        'credit_hours' => 3,
    ]);

    $this->lecturerUser = User::factory()->role(UserRole::Lecturer)->create();
    $this->lecturer = Lecturer::factory()->create([
        'user_id' => $this->lecturerUser->id,
    ]);

    $this->assignment = CourseAssignment::factory()->create([
        'lecturer_id' => $this->lecturer->id,
        'course_id' => $this->course->id,
        'academic_year' => '2026/2027',
        'semester' => 'Semester 1',
        'section' => 'Section A',
        'status' => 'active',
        'workload_hours' => 3,
    ]);
});

test('unauthenticated guest cannot access lecturer portal', function () {
    $response = $this->get(route('lecturer.dashboard'));
    $response->assertRedirect(route('login'));
});

test('student cannot access lecturer portal', function () {
    $studentUser = User::factory()->role(UserRole::Student)->create();
    $this->actingAs($studentUser);

    $response = $this->get(route('lecturer.dashboard'));
    $response->assertForbidden();
});

test('lecturer can access dashboard with assignments and stats', function () {
    $this->actingAs($this->lecturerUser);

    $response = $this->get(route('lecturer.dashboard'));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('lecturer/dashboard')
                ->has('stats')
                ->has('assignments')
        );
});

test('lecturer can view assigned courses', function () {
    $this->actingAs($this->lecturerUser);

    $response = $this->get(route('lecturer.courses.index'));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('lecturer/courses/index')
                ->has('assignments')
        );
});

test('lecturer can view assigned course show hub', function () {
    $this->actingAs($this->lecturerUser);

    $response = $this->get(route('lecturer.courses.show', $this->course));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('lecturer/courses/show')
                ->has('course')
                ->has('assignment')
                ->has('students')
        );
});

test('lecturer cannot view course hub of a course they are not assigned to', function () {
    $otherCourse = Course::factory()->create();
    $this->actingAs($this->lecturerUser);

    $response = $this->get(route('lecturer.courses.show', $otherCourse));
    $response->assertForbidden();
});

test('lecturer can view enrolled students directory', function () {
    $studentUser = User::factory()->role(UserRole::Student)->create();
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $this->program->id,
        'current_semester' => 1,
    ]);

    $this->actingAs($this->lecturerUser);

    $response = $this->get(route('lecturer.students.index'));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('lecturer/students/index')
                ->has('students')
        );
});

test('lecturer can record attendance for enrolled students', function () {
    $studentUser = User::factory()->role(UserRole::Student)->create();
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $this->program->id,
        'current_semester' => 1,
    ]);

    $this->actingAs($this->lecturerUser);

    $response = $this->post(route('lecturer.attendance.store'), [
        'course_id' => $this->course->id,
        'date' => '2026-09-15',
        'records' => [
            [
                'student_id' => $student->id,
                'status' => 'present',
                'notes' => 'Attended on time',
            ],
        ],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('student_attendances', [
        'student_id' => $student->id,
        'course_id' => $this->course->id,
        'date' => '2026-09-15',
        'status' => 'present',
    ]);
});

test('lecturer can enter grades and recalculate student GPA', function () {
    $studentUser = User::factory()->role(UserRole::Student)->create();
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $this->program->id,
        'current_semester' => 1,
        'gpa' => 0.00,
    ]);

    $this->actingAs($this->lecturerUser);

    $response = $this->post(route('lecturer.gradebook.store'), [
        'course_id' => $this->course->id,
        'grades' => [
            [
                'student_id' => $student->id,
                'credits' => 3,
                'grade' => 'A',
                'grade_point' => 4.0,
                'status' => 'passed',
            ],
        ],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('student_grades', [
        'student_id' => $student->id,
        'course_id' => $this->course->id,
        'grade' => 'A',
        'grade_point' => 4.0,
        'status' => 'passed',
    ]);

    $student->refresh();
    expect((float) $student->gpa)->toBe(4.0);
});

test('lecturer can upload and delete course materials', function () {
    Storage::fake('public');
    $this->actingAs($this->lecturerUser);

    $file = UploadedFile::fake()->create('syllabus.pdf', 500, 'application/pdf');

    $response = $this->post(route('lecturer.materials.store'), [
        'course_id' => $this->course->id,
        'title' => 'Software Architecture Syllabus',
        'description' => 'Course outline for 2026/2027',
        'category' => 'syllabus',
        'file' => $file,
    ]);

    $response->assertRedirect();
    $material = CourseMaterial::where('title', 'Software Architecture Syllabus')->first();
    expect($material)->not->toBeNull();
    Storage::disk('public')->assertExists($material->file_path);

    // Delete material
    $delResponse = $this->delete(route('lecturer.materials.destroy', $material));
    $delResponse->assertRedirect();
    $this->assertSoftDeleted('course_materials', ['id' => $material->id]);
});
