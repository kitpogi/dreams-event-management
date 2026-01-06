<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContactInquiryConfirmationMail;
use App\Models\ContactInquiry;
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
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255', // For backward compatibility
            'first_name' => 'required_without:name|string|max:255',
            'last_name' => 'required_without:name|string|max:255',
            'email' => 'required|email|max:255',
            'mobile_number' => 'required|string|max:20',
            'event_type' => 'required|string|in:wedding,debut,birthday,pageant,corporate,anniversary,other',
            'date_of_event' => 'nullable|date',
            'preferred_venue' => 'required|string|max:255',
            'budget' => 'nullable|numeric|min:0',
            'estimated_guests' => 'nullable|integer|min:1',
            'message' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

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
    public function index()
    {
        try {
            // New inquiries: not marked as old, sorted by created_at desc (newest first)
            $newInquiries = ContactInquiry::where('is_old', false)
                ->orderBy('created_at', 'desc')
                ->get();

            // Old inquiries: marked as old, sorted by updated_at desc (recently updated first)
            $oldInquiries = ContactInquiry::where('is_old', true)
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'new_inquiries' => $newInquiries,
                    'old_inquiries' => $oldInquiries,
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

