<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WebhookService;
use Illuminate\Http\Request;

/**
 * Controller for webhook management endpoints.
 */
class WebhookController extends Controller
{
    public function __construct(
        protected WebhookService $webhookService
    ) {}

    /**
     * List all registered webhooks.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $webhooks = $this->webhookService->getAllWebhooks();

        return response()->json([
            'success' => true,
            'data' => $webhooks,
            'meta' => [
                'available_events' => WebhookService::EVENTS,
            ],
        ]);
    }

    /**
     * Register a new webhook.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'url' => 'required|url|max:500',
            'events' => 'required|array|min:1',
            'events.*' => 'string|in:' . implode(',', WebhookService::EVENTS),
            'secret' => 'nullable|string|min:16|max:64',
        ]);

        try {
            $webhook = $this->webhookService->register(
                $request->input('url'),
                $request->input('events'),
                $request->input('secret')
            );

            return response()->json([
                'success' => true,
                'message' => 'Webhook registered successfully',
                'data' => $webhook,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get webhook details.
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id)
    {
        $webhook = \App\Models\Webhook::find($id);

        if (!$webhook) {
            return response()->json([
                'success' => false,
                'message' => 'Webhook not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $webhook->id,
                'url' => $webhook->url,
                'events' => $webhook->events,
                'is_active' => $webhook->is_active,
                'created_at' => $webhook->created_at->toIso8601String(),
                'updated_at' => $webhook->updated_at->toIso8601String(),
                'delivery_stats' => $webhook->getDeliveryStats(),
            ],
        ]);
    }

    /**
     * Update a webhook.
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'url' => 'sometimes|url|max:500',
            'events' => 'sometimes|array|min:1',
            'events.*' => 'string|in:' . implode(',', WebhookService::EVENTS),
            'is_active' => 'sometimes|boolean',
        ]);

        try {
            $webhook = $this->webhookService->updateWebhook($id, $request->only(['url', 'events', 'is_active']));

            return response()->json([
                'success' => true,
                'message' => 'Webhook updated successfully',
                'data' => $webhook,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Webhook not found',
            ], 404);
        }
    }

    /**
     * Delete a webhook.
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(string $id)
    {
        $success = $this->webhookService->unregister($id);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Webhook not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Webhook deleted successfully',
        ]);
    }

    /**
     * Test a webhook.
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function test(string $id)
    {
        try {
            $result = $this->webhookService->testWebhook($id);

            return response()->json([
                'success' => true,
                'message' => $result['success'] ? 'Webhook test successful' : 'Webhook test failed',
                'data' => $result,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Webhook not found',
            ], 404);
        }
    }

    /**
     * Get webhook delivery logs.
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deliveries(Request $request, string $id)
    {
        $limit = min((int) $request->query('limit', 50), 200);
        $logs = $this->webhookService->getDeliveryLogs($id, $limit);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    /**
     * Retry a failed webhook delivery.
     *
     * @param string $deliveryId
     * @return \Illuminate\Http\JsonResponse
     */
    public function retryDelivery(string $deliveryId)
    {
        $success = $this->webhookService->retryDelivery($deliveryId);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Delivery retry initiated' : 'Unable to retry delivery',
        ]);
    }
}
