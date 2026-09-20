<?php

namespace App\Imports;

use App\Enums\FeeStatus;
use App\Enums\UserRole;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToArray;
use Throwable;

class StudentImport implements ToArray
{
    /**
     * Recognised header aliases mapped to the canonical import field.
     *
     * @var array<string, list<string>>
     */
    private const COLUMN_ALIASES = [
        'name' => ['name', 'full name', 'full names', 'student name'],
        'email' => ['email', 'e-mail', 'email address'],
        'password' => ['password'],
        'matric_no' => ['matric no', 'matric number', 'matric no.', 'student id', 'id', 'id no', 'id number'],
        'program' => ['program', 'program name', 'course', 'course of study'],
        'current_semester' => ['current semester', 'semester'],
        'phone' => ['phone', 'telephone', 'mobile', 'contact'],
        'gender' => ['gender', 'sex'],
        'date_of_birth' => ['date of birth', 'dob', 'birth date', 'birthday'],
        'address' => ['address', 'residential address', 'house address'],
        'fee_status' => ['fee status', 'fee'],
        'enrollment_status' => ['enrollment status', 'status'],
        'enrollment_date' => ['enrollment date', 'admission date'],
        'gpa' => ['gpa', 'cgpa', 'grade point average'],
        'graduation_date' => ['graduation date', 'graduated date'],
    ];

    private const EMAIL_DOMAIN = 'uct.edu.so';

    /**
     * @var array<string, true>
     */
    private array $seenEmails = [];

    /**
     * No-op hook required by the ToArray concern; rows are processed in processRows().
     */
    public function array(array $rows): void {}

    /**
     * Process raw sheet rows (template or legacy MPU list layout) and create
     * user/student records. A hidden program override fills the program when the
     * file has no Program column of its own.
     *
     * @param  list<list<mixed>>  $rows
     * @return array{imported: int, failed: int, errors: list<string>}
     */
    public function processRows(array $rows, ?string $programOverride = null): array
    {
        $headerIndex = $this->locateHeaderRow($rows);
        if ($headerIndex === null) {
            return ['imported' => 0, 'failed' => 0, 'errors' => ['Could not detect a header row in this workbook.']];
        }

        $columns = $this->buildColumnMap($rows[$headerIndex]);

        if (! isset($columns['name'])) {
            return ['imported' => 0, 'failed' => 0, 'errors' => ['Could not find a student name column in this workbook.']];
        }

        if (isset($columns['program'])) {
            $programName = null;
        } elseif ($programOverride === null || $programOverride === '') {
            return ['imported' => 0, 'failed' => 0, 'errors' => ['This file does not include a Program column. Select a program and try again.']];
        } else {
            $programName = trim($programOverride);
            if (! $this->programExists($programName)) {
                return ['imported' => 0, 'failed' => 0, 'errors' => ["Program '{$programName}' was not found in the system."]];
            }
        }

        $this->seenEmails = [];
        $imported = 0;
        $failed = 0;
        $errors = [];

        foreach (array_slice($rows, $headerIndex + 1) as $offset => $row) {
            $rowNumber = $headerIndex + 2 + $offset; // sheet rows are 1-based
            $data = $this->normaliseRow($row, $columns, $programName);

            if ($data['name'] === '' && $this->rowIsEmpty($row, $columns)) {
                continue;
            }

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
     * @param  list<mixed>  $row
     * @param  array<string, int>  $columns
     * @return array<string, string>
     */
    private function normaliseRow(array $row, array $columns, ?string $programOverride): array
    {
        $data = [];

        foreach (self::COLUMN_ALIASES as $field => $aliases) {
            $index = $columns[$field] ?? null;
            $data[$field] = $index !== null && isset($row[$index])
                ? trim((string) $row[$index])
                : '';
        }

        // Legacy MPU lists only carry a full name; derive an email account.
        if ($data['email'] === '' && $data['name'] !== '') {
            $data['email'] = $this->generateEmail($data['name'], $data['matric_no']);
        }

        if ($data['program'] === '') {
            $data['program'] = (string) $programOverride;
        }

        return $data;
    }

    /**
     * Detect the header row as the row with the most recognised column headers.
     *
     * @param  list<list<mixed>>  $rows
     */
    private function locateHeaderRow(array $rows): ?int
    {
        $bestIndex = null;
        $bestScore = 0;

        foreach ($rows as $index => $row) {
            $score = $this->countRecognisedHeaders($row);

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestIndex = $index;

                if ($score >= 3) {
                    break;
                }
            }
        }

        return $bestScore >= 2 ? $bestIndex : null;
    }

    /**
     * @param  list<mixed>  $row
     */
    private function countRecognisedHeaders(array $row): int
    {
        $aliases = $this->aliasLookup();

        return collect($row)
            ->map(fn (mixed $cell): string => $this->normaliseHeader((string) $cell))
            ->filter(fn (string $header): bool => $header !== '' && isset($aliases[$header]))
            ->count();
    }

    /**
     * @param  list<mixed>  $headerRow
     * @return array<string, int>
     */
    private function buildColumnMap(array $headerRow): array
    {
        $aliases = $this->aliasLookup();
        $columns = [];

        foreach ($headerRow as $index => $cell) {
            $header = $this->normaliseHeader((string) $cell);

            if ($header !== '' && isset($aliases[$header]) && ! isset($columns[$aliases[$header]])) {
                $columns[$aliases[$header]] = $index;
            }
        }

        return $columns;
    }

    /**
     * @return array<string, string>
     */
    private function aliasLookup(): array
    {
        $lookup = [];

        foreach (self::COLUMN_ALIASES as $field => $aliases) {
            foreach ($aliases as $alias) {
                $lookup[$this->normaliseHeader($alias)] = $field;
            }
        }

        return $lookup;
    }

    private function normaliseHeader(string $header): string
    {
        $header = mb_strtolower($header);
        $header = preg_replace('/[^a-z0-9]+/', ' ', $header);
        $header = trim((string) $header);
        $header = preg_replace('/\s+/', ' ', $header);

        return (string) $header;
    }

    /**
     * @param  list<mixed>  $row
     * @param  array<string, int>  $columns
     */
    private function rowIsEmpty(array $row, array $columns): bool
    {
        foreach ($columns as $index) {
            if (isset($row[$index]) && trim((string) $row[$index]) !== '') {
                return false;
            }
        }

        return true;
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

    private function programExists(string $programName): bool
    {
        return Program::whereRaw('LOWER(name) = ?', [mb_strtolower($programName)])->exists();
    }

    private function resolveProgram(string $programName): ?Program
    {
        return Program::whereRaw('LOWER(name) = ?', [mb_strtolower($programName)])->first();
    }

    /**
     * Derive a deterministic login email for legacy lists that have no email column.
     */
    private function generateEmail(string $name, string $matricNo): string
    {
        $words = preg_split('/\s+/', trim($name));
        $first = $this->slugify($words[0] ?? 'student');
        $last = $this->slugify(end($words));
        $email = "{$first}.{$last}@".self::EMAIL_DOMAIN;

        if ($this->seenEmails[$email] ?? false) {
            $email = "{$first}.{$last}.{$this->slugify($matricNo)}@".self::EMAIL_DOMAIN;
        }

        $this->seenEmails[$email] = true;

        return $email;
    }

    private function slugify(string $value): string
    {
        $value = (string) preg_replace('/[^a-z0-9]/i', '', $value);

        return mb_strtolower($value === '' ? 'student' : $value);
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
