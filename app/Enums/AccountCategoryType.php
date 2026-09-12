<?php

namespace App\Enums;

enum AccountCategoryType: string
{
    case Assets = 'assets';
    case Liabilities = 'liabilities';
    case Equity = 'equity';
    case Revenue = 'revenue';
    case ExpensesDirectAcademic = 'expenses_direct_academic';
    case ExpensesOperating = 'expenses_operating';
    case FinanceCostsOther = 'finance_costs_other';

    public function label(): string
    {
        return match ($this) {
            self::Assets => 'Assets',
            self::Liabilities => 'Liabilities',
            self::Equity => 'Equity',
            self::Revenue => 'Revenue',
            self::ExpensesDirectAcademic => 'Direct Academic Costs',
            self::ExpensesOperating => 'Operating Expenses',
            self::FinanceCostsOther => 'Finance Costs & Other',
        };
    }

    public function codeRangeStart(): int
    {
        return match ($this) {
            self::Assets => 1000,
            self::Liabilities => 2000,
            self::Equity => 3000,
            self::Revenue => 4000,
            self::ExpensesDirectAcademic => 5000,
            self::ExpensesOperating => 6000,
            self::FinanceCostsOther => 7000,
        };
    }

    public function codeRangeEnd(): int
    {
        return match ($this) {
            self::Assets => 1999,
            self::Liabilities => 2999,
            self::Equity => 3999,
            self::Revenue => 4999,
            self::ExpensesDirectAcademic => 5999,
            self::ExpensesOperating => 6999,
            self::FinanceCostsOther => 7999,
        };
    }

    public function accountType(): AccountType
    {
        return match ($this) {
            self::Assets => AccountType::Asset,
            self::Liabilities => AccountType::Liability,
            self::Equity => AccountType::Equity,
            self::Revenue => AccountType::Revenue,
            self::ExpensesDirectAcademic, self::ExpensesOperating, self::FinanceCostsOther => AccountType::Expense,
        };
    }

    public function normalBalance(): NormalBalance
    {
        return $this->accountType()->normalBalance();
    }

    /**
     * Short scope note from the UCT Account Numbering Guide.
     */
    public function legend(): string
    {
        return match ($this) {
            self::Assets => '1000s cash/receivables, 1500s fixed assets, 1700s other assets',
            self::Liabilities => '2000s–2100s current liabilities, 2500s long-term loans',
            self::Equity => 'Share capital, retained earnings, current-year profit, drawings',
            self::Revenue => '4000s tuition by college, 4100s other student fees',
            self::ExpensesDirectAcademic => 'Faculty pay and costs directly tied to delivering teaching',
            self::ExpensesOperating => 'Admin, premises, marketing, compliance, depreciation',
            self::FinanceCostsOther => 'Bank charges, interest, FX, non-operating items',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Option list for filters and account forms.
     *
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $type) => ['value' => $type->value, 'label' => $type->label()],
            self::cases()
        );
    }
}
