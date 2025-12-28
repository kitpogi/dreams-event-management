<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ImageAnalysisController extends Controller
{
    public function analyzePackageImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:10240', // 10MB max
        ]);

        try {
            $image = $request->file('image');
            $base64Image = base64_encode(file_get_contents($image->getPathname()));
            $mimeType = $image->getMimeType();

            // Try Google Gemini first (FREE with generous limits), fallback to OpenAI
            $geminiKey = env('GEMINI_API_KEY');
            $openaiKey = env('OPENAI_API_KEY');
            
            if ($geminiKey) {
                return $this->analyzeWithGemini($base64Image, $mimeType, $geminiKey);
            } elseif ($openaiKey) {
                return $this->analyzeWithOpenAI($base64Image, $mimeType, $openaiKey);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'No AI API key configured. Please add GEMINI_API_KEY (free) or OPENAI_API_KEY to your .env file.',
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Image Analysis Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while analyzing the image.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function analyzeWithGemini($base64Image, $mimeType, $apiKey)
    {
        try {
            $prompt = 'Analyze this event package image/flyer and extract the following information in JSON format:
{
  "name": "package name",
  "description": "detailed description",
  "price": "price in numbers only (no currency symbols)",
  "capacity": "number of guests/people (numbers only, no text like \'pax\' or \'guests\')",
  "type": "one of: wedding, debut, birthday, pageant, corporate, anniversary, or other",
  "theme": "theme or style",
  "inclusions": "list of what\'s included, separated by newlines"
}

If you cannot find a specific field, leave it as an empty string. For capacity, extract only the numeric value. Extract as much information as possible from the image. Be thorough with the description and inclusions.';

            $response = Http::timeout(60)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={$apiKey}",
                [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt],
                                [
                                    'inline_data' => [
                                        'mime_type' => $mimeType,
                                        'data' => $base64Image
                                    ]
                                ]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.4,
                        'topK' => 32,
                        'topP' => 1,
                        'maxOutputTokens' => 1000,
                    ]
                ]
            );

            if ($response->failed()) {
                Log::error('Gemini API Error: ' . $response->body());
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to analyze image with Gemini AI.',
                    'error' => $response->json()['error']['message'] ?? 'Unknown error',
                ], 500);
            }

            $result = $response->json();
            $content = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';

            return $this->parseAndReturnResult($content);

        } catch (\Exception $e) {
            Log::error('Gemini Analysis Error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function analyzeWithOpenAI($base64Image, $mimeType, $apiKey)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(60)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o-mini',
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => 'Analyze this event package image/flyer and extract the following information in JSON format:
{
  "name": "package name",
  "description": "detailed description",
  "price": "price in numbers only (no currency symbols)",
  "capacity": "number of guests/people (numbers only, no text like \'pax\' or \'guests\')",
  "type": "one of: wedding, debut, birthday, pageant, corporate, anniversary, or other",
  "theme": "theme or style",
  "inclusions": "list of what\'s included, separated by newlines"
}

If you cannot find a specific field, leave it as an empty string. For capacity, extract only the numeric value. Extract as much information as possible from the image. Be thorough with the description and inclusions.',
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => "data:{$mimeType};base64,{$base64Image}",
                                ],
                            ],
                        ],
                    ],
                ],
                'max_tokens' => 1000,
            ]);

            if ($response->failed()) {
                Log::error('OpenAI API Error: ' . $response->body());
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to analyze image with OpenAI.',
                    'error' => $response->json()['error']['message'] ?? 'Unknown error',
                ], 500);
            }

            $result = $response->json();
            $content = $result['choices'][0]['message']['content'] ?? '';

            return $this->parseAndReturnResult($content);

        } catch (\Exception $e) {
            Log::error('OpenAI Analysis Error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function parseAndReturnResult($content)
    {
        // Extract JSON from the response (remove markdown code blocks if present)
        $content = preg_replace('/```json\s*/', '', $content);
        $content = preg_replace('/```\s*$/', '', $content);
        $content = trim($content);

        $extractedData = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('JSON Parse Error: ' . json_last_error_msg());
            Log::error('Content: ' . $content);
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse AI response.',
                'raw_content' => $content,
            ], 500);
        }

        return response()->json([
            'success' => true,
            'data' => $extractedData,
            'message' => 'Image analyzed successfully',
        ]);
    }
}

