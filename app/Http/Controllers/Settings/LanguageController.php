<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class LanguageController extends Controller
{
    /**
     * Display the language settings page.
     */
    public function edit(): Response
    {
        return Inertia::render('settings/language');
    }

    /**
     * Update the user's language preference.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'language' => ['required', 'string', 'in:en,ar'],
        ]);

        $request->user()->update([
            'preferred_language' => $validated['language'],
        ]);

        return Redirect::back()->with('success', 'Language preference saved successfully.');
    }
}
