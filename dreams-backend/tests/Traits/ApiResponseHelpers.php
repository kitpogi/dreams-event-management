<?php

namespace Tests\Traits;

trait ApiResponseHelpers
{
    /**
     * Assert API response structure
     */
    protected function assertApiSuccessResponse($response, int $expectedStatus = 200): void
    {
        $response->assertStatus($expectedStatus)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
            ]);
    }

    /**
     * Assert API error response structure
     */
    protected function assertApiErrorResponse($response, int $expectedStatus = 400): void
    {
        $response->assertStatus($expectedStatus)
            ->assertJsonStructure([
                'success',
                'message',
                'errors',
            ]);
    }

    /**
     * Assert API validation error response
     */
    protected function assertApiValidationErrors($response, array $fields): void
    {
        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => $fields,
            ]);
    }

    /**
     * Assert API paginated response
     */
    protected function assertApiPaginatedResponse($response): void
    {
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [],
            'meta' => [
                'current_page',
                'per_page',
                'total',
                'last_page',
            ],
        ]);
    }

    /**
     * Get API response data
     */
    protected function getResponseData($response): array
    {
        return $response->json('data', []);
    }

    /**
     * Assert response data contains
     */
    protected function assertResponseDataContains($response, array $data): void
    {
        $responseData = $this->getResponseData($response);
        
        foreach ($data as $key => $value) {
            $this->assertArrayHasKey($key, $responseData);
            if (is_array($value)) {
                foreach ($value as $subKey => $subValue) {
                    $this->assertEquals($subValue, $responseData[$key][$subKey] ?? null);
                }
            } else {
                $this->assertEquals($value, $responseData[$key] ?? null);
            }
        }
    }
}
