<?php

namespace App\Enums;

enum ExpenseType: string
{
    case Salary = 'salary';
    case Utilities = 'utilities';
    case Equipment = 'equipment';
    case Maintenance = 'maintenance';
    case Supplies = 'supplies';
    case Others = 'others';

    public function label(): string
    {
        return match ($this) {
            self::Salary => 'Salary',
            self::Utilities => 'Utilities',
            self::Equipment => 'Equipment',
            self::Maintenance => 'Maintenance',
            self::Supplies => 'Supplies',
            self::Others => 'Others',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
