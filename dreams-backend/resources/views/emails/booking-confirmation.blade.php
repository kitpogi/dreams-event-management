<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #4a90e2;
        }
        .header h1 {
            color: #4a90e2;
            margin: 0;
            font-size: 28px;
        }
        .content {
            margin: 20px 0;
        }
        .booking-details {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .booking-details h2 {
            color: #4a90e2;
            margin-top: 0;
            font-size: 20px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: bold;
            color: #666;
        }
        .detail-value {
            color: #333;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
        }
        .status-pending {
            background-color: #ffc107;
            color: #333;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .message {
            background-color: #e3f2fd;
            padding: 15px;
            border-left: 4px solid #4a90e2;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Booking Confirmation</h1>
        </div>

        <div class="content">
            <p>Dear {{ $client->client_fname }} {{ $client->client_lname }},</p>

            <p>Thank you for choosing Dreams Events! We have successfully received your booking request.</p>

            <div class="message">
                <strong>Your booking is currently pending review.</strong> Our team will review your request and get back to you soon. You will receive an email notification once your booking status is updated.
            </div>

            <div class="booking-details">
                <h2>Booking Details</h2>
                
                <div class="detail-row">
                    <span class="detail-label">Booking ID:</span>
                    <span class="detail-value">#{{ $booking->booking_id }}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Package:</span>
                    <span class="detail-value">{{ $package->package_name ?? 'N/A' }}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Event Date:</span>
                    <span class="detail-value">{{ $booking->event_date->format('F d, Y') }}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Event Venue:</span>
                    <span class="detail-value">{{ $booking->event_venue }}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Number of Guests:</span>
                    <span class="detail-value">{{ $booking->guest_count }}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">
                        <span class="status-badge status-pending">{{ $booking->booking_status }}</span>
                    </span>
                </div>

                @if($booking->special_requests)
                <div class="detail-row">
                    <span class="detail-label">Special Requests:</span>
                    <span class="detail-value">{{ $booking->special_requests }}</span>
                </div>
                @endif
            </div>

            <p>If you have any questions or need to make changes to your booking, please don't hesitate to contact us.</p>

            <p>We look forward to making your event unforgettable!</p>

            <p>Best regards,<br>
            <strong>The Dreams Events Team</strong></p>
        </div>

        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
            <p>&copy; {{ date('Y') }} Dreams Events. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

