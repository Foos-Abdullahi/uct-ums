<?php

namespace App\Http\Controllers\Student;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentsController extends StudentBaseController
{
    /**
     * Display the student's documents.
     */
    public function index(Request $request): Response
    {
        $student = $this->getStudent($request);

        $documents = $student->documents()
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Student/documents/index', [
            'student' => $student,
            'documents' => $documents,
        ]);
    }
}
