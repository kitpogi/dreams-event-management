<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
            font-size: 14px;
            color: #555;
            line-height: 1.5;
        }

        .invoice-box {
            max-width: 800px;
            margin: auto;
            padding: 30px;
            border: 1px solid #eee;
            box-shadow: 0 0 10px rgba(0, 0, 0, .15);
        }

        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
        }

        .header h1 {
            color: #333;
            margin: 0;
        }

        .header .meta {
            text-align: right;
        }

        .client-info {
            margin-bottom: 30px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        table th {
            text-align: left;
            background: #f9f9f9;
            padding: 10px;
            border-bottom: 2px solid #ddd;
        }

        table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }

        .total {
            text-align: right;
            font-size: 18px;
            font-weight: bold;
            margin-top: 20px;
        }

        .footer {
            margin-top: 50px;
            font-size: 12px;
            text-align: center;
            color: #999;
        }
    </style>
</head>

<body>
    <div class="invoice-box">
        <div class="header">
            <div>
                <h1>INVOICE</h1>
                <h3>Dreams Event Management</h3>
            </div>
            <div class="meta">
                <p><strong>Invoice #:</strong> {{ $invoice->invoice_number }}</p>
                <p><strong>Date:</strong> {{ $invoice->issued_date->format('M d, Y') }}</p>
                <p><strong>Due Date:</strong> {{ $invoice->due_date->format('M d, Y') }}</p>
                <p><strong>Status:</strong> <span style="text-transform: uppercase;">{{ $invoice->status }}</span></p>
            </div>
        </div>

        <div class="client-info">
            <h4>Bill To:</h4>
            <p>{{ $client->first_name }} {{ $client->last_name }}</p>
            <p>{{ $client->email }}</p>
            <p>{{ $client->phone_number }}</p>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>{{ $booking->eventPackage->name ?? 'Event Booking' }}</strong><br>
                        Event Date: {{ $booking->event_date->format('M d, Y') }}<br>
                        Venue: {{ $booking->event_venue }}
                    </td>
                    <td style="text-align: right;">${{ number_format($invoice->amount, 2) }}</td>
                </tr>
            </tbody>
        </table>

        <div class="total">
            Total: ${{ number_format($invoice->amount, 2) }}
        </div>

        @if($invoice->notes)
            <div style="margin-top: 30px; font-style: italic;">
                <p>Notes: {{ $invoice->notes }}</p>
            </div>
        @endif

        <div class="footer">
            <p>Thank you for choosing Dreams Event Management!</p>
        </div>
    </div>
</body>

</html>