<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case BankTransfer = 'bank_transfer';
    case Cash = 'cash';
    case EvcPlus = 'evc_plus';
    case Zaad = 'zaad';
    case Sahay = 'sahay';
    case CreditCard = 'credit_card';
    case Cheque = 'cheque';
    case Online = 'online';

    public function label(): string
    {
        return match ($this) {
            self::BankTransfer => 'Bank Transfer',
            self::Cash => 'Cash',
            self::EvcPlus => 'EVC Plus',
            self::Zaad => 'Zaad',
            self::Sahay => 'Sahay',
            self::CreditCard => 'Credit Card',
            self::Cheque => 'Cheque',
            self::Online => 'Online',
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
