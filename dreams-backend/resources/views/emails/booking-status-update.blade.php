<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Status Update</title>
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
        .status-update {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
        .status-change {
            font-size: 18px;
            margin: 10px 0;
        }
        .status-arrow {
            color: #666;
            margin: 0 10px;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 16px;
        }
        .status-pending {
            background-color: #ffc107;
            color: #333;
        }
        .status-approved {
            background-color: #28a745;
            color: #fff;
        }
        .status-completed {
            background-color: #17a2b8;
            color: #fff;
        }
        .status-cancelled {
            background-color: #dc3545;
            color: #fff;
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
        .message {
            background-color: #e3f2fd;
            padding: 15px;
            border-left: 4px solid #4a90e2;
            margin: 20px 0;
            border-radius: 4px;
        }
        .message.approved {
            background-color: #d4edda;
            border-left-color: #28a745;
        }
        .message.completed {
            background-color: #d1ecf1;
            border-left-color: #17a2b8;
        }
        .message.cancelled {
            background-color: #f8d7da;
            border-left-color: #dc3545;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Booking Status Update</h1>
        </div>

        <div class="content">
            <p>Dear {{ $client->client_fname }} {{ $client->client_lname }},</p>

            <p>We are writing to inform you that your booking status has been updated.</p>

            <div class="status-update">
                <div class="status-change">
                    <span class="status-badge status-{{ strtolower($oldStatus) }}">{{ $oldStatus }}</span>
                    <span class="status-arrow">→</span>
                    <span class="status-badge status-{{ strtolower($newStatus) }}">{{ $newStatus }}</span>
                </div>
            </div>

            @if($newStatus === 'Approved')
            <div class="message approved">
                <strong>🎉 Great News! Your booking has been approved!</strong><br>
                Your event is now confirmed. We're excited to help make your event a success. Our team will be in touch with you soon to discuss the next steps and finalize the details.
            </div>
            @elseif($newStatus === 'Completed')
            <div class="message completed">
                <strong>✨ Event Completed!</strong><br>
                We hope your event was everything you dreamed of! Thank you for choosing Dreams Events. We'd love to hear about your experience and would appreciate any feedback you can provide.
            </div>
            @elseif($newStatus === 'Cancelled')
            <div class="message cancelled">
                <strong>Booking Cancelled</strong><br>
                Your booking has been cancelled. If you have any questions or would like to reschedule, please don't hesitate to contact us. We're here to help.
            </div>
            @else
            <div class="message">
                <strong>Status Updated</strong><br>
                Your booking status has been changed. If you have any questions, please feel free to contact us.
            </div>
            @endif

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
                    <span class="detail-label">Current Status:</span>
                    <span class="detail-value">
                        <span class="status-badge status-{{ strtolower($newStatus) }}">{{ $newStatus }}</span>
                    </span>
                </div>

                @if($booking->special_requests)
                <div class="detail-row">
                    <span class="detail-label">Special Requests:</span>
                    <span class="detail-value">{{ $booking->special_requests }}</span>
                </div>
                @endif
            </div>

            <p>If you have any questions or concerns about this status update, please don't hesitate to contact us.</p>

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

