<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\StudentInvoice;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<StudentInvoice>
 */
class StudentInvoiceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'invoice_no' => 'INV-'.date('Y').'-'.strtoupper(Str::random(6)),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'type' => fake()->randomElement(['tuition', 'admission', 'examination', 'laboratory', 'library', 'graduation', 'hostel', 'other']),
            'amount' => fake()->randomFloat(2, 500, 3000),
            'tax_amount' => 0.00,
            'discount_amount' => 0.00,
            'paid_amount' => 0.00,
            'due_date' => fake()->dateTimeBetween('now', '+60 days')->format('Y-m-d'),
            'issue_date' => now()->format('Y-m-d'),
            'status' => 'unpaid',
            'approved_by' => null,
            'approved_at' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
            'paid_amount' => $attributes['amount'],
        ]);
    }

    public function partial(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'partial',
            'paid_amount' => round((float) $attributes['amount'] / 2, 2),
        ]);
    }

    public function withItems(int $count = 2): static
    {
        return $this->afterCreating(function (StudentInvoice $invoice) use ($count) {
            $items = [];
            $total = 0;

            for ($i = 1; $i <= $count; $i++) {
                $unitPrice = fake()->randomFloat(2, 50, 500);
                $quantity = fake()->numberBetween(1, 4);
                $lineTotal = round($unitPrice * $quantity, 2);

                $items[] = [
                    'description' => fake()->sentence(3),
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'amount' => $lineTotal,
                ];

                $total += $lineTotal;
            }

            $invoice->items()->createMany($items);
            $invoice->update(['amount' => round($total, 2)]);
        });
    }

    public function withTax(float $rate = 5.0): static
    {
        return $this->state(function (array $attributes) use ($rate) {
            $amount = (float) $attributes['amount'];

            return [
                'tax_amount' => round($amount * $rate / 100, 2),
            ];
        });
    }

    public function withDiscount(float $discount = 100.0): static
    {
        return $this->state(function (array $attributes) use ($discount) {
            $amount = (float) $attributes['amount'];

            return [
                'discount_amount' => $discount,
                'amount' => round(max(0, $amount - $discount), 2),
            ];
        });
    }
}
