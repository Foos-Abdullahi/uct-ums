<?php

namespace App\Models;

use App\Enums\AccountCategoryType;
use App\Enums\NormalBalance;
use Database\Factories\AccountCategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AccountCategory extends Model
{
    /** @use HasFactory<AccountCategoryFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'type',
        'name',
        'normal_balance',
        'code_range_start',
        'code_range_end',
        'sort_order',
        'description',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => AccountCategoryType::class,
            'normal_balance' => NormalBalance::class,
            'code_range_start' => 'integer',
            'code_range_end' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return HasMany<Account, $this>
     */
    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class)->orderBy('code');
    }

    public function isExpenseCategory(): bool
    {
        return $this->type->accountType()->isExpense();
    }
}
