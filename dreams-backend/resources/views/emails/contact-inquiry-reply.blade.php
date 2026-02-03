<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reply to Your Inquiry</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 640px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
        .container { background-color: #ffffff; padding: 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); }
        .header { text-align: center; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 3px solid #4a90e2; }
        .header h1 { color: #4a90e2; margin: 0; font-size: 26px; }
        .reply-message { background-color: #f9f9f9; padding: 18px; border-left: 4px solid #4a90e2; border-radius: 4px; margin: 18px 0; white-space: pre-wrap; }
        .details { background-color: #e3f2fd; padding: 18px; border-radius: 6px; margin: 18px 0; }
        .details-title { font-weight: 600; color: #4a90e2; margin-bottom: 12px; font-size: 14px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #b3d9ff; font-size: 14px; }
        .detail-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #666; }
        .value { color: #333; text-align: right; }
        .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reply from Dreams Events</h1>
        </div>

        <p>Hi {{ $inquiry->name ?? trim(($inquiry->first_name ?? '') . ' ' . ($inquiry->last_name ?? '')) }},</p>

        <p>Thank you for your inquiry. We're excited to help you with your event! Here's our response:</p>

        <div class="reply-message">
            {{ $replyMessage }}
        </div>

        <div class="details">
            <div class="details-title">Your Original Inquiry Details:</div>
            <div class="detail-row">
                <span class="label">Event Type</span>
                <span class="value">{{ $inquiry->event_type ?? 'N/A' }}</span>
            </div>
            @if($inquiry->date_of_event)
            <div class="detail-row">
                <span class="label">Preferred Date</span>
                <span class="value">{{ \Carbon\Carbon::parse($inquiry->date_of_event)->format('F d, Y') }}</span>
            </div>
            @endif
            <div class="detail-row">
                <span class="label">Preferred Venue</span>
                <span class="value">{{ $inquiry->preferred_venue ?? 'N/A' }}</span>
            </div>
            @if($inquiry->estimated_guests)
            <div class="detail-row">
                <span class="label">Estimated Guests</span>
                <span class="value">{{ $inquiry->estimated_guests }}</span>
            </div>
            @endif
            @if($inquiry->budget)
            <div class="detail-row">
                <span class="label">Budget</span>
                <span class="value">PHP {{ number_format($inquiry->budget, 2) }}</span>
            </div>
            @endif
            @if($inquiry->message)
            <div class="detail-row" style="flex-direction: column; align-items: flex-start;">
                <span class="label" style="margin-bottom: 4px;">Your Message</span>
                <span class="value" style="text-align: left; width: 100%;">{{ $inquiry->message }}</span>
            </div>
            @endif
        </div>

        <p>If you have any further questions or need to discuss your event in more detail, please feel free to reply to this email or contact us directly.</p>

        <p>Best regards,<br><strong>The Dreams Events Team</strong></p>

        <div class="footer">
            <p>&copy; {{ date('Y') }} Dreams Events. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

