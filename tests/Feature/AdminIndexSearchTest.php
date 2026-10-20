<?php

use App\Enums\UserRole;
use App\Models\Admission;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Expense;
use App\Models\Lecturer;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('students index search bar filters students by name or matric number', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $targetUser = User::factory()->create(['name' => 'UniqueSearchable Student', 'email' => 'target@example.com']);
    $targetStudent = Student::factory()->create([
        'user_id' => $targetUser->id,
        'matric_no' => 'UCT-TARGET-2026',
    ]);

    $otherUser = User::factory()->create(['name' => 'Another Student', 'email' => 'other@example.com']);
    Student::factory()->create([
        'user_id' => $otherUser->id,
        'matric_no' => 'UCT-OTHER-9999',
    ]);

    $response = $this->get(route('admin.students.index', ['search' => 'UniqueSearchable']));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/students/index')
            ->where('filters.search', 'UniqueSearchable')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('students.data', 1)
                ->where('students.data.0.id', $targetStudent->id)
            )
        );
});

test('admissions index search bar filters applications', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $program = Program::factory()->create();
    $target = Admission::factory()->create([
        'program_id' => $program->id,
        'first_name' => 'SpecialSearchApplicant',
        'application_no' => 'ADM-SEARCH-001',
    ]);
    Admission::factory()->create([
        'program_id' => $program->id,
        'first_name' => 'UnrelatedApplicant',
        'application_no' => 'ADM-OTHER-002',
    ]);

    $response = $this->get(route('admin.admissions.index', ['search' => 'SpecialSearchApplicant']));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/admissions/index')
            ->where('filters.search', 'SpecialSearchApplicant')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('admissions.data', 1)
                ->where('admissions.data.0.id', $target->id)
            )
        );
});

test('lecturers index search bar filters lecturers', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $targetUser = User::factory()->create(['name' => 'Dr Unique Searchable']);
    $targetLecturer = Lecturer::factory()->create([
        'user_id' => $targetUser->id,
        'lecturer_no' => 'LEC-TARGET-001',
    ]);
    $otherUser = User::factory()->create(['name' => 'Dr Other Lecturer']);
    Lecturer::factory()->create([
        'user_id' => $otherUser->id,
        'lecturer_no' => 'LEC-OTHER-002',
    ]);

    $response = $this->get(route('admin.lecturers.index', ['search' => 'Unique Searchable']));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/lecturers/index')
            ->where('filters.search', 'Unique Searchable')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('lecturers.data', 1)
                ->where('lecturers.data.0.id', $targetLecturer->id)
            )
        );
});

test('assignments index search bar filters assignments', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $targetCourse = Course::factory()->create(['name' => 'Quantum Machine Learning', 'code' => 'QML-901']);
    $targetAssignment = CourseAssignment::factory()->create(['course_id' => $targetCourse->id]);

    $otherCourse = Course::factory()->create(['name' => 'Basic Biology', 'code' => 'BIO-101']);
    CourseAssignment::factory()->create(['course_id' => $otherCourse->id]);

    $response = $this->get(route('admin.assignments.index', ['search' => 'Quantum Machine Learning']));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/assignments/index')
            ->where('filters.search', 'Quantum Machine Learning')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('assignments.data', 1)
                ->where('assignments.data.0.id', $targetAssignment->id)
            )
        );
});

test('programs index search bar filters programs', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $targetProgram = Program::factory()->create(['name' => 'Aerospace Robotics Engineering', 'code' => 'ARE-01']);
    Program::factory()->create(['name' => 'General Linguistics', 'code' => 'GL-01']);

    $response = $this->get(route('admin.programs.index', ['search' => 'Aerospace Robotics']));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/programs/index')
            ->where('filters.search', 'Aerospace Robotics')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('programs.data', 1)
                ->where('programs.data.0.id', $targetProgram->id)
            )
        );
});

