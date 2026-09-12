<?php

namespace App\Models;

use App\Enums\AccountStatus;
use App\Enums\AccountType;
use App\Enums\ExpenseType;
use App\Enums\NormalBalance;
use Database\Factories\AccountFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    /** @use HasFactory<AccountFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'account_category_id',
        'parent_account_id',
        'code',
        'name',
        'type',
        'normal_balance',
        'description',
        'status',
        'is_system',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => AccountType::class,
            'normal_balance' => NormalBalance::class,
            'status' => AccountStatus::class,
            'code' => 'integer',
            'is_system' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<AccountCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(AccountCategory::class, 'account_category_id');
    }

    /**
     * @return BelongsTo<Account, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'parent_account_id');
    }

    /**
     * @return HasMany<Account, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(Account::class, 'parent_account_id');
    }

    /**
     * @return HasMany<Expense, $this>
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    /**
     * @return HasMany<AccountHistory, $this>
     */
    public function histories(): HasMany
    {
        return $this->hasMany(AccountHistory::class);
    }

    public function isExpenseAccount(): bool
    {
        return $this->type === AccountType::Expense;
    }

    public function isActive(): bool
    {
        return $this->status === AccountStatus::Active;
    }

    /**
     * Whether any financial transactions (posted or not) reference this account.
     */
    public function hasTransactions(): bool
    {
        return $this->expenses()->exists();
    }

    /**
     * Full accounting label, e.g. "6110 · Electricity & Utilities".
     */
    public function fullLabel(): string
    {
        return "{$this->code} · {$this->name}";
    }

    /**
     * Legacy free-text expense type retained so older views (finance portal,
     * dashboard breakdowns) keep rendering sensibly for account-linked expenses.
     */
    public function legacyExpenseType(): ExpenseType
    {
        return match (true) {
            in_array($this->code, [5000, 5010, 6000, 6010], true) => ExpenseType::Salary,
            in_array($this->code, [6100, 6110, 6120], true) => ExpenseType::Utilities,
            in_array($this->code, [5100, 6300], true) => ExpenseType::Supplies,
            $this->code === 6400 => ExpenseType::Maintenance,
            default => ExpenseType::Others,
        };
    }

    /**
     * Normalise a raw code into a stable account code (int only).
     */
    public static function normalizeCode(int|string $code): int
    {
        return (int) preg_replace('/\D/', '', (string) $code);
    }

    /**
     * The category whose code range a given code belongs to, or null.
     */
    public static function categoryForCode(int $code): ?AccountCategory
    {
        return AccountCategory::query()
            ->where('code_range_start', '<=', $code)
            ->where('code_range_end', '>=', $code)
            ->first();
    }

    /**
     * Next available account code using the UCT numbering guide (steps of 10).
     *
     * Continues the highest existing code in the category by +10 when that stays
     * within range, otherwise scans the range upward for the first free slot.
     */
    public static function suggestNextCode(AccountCategory $category, ?int $ignoreCode = null): ?int
    {
        $from = $category->code_range_start;
        $to = $category->code_range_end;

        $codes = self::query()
            ->where('account_category_id', $category->id)
            ->whereBetween('code', [$from, $to])
            ->when($ignoreCode !== null, fn ($query) => $query->where('code', '!=', $ignoreCode))
            ->pluck('code')
            ->flip();

        $next = ($codes->keys()->max() ?? $from - 10) + 10;

        while ($codes->has($next)) {
            $next += 10;
        }

        if ($next <= $to) {
            return $next;
        }

        // Highest slot is exhausted; scan the range upward for the first free block.
        for ($candidate = $from; $candidate <= $to; $candidate += 10) {
            if (! $codes->has($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * Record a lightweight account-history entry (created / updated / deactivated /
     * reactivated / imported) for the given actor.
     */
    public function recordHistory(string $action, array $changes = [], ?int $actorId = null): AccountHistory
    {
        return $this->histories()->create([
            'actor_id' => $actorId,
            'action' => $action,
            'changes' => $changes,
        ]);
    }
}
