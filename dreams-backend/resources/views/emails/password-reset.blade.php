<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
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
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
            margin-bottom: 30px;
        }

        .content p {
            margin-bottom: 15px;
            font-size: 16px;
        }

        .button-container {
            text-align: center;
            margin: 30px 0;
        }

        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4a90e2;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
        }

        .button:hover {
            background-color: #357abd;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 14px;
        }

        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }

        .warning p {
            margin: 0;
            color: #856404;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <img src="{{ $message->embed(public_path('images/logo.png')) }}" alt="D'Dreams Event & Styles"
                style="width: 120px; height: auto; margin-bottom: 15px;">
            <h1>D'Dreams Event & Styles</h1>
        </div>

        <div class="content">
            <p>Hello,</p>

            <p>We received a request to reset your password for your D'Dreams Event & Styles account.</p>

            <p>Click the button below to reset your password:</p>

            <div class="button-container">
                <a href="{{ $resetUrl }}" class="button">Reset Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4a90e2;">{{ $resetUrl }}</p>

            <div class="warning">
                <p><strong>Important:</strong> This link will expire in 60 minutes. If you didn't request a password
                    reset, please ignore this email.</p>
            </div>

            <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; {{ date('Y') }} D'Dreams Event & Styles. All rights reserved.</p>
        </div>
    </div>
</body>

</html>