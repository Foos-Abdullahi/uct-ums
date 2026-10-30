<?php

test('not found responses render through the standalone error shell', function () {
    $this->get('/not-found')
        ->assertNotFound()
        ->assertInertia(fn ($page) => $page
            ->component('errors/error')
            ->where('status', 404)
        );
});
