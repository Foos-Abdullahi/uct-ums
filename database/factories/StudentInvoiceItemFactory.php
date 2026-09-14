<?php

namespace Database\Factories;

use App\Models\StudentInvoice;
use App\Models\StudentInvoiceItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentInvoiceItem>
 */
class StudentInvoiceItemFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $unitPrice = fake()->randomFloat(2, 10, 500);
        $quantity = fake()->numberBetween(1, 5);

        return [
            'invoice_id' => StudentInvoice::factory(),
            'description' => fake()->sentence(3),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'amount' => round($unitPrice * $quantity, 2),
        ];
    }
}
