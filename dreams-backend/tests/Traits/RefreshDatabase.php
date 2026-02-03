<?php

namespace Tests\Traits;

use Illuminate\Foundation\Testing\DatabaseTransactions;

trait RefreshDatabase
{
    use DatabaseTransactions;

    protected function setUpTraits()
    {
        parent::setUpTraits();
        
        // Migrate and seed the test database
        $this->artisan('migrate', ['--env' => 'testing']);
    }
}
