<?php

use App\Enums\UserRole;
use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('admin invoice search matches invoice and student details across pages', function (string $field) {
    $this->seed(RolePermissionSeeder::class);
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $student = Student::factory()->create([
        'user_id' => User::factory()->create(['name' => 'Amina Searchable', 'email' => 'amina@example.com'])->id,
        'matric_no' => 'MATRIC-SEARCHABLE',
    ]);
    $invoice = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'invoice_no' => 'INV-SEARCHABLE',
        'title' => 'Special tuition',
    ]);
    StudentInvoice::factory()->count(11)->create(['status' => 'paid']);

    $search = match ($field) {
        'invoice' => 'INV-SEARCH',
        'name' => 'Amina',
        'matric' => 'MATRIC-SEARCH',
        'student_id' => (string) $student->id,
        'email' => 'amina@example.com',
        'title' => 'Special tuition',
        default => 'no-matching-invoice',
    };

    $this->actingAs($admin)
        ->get(route('admin.finance.invoices', ['search' => $search, 'status' => 'unpaid']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/finance/invoices')
            ->reloadOnly('invoices', fn (Assert $reload) => $reload
                ->where('invoices.total', $field === 'missing' ? 0 : 1)
                ->has('invoices.data', $field === 'missing' ? 0 : 1)
                ->when($field !== 'missing', fn (Assert $results) => $results
                    ->where('invoices.data.0.id', $invoice->id))));
})->with(['invoice', 'name', 'matric', 'student_id', 'email', 'title', 'missing']);
