<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Reminder</title>
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
        .reminder-banner {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        .reminder-banner h2 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .reminder-banner p {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
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
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .message {
            background-color: #fff3cd;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
            border-radius: 4px;
        }
        .cta-button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4a90e2;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .cta-button:hover {
            background-color: #357abd;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Event Reminder</h1>
        </div>

        <div class="content">
            <p>Dear {{ $client->client_fname }} {{ $client->client_lname }},</p>

            <div class="reminder-banner">
                <h2>
                    @if($reminderType === '1_week')
                        ⏰ Your Event is in 1 Week!
                    @else
                        🎉 Your Event is Tomorrow!
                    @endif
                </h2>
                <p>
                    @if($reminderType === '1_week')
                        Only {{ $daysUntilEvent }} days until your special day
                    @else
                        Your event is happening tomorrow!
                    @endif
                </p>
            </div>

            <p>We wanted to remind you about your upcoming event with Dreams Events. Here are the details:</p>

            <div class="booking-details">
                <h2>Event Details</h2>
                
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
                    <span class="detail-value">
                        <strong>{{ $booking->event_date->format('l, F d, Y') }}</strong>
                    </span>
                </div>

                @if($booking->event_time)
                <div class="detail-row">
                    <span class="detail-label">Event Time:</span>
                    <span class="detail-value">{{ \Carbon\Carbon::parse($booking->event_time)->format('g:i A') }}</span>
                </div>
                @endif

                <div class="detail-row">
                    <span class="detail-label">Event Venue:</span>
                    <span class="detail-value">{{ $booking->event_venue }}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Number of Guests:</span>
                    <span class="detail-value">{{ $booking->guest_count }}</span>
                </div>

                @if($booking->special_requests)
                <div class="detail-row">
                    <span class="detail-label">Special Requests:</span>
                    <span class="detail-value">{{ $booking->special_requests }}</span>
                </div>
                @endif
            </div>

            @if($reminderType === '1_week')
            <div class="message">
                <strong>📋 Preparation Checklist:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Confirm final guest count</li>
                    <li>Review event details and special requests</li>
                    <li>Prepare any additional items you'd like to bring</li>
                    <li>Contact us if you need to make any changes</li>
                </ul>
            </div>
            @else
            <div class="message">
                <strong>🎯 Final Reminders:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Double-check the event time and venue</li>
                    <li>Ensure all preparations are complete</li>
                    <li>Get a good night's rest!</li>
                    <li>Contact us immediately if you have any last-minute concerns</li>
                </ul>
            </div>
            @endif

            <p>If you have any questions or need to make changes to your booking, please don't hesitate to contact us as soon as possible.</p>

            <p>We're excited to help make your event unforgettable!</p>

            <p>Best regards,<br>
            <strong>The Dreams Events Team</strong></p>
        </div>

        <div class="footer">
            <p>This is an automated reminder email. Please do not reply directly to this message.</p>
            <p>&copy; {{ date('Y') }} Dreams Events. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

