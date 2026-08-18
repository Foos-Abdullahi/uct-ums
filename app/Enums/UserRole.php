<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Registrar = 'registrar';
    case Finance = 'finance';
    case Hr = 'hr';
    case Lecturer = 'lecturer';
    case Student = 'student';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function dashboardRoute(): string
    {
        return match ($this) {
            self::SuperAdmin => 'admin.dashboard',
            self::Registrar => 'registrar.dashboard',
            self::Finance => 'finance.dashboard',
            self::Hr => 'hr.dashboard',
            self::Lecturer => 'lecturer.dashboard',
            self::Student => 'student.dashboard',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Registrar => 'Registrar',
            self::Finance => 'Finance',
            self::Hr => 'HR',
            self::Lecturer => 'Lecturer',
            self::Student => 'Student',
        };
    }
}
