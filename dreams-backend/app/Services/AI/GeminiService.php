<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class GeminiService
{
    protected string $apiKey;
    protected string $model;
    protected string $baseUrl;
    protected int $timeout;
    protected float $temperature;
    protected int $maxTokens;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key', '');
        $this->model = config('services.gemini.model', 'gemini-1.5-flash-latest');
        $this->baseUrl = config('services.gemini.base_url');
        $this->timeout = config('services.gemini.timeout', 30);
        $this->temperature = config('services.gemini.temperature', 0.3);
        $this->maxTokens = config('services.gemini.max_tokens', 1024);
    }

    /**
     * Check if the Gemini service is available (has API key)
     */
    public function isAvailable(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Send a text prompt to Gemini and get a text response
     */
    public function generateText(string $prompt, array $options = []): ?string
    {
        if (!$this->isAvailable()) {
            Log::warning('GeminiService: No API key configured');
            return null;
        }

        $temperature = $options['temperature'] ?? $this->temperature;
        $maxTokens = $options['max_tokens'] ?? $this->maxTokens;

        $url = $this->baseUrl . $this->model . ':generateContent?key=' . $this->apiKey;

        try {
            $response = Http::timeout($this->timeout)->post($url, [
                'contents' => [
                    ['parts' => [['text' => $prompt]]]
                ],
                'generationConfig' => [
                    'temperature' => $temperature,
                    'maxOutputTokens' => $maxTokens,
                    'topP' => 0.95,
                ],
            ]);

            if (!$response->successful()) {
                Log::error('GeminiService: API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();
            return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

        } catch (\Exception $e) {
            Log::error('GeminiService: Request failed', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Send a prompt and parse the response as JSON
     */
    public function generateJson(string $prompt, array $options = []): ?array
    {
        $text = $this->generateText($prompt, $options);

        if (!$text) {
            return null;
        }

        // Strip markdown code fences if present
        $cleaned = preg_replace('/```(?:json)?\s*/i', '', $text);
        $cleaned = preg_replace('/```\s*$/', '', $cleaned);
        $cleaned = trim($cleaned);

        $decoded = json_decode($cleaned, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::warning('GeminiService: Failed to parse JSON response', [
                'raw' => $text,
                'error' => json_last_error_msg(),
            ]);
            return null;
        }

        return $decoded;
    }

    /**
     * Generate text with caching
     */
    public function cachedGenerateJson(string $cacheKey, string $prompt, int $ttl = 3600, array $options = []): ?array
    {
        return Cache::remember($cacheKey, $ttl, function () use ($prompt, $options) {
            return $this->generateJson($prompt, $options);
        });
    }
}
