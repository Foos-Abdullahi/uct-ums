<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreSemesterFeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'academic_year' => ['required', 'string', 'max:20', 'regex:/^\d{4}\/\d{4}$/'],
            'semester' => ['required', 'integer', 'min:1', 'max:'.config('academic.total_semesters')],
            'program_id' => ['nullable', 'integer', 'exists:programs,id'],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:tuition,registration,exam,lab,library,graduation,hostel,other'],
            'amount' => ['required', 'numeric', 'min:1'],
            'due_date' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'academic_year.regex' => 'Use an academic year in the format 2026/2027.',
        ];
    }
}
