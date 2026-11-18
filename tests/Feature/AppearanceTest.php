<?php

test('pages default to the light appearance when no preference is stored', function () {
    $response = $this->get(route('login'));

    $response->assertOk()
        ->assertViewHas('appearance', 'light')
        ->assertDontSee('<html lang="en" class="dark">', false);
});

test('a stored dark preference renders the dark theme on first paint', function () {
    $response = $this->withUnencryptedCookie('appearance', 'dark')->get(route('login'));

    $response->assertOk()
        ->assertViewHas('appearance', 'dark')
        ->assertSee('class="dark"', false);
});