test('courses index search bar filters courses', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $targetCourse = Course::factory()->create(['name' => 'Advanced Cryptography Systems', 'code' => 'ACS-777']);
    Course::factory()->create(['name' => 'Introduction to Philosophy', 'code' => 'PHI-101']);

    $response = $this->get(route('admin.courses.index', ['search' => 'Cryptography']));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/courses/index')
            ->where('filters.search', 'Cryptography')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('courses.data', 1)
                ->where('courses.data.0.id', $targetCourse->id)
            )
        );
});

test('enrollments index search bar filters enrolled students', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $targetUser = User::factory()->create(['name' => 'EnrollmentSearchStudent']);
    $targetStudent = Student::factory()->create([
        'user_id' => $targetUser->id,
        'matric_no' => 'ENROLL-SEARCH-001',
    ]);
    $otherUser = User::factory()->create(['name' => 'UnrelatedStudent']);
    Student::factory()->create([
        'user_id' => $otherUser->id,
        'matric_no' => 'ENROLL-OTHER-002',
    ]);

    $response = $this->get(route('admin.enrollments.index', ['search' => 'EnrollmentSearchStudent']));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/enrollments/index')
            ->where('filters.search', 'EnrollmentSearchStudent')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('enrollments.data', 1)
                ->where('enrollments.data.0.id', $targetStudent->id)
            )
        );
});

test('transcripts index search bar filters transcripts', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $targetUser = User::factory()->create(['name' => 'TranscriptSearchStudent']);
    $targetStudent = Student::factory()->create([
        'user_id' => $targetUser->id,
        'matric_no' => 'TRANS-SEARCH-001',
        'gpa' => 3.95,
    ]);
    $otherUser = User::factory()->create(['name' => 'OtherStudent']);
    Student::factory()->create([
        'user_id' => $otherUser->id,
        'matric_no' => 'TRANS-OTHER-002',
        'gpa' => 2.50,
    ]);

    $response = $this->get(route('admin.transcripts.index', ['search' => 'TranscriptSearchStudent']));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/transcripts/index')
            ->where('filters.search', 'TranscriptSearchStudent')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('transcripts.data', 1)
                ->where('transcripts.data.0.id', $targetStudent->id)
            )
        );
});

test('fees index search bar filters student fee ledgers', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $targetUser = User::factory()->create(['name' => 'FeeSearchStudent']);
    $targetStudent = Student::factory()->create([
        'user_id' => $targetUser->id,
        'matric_no' => 'FEE-SEARCH-001',
    ]);
    $otherUser = User::factory()->create(['name' => 'OtherFeeStudent']);
    Student::factory()->create([
        'user_id' => $otherUser->id,
        'matric_no' => 'FEE-OTHER-002',
    ]);

    $response = $this->get(route('admin.finance.fees', ['search' => 'FeeSearchStudent']));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/finance/fees')
            ->where('filters.search', 'FeeSearchStudent')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('students.data', 1)
                ->where('students.data.0.id', $targetStudent->id)
            )
        );
});

test('payments index search bar filters payments', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $student = Student::factory()->create();
    $targetPayment = StudentPayment::factory()->create([
        'student_id' => $student->id,
        'transaction_no' => 'TXN-TARGET-999',
    ]);
    StudentPayment::factory()->create([
        'student_id' => $student->id,
        'transaction_no' => 'TXN-OTHER-000',
    ]);

    $response = $this->get(route('admin.finance.payments', ['search' => 'TXN-TARGET-999']));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/finance/payments')
            ->where('filters.search', 'TXN-TARGET-999')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('payments.data', 1)
                ->where('payments.data.0.id', $targetPayment->id)
            )
        );
});

test('expenses index search bar filters expense records', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $targetExpense = Expense::factory()->create([
        'title' => 'Special Lab Microscope Purchase',
        'expense_no' => 'EXP-TARGET-555',
    ]);
    Expense::factory()->create([
        'title' => 'Routine Office Stationary',
        'expense_no' => 'EXP-OTHER-111',
    ]);

    $response = $this->get(route('admin.expenses.index', ['search' => 'Microscope']));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/finance/expenses')
            ->where('filters.search', 'Microscope')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('expenses.data', 1)
                ->where('expenses.data.0.id', $targetExpense->id)
            )
        );
});
