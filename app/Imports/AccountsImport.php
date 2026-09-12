<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Reads a chart-of-accounts workbook as raw heading-keyed rows.
 *
 * The maatwebsite/excel v4.0 "ToArray" concern is a plain signature hook, so all
 * row normalisation and validation happens in the controller via the static
 * normaliseRow() method. Expected columns (case-insensitive): code, name
 * (or "account name"), group, type, balance (or "normal balance"), description,
 * status.
 */
class AccountsImport implements ToArray, WithHeadingRow
{
    public const HEADER_MAP = [
        'code' => ['code'],
        'name' => ['name', 'account name', 'account_name', 'accountname'],
        'group' => ['group', 'category', 'group/category', 'account group', 'account_group'],
        'type' => ['type', 'account type', 'account_type'],
        'balance' => ['balance', 'normal balance', 'normal_balance', 'normalbalance'],
        'description' => ['description'],
        'status' => ['status'],
    ];

    /**
     * v4.0 compatibility hook; reading raw rows via Excel::toArray does not
     * call this callback, validation is performed downstream instead.
     */
    public function array(array $array): void
    {
        // no-op
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{code: mixed, name: mixed, group: mixed, type: mixed, balance: mixed, description: mixed, status: mixed}
     */
    public static function normaliseRow(array $row): array
    {
        $keys = [];

        foreach (array_keys($row) as $key) {
            $keys[strtolower(preg_replace('/[^a-z ]/i', '', (string) $key))] = $key;
        }

        $pick = function (array $aliases) use ($keys, $row) {
            foreach ($aliases as $alias) {
                $sourceKey = $keys[$alias] ?? null;

                if ($sourceKey !== null && isset($row[$sourceKey]) && $row[$sourceKey] !== null) {
                    return $row[$sourceKey];
                }
            }

            return null;
        };

        return [
            'code' => $pick(self::HEADER_MAP['code']),
            'name' => $pick(self::HEADER_MAP['name']),
            'group' => $pick(self::HEADER_MAP['group']),
            'type' => $pick(self::HEADER_MAP['type']),
            'balance' => $pick(self::HEADER_MAP['balance']),
            'description' => $pick(self::HEADER_MAP['description']),
            'status' => $pick(self::HEADER_MAP['status']),
        ];
    }
}
