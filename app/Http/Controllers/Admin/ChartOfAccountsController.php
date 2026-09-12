<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AccountCategoryType;
use App\Enums\AccountStatus;
use App\Enums\AccountType;
use App\Enums\NormalBalance;
use App\Http\Controllers\Controller;
use App\Imports\AccountsImport;
use App\Models\Account;
use App\Models\AccountCategory;
use App\Models\AccountHistory;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class ChartOfAccountsController extends Controller
{
    /**
     * Interactive chart of accounts with search, filters, summary cards and
     * server-side account management actions.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $group = $request->query('group');
        $type = $request->query('type');
        $normalBalance = $request->query('normal_balance');
        $status = $request->query('status');

        $categories = AccountCategory::query()
            ->with([
                'accounts' => fn ($query) => $query
                    ->when($search !== '', function ($query) use ($search) {
                        $query->where(function ($sub) use ($search) {
                            $sub->where('code', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%")
                                ->orWhere('description', 'like', "%{$search}%");
                        });
                    })
                    ->when($type && $type !== 'all', fn ($query) => $query->where('type', $type))
                    ->when($normalBalance && $normalBalance !== 'all', fn ($query) => $query->where('normal_balance', $normalBalance))
                    ->when($status && $status !== 'all', fn ($query) => $query->where('status', $status))
                    ->orderBy('code'),
            ])
            ->when($group && $group !== 'all', fn ($query) => $query->where('type', $group))
            ->orderBy('sort_order')
            ->get();

        $transactionCounts = Expense::whereIn('account_id', Account::pluck('id'))
            ->select('account_id', DB::raw('COUNT(*) as total'))
            ->groupBy('account_id')
            ->pluck('total', 'account_id');

        $expenseTotals = Expense::whereIn('account_id', Account::pluck('id'))
            ->select('account_id', DB::raw('SUM(amount) as total'))
            ->groupBy('account_id')
            ->pluck('total', 'account_id');

        $mapped = $categories->map(function (AccountCategory $category) use ($transactionCounts, $expenseTotals) {
            return [
                'type' => $category->type->value,
                'name' => $category->type->label(),
                'code_range' => "{$category->type->codeRangeStart()}–{$category->type->codeRangeEnd()}",
                'normal_balance' => $category->type->normalBalance()->label(),
                'legend' => $category->type->legend(),
                'suggested_code' => Account::suggestNextCode($category),
                'accounts' => $category->accounts->map(fn (Account $account) => [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'type' => $account->type->value,
                    'normal_balance' => $account->normal_balance->value,
                    'status' => $account->status->value,
                    'description' => $account->description,
                    'is_system' => $account->is_system,
                    'transaction_count' => (int) ($transactionCounts[$account->id] ?? 0),
                    'expense_count' => (int) ($transactionCounts[$account->id] ?? 0),
                    'total_amount' => (float) ($expenseTotals[$account->id] ?? 0),
                ]),
            ];
        })->filter(fn ($item) => $item['accounts']->isNotEmpty() || ($search === '' && (! $group || $group === 'all')))
            ->values();

        return Inertia::render('Admin/finance/chart-of-accounts', [
            'summary' => [
                'total_accounts' => Account::count(),
                'active_accounts' => Account::where('status', AccountStatus::Active->value)->count(),
                'inactive_accounts' => Account::where('status', AccountStatus::Inactive->value)->count(),
                'account_groups' => AccountCategory::count(),
            ],
            'categories' => $mapped,
            'account_groups' => AccountCategoryType::options(),
            'account_types' => AccountType::values(),
            'normal_balances' => NormalBalance::values(),
            'filters' => [
                'search' => $search,
                'group' => $group && $group !== 'all' ? $group : 'all',
                'type' => $type && $type !== 'all' ? $type : 'all',
                'normal_balance' => $normalBalance && $normalBalance !== 'all' ? $normalBalance : 'all',
                'status' => $status && $status !== 'all' ? $status : 'all',
            ],
        ]);
    }

    /**
     * Store a newly created account.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateAccountInput($request, forUpdate: false);

        $category = AccountCategory::findOrFail($data['account_category_id']);
        $this->ensureCodeInRange($category, $data['code']);

        $data['type'] = $category->type->accountType();
        $data['normal_balance'] = $category->type->normalBalance();
        $data['status'] = $data['status'] ?? AccountStatus::Active->value;

        $account = DB::transaction(function () use ($data, $request) {
            $account = Account::create($data);

            $account->recordHistory('created', $data, $request->user()->id);

            return $account;
        });

        return back()->with('success', "Account {$account->code} · {$account->name} created.");
    }

    /**
     * Update an account. Account codes and groups are locked once the account
     * has posted transactions so historical references are never silently changed.
     */
    public function update(Request $request, Account $account): RedirectResponse
    {
        $data = $this->validateAccountInput($request, forUpdate: true);

        $hasTransactions = $account->hasTransactions();
        $category = AccountCategory::findOrFail($data['account_category_id']);

        if ($hasTransactions && (int) $data['code'] !== (int) $account->code) {
            throw ValidationException::withMessages([
                'code' => 'This account has posted transactions, so its account code cannot be changed. You can deactivate the account instead.',
            ]);
        }

        if ($hasTransactions && (int) $data['account_category_id'] !== (int) $account->account_category_id) {
            throw ValidationException::withMessages([
                'account_category_id' => 'This account has posted transactions, so its account group cannot be changed.',
            ]);
        }

        $this->ensureCodeInRange($category, $data['code']);

        $data['type'] = $category->type->accountType();
        $data['normal_balance'] = $category->type->normalBalance();
        $data['status'] = $data['status'] ?? $account->status->value;

        $old = $account->only(['code', 'name', 'normal_balance', 'description']);
        $new = [
            'code' => $data['code'],
            'name' => $data['name'],
            'normal_balance' => $data['normal_balance']->value,
            'description' => $data['description'],
        ];

        $account->update($data);
        $account->recordHistory('updated', ['old' => $old, 'new' => $new], $request->user()->id);

        return back()->with('success', "Account {$account->code} · {$account->name} updated.");
    }

    /**
     * Deactivate or reactivate an account. Historical transactions are preserved.
     */
    public function toggleStatus(Request $request, Account $account): RedirectResponse
    {
        $newStatus = $account->status === AccountStatus::Active
            ? AccountStatus::Inactive
            : AccountStatus::Active;

        $account->update(['status' => $newStatus]);
        $account->recordHistory(
            $newStatus === AccountStatus::Active ? 'reactivated' : 'deactivated',
            ['old_status' => $account->status->value],
            $request->user()->id
        );

        return back()->with('success', "Account {$account->code} · {$account->name} {$newStatus->label()}d.");
    }

    /**
     * Delete an unused, non-system account. Accounts with transactions cannot
     * be deleted - they are deactivated instead to preserve history.
     */
    public function destroy(Request $request, Account $account): RedirectResponse
    {
        if ($account->hasTransactions()) {
            return back()->with('error', 'This account cannot be deleted because it has posted transactions. You can deactivate the account instead.');
        }

        if ($account->is_system) {
            return back()->with('error', 'Core UCT accounts cannot be deleted. You can deactivate the account instead.');
        }

        $label = $account->fullLabel();
        $account->delete();

        return back()->with('success', "Account {$label} deleted.");
    }

    /**
     * Account details (financial activity, recent transactions, history).
     */
    public function show(Request $request, Account $account): JsonResponse
    {
        $account->load(['category', 'histories.actor']);

        $posted = Expense::where('account_id', $account->id)
            ->whereIn('status', ['approved', 'paid'])
            ->get();

        $transactionCount = Expense::where('account_id', $account->id)->count();
        $totalDebits = (float) $posted->sum('amount');

        $history = $account->histories
            ->sortByDesc('created_at')
            ->values()
            ->map(fn (AccountHistory $entry) => [
                'id' => $entry->id,
                'action' => $entry->action,
                'changes' => $entry->changes,
                'actor' => $entry->actor?->name ?? 'System',
                'created_at' => $entry->created_at->toDateTimeString(),
            ]);

        return response()->json([
            'account' => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type->value,
                'type_label' => $account->type->label(),
                'normal_balance' => $account->normal_balance->value,
                'normal_balance_label' => $account->normal_balance->label(),
                'status' => $account->status->value,
                'description' => $account->description,
                'is_system' => $account->is_system,
                'category' => [
                    'type' => $account->category?->type->value,
                    'name' => $account->category?->type->label(),
                    'code_range' => $account->category
                        ? "{$account->category->type->codeRangeStart()}–{$account->category->type->codeRangeEnd()}"
                        : null,
                ],
                'created_at' => $account->created_at?->toDateTimeString(),
                'updated_at' => $account->updated_at?->toDateTimeString(),
                'has_transactions' => $transactionCount > 0,
                'can_change_code' => $transactionCount === 0,
            ],
            'financial' => [
                'transaction_count' => $transactionCount,
                'posted_count' => $posted->count(),
                'total_debits' => $totalDebits,
                'total_credits' => 0.0,
                'balance' => $totalDebits,
            ],
            'recent_transactions' => Expense::where('account_id', $account->id)
                ->latest('expense_date')
                ->limit(8)
                ->get(['id', 'expense_no', 'title', 'amount', 'status', 'expense_date'])
                ->map(fn (Expense $expense) => [
                    'id' => $expense->id,
                    'expense_no' => $expense->expense_no,
                    'title' => $expense->title,
                    'amount' => (float) $expense->amount,
                    'status' => $expense->status,
                    'expense_date' => $expense->expense_date?->toDateString(),
                ]),
            'history' => $history,
        ]);
    }

    /**
     * Dedicated import wizard page.
     */
    public function importIndex(): Response
    {
        return Inertia::render('Admin/finance/chart-of-accounts-import', [
            'account_groups' => AccountCategoryType::options(),
        ]);
    }

    /**
     * Parse and validate an uploaded workbook without saving anything.
     */
    public function importPreview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:5120'],
        ]);

        $rows = collect(Excel::toArray(new AccountsImport, $request->file('file')))
            ->flatten(1)
            ->reject(fn ($row) => empty($row))
            ->map(fn (array $row) => AccountsImport::normaliseRow($row))
            ->values();

        $categories = AccountCategory::all();
        $existingCodes = Account::pluck('code')->flip();
        $seenCodes = [];

        $validated = $rows->map(function ($row, $index) use ($categories, $existingCodes, &$seenCodes) {
            $errors = [];
            $warnings = [];

            $code = isset($row['code']) && $row['code'] !== '' ? (int) preg_replace('/\D/', '', (string) $row['code']) : null;
            $name = trim((string) ($row['name'] ?? ''));
            $groupName = trim((string) ($row['group'] ?? ''));
            $typeName = trim((string) ($row['type'] ?? ''));
            $balanceName = strtolower(trim((string) ($row['balance'] ?? '')));
            $description = trim((string) ($row['description'] ?? ''));

            if ($code === null) {
                $errors[] = 'Account code is required.';
            } elseif ($code < 1000 || $code > 7999) {
                $errors[] = "Invalid account code {$code}. Codes must be between 1000 and 7999.";
            }

            if ($name === '') {
                $errors[] = 'Account name is required.';
            }

            $category = null;
            if ($groupName !== '') {
                $category = $categories->first(fn ($c) => strcasecmp($c->type->value, $groupName) === 0
                    || strcasecmp($c->type->label(), $groupName) === 0);
                if (! $category) {
                    $errors[] = "Unknown account group \"{$groupName}\".";
                }
            } elseif ($code !== null) {
                $category = $categories->first(fn ($c) => $code >= $c->code_range_start && $code <= $c->code_range_end);
            }

            if ($category && $code !== null && ($code < $category->code_range_start || $code > $category->code_range_end)) {
                $errors[] = "Invalid account code {$code}: belongs to the {$category->type->label()} range ({$category->code_range_start}–{$category->code_range_end}). Please choose a code in the {$category->type->label()} range.";
            }

            $type = null;
            if ($typeName !== '') {
                $type = AccountType::tryFrom(strtolower($typeName));
                if (! $type) {
                    $type = collect(AccountType::cases())
                        ->first(fn ($t) => strcasecmp($t->value, $typeName) === 0 || strcasecmp($t->label(), $typeName) === 0);
                }
                if (! $type) {
                    $errors[] = "Unknown account type \"{$typeName}\".";
                }
            } elseif ($category) {
                $type = $category->type->accountType();
            }

            if ($balanceName !== '') {
                $balance = NormalBalance::tryFrom($balanceName);
                if (! $balance) {
                    $errors[] = "Invalid normal balance \"{$balanceName}\". Use 'debit' or 'credit'.";
                } elseif ($type && $balance !== $type->normalBalance()) {
                    $errors[] = "Normal balance must be {$type->normalBalance()->label()} for {$type->label()} accounts.";
                }
            }

            if ($code !== null && $existingCodes->has($code)) {
                $warnings[] = "Code {$code} already exists and will be skipped.";
            }

            if ($code !== null && isset($seenCodes[$code])) {
                $errors[] = 'Duplicate code '.$code.' within the file (previous row '.($seenCodes[$code] + 1).').';
            } else {
                $seenCodes[$code] = $index;
            }

            return [
                'row' => $index + 2,
                'code' => $code,
                'name' => $name,
                'description' => $description,
                'group' => $category?->type->value ?? '',
                'group_name' => $category?->type->label() ?? '',
                'type' => $type?->value ?? '',
                'balance' => $balanceName,
                'errors' => $errors,
                'warnings' => $warnings,
            ];
        });

        return response()->json([
            'total' => count($validated),
            'valid' => $validated->filter(fn ($r) => empty($r['errors']) && empty($r['warnings']))->count(),
            'warnings' => $validated->filter(fn ($r) => empty($r['errors']) && ! empty($r['warnings']))->count(),
            'errors' => $validated->filter(fn ($r) => ! empty($r['errors']))->count(),
            'rows' => $validated->values(),
        ]);
    }

    /**
     * Import previously validated rows inside a single database transaction.
     */
    public function importStore(Request $request): JsonResponse
    {
        $rows = $request->validate([
            'rows' => ['required', 'array'],
            'rows.*.code' => ['required', 'integer'],
            'rows.*.name' => ['required', 'string'],
            'rows.*.group' => ['nullable', 'string'],
            'rows.*.description' => ['nullable', 'string'],
        ])['rows'];

        $categories = AccountCategory::all();
        $existingCodes = Account::pluck('code')->flip();
        $imported = 0;
        $skipped = 0;
        $seenCodes = [];

        try {
            DB::transaction(function () use ($rows, $categories, $existingCodes, &$imported, &$skipped, &$seenCodes, $request) {
                foreach ($rows as $row) {
                    $code = Account::normalizeCode($row['code']);

                    if ($existingCodes->has($code) || isset($seenCodes[$code])) {
                        $skipped++;

                        continue;
                    }

                    $seenCodes[$code] = true;

                    $category = $categories->first(
                        fn ($c) => isset($row['group']) && $row['group'] !== '' && strcasecmp($c->type->value, $row['group']) === 0
                    ) ?? $categories->first(fn ($c) => $code >= $c->code_range_start && $code <= $c->code_range_end);

                    if (! $category) {
                        continue;
                    }

                    $account = Account::create([
                        'account_category_id' => $category->id,
                        'code' => $code,
                        'name' => $row['name'],
                        'type' => $category->type->accountType(),
                        'normal_balance' => $category->type->normalBalance(),
                        'description' => $row['description'] ?? null,
                        'status' => AccountStatus::Active->value,
                        'is_system' => false,
                    ]);

                    $account->recordHistory('imported', ['source' => 'excel'], $request->user()->id);
                    $imported++;
                }
            });
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Import failed. No changes were saved.'], 422);
        }

        return response()->json([
            'message' => "{$imported} accounts imported successfully.",
            'imported' => $imported,
            'skipped' => $skipped,
        ]);
    }

    /**
     * Validate account input shared by create and update.
     *
     * @return array{account_category_id: int, code: int, name: string, description: ?string, status?: string}
     */
    private function validateAccountInput(Request $request, bool $forUpdate): array
    {
        $rules = [
            'account_category_id' => ['required', 'integer', 'exists:account_categories,id'],
            'code' => ['required', 'integer', 'min:1000', 'max:7999'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::in(AccountStatus::values())],
        ];

        if ($forUpdate) {
            $account = (int) $request->route('account')->id;

            $rules['code'][] = Rule::unique('accounts', 'code')->ignore($account);
        } else {
            $rules['code'][] = Rule::unique('accounts', 'code');
        }

        return $request->validate($rules);
    }

    /**
     * Enforce that a code belongs to the selected group's number range, with a
     * friendly message naming the range the code actually falls into.
     */
    private function ensureCodeInRange(AccountCategory $category, int $code): void
    {
        if ($code >= $category->code_range_start && $code <= $category->code_range_end) {
            return;
        }

        $belongsTo = Account::categoryForCode($code);

        throw ValidationException::withMessages([
            'code' => $belongsTo
                ? "Invalid account code {$code}. {$code} belongs to the {$belongsTo->type->label()} range ({$belongsTo->code_range_start}–{$belongsTo->code_range_end}). {$category->type->label()} accounts must use codes between {$category->code_range_start} and {$category->code_range_end}."
                : "Invalid account code {$code}. {$category->type->label()} accounts must use codes between {$category->code_range_start} and {$category->code_range_end}.",
        ]);
    }
}
