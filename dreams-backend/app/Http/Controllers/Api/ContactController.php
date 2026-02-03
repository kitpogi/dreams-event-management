<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContactInquiryConfirmationMail;
use App\Mail\ContactInquiryReplyMail;
use App\Models\ContactInquiry;
use App\Events\NewContactInquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ContactController extends Controller
{
    /**
     * Store a new contact inquiry
     */
    public function store(\App\Http\Requests\Contact\StoreContactRequest $request)
    {
        // Validation handled by FormRequest

        try {
            // Use name if provided, otherwise construct from first_name and last_name
            $name = $request->name ?? ($request->first_name . ' ' . $request->last_name);

            $inquiry = ContactInquiry::create([
                'name' => trim($name),
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'mobile_number' => $request->mobile_number,
                'event_type' => $request->event_type,
                'date_of_event' => $request->date_of_event,
                'preferred_venue' => $request->preferred_venue,
                'budget' => $request->budget,
                'estimated_guests' => $request->estimated_guests,
                'message' => $request->message,
                'status' => 'new',
            ]);

            // Send confirmation email to the client (best-effort; do not block response)
            if ($inquiry->email) {
                try {
                    Mail::to($inquiry->email)->send(new ContactInquiryConfirmationMail($inquiry));
                    Log::info('Contact inquiry confirmation email sent successfully', [
                        'inquiry_id' => $inquiry->id,
                        'email' => $inquiry->email
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send contact inquiry confirmation email', [
                        'inquiry_id' => $inquiry->id,
                        'email' => $inquiry->email,
                        'error' => $e->getMessage(),
                        'error_code' => $e->getCode(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

            // Optional: notify admin if configured
            $adminEmail = env('CONTACT_NOTIFY_EMAIL', env('MAIL_FROM_ADDRESS'));
            if ($adminEmail) {
                try {
                    Mail::to($adminEmail)->send(new ContactInquiryConfirmationMail($inquiry));
                    Log::info('Admin notification email sent successfully', [
                        'inquiry_id' => $inquiry->id,
                        'admin_email' => $adminEmail
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to notify admin of contact inquiry', [
                        'inquiry_id' => $inquiry->id,
                        'admin_email' => $adminEmail,
                        'error' => $e->getMessage(),
                        'error_code' => $e->getCode(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

            // Broadcast new inquiry event for real-time admin notifications
            try {
                broadcast(new NewContactInquiry([
                    'id' => $inquiry->id,
                    'name' => $inquiry->name,
                    'email' => $inquiry->email,
                    'event_type' => $inquiry->event_type,
                    'status' => $inquiry->status,
                    'created_at' => $inquiry->created_at->toISOString(),
                ]))->toOthers();
            } catch (\Exception $e) {
                Log::error('Failed to broadcast new inquiry event: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Thank you for your message! We will get back to you soon.',
                'data' => $inquiry
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit inquiry. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all contact inquiries (Admin only)
     */
    public function index(Request $request)
    {
        try {
            // New inquiries: not marked as old, sorted by created_at desc (newest first)
            $newInquiries = ContactInquiry::where('is_old', false)
                ->orderBy('created_at', 'desc')
                ->get();

            // Old inquiries: marked as old, with optional filtering and pagination
            $oldInquiriesQuery = ContactInquiry::where('is_old', true);

            // Apply status filter for old inquiries
            if ($request->has('old_status') && $request->old_status !== 'all') {
                $oldInquiriesQuery->where('status', $request->old_status);
            }

            // Apply date range filter for old inquiries
            if ($request->has('date_range')) {
                $dateRange = $request->date_range;
                $now = Carbon::now();
                
                switch ($dateRange) {
                    case '7days':
                        $oldInquiriesQuery->where('updated_at', '>=', $now->copy()->subDays(7));
                        break;
                    case '30days':
                        $oldInquiriesQuery->where('updated_at', '>=', $now->copy()->subDays(30));
                        break;
                    case '90days':
                        $oldInquiriesQuery->where('updated_at', '>=', $now->copy()->subDays(90));
                        break;
                    case '6months':
                        $oldInquiriesQuery->where('updated_at', '>=', $now->copy()->subMonths(6));
                        break;
                    case 'custom':
                        if ($request->has('date_from')) {
                            $oldInquiriesQuery->where('updated_at', '>=', Carbon::parse($request->date_from));
                        }
                        if ($request->has('date_to')) {
                            $oldInquiriesQuery->where('updated_at', '<=', Carbon::parse($request->date_to)->endOfDay());
                        }
                        break;
                    // 'all' or default: no date filter
                }
            }

            // Apply search filter
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $oldInquiriesQuery->where(function($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('event_type', 'like', "%{$search}%");
                });
            }

            // Get summary statistics for old inquiries (before pagination)
            $totalOldInquiries = (clone $oldInquiriesQuery)->count();
            $oldInquiriesByStatus = (clone $oldInquiriesQuery)
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            // Apply pagination if requested
            $perPage = $request->get('per_page', 25); // Default 25 per page
            $page = $request->get('page', 1);
            
            if ($request->has('paginate') && $request->paginate === 'true') {
                $oldInquiriesPaginated = $oldInquiriesQuery
                    ->orderBy('updated_at', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage, ['*'], 'page', $page);
                
                $oldInquiries = $oldInquiriesPaginated->items();
                $pagination = [
                    'current_page' => $oldInquiriesPaginated->currentPage(),
                    'last_page' => $oldInquiriesPaginated->lastPage(),
                    'per_page' => $oldInquiriesPaginated->perPage(),
                    'total' => $oldInquiriesPaginated->total(),
                    'from' => $oldInquiriesPaginated->firstItem(),
                    'to' => $oldInquiriesPaginated->lastItem(),
                ];
            } else {
                // No pagination - return all (for backward compatibility)
                $oldInquiries = $oldInquiriesQuery
                    ->orderBy('updated_at', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->get();
                $pagination = null;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'new_inquiries' => $newInquiries,
                    'old_inquiries' => $oldInquiries,
                    'old_inquiries_pagination' => $pagination,
                    'old_inquiries_stats' => [
                        'total' => $totalOldInquiries,
                        'by_status' => $oldInquiriesByStatus,
                    ],
                    // Keep backward compatibility
                    'all_inquiries' => ContactInquiry::orderBy('created_at', 'desc')->get()
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch inquiries',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update inquiry status (Admin only)
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:new,contacted,converted,closed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $inquiry = ContactInquiry::findOrFail($id);
            $oldStatus = $inquiry->status;
            $newStatus = $request->status;
            
            // If status is being changed, mark as old
            if ($oldStatus !== $newStatus) {
                $inquiry->is_old = true;
            }
            
            $inquiry->status = $newStatus;
            $inquiry->save();

            return response()->json([
                'success' => true,
                'message' => 'Inquiry status updated successfully',
                'data' => $inquiry
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update inquiry status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reply to a contact inquiry (Admin only)
     */
    public function reply(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'subject' => 'required|string|max:255',
                'message' => 'required|string|max:5000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $inquiry = ContactInquiry::findOrFail($id);

            // Send reply email via Gmail SMTP
            try {
                Mail::to($inquiry->email)->send(new ContactInquiryReplyMail($inquiry, $request->message, $request->subject));
                
                Log::info('Contact inquiry reply email sent successfully', [
                    'inquiry_id' => $inquiry->id,
                    'email' => $inquiry->email,
                    'subject' => $request->subject
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Reply sent successfully to ' . $inquiry->email,
                ], 200);
            } catch (\Exception $e) {
                Log::error('Failed to send contact inquiry reply email', [
                    'inquiry_id' => $inquiry->id,
                    'email' => $inquiry->email,
                    'error' => $e->getMessage(),
                    'error_code' => $e->getCode(),
                    'trace' => $e->getTraceAsString()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send reply email. Please try again.',
                    'error' => config('app.debug') ? $e->getMessage() : 'Email sending failed'
                ], 500);
            }
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Inquiry not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error in contact inquiry reply', [
                'inquiry_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your request',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Bulk delete contact inquiries (Admin only)
     * Only allows deletion of inquiries older than 90 days
     */
    public function bulkDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:contact_inquiries,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $ids = $request->ids;
            $ninetyDaysAgo = Carbon::now()->subDays(90);
            
            // Get inquiries and validate they are old enough
            $inquiries = ContactInquiry::whereIn('id', $ids)->get();
            
            $tooRecent = [];
            $canDelete = [];
            
            foreach ($inquiries as $inquiry) {
                $inquiryDate = Carbon::parse($inquiry->created_at);
                if ($inquiryDate->greaterThan($ninetyDaysAgo)) {
                    $tooRecent[] = $inquiry->id;
                } else {
                    $canDelete[] = $inquiry->id;
                }
            }

            if (!empty($tooRecent)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Some inquiries are too recent to delete. Only inquiries older than 90 days can be deleted.',
                    'too_recent_ids' => $tooRecent,
                    'can_delete_count' => count($canDelete)
                ], 400);
            }

            // Delete the inquiries
            $deletedCount = ContactInquiry::whereIn('id', $canDelete)->delete();

            Log::info('Bulk delete contact inquiries', [
                'deleted_count' => $deletedCount,
                'inquiry_ids' => $canDelete,
                'user_id' => $request->user()->id ?? null
            ]);

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$deletedCount} inquiry(ies)",
                'deleted_count' => $deletedCount
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to bulk delete contact inquiries', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete inquiries',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Export contact inquiries as CSV (admin only)
     */
    public function export(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $fileName = 'contact_inquiries_' . now()->format('Y_m_d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        $query = ContactInquiry::orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('event_type')) {
            $query->where('event_type', $request->event_type);
        }

        $columns = [
            'Inquiry ID',
            'Name',
            'Email',
            'Mobile Number',
            'Event Type',
            'Event Date',
            'Preferred Venue',
            'Budget',
            'Estimated Guests',
            'Status',
            'Message',
            'Created At',
        ];

        $callback = function () use ($query, $columns) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $columns);

            $query->chunk(500, function ($inquiries) use ($handle) {
                foreach ($inquiries as $inquiry) {
                    $name = $inquiry->name ?? trim(($inquiry->first_name ?? '') . ' ' . ($inquiry->last_name ?? ''));

                    fputcsv($handle, [
                        $inquiry->id,
                        $name,
                        $inquiry->email,
                        $inquiry->mobile_number,
                        $inquiry->event_type,
                        $inquiry->date_of_event ? Carbon::parse($inquiry->date_of_event)->toDateString() : '',
                        $inquiry->preferred_venue,
                        $inquiry->budget,
                        $inquiry->estimated_guests,
                        ucfirst($inquiry->status),
                        $inquiry->message,
                        $inquiry->created_at ? $inquiry->created_at->toDateTimeString() : '',
                    ]);
                }
            });

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}

