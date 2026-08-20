<?php

namespace Database\Seeders;

use App\Enums\FeeStatus;
use App\Enums\UserRole;
use App\Models\Admission;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentCertificate;
use App\Models\StudentDocument;
use App\Models\StudentGrade;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentSeeder extends Seeder
{
    /**
     * Seed student accounts, admissions, and related records.
     */
    public function run(): void
    {
        $seProgram = Program::query()->firstOrCreate(
            ['name' => 'Bachelor of Science in Software Engineering'],
            ['degree_level' => 'bachelor', 'duration_semesters' => 8],
        );

        $csProgram = Program::query()->firstOrCreate(
            ['name' => 'Bachelor of Science in Networking and Cyber Security'],
            ['degree_level' => 'bachelor', 'duration_semesters' => 8],
        );

        $animProgram = Program::query()->firstOrCreate(
            ['name' => 'Bachelor of Science in Animation and Visual Effects'],
            ['degree_level' => 'bachelor', 'duration_semesters' => 8],
        );

        // 1. Primary Student Account
        $user = User::query()->updateOrCreate(
            ['email' => 'student@uct.edu'],
            [
                'name' => 'Mohamed Ali',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => UserRole::Student,
                'is_active' => true,
            ],
        );

        $student = Student::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'matric_no' => 'UCT2026001',
                'program_id' => $seProgram->id,
                'current_semester' => 4,
                'phone' => '+252 61 555 0101',
                'gender' => 'Male',
                'date_of_birth' => '2002-05-15',
                'address' => 'KM4, Hodan District, Mogadishu',
                'fee_status' => FeeStatus::Paid,
                'enrollment_status' => 'enrolled',
                'gpa' => 3.75,
                'enrollment_date' => now()->subMonths(18)->toDateString(),
            ],
        );

        // Seed Invoices & Payments for Mohamed Ali
        $inv1 = StudentInvoice::query()->firstOrCreate(
            ['invoice_no' => 'INV-2025-001'],
            [
                'student_id' => $student->id,
                'title' => 'Fall 2025 Tuition Fee',
                'type' => 'tuition',
                'amount' => 1200.00,
                'paid_amount' => 1200.00,
                'due_date' => now()->subMonths(5)->toDateString(),
                'status' => 'paid',
            ],
        );

        StudentPayment::query()->firstOrCreate(
            ['transaction_no' => 'TXN-984210'],
            [
                'student_id' => $student->id,
                'invoice_id' => $inv1->id,
                'amount' => 1200.00,
                'payment_method' => 'bank_transfer',
                'payment_date' => now()->subMonths(5)->addDays(3)->toDateString(),
                'status' => 'approved',
                'notes' => 'Full tuition paid via Premier Bank.',
            ],
        );

        $inv2 = StudentInvoice::query()->firstOrCreate(
            ['invoice_no' => 'INV-2026-002'],
            [
                'student_id' => $student->id,
                'title' => 'Spring 2026 Tuition Fee',
                'type' => 'tuition',
                'amount' => 1200.00,
                'paid_amount' => 1200.00,
                'due_date' => now()->addMonth()->toDateString(),
                'status' => 'paid',
            ],
        );

        StudentPayment::query()->firstOrCreate(
            ['transaction_no' => 'TXN-984852'],
            [
                'student_id' => $student->id,
                'invoice_id' => $inv2->id,
                'amount' => 1200.00,
                'payment_method' => 'card',
                'payment_date' => now()->subDays(10)->toDateString(),
                'status' => 'approved',
                'notes' => 'Early bird online payment.',
            ],
        );

        // Seed Grades for Mohamed Ali
        $grades = [
            ['CS101', 'Introduction to Programming', 1, 3, 'A', 4.00, 'passed'],
            ['CS102', 'Calculus for Computer Science', 1, 3, 'A-', 3.67, 'passed'],
            ['CS201', 'Data Structures & Algorithms', 2, 4, 'A', 4.00, 'passed'],
            ['CS202', 'Database Systems', 2, 3, 'B+', 3.33, 'passed'],
            ['CS301', 'Software Engineering Principles', 3, 3, 'A', 4.00, 'passed'],
            ['CS302', 'Web Application Development', 3, 3, 'A', 4.00, 'passed'],
            ['CS401', 'Distributed Systems', 4, 4, 'in_progress', null, 'in_progress'],
            ['CS402', 'Mobile Application Development', 4, 3, 'in_progress', null, 'in_progress'],
        ];

        foreach ($grades as $g) {
            StudentGrade::query()->updateOrCreate(
                ['student_id' => $student->id, 'course_code' => $g[0]],
                [
                    'course_name' => $g[1],
                    'semester' => $g[2],
                    'credits' => $g[3],
                    'grade' => $g[4] === 'in_progress' ? null : $g[4],
                    'grade_point' => $g[5],
                    'status' => $g[6],
                ],
            );
        }

        // Seed Documents
        StudentDocument::query()->updateOrCreate(
            ['student_id' => $student->id, 'title' => 'High School Leaving Certificate'],
            [
                'category' => 'admission',
                'file_path' => 'documents/sample-certificate.pdf',
                'file_type' => 'application/pdf',
                'file_size' => 245000,
            ],
        );

        StudentDocument::query()->updateOrCreate(
            ['student_id' => $student->id, 'title' => 'National ID / Passport Scan'],
            [
                'category' => 'identity',
                'file_path' => 'documents/sample-id.pdf',
                'file_type' => 'application/pdf',
                'file_size' => 128000,
            ],
        );

        // Seed Certificate
        StudentCertificate::query()->updateOrCreate(
            ['certificate_no' => 'CERT-2025-0089'],
            [
                'student_id' => $student->id,
                'title' => 'Dean\'s Honor Roll - Academic Year 2024/2025',
                'type' => 'honor',
                'issue_date' => now()->subMonths(6)->toDateString(),
                'status' => 'active',
                'file_path' => 'certificates/deans-list-2025.pdf',
            ],
        );

        // Seed Attendance
        $attendanceData = [
            ['Distributed Systems', now()->subDays(2)->toDateString(), 'present'],
            ['Distributed Systems', now()->subDays(4)->toDateString(), 'present'],
            ['Mobile Application Development', now()->subDays(3)->toDateString(), 'present'],
            ['Mobile Application Development', now()->subDays(5)->toDateString(), 'late'],
            ['Software Engineering Principles', now()->subDays(10)->toDateString(), 'present'],
        ];

        foreach ($attendanceData as $att) {
            StudentAttendance::query()->firstOrCreate(
                ['student_id' => $student->id, 'course_name' => $att[0], 'date' => $att[1]],
                ['status' => $att[2]],
            );
        }

        // 2. More sample students for list filtering & testing
        $sampleStudents = [
            [
                'name' => 'Amina Hassan Nur',
                'email' => 'amina.hassan@uct.edu',
                'matric_no' => 'UCT2026002',
                'program_id' => $csProgram->id,
                'current_semester' => 2,
                'phone' => '+252 61 555 0102',
                'gender' => 'Female',
                'date_of_birth' => '2003-08-22',
                'address' => 'Waberi, Mogadishu',
                'fee_status' => FeeStatus::Unpaid,
                'enrollment_status' => 'enrolled',
                'gpa' => 3.90,
                'enrollment_date' => now()->subMonths(6)->toDateString(),
            ],
            [
                'name' => 'Khadar Abdi Warsame',
                'email' => 'khadar.abdi@uct.edu',
                'matric_no' => 'UCT2026003',
                'program_id' => $animProgram->id,
                'current_semester' => 3,
                'phone' => '+252 61 555 0103',
                'gender' => 'Male',
                'date_of_birth' => '2001-11-10',
                'address' => 'Howlwadaag, Mogadishu',
                'fee_status' => FeeStatus::Partial,
                'enrollment_status' => 'suspended',
                'gpa' => 2.65,
                'enrollment_date' => now()->subMonths(12)->toDateString(),
            ],
            [
                'name' => 'Fadumo Yusuf Elmi',
                'email' => 'fadumo.elmi@uct.edu',
                'matric_no' => 'UCT2026004',
                'program_id' => $seProgram->id,
                'current_semester' => 8,
                'phone' => '+252 61 555 0104',
                'gender' => 'Female',
                'date_of_birth' => '2000-03-01',
                'address' => 'Yaakhshiid, Mogadishu',
                'fee_status' => FeeStatus::Paid,
                'enrollment_status' => 'graduated',
                'gpa' => 3.88,
                'enrollment_date' => now()->subMonths(48)->toDateString(),
                'graduation_date' => now()->subMonths(1)->toDateString(),
            ],
            [
                'name' => 'Hamza Omar Shire',
                'email' => 'hamza.shire@uct.edu',
                'matric_no' => 'UCT2026005',
                'program_id' => $csProgram->id,
                'current_semester' => 1,
                'phone' => '+252 61 555 0105',
                'gender' => 'Male',
                'date_of_birth' => '2004-01-14',
                'address' => 'Wadajir, Mogadishu',
                'fee_status' => FeeStatus::Unpaid,
                'enrollment_status' => 'pending',
                'gpa' => null,
                'enrollment_date' => now()->toDateString(),
            ],
        ];

        foreach ($sampleStudents as $s) {
            $u = User::query()->updateOrCreate(
                ['email' => $s['email']],
                [
                    'name' => $s['name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'role' => UserRole::Student,
                    'is_active' => $s['enrollment_status'] !== 'suspended',
                ],
            );

            $st = Student::query()->updateOrCreate(
                ['user_id' => $u->id],
                [
                    'matric_no' => $s['matric_no'],
                    'program_id' => $s['program_id'],
                    'current_semester' => $s['current_semester'],
                    'phone' => $s['phone'],
                    'gender' => $s['gender'],
                    'date_of_birth' => $s['date_of_birth'],
                    'address' => $s['address'],
                    'fee_status' => $s['fee_status'],
                    'enrollment_status' => $s['enrollment_status'],
                    'gpa' => $s['gpa'],
                    'enrollment_date' => $s['enrollment_date'],
                    'graduation_date' => $s['graduation_date'] ?? null,
                ],
            );

            // Create sample unpaid invoice for unpaid/partial students
            if ($s['fee_status'] === FeeStatus::Unpaid) {
                StudentInvoice::query()->firstOrCreate(
                    ['invoice_no' => 'INV-2026-' . $st->id],
                    [
                        'student_id' => $st->id,
                        'title' => 'Semester 1 Registration & Tuition',
                        'type' => 'tuition',
                        'amount' => 1200.00,
                        'paid_amount' => 0.00,
                        'due_date' => now()->addWeeks(2)->toDateString(),
                        'status' => 'unpaid',
                    ],
                );
            } elseif ($s['fee_status'] === FeeStatus::Partial) {
                $inv = StudentInvoice::query()->firstOrCreate(
                    ['invoice_no' => 'INV-2026-' . $st->id],
                    [
                        'student_id' => $st->id,
                        'title' => 'Semester 3 Tuition Fee',
                        'type' => 'tuition',
                        'amount' => 1200.00,
                        'paid_amount' => 600.00,
                        'due_date' => now()->subDays(5)->toDateString(),
                        'status' => 'partial',
                    ],
                );
                StudentPayment::query()->firstOrCreate(
                    ['transaction_no' => 'TXN-PART-' . $st->id],
                    [
                        'student_id' => $st->id,
                        'invoice_id' => $inv->id,
                        'amount' => 600.00,
                        'payment_method' => 'cash',
                        'payment_date' => now()->subDays(15)->toDateString(),
                        'status' => 'approved',
                        'notes' => 'Partial cash payment made at finance desk.',
                    ],
                );
            }
        }

        // 3. Seed Admission Applications
        $admissions = [
            [
                'application_no' => 'ADM-2026-00001',
                'first_name' => 'Suleiman',
                'last_name' => 'Jama Farah',
                'email' => 'suleiman.jama@example.com',
                'phone' => '+252 61 777 0011',
                'gender' => 'Male',
                'date_of_birth' => '2004-06-18',
                'address' => 'Hodan, Mogadishu',
                'program_id' => $seProgram->id,
                'entry_semester' => 'Semester 1',
                'previous_qualification' => 'Somali Secondary School Certificate',
                'previous_gpa' => 3.85,
                'status' => 'pending',
                'application_date' => now()->subDays(3)->toDateString(),
                'notes' => 'Interested in artificial intelligence and web development.',
            ],
            [
                'application_no' => 'ADM-2026-00002',
                'first_name' => 'Hawa',
                'last_name' => 'Guled Hassan',
                'email' => 'hawa.guled@example.com',
                'phone' => '+252 61 777 0022',
                'gender' => 'Female',
                'date_of_birth' => '2003-12-05',
                'address' => 'Karaan, Mogadishu',
                'program_id' => $csProgram->id,
                'entry_semester' => 'Semester 1',
                'previous_qualification' => 'High School Diploma (Grade A)',
                'previous_gpa' => 3.92,
                'status' => 'approved',
                'application_date' => now()->subDays(7)->toDateString(),
                'notes' => 'Certified in basic networking fundamentals.',
                'review_notes' => 'Academic records verified and approved.',
            ],
            [
                'application_no' => 'ADM-2026-00003',
                'first_name' => 'Liban',
                'last_name' => 'Dahir Barre',
                'email' => 'liban.dahir@example.com',
                'phone' => '+252 61 777 0033',
                'gender' => 'Male',
                'date_of_birth' => '2002-09-30',
                'address' => 'Shibis, Mogadishu',
                'program_id' => $animProgram->id,
                'entry_semester' => 'Semester 1',
                'previous_qualification' => 'Secondary Certificate',
                'previous_gpa' => 2.10,
                'status' => 'rejected',
                'application_date' => now()->subDays(14)->toDateString(),
                'notes' => 'Applicant portfolio attached.',
                'review_notes' => 'Does not meet the minimum GPA threshold requirement of 2.50.',
            ],
            [
                'application_no' => 'ADM-2026-00004',
                'first_name' => 'Zahra',
                'last_name' => 'Abukar Moallim',
                'email' => 'zahra.abukar@example.com',
                'phone' => '+252 61 777 0044',
                'gender' => 'Female',
                'date_of_birth' => '2004-04-20',
                'address' => 'Hamar Weyne, Mogadishu',
                'program_id' => $seProgram->id,
                'entry_semester' => 'Semester 1',
                'previous_qualification' => 'High School Certificate',
                'previous_gpa' => 3.70,
                'status' => 'under_review',
                'application_date' => now()->subDays(1)->toDateString(),
                'notes' => 'Application currently being evaluated by department dean.',
            ],
        ];

        foreach ($admissions as $adm) {
            Admission::query()->updateOrCreate(
                ['application_no' => $adm['application_no']],
                $adm,
            );
        }
    }
}
