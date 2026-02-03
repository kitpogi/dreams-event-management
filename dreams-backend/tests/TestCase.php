<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Traits\AuthenticatesUsers;
use Tests\Traits\ApiResponseHelpers;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;
    use RefreshDatabase;
    use AuthenticatesUsers;
    use ApiResponseHelpers;

    /**
     * Create a JSON API request
     */
    protected function jsonApi(
        string $method,
        string $uri,
        array $data = [],
        array $headers = []
    ) {
        $defaultHeaders = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        return $this->json(
            $method,
            $uri,
            $data,
            array_merge($defaultHeaders, $headers)
        );
    }
}

