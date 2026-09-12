<?php

namespace Database\Seeders;

use App\Enums\AccountCategoryType;
use App\Enums\ExpenseType;
use App\Models\Account;
use App\Models\AccountCategory;
use App\Models\Expense;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChartOfAccountsSeeder extends Seeder
{
    /**
     * Chart of accounts copied verbatim from UCT_Chart_of_Accounts_1.xlsx (Currency: USD).
     * Add new accounts inside the correct block using the next free number in steps of 10.
     *
     * @return array<string, array<int, array{code: int, name: string, balance: string, description: string}>>
     */
    private function definitions(): array
    {
        return [
            AccountCategoryType::Assets->value => [
                ['code' => 1010, 'name' => 'Cash on Hand', 'balance' => 'debit', 'description' => 'Petty cash held at campus'],
                ['code' => 1020, 'name' => 'Cash at Bank – Operating Account', 'balance' => 'debit', 'description' => 'Main bank account'],
                ['code' => 1030, 'name' => 'Mobile Money Account', 'balance' => 'debit', 'description' => 'e.g. EVC Plus, before sweeping to bank'],
                ['code' => 1100, 'name' => 'Accounts Receivable – Student Fees', 'balance' => 'debit', 'description' => 'Fees billed/invoiced but not yet collected'],
                ['code' => 1200, 'name' => 'Prepaid Expenses', 'balance' => 'debit', 'description' => 'Rent, insurance, etc. paid in advance'],
                ['code' => 1300, 'name' => 'Supplies Inventory', 'balance' => 'debit', 'description' => 'Stationery and teaching consumables on hand'],
                ['code' => 1500, 'name' => 'Furniture & Fixtures', 'balance' => 'debit', 'description' => 'Desks, chairs, office furniture'],
                ['code' => 1510, 'name' => 'Computers & IT Equipment', 'balance' => 'debit', 'description' => 'Computer lab, laptops, servers, networking'],
                ['code' => 1520, 'name' => 'Lab & Teaching Equipment', 'balance' => 'debit', 'description' => 'Engineering/technical lab tools'],
                ['code' => 1530, 'name' => 'Vehicles', 'balance' => 'debit', 'description' => ''],
                ['code' => 1590, 'name' => 'Accumulated Depreciation', 'balance' => 'credit', 'description' => 'Cumulative depreciation on the fixed assets above'],
                ['code' => 1700, 'name' => 'Deposits (Rent / Utilities)', 'balance' => 'debit', 'description' => 'Refundable deposits paid to landlord/utility providers'],
            ],
            AccountCategoryType::Liabilities->value => [
                ['code' => 2000, 'name' => 'Accounts Payable', 'balance' => 'credit', 'description' => 'Unpaid supplier/vendor invoices'],
                ['code' => 2010, 'name' => 'Accrued Salaries Payable', 'balance' => 'credit', 'description' => 'Salaries earned but not yet paid'],
                ['code' => 2020, 'name' => 'Statutory Deductions Payable', 'balance' => 'credit', 'description' => 'Any employee tax/social contributions withheld'],
                ['code' => 2100, 'name' => 'Unearned Tuition Revenue', 'balance' => 'credit', 'description' => 'Fees collected for a term not yet taught'],
                ['code' => 2110, 'name' => 'Student Deposits & Advances', 'balance' => 'credit', 'description' => 'Refundable deposits, admission holds'],
                ['code' => 2300, 'name' => 'Due to Shareholders', 'balance' => 'credit', 'description' => 'Loans from, or amounts owed to, shareholders'],
                ['code' => 2400, 'name' => 'Short-Term Loans Payable', 'balance' => 'credit', 'description' => 'Due within 12 months'],
                ['code' => 2500, 'name' => 'Long-Term Loans Payable', 'balance' => 'credit', 'description' => 'Due beyond 12 months'],
            ],
            AccountCategoryType::Equity->value => [
                ['code' => 3000, 'name' => 'Share Capital', 'balance' => 'credit', 'description' => 'Capital contributed by shareholders'],
                ['code' => 3100, 'name' => 'Retained Earnings', 'balance' => 'credit', 'description' => "Accumulated prior-years' profit not distributed"],
                ['code' => 3200, 'name' => 'Current Year Net Income', 'balance' => 'credit', 'description' => 'Rolls into Retained Earnings at year-end close'],
                ['code' => 3300, 'name' => 'Owner Drawings / Distributions', 'balance' => 'debit', 'description' => 'Cash distributed to shareholders during the year'],
            ],
            AccountCategoryType::Revenue->value => [
                ['code' => 4000, 'name' => 'Tuition Revenue – College of ICT', 'balance' => 'credit', 'description' => ''],
                ['code' => 4010, 'name' => 'Tuition Revenue – College of Business & Commerce', 'balance' => 'credit', 'description' => ''],
                ['code' => 4020, 'name' => 'Tuition Revenue – College of Engineering', 'balance' => 'credit', 'description' => ''],
                ['code' => 4100, 'name' => 'Admission & Registration Fees', 'balance' => 'credit', 'description' => 'One-time fee at enrollment'],
                ['code' => 4110, 'name' => 'Examination Fees', 'balance' => 'credit', 'description' => ''],
                ['code' => 4120, 'name' => 'Certificate / Transcript / ID Card Fees', 'balance' => 'credit', 'description' => ''],
                ['code' => 4130, 'name' => 'Late Payment Fees', 'balance' => 'credit', 'description' => ''],
                ['code' => 4200, 'name' => 'Short Courses & Professional Training Revenue', 'balance' => 'credit', 'description' => 'Non-degree courses, corporate training'],
                ['code' => 4900, 'name' => 'Other Income', 'balance' => 'credit', 'description' => ''],
            ],
            AccountCategoryType::ExpensesDirectAcademic->value => [
                ['code' => 5000, 'name' => 'Faculty Salaries & Benefits', 'balance' => 'debit', 'description' => 'Full-time lecturers'],
                ['code' => 5010, 'name' => 'Part-Time / Adjunct Lecturer Fees', 'balance' => 'debit', 'description' => ''],
                ['code' => 5100, 'name' => 'Teaching Materials & Lab Supplies', 'balance' => 'debit', 'description' => ''],
                ['code' => 5110, 'name' => 'Software & Learning Platform Licenses', 'balance' => 'debit', 'description' => 'LMS, design/engineering software, etc.'],
                ['code' => 5300, 'name' => 'Examination Costs', 'balance' => 'debit', 'description' => ''],
            ],
            AccountCategoryType::ExpensesOperating->value => [
                ['code' => 6000, 'name' => 'Administrative & Management Salaries', 'balance' => 'debit', 'description' => ''],
                ['code' => 6010, 'name' => 'Support Staff Wages', 'balance' => 'debit', 'description' => 'Security, cleaning, drivers, admin assistants'],
                ['code' => 6100, 'name' => 'Rent – Campus Premises', 'balance' => 'debit', 'description' => ''],
                ['code' => 6110, 'name' => 'Electricity & Utilities', 'balance' => 'debit', 'description' => ''],
                ['code' => 6120, 'name' => 'Internet & Communications', 'balance' => 'debit', 'description' => ''],
                ['code' => 6200, 'name' => 'Marketing & Student Recruitment', 'balance' => 'debit', 'description' => ''],
                ['code' => 6300, 'name' => 'Office Supplies & Printing', 'balance' => 'debit', 'description' => ''],
                ['code' => 6400, 'name' => 'Repairs & Maintenance', 'balance' => 'debit', 'description' => ''],
                ['code' => 6500, 'name' => 'Professional, Legal & Audit Fees', 'balance' => 'debit', 'description' => ''],
                ['code' => 6600, 'name' => 'Ministry of Education / NCHE Licensing Fees', 'balance' => 'debit', 'description' => ''],
                ['code' => 6700, 'name' => 'Depreciation Expense', 'balance' => 'debit', 'description' => 'Offsets 1590 Accumulated Depreciation'],
                ['code' => 6800, 'name' => 'Insurance Expense', 'balance' => 'debit', 'description' => ''],
                ['code' => 6900, 'name' => 'Travel & Transport', 'balance' => 'debit', 'description' => ''],
                ['code' => 6910, 'name' => 'Staff Training & Development', 'balance' => 'debit', 'description' => ''],
            ],
            AccountCategoryType::FinanceCostsOther->value => [
                ['code' => 7000, 'name' => 'Bank Charges & Fees', 'balance' => 'debit', 'description' => ''],
                ['code' => 7010, 'name' => 'Interest Expense on Loans', 'balance' => 'debit', 'description' => ''],
                ['code' => 7020, 'name' => 'Foreign Exchange Loss', 'balance' => 'debit', 'description' => ''],
                ['code' => 7900, 'name' => 'Other Non-Operating Expenses', 'balance' => 'debit', 'description' => ''],
            ],
        ];
    }

    /**
     * Seed the UCT chart of accounts and backfill existing expenses.
     */
    public function run(): void
    {
        DB::transaction(function () {
            foreach (AccountCategoryType::cases() as $index => $categoryType) {
                $category = AccountCategory::updateOrCreate(
                    ['type' => $categoryType->value],
                    [
                        'name' => $categoryType->label(),
                        'normal_balance' => $categoryType->normalBalance(),
                        'code_range_start' => $categoryType->codeRangeStart(),
                        'code_range_end' => $categoryType->codeRangeEnd(),
                        'sort_order' => $index,
                        'description' => $categoryType->legend(),
                    ]
                );

                foreach ($this->definitions()[$categoryType->value] as $index => $account) {
                    Account::updateOrCreate(
                        ['code' => $account['code']],
                        [
                            'account_category_id' => $category->id,
                            'name' => $account['name'],
                            'type' => $category->type->accountType(),
                            'normal_balance' => $account['balance'],
                            'description' => $account['description'],
                            'status' => 'active',
                            'is_system' => true,
                            'sort_order' => $index,
                        ]
                    );
                }
            }

            $this->backfillLegacyExpenses();
        });
    }

    /**
     * Link existing expenses recorded under the old free-text type to a
     * real chart-of-accounts account so nothing is left orphaned.
     */
    private function backfillLegacyExpenses(): void
    {
        $legacyMap = $this->legacyAccountMap();

        Expense::query()
            ->whereNull('account_id')
            ->get(['id', 'expense_type'])
            ->each(function (Expense $expense) use ($legacyMap) {
                $account = $legacyMap[$expense->expense_type] ?? null;

                if (! $account) {
                    return;
                }

                $expense->forceFill(['account_id' => $account->id])->save();
            });
    }

    /**
     * @return array<string, Account|null>
     */
    private function legacyAccountMap(): array
    {
        $codes = [
            ExpenseType::Salary->value => 5000,
            ExpenseType::Utilities->value => 6110,
            ExpenseType::Equipment->value => 5100,
            ExpenseType::Maintenance->value => 6400,
            ExpenseType::Supplies->value => 6300,
            ExpenseType::Others->value => 7900,
        ];

        $map = [];

        foreach ($codes as $type => $code) {
            $map[$type] = $code !== null ? Account::where('code', $code)->first() : null;
        }

        return $map;
    }
}
