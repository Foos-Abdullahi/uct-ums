<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user();

        return redirect()->route($user->role->dashboardRoute());
    })->name('dashboard');
});

require __DIR__.'/portals/admin.php';
require __DIR__.'/portals/registrar.php';
require __DIR__.'/portals/finance.php';
require __DIR__.'/portals/hr.php';
require __DIR__.'/portals/lecturer.php';
require __DIR__.'/portals/student.php';

require __DIR__.'/settings.php';
