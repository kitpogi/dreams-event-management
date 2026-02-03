<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\BookingDetail;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use Carbon\Carbon;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // If client, return their booking invoices
        if ($user->role === 'client') {
            $invoices = Invoice::whereHas('booking', function ($query) use ($user) {
                $query->where('client_id', $user->client_id);
            })->with('booking')->orderBy('created_at', 'desc')->get();

            return response()->json(['status' => 'success', 'data' => $invoices]);
        }

        // If admin/coordinator, return all or filtered invoices
        // For now returning all for non-clients
        $invoices = Invoice::with(['booking.client'])->orderBy('created_at', 'desc')->get();
        return response()->json(['status' => 'success', 'data' => $invoices]);
    }

    public function show($id)
    {
        $invoice = Invoice::with(['booking.client', 'booking.eventPackage'])->findOrFail($id);

        // Check authorization (omitted for brevity, but should verify ownership)

        return response()->json(['status' => 'success', 'data' => $invoice]);
    }

    public function download($id)
    {
        $invoice = Invoice::with(['booking.client', 'booking.eventPackage'])->findOrFail($id);

        $data = [
            'invoice' => $invoice,
            'client' => $invoice->booking->client,
            'booking' => $invoice->booking,
        ];

        // Ensure you have a view at resources/views/invoices/pdf.blade.php
        $pdf = Pdf::loadView('invoices.pdf', $data);

        return $pdf->download('invoice-' . $invoice->invoice_number . '.pdf');
    }

    public function generate(Request $request, $bookingId)
    {
        $booking = BookingDetail::findOrFail($bookingId);

        // Check if invoice already exists
        $existingInvoice = Invoice::where('booking_id', $bookingId)->first();
        if ($existingInvoice) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invoice already exists for this booking',
                'data' => $existingInvoice
            ], 409);
        }

        $invoice = Invoice::create([
            'booking_id' => $booking->booking_id,
            'invoice_number' => 'INV-' . strtoupper(Str::random(8)), // Simple generation, can be better
            'amount' => $booking->total_amount,
            'status' => 'unpaid',
            'issued_date' => Carbon::now(),
            'due_date' => Carbon::now()->addDays(30), // Default 30 days due
            'notes' => $request->input('notes', 'Thank you for your business!'),
        ]);

        return response()->json(['status' => 'success', 'data' => $invoice], 201);
    }
}
