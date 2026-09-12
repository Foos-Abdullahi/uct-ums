<?php

namespace App\Models;

use App\Enums\ExpenseStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Expense extends Model
{
    use HasFactory;
    use SoftDeletes;

    public const TYPES = ['salary', 'utilities', 'equipment', 'maintenance', 'supplies', 'others'];

    public const STATUSES = ['draft', 'pending_approval', 'approved', 'paid', 'rejected', 'cancelled'];

    public const APPROVAL_LEVELS = [
        1 => 'Finance Officer',
        2 => 'Finance Director',
        3 => 'Vice Chancellor',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'expense_no',
        'title',
        'description',
        'expense_type',
        'account_id',
        'amount',
        'expense_date',
        'vendor',
        'budget_line',
        'receipt_path',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date:Y-m-d',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Account, $this>
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * @return HasMany<ExpenseApproval, $this>
     */
    public function approvals(): HasMany
    {
        return $this->hasMany(ExpenseApproval::class);
    }

    /**
     * @return HasMany<ExpenseApproval, $this>
     */
    public function pendingApprovals(): HasMany
    {
        return $this->hasMany(ExpenseApproval::class)->where('action', 'pending');
    }

    /**
     * @return HasMany<ExpenseApproval, $this>
     */
    public function approvedApprovals(): HasMany
    {
        return $this->hasMany(ExpenseApproval::class)->where('action', 'approved');
    }

    public function currentLevel(): int
    {
        $approved = $this->approvedApprovals()->count();

        return min($approved + 1, count(self::APPROVAL_LEVELS));
    }

    public function needsApproval(): bool
    {
        return $this->status === ExpenseStatus::PendingApproval->value
            && $this->approvedApprovals()->count() < count(self::APPROVAL_LEVELS)
            && $this->pendingApprovals()->exists();
    }

    /**
     * Build the full multi-level approval chain for this expense.
     */
    public function buildApprovalChain(): void
    {
        $this->approvals()->delete();

        foreach (array_keys(self::APPROVAL_LEVELS) as $level) {
            $approver = $this->approverForLevel($level);

            if (! $approver) {
                continue;
            }

            ExpenseApproval::create([
                'expense_id' => $this->id,
                'approver_id' => $approver->id,
                'level' => $level,
                'action' => 'pending',
            ]);
        }
    }

    /**
     * Determine the approver for a given level, avoiding duplicate users.
     */
    private function approverForLevel(int $level): ?User
    {
        $roles = match ($level) {
            1 => ['finance'],
            2 => ['super_admin', 'finance'],
            3 => ['super_admin'],
            default => ['finance'],
        };

        $alreadyAssigned = $this->approvals()->pluck('approver_id');

        return User::query()
            ->whereIn('role', $roles)
            ->where('is_active', true)
            ->when($alreadyAssigned->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $alreadyAssigned))
            ->orderBy('id')
            ->first()
            // Fall back to any matching user (small team) so the chain never deadlocks.
            ?? User::query()
                ->whereIn('role', $roles)
                ->where('is_active', true)
                ->orderBy('id')
                ->first();
    }
}
