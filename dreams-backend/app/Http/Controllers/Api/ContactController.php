<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactInquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
            $inquiries = ContactInquiry::orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $inquiries
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
            $inquiry->status = $request->status;
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
}

