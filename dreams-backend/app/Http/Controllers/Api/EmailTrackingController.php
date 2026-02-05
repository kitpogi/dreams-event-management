<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmailTrackingService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

/**
 * Controller for email tracking endpoints.
 */
class EmailTrackingController extends Controller
{
    public function __construct(
        protected EmailTrackingService $trackingService
    ) {}

    /**
     * Track email open via tracking pixel.
     *
     * @param string $trackingId
     * @return Response
     */
    public function trackOpen(string $trackingId): Response
    {
        // Remove .gif extension if present
        $trackingId = str_replace('.gif', '', $trackingId);

        $this->trackingService->trackOpened($trackingId);

        // Return a 1x1 transparent GIF
        $gif = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

        return response($gif, 200, [
            'Content-Type' => 'image/gif',
            'Content-Length' => strlen($gif),
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }

    /**
     * Track email link click and redirect.
     *
     * @param Request $request
     * @param string $trackingId
     * @return \Illuminate\Http\RedirectResponse
     */
    public function trackClick(Request $request, string $trackingId)
    {
        $encodedUrl = $request->query('url');

        if (!$encodedUrl) {
            abort(400, 'Missing URL parameter');
        }

        $originalUrl = base64_decode($encodedUrl);

        if (!filter_var($originalUrl, FILTER_VALIDATE_URL)) {
            abort(400, 'Invalid URL');
        }

        $this->trackingService->trackClicked($trackingId, $originalUrl);

        return redirect()->away($originalUrl);
    }

    /**
     * Get email statistics (admin only).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStatistics(Request $request)
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $stats = $this->trackingService->getStatistics(
            $request->query('type'),
            $request->query('start_date'),
            $request->query('end_date')
        );

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get email logs (admin only).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLogs(Request $request)
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $filters = $request->only(['type', 'status', 'recipient', 'start_date', 'end_date']);
        $limit = min((int) $request->query('limit', 100), 500);

        $logs = $this->trackingService->getLogs($filters, $limit);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    /**
     * Get statistics by email type (admin only).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStatsByType(Request $request)
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $stats = $this->trackingService->getStatsByType();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get daily statistics (admin only).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDailyStats(Request $request)
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $days = min((int) $request->query('days', 30), 90);
        $stats = $this->trackingService->getDailyStats($days);

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Retry a failed email (admin only).
     *
     * @param Request $request
     * @param string $trackingId
     * @return \Illuminate\Http\JsonResponse
     */
    public function retry(Request $request, string $trackingId)
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $success = $this->trackingService->retry($trackingId);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Email retry scheduled' : 'Unable to retry email',
        ]);
    }

    /**
     * Handle webhook from email service provider (for bounces, etc.).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function handleWebhook(Request $request)
    {
        $eventType = $request->input('event_type');
        $trackingId = $request->input('tracking_id');

        if (!$trackingId) {
            return response()->json(['message' => 'Missing tracking ID'], 400);
        }

        switch ($eventType) {
            case 'delivered':
                // Mark as delivered
                $log = $this->trackingService->getByTrackingId($trackingId);
                if ($log) {
                    $log->update(['status' => 'delivered']);
                }
                break;

            case 'bounced':
            case 'bounce':
                $this->trackingService->trackBounced(
                    $trackingId,
                    $request->input('bounce_type', 'unknown'),
                    $request->input('message')
                );
                break;

            case 'complained':
            case 'spam':
                $this->trackingService->trackBounced(
                    $trackingId,
                    'complaint',
                    $request->input('message')
                );
                break;

            default:
                // Log unknown event
                Log::debug('Unknown email webhook event', [
                    'event_type' => $eventType,
                    'tracking_id' => $trackingId,
                ]);
        }

        return response()->json(['success' => true]);
    }
}
