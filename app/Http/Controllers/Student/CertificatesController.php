<?php

namespace App\Http\Controllers\Student;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CertificatesController extends StudentBaseController
{
    /**
     * Display the student's certificates.
     */
    public function index(Request $request): Response
    {
        $student = $this->getStudent($request);

        $certificates = $student->certificates()
            ->orderByDesc('issue_date')
            ->get();

        return Inertia::render('Student/certificates/index', [
            'student' => $student,
            'certificates' => $certificates,
        ]);
    }
}
