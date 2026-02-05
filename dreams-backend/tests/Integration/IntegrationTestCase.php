<?php

namespace Tests\Integration;

use Tests\TestCase;
use Tests\Support\IntegrationTestHelpers;

/**
 * Base class for integration tests.
 * 
 * Integration tests verify that multiple components work together correctly.
 * They use the full application stack but with a test database.
 */
abstract class IntegrationTestCase extends TestCase
{
    use IntegrationTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpIntegrationTest();
    }
}
