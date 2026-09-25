<?php

namespace App\Models;

use App\Enums\UserRole;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'role', 'is_active', 'preferred_language'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Memoised permission slugs resolved for the current request.
     *
     * @var list<string>|null
     */
    protected ?array $resolvedPermissionSlugs = null;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => UserRole::class,
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasOne<Student, $this>
     */
    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    /**
     * @return HasOne<Staff, $this>
     */
    public function staff(): HasOne
    {
        return $this->hasOne(Staff::class);
    }

    /**
     * Permission slugs granted to the user through the role they are assigned.
     *
     * Super administrators are granted every permission the system knows about.
     *
     * @return list<string>
     */
    public function permissionSlugs(): array
    {
        if ($this->resolvedPermissionSlugs !== null) {
            return $this->resolvedPermissionSlugs;
        }

        $permissions = Permission::query();

        if ($this->role !== UserRole::SuperAdmin) {
            $permissions->whereHas(
                'roles',
                fn (Builder $query) => $query->where('slug', $this->role->value),
            );
        }

        return $this->resolvedPermissionSlugs = $permissions->pluck('slug')->all();
    }

    /**
     * Determine whether the user is granted every one of the given permissions.
     */
    public function hasPermission(string ...$permissions): bool
    {
        if ($this->role === UserRole::SuperAdmin) {
            return true;
        }

        if ($permissions === []) {
            return true;
        }

        return array_diff($permissions, $this->permissionSlugs()) === [];
    }
}
