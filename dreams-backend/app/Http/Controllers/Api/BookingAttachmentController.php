<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BookingDetail;
use App\Services\ImageService;
use App\Services\ClientService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class BookingAttachmentController extends Controller
{
    /**
     * Upload mood board/inspiration photos for a booking
     */
    public function upload(Request $request, $bookingId)
    {
        $request->validate([
            'files' => 'required|array|min:1|max:10',
            'files.*' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max per file
        ]);

        $booking = BookingDetail::findOrFail($bookingId);

        // Check authorization - client can only upload to their own bookings
        if (!$request->user()->isAdmin() && !$request->user()->isCoordinator()) {
            $clientService = app(ClientService::class);
            $client = $clientService->getByUserEmail($request->user()->email);
            
            if (!$client || $booking->client_id !== $client->client_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $imageService = app(ImageService::class);
        $uploadedFiles = [];
        $errors = [];

        foreach ($request->file('files') as $file) {
            try {
                $path = $imageService->processAndStore(
                    $file,
                    'bookings/mood-boards',
                    1920, // max width
                    1080, // max height
                    85    // quality
                );
                
                $uploadedFiles[] = [
                    'path' => $path,
                    'url' => asset('storage/' . $path),
                    'original_name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'uploaded_at' => now()->toISOString(),
                ];
            } catch (\Exception $e) {
                Log::error('Error uploading mood board file: ' . $e->getMessage());
                $errors[] = $file->getClientOriginalName() . ': ' . $e->getMessage();
            }
        }

        if (empty($uploadedFiles)) {
            return response()->json([
                'message' => 'Failed to upload files',
                'errors' => $errors,
            ], 422);
        }

        // Get existing mood board files
        $existingFiles = $booking->mood_board ?? [];
        if (!is_array($existingFiles)) {
            $existingFiles = [];
        }

        // Merge with new files
        $allFiles = array_merge($existingFiles, $uploadedFiles);

        // Update booking
        $booking->mood_board = $allFiles;
        $booking->save();

        return response()->json([
            'message' => 'Files uploaded successfully',
            'data' => [
                'uploaded' => $uploadedFiles,
                'total_files' => count($allFiles),
                'errors' => $errors,
            ],
        ], 201);
    }

    /**
     * Delete a mood board file
     */
    public function delete(Request $request, $bookingId, $fileIndex)
    {
        $booking = BookingDetail::findOrFail($bookingId);

        // Check authorization
        if (!$request->user()->isAdmin() && !$request->user()->isCoordinator()) {
            $clientService = app(ClientService::class);
            $client = $clientService->getByUserEmail($request->user()->email);
            
            if (!$client || $booking->client_id !== $client->client_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $moodBoard = $booking->mood_board ?? [];
        if (!is_array($moodBoard) || !isset($moodBoard[$fileIndex])) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $file = $moodBoard[$fileIndex];

        // Delete physical file
        if (isset($file['path'])) {
            $filePath = str_replace(asset('storage/'), '', $file['url'] ?? '');
            if ($filePath && Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }
        }

        // Remove from array
        unset($moodBoard[$fileIndex]);
        $moodBoard = array_values($moodBoard); // Re-index array

        // Update booking
        $booking->mood_board = $moodBoard;
        $booking->save();

        return response()->json([
            'message' => 'File deleted successfully',
            'data' => [
                'remaining_files' => count($moodBoard),
            ],
        ]);
    }

    /**
     * Get all mood board files for a booking
     */
    public function index(Request $request, $bookingId)
    {
        $booking = BookingDetail::findOrFail($bookingId);

        // Check authorization
        if (!$request->user()->isAdmin() && !$request->user()->isCoordinator()) {
            $clientService = app(ClientService::class);
            $client = $clientService->getByUserEmail($request->user()->email);
            
            if (!$client || $booking->client_id !== $client->client_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $moodBoard = $booking->mood_board ?? [];
        if (!is_array($moodBoard)) {
            $moodBoard = [];
        }

        return response()->json([
            'data' => $moodBoard,
            'total' => count($moodBoard),
        ]);
    }
}
