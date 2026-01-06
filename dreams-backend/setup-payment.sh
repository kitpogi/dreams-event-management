#!/bin/bash

# Payment Integration Setup Script
# This script helps you set up the payment integration

echo "🚀 Payment Integration Setup"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file first."
    exit 1
fi

echo "📋 Step 1: Checking PayMongo configuration..."
echo ""

# Check if PayMongo keys are set
if grep -q "PAYMONGO_SECRET_KEY=sk_test_xxxxx" .env || grep -q "PAYMONGO_SECRET_KEY=$" .env; then
    echo "⚠️  Warning: PayMongo keys not configured!"
    echo "Please update .env file with your PayMongo API keys."
    echo ""
    echo "Get your keys from: https://dashboard.paymongo.com/developers/api-keys"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to exit and configure keys first..."
else
    echo "✅ PayMongo keys found in .env"
fi

echo ""
echo "📋 Step 2: Running database migrations..."
echo ""

# Run migrations
php artisan migrate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations completed successfully!"
else
    echo ""
    echo "❌ Migration failed! Please check the error above."
    exit 1
fi

echo ""
echo "📋 Step 3: Verifying configuration..."
echo ""

# Check if config is cached
if [ -f bootstrap/cache/config.php ]; then
    echo "⚠️  Config is cached. Clearing cache..."
    php artisan config:clear
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Make sure your PayMongo API keys are set in .env"
echo "2. Start your backend server: php artisan serve"
echo "3. Test payment integration"
echo ""
echo "📚 Documentation: docs/PAYMENT_SETUP_GUIDE.md"
echo ""

