<?php

use App\Enums\UserRole;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('a user is granted the permissions mapped to their role', function () {
    $registrar = User::factory()->role(UserRole::Registrar)->create();

    expect($registrar->hasPermission('students.view', 'admissions.review'))->toBeTrue()
        ->and($registrar->hasPermission('finance.payments.verify'))->toBeFalse()
        ->and($registrar->hasPermission('settings.users'))->toBeFalse();
});

test('granting every listed permission is required', function () {
    $finance = User::factory()->role(UserRole::Finance)->create();

    expect($finance->hasPermission('finance.view', 'finance.payments.create'))->toBeTrue()
        ->and($finance->hasPermission('finance.view', 'students.create'))->toBeFalse();
});

test('super admins are never locked out of a permission', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();

    expect($admin->hasPermission('settings.users', 'settings.roles', 'a.permission.that.does.not.exist'))->toBeTrue();
});

test('a user with no permissions is granted nothing', function () {
    $student = User::factory()->role(UserRole::Student)->create();

    expect($student->permissionSlugs())->toBe([])
        ->and($student->hasPermission('students.view'))->toBeFalse();
});

test('granted permission slugs are shared with the frontend', function () {
    $hr = User::factory()->role(UserRole::Hr)->create();

    $this->actingAs($hr);

    $permissions = $this->get(route('admin.lecturers.index'))
        ->assertOk()
        ->viewData('page')['props']['auth']['user']['permissions'];

    expect($permissions)->toContain('lecturers.view')
        ->and($permissions)->not->toContain('settings.users');
});

test('a registrar can reach the admin modules their role covers', function (string $routeName) {
    $this->actingAs(User::factory()->role(UserRole::Registrar)->create());

    $this->get(route($routeName))->assertOk();
})->with([
    'students' => 'admin.students.index',
    'admissions' => 'admin.admissions.index',
    'programs' => 'admin.programs.index',
    'reports' => 'admin.reports.index',
    'audit log' => 'admin.settings.audit-log',
]);

test('a registrar is refused the modules their role does not cover', function (string $routeName) {
    $this->actingAs(User::factory()->role(UserRole::Registrar)->create());

    $this->get(route($routeName))->assertForbidden();
})->with([
    'expenses' => 'admin.expenses.index',
    'chart of accounts' => 'admin.finance.chart-of-accounts',
    'user management' => 'admin.settings.users',
    'roles and permissions' => 'admin.settings.roles',
    'system settings' => 'admin.settings.system',
]);

test('an HR officer is refused student management', function () {
    $this->actingAs(User::factory()->role(UserRole::Hr)->create());

    $this->get(route('admin.students.index'))->assertForbidden();
    $this->get(route('admin.lecturers.index'))->assertOk();
});

test('finance can view students but cannot create them', function () {
    $this->actingAs(User::factory()->role(UserRole::Finance)->create());

    $this->get(route('admin.students.index'))->assertOk();
    $this->get(route('admin.students.create'))->assertForbidden();
});

test('finance can reach the expense ledger their role covers', function () {
    $this->actingAs(User::factory()->role(UserRole::Finance)->create());

    $this->get(route('admin.expenses.index'))->assertOk();
});

test('only super admins can manage users and roles', function () {
    $this->actingAs(User::factory()->role(UserRole::SuperAdmin)->create());

    $this->get(route('admin.settings.users'))->assertOk();
    $this->get(route('admin.settings.roles'))->assertOk();
});

test('a back office role without the setting cannot create users', function () {
    $this->actingAs(User::factory()->role(UserRole::Registrar)->create());

    $userCount = User::count();

    $this->post(route('admin.settings.users'), [
        'name' => 'Intruder',
        'email' => 'intruder@uct.so',
        'password' => 'password-1234',
        'role' => UserRole::Registrar->value,
    ])->assertForbidden();

    $this->assertSame($userCount, User::count());
    $this->assertDatabaseMissing('users', ['email' => 'intruder@uct.so']);
});

test('a super admin can create users', function () {
    $this->actingAs(User::factory()->role(UserRole::SuperAdmin)->create());

    $this->post(route('admin.settings.users'), [
        'name' => 'New Officer',
        'email' => 'new.officer@uct.so',
        'password' => 'password-1234',
        'role' => UserRole::Registrar->value,
    ])->assertRedirect();

    $this->assertDatabaseHas('users', [
        'email' => 'new.officer@uct.so',
        'role' => UserRole::Registrar->value,
    ]);
});

test('a back office role without the setting cannot delete a user', function () {
    $victim = User::factory()->role(UserRole::Registrar)->create();

    $this->actingAs(User::factory()->role(UserRole::Hr)->create());

    $this->delete(route('admin.settings.users.destroy', $victim))->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $victim->id]);
});

test('a role permission change takes effect on the next request', function () {
    $finance = User::factory()->role(UserRole::Finance)->create();

    expect($finance->hasPermission('students.create'))->toBeFalse();

    Role::where('slug', UserRole::Finance->value)
        ->first()
        ->permissions()
        ->sync(Permission::where('slug', 'students.create')->pluck('id'));

    expect($finance->fresh()->hasPermission('students.create'))->toBeTrue();
});

test('lecturer and student accounts cannot reach the back office', function (UserRole $role) {
    $this->actingAs(User::factory()->role($role)->create());

    $this->get(route('admin.students.index'))->assertForbidden();
    $this->get(route('admin.settings.users'))->assertForbidden();
})->with([
    'lecturer' => UserRole::Lecturer,
    'student' => UserRole::Student,
]);

test('registrar and finance portal routes are permission gated', function () {
    $this->actingAs(User::factory()->role(UserRole::Registrar)->create());

    $this->get(route('registrar.students.index'))->assertOk();
    $this->get(route('finance.dashboard'))->assertForbidden();
});
