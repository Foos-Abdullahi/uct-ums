<?php

namespace App\Imports;

use App\Enums\FeeStatus;
use App\Enums\UserRole;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\Import;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Throwable;

class StudentImport implements Import, WithHeadingRow
{
    /**
     * Process all rows of the uploaded spreadsheet and create user/student records.
     *
     * @param  Collection<int, Collection<array-key, mixed>>  $rows
     * @return array{imported: int, failed: int, errors: list<string>}
     */
    public function processRows(Collection $rows): array
    {
        $imported = 0;
        $failed = 0;
        $errors = [];

        foreach ($rows as $index => $row) {
            $rowNumber = (int) $index + 2; // sheet rows are 1-based and row 1 is the heading row

            $data = $this->normaliseRow($row);

            $validationError = $this->validateRow($data);
            if ($validationError !== null) {
                $failed++;
                $errors[] = "Row {$rowNumber}: {$validationError}";

                continue;
            }

            $program = $this->resolveProgram($data['program']);
            if ($program === null) {
                $failed++;
                $errors[] = "Row {$rowNumber}: Program '{$data['program']}' was not found in the system.";

                continue;
            }

            $data['program_id'] = (string) $program->id;

            try {
                DB::transaction(fn () => $this->createStudent($data));
                $imported++;
            } catch (Throwable $e) {
                $failed++;
                $errors[] = "Row {$rowNumber}: {$e->getMessage()}";
            }
        }

        return compact('imported', 'failed', 'errors');
    }

    /**
     * Map a spreadsheet row to a clean keyed array with string values.
     *
     * @return array<string, string>
     */
    private function normaliseRow(mixed $row): array
    {
        $values = $row instanceof Collection ? $row->toArray() : (array) $row;

        return collect([
            'name', 'email', 'password', 'matric_no', 'program', 'current_semester',
            'phone', 'gender', 'date_of_birth', 'address', 'fee_status',
            'enrollment_status', 'enrollment_date', 'gpa', 'graduation_date',
        ])->mapWithKeys(fn (string $key): array => [
            $key => trim((string) ($values[$key] ?? '')),
        ])->toArray();
    }

    /**
     * Validate field-level rules. Returns the first combined error message or null.
     *
     * @param  array<string, string>  $data
     */
    private function validateRow(array $data): ?string
    {
        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'matric_no' => ['nullable', 'string', 'max:50', 'unique:students,matric_no'],
            'program' => ['required', 'string'],
            'current_semester' => ['nullable', 'integer', 'min:1', 'max:12'],
            'phone' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'string', 'in:Male,Female,Other'],
            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:500'],
            'fee_status' => ['nullable', 'string', 'in:paid,unpaid,partial'],
            'enrollment_status' => ['nullable', 'string', 'in:enrolled,pending,suspended,graduated,withdrawn'],
            'enrollment_date' => ['nullable', 'date'],
            'gpa' => ['nullable', 'numeric', 'min:0', 'max:4'],
            'graduation_date' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return implode('; ', $validator->errors()->all());
        }

        return null;
    }

    private function resolveProgram(string $programName): ?Program
    {
        return Program::whereRaw('LOWER(name) = ?', [mb_strtolower($programName)])->first();
    }

    /**
     * Create the user account and student record for a single row.
     *
     * @param  array<string, string>  $data
     */
    private function createStudent(array $data): Student
    {
        $password = $data['password'] !== '' ? $data['password'] : 'password123';
        $enrollmentStatus = $data['enrollment_status'] !== '' ? $data['enrollment_status'] : 'enrolled';

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($password),
            'role' => UserRole::Student,
            'is_active' => $enrollmentStatus !== 'suspended',
            'email_verified_at' => now(),
        ]);

        return Student::create([
            'user_id' => $user->id,
            'matric_no' => $data['matric_no'] !== '' ? $data['matric_no'] : $this->nextMatricNo(),
            'program_id' => $data['program_id'],
            'current_semester' => $data['current_semester'] !== '' ? (int) $data['current_semester'] : 1,
            'phone' => $data['phone'] !== '' ? $data['phone'] : null,
            'gender' => $data['gender'] !== '' ? $data['gender'] : null,
            'date_of_birth' => $data['date_of_birth'] !== '' ? $data['date_of_birth'] : null,
            'address' => $data['address'] !== '' ? $data['address'] : null,
            'fee_status' => $data['fee_status'] !== '' ? $data['fee_status'] : FeeStatus::Unpaid->value,
            'enrollment_status' => $enrollmentStatus,
            'enrollment_date' => $data['enrollment_date'] !== '' ? $data['enrollment_date'] : now()->toDateString(),
            'gpa' => $data['gpa'] !== '' ? $data['gpa'] : null,
            'graduation_date' => $data['graduation_date'] !== '' ? $data['graduation_date'] : null,
        ]);
    }

    private function nextMatricNo(): string
    {
        $nextId = (Student::max('id') ?? 0) + 1;

        return 'UCT-'.date('Y').'-'.str_pad((string) $nextId, 5, '0', STR_PAD_LEFT);
    }
}
