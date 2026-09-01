<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    /**
     * Display a listing of roles with statistics, permissions count, and assigned users.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $query = Role::query()
            ->withCount(['permissions', 'users'])
            ->when($search, function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->orderByDesc('is_system')
            ->orderBy('name');

        $roles = $query->get();

        return Inertia::render('Admin/roles/index', [
            'stats' => Inertia::defer(fn () => [
                'total_roles' => Role::count(),
                'system_roles' => Role::where('is_system', true)->count(),
                'custom_roles' => Role::where('is_system', false)->count(),
                'total_permissions' => Permission::count(),
                'total_users' => User::count(),
            ]),
            'roles' => $roles,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        $permissionsByModule = Permission::query()
            ->orderBy('module')
            ->orderBy('name')
            ->get()
            ->groupBy('module');

        return Inertia::render('Admin/roles/create', [
            'permissions_by_module' => $permissionsByModule,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:50', 'alpha_dash', 'unique:roles,slug'],
            'description' => ['nullable', 'string', 'max:1000'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['slug'], '_'),
            'description' => $validated['description'] ?? null,
            'is_system' => false,
        ]);

        if (! empty($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        return redirect()->route('admin.settings.roles.show', $role)
            ->with('success', "Role {$role->name} created successfully.");
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): Response
    {
        $role->loadCount(['permissions', 'users']);
        $role->load(['permissions' => fn ($q) => $q->orderBy('module')->orderBy('name')]);

        $users = User::where('role', $role->slug)
            ->latest()
            ->paginate(10);

        $permissionsByModule = $role->permissions->groupBy('module');

        return Inertia::render('Admin/roles/show', [
            'role' => $role,
            'permissions_by_module' => $permissionsByModule,
            'users' => $users,
        ]);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role): Response
    {
        $role->load('permissions');

        $permissionsByModule = Permission::query()
            ->orderBy('module')
            ->orderBy('name')
            ->get()
            ->groupBy('module');

        $assignedPermissionIds = $role->permissions->pluck('id')->toArray();

        return Inertia::render('Admin/roles/edit', [
            'role' => $role,
            'permissions_by_module' => $permissionsByModule,
            'assigned_permission_ids' => $assignedPermissionIds,
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, Role $role): RedirectResponse
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,id'],
        ];

        if (! $role->is_system) {
            $rules['slug'] = ['required', 'string', 'max:50', 'alpha_dash', 'unique:roles,slug,'.$role->id];
        }

        $validated = $request->validate($rules);

        $role->update([
            'name' => $validated['name'],
            'slug' => $role->is_system ? $role->slug : Str::slug($validated['slug'], '_'),
            'description' => $validated['description'] ?? null,
        ]);

        $role->permissions()->sync($validated['permissions'] ?? []);

        return redirect()->route('admin.settings.roles.show', $role)
            ->with('success', "Role {$role->name} updated successfully.");
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role): RedirectResponse
    {
        if ($role->is_system) {
            return back()->with('error', 'Core system roles cannot be deleted.');
        }

        $usersCount = User::where('role', $role->slug)->count();
        if ($usersCount > 0) {
            return back()->with('error', "Cannot delete role {$role->name} because {$usersCount} user(s) are currently assigned to it.");
        }

        $roleName = $role->name;
        $role->permissions()->detach();
        $role->delete();

        return redirect()->route('admin.settings.roles')
            ->with('success', "Role {$roleName} deleted successfully.");
    }
}
