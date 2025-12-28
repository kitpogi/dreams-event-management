# Dreams Event Management System - Deployment Guide

This comprehensive guide will help you deploy the Dreams Event Management System to a production environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [Security Considerations](#security-considerations)
8. [Performance Optimization](#performance-optimization)
9. [Scheduled Tasks](#scheduled-tasks)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **PHP**: >= 8.1 with extensions:
  - BCMath
  - Ctype
  - cURL
  - DOM
  - Fileinfo
  - JSON
  - Mbstring
  - OpenSSL
  - PDO
  - Tokenizer
  - XML
  - GD (for image processing)
- **Composer**: Latest version
- **Node.js**: >= 18.x
- **npm** or **yarn**: Latest version
- **MySQL**: >= 8.0 or **MariaDB**: >= 10.3
- **Web Server**: Apache 2.4+ or Nginx 1.18+
- **SSL Certificate**: Required for production (Let's Encrypt recommended)

### Recommended Hosting

- **VPS/Cloud Server**: DigitalOcean, AWS, Linode, Vultr
- **Shared Hosting**: Not recommended (limited control)
- **Platform as a Service**: Laravel Forge, Ploi, Heroku (with modifications)

---

## Server Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 20GB SSD
- **Bandwidth**: 100GB/month

### Recommended Requirements

- **CPU**: 4+ cores
- **RAM**: 4GB+
- **Storage**: 50GB+ SSD
- **Bandwidth**: 500GB+/month

---

## Backend Deployment

### Step 1: Clone Repository

```bash
cd /var/www
git clone <your-repository-url> dreams-backend
cd dreams-backend
```

### Step 2: Install Dependencies

```bash
composer install --optimize-autoloader --no-dev
```

### Step 3: Environment Configuration

```bash
cp .env.example .env
php artisan key:generate
```

### Step 4: Configure Environment Variables

Edit `.env` file with production values (see [Environment Configuration](#environment-configuration) section).

### Step 5: Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/dreams-backend
sudo chmod -R 755 /var/www/dreams-backend
sudo chmod -R 775 /var/www/dreams-backend/storage
sudo chmod -R 775 /var/www/dreams-backend/bootstrap/cache
```

### Step 6: Run Migrations

```bash
php artisan migrate --force
```

**Note**: Use `--force` flag in production to skip confirmation prompts.

### Step 7: Optimize Application

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### Step 8: Create Storage Link

```bash
php artisan storage:link
```

### Step 9: Configure Web Server

#### For Nginx

Create `/etc/nginx/sites-available/dreams-backend`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/dreams-backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/dreams-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### For Apache

Create `/etc/apache2/sites-available/dreams-backend.conf`:

```apache
<VirtualHost *:80>
    ServerName api.yourdomain.com
    DocumentRoot /var/www/dreams-backend/public

    <Directory /var/www/dreams-backend/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/dreams-backend-error.log
    CustomLog ${APACHE_LOG_DIR}/dreams-backend-access.log combined
</VirtualHost>
```

Enable the site:

```bash
sudo a2ensite dreams-backend
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Step 10: SSL Configuration (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
# For Nginx
sudo certbot --nginx -d api.yourdomain.com

# For Apache
sudo certbot --apache -d api.yourdomain.com
```

---

## Frontend Deployment

### Step 1: Build for Production

```bash
cd dreams-frontend
npm install
npm run build
```

### Step 2: Deploy Build Files

#### Option A: Static Hosting (Recommended)

Deploy the `dist` folder to:

- **Netlify**: Drag and drop `dist` folder
- **Vercel**: Connect repository, set build command: `npm run build`, output directory: `dist`
- **Cloudflare Pages**: Similar to Vercel
- **AWS S3 + CloudFront**: Upload `dist` to S3 bucket, configure CloudFront

#### Option B: Same Server as Backend

```bash
# Copy build files to web server
sudo cp -r dist/* /var/www/dreams-frontend/

# Configure Nginx for frontend
```

Create `/etc/nginx/sites-available/dreams-frontend`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/dreams-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|png|svg|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 3: Environment Variables

Create `.env.production` in frontend root:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

Update build command to use production env:

```bash
npm run build -- --mode production
```

---

## Database Setup

### Step 1: Create Database

```sql
CREATE DATABASE dreamsdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dreams_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON dreamsdb.* TO 'dreams_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Run Migrations

```bash
php artisan migrate --force
```

### Step 3: Seed Initial Data (Optional)

```bash
php artisan db:seed --class=DatabaseSeeder
```

### Step 4: Create Admin User

```bash
php artisan tinker
```

```php
$user = \App\Models\User::create([
    'name' => 'Admin User',
    'email' => 'admin@dreamsevents.com',
    'password' => bcrypt('secure_password'),
    'role' => 'admin',
    'email_verified_at' => now(),
]);
```

---

## Environment Configuration

### Backend (.env)

```env
# Application
APP_NAME="Dreams Events"
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dreamsdb
DB_USERNAME=dreams_user
DB_PASSWORD=your_secure_password

# Cache (Use Redis for production)
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Session (Use Redis or database)
SESSION_DRIVER=redis
SESSION_LIFETIME=120

# Queue (Use Redis or database)
QUEUE_CONNECTION=redis

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Sanctum
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com

# Frontend URL (for password reset links)
FRONTEND_URL=https://yourdomain.com

# Cron Secret Token (for scheduled tasks)
CRON_SECRET_TOKEN=generate-random-secret-token-here

# Optional: AI Features
GEMINI_API_KEY=your_gemini_key_here
# OR
OPENAI_API_KEY=your_openai_key_here

# File Storage
FILESYSTEM_DISK=public
```

### Frontend (.env.production)

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## Security Considerations

### 1. Application Security

- ✅ Set `APP_DEBUG=false` in production
- ✅ Use strong `APP_KEY` (auto-generated)
- ✅ Enable HTTPS/SSL
- ✅ Configure CORS properly
- ✅ Use secure session driver (Redis/database)
- ✅ Enable rate limiting (already configured)

### 2. Database Security

- ✅ Use strong database passwords
- ✅ Restrict database user privileges
- ✅ Use SSL for database connections (if remote)
- ✅ Regular database backups

### 3. Server Security

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Disable root login (SSH)
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 4. File Permissions

```bash
# Secure storage and cache directories
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap/cache
```

### 5. Environment File Protection

```bash
# Ensure .env is not publicly accessible
# Add to .htaccess (Apache) or nginx config:
# Deny access to .env files
```

### 6. Rate Limiting

Rate limiting is already configured. Adjust limits in `app/Providers/RateLimitServiceProvider.php` if needed.

---

## Performance Optimization

### 1. Enable OPcache (PHP)

Edit `/etc/php/8.1/fpm/php.ini`:

```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
```

Restart PHP-FPM:

```bash
sudo systemctl restart php8.1-fpm
```

### 2. Use Redis for Caching

Install Redis:

```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

Update `.env`:

```env
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

### 3. Enable Gzip Compression (Nginx)

Add to nginx config:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 4. Image Optimization

Image optimization is already implemented:

- Automatic compression on upload
- Max dimensions: 1920x1080px
- Quality: 85%

### 5. CDN for Static Assets

Consider using CloudFlare or AWS CloudFront for:

- Frontend static assets
- Backend storage images

---

## Scheduled Tasks

### Option 1: Cron Job (Linux)

```bash
sudo crontab -e
```

Add:

```cron
* * * * * cd /var/www/dreams-backend && php artisan schedule:run >> /dev/null 2>&1
```

### Option 2: HTTP Endpoint (Recommended for shared hosting)

Configure a cron job to hit:

```
https://api.yourdomain.com/cron/send-reminders?token=your_cron_secret_token
```

See `CRON_ENDPOINT_SETUP.md` for details.

### Scheduled Tasks

- **Daily**: Send booking reminders (1 week and 1 day before events)
- **Daily**: Clean up expired password reset tokens (if implemented)

---

## Monitoring & Maintenance

### 1. Log Monitoring

```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/dreams-backend-error.log

# PHP-FPM logs
tail -f /var/log/php8.1-fpm.log
```

### 2. Database Backups

Create backup script `/usr/local/bin/backup-dreams-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/dreams"
mkdir -p $BACKUP_DIR
mysqldump -u dreams_user -p'password' dreamsdb > $BACKUP_DIR/dreamsdb_$DATE.sql
# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

Make executable:

```bash
sudo chmod +x /usr/local/bin/backup-dreams-db.sh
```

Add to crontab (daily at 2 AM):

```cron
0 2 * * * /usr/local/bin/backup-dreams-db.sh
```

### 3. Application Updates

```bash
# Pull latest code
git pull origin main

# Update dependencies
composer install --optimize-autoloader --no-dev
npm install && npm run build

# Run migrations
php artisan migrate --force

# Clear and recache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Re-optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 4. Health Checks

Create health check endpoint (already available):

```
GET https://api.yourdomain.com/up
```

Monitor with uptime services like:

- UptimeRobot
- Pingdom
- StatusCake

---

## Troubleshooting

### Common Issues

#### 1. 500 Internal Server Error

```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Check permissions
sudo chmod -R 775 storage bootstrap/cache

# Clear cache
php artisan config:clear
php artisan cache:clear
```

#### 2. Database Connection Error

- Verify database credentials in `.env`
- Check if database user has proper permissions
- Verify MySQL service is running: `sudo systemctl status mysql`

#### 3. CORS Errors

- Verify `CORS_ALLOWED_ORIGINS` in `.env` includes your frontend URL
- Clear config cache: `php artisan config:clear`

#### 4. Image Upload Fails

- Check storage permissions: `sudo chmod -R 775 storage`
- Verify `storage/app/public` exists
- Check PHP upload limits in `php.ini`:
  ```ini
  upload_max_filesize = 10M
  post_max_size = 10M
  ```

#### 5. Scheduled Tasks Not Running

- Verify cron job is set up correctly
- Check Laravel logs for schedule errors
- Test manually: `php artisan schedule:run`

#### 6. Rate Limiting Too Strict

- Adjust limits in `app/Providers/RateLimitServiceProvider.php`
- Clear config cache after changes

---

## Post-Deployment Checklist

- [ ] SSL certificate installed and working
- [ ] Environment variables configured correctly
- [ ] Database migrations completed
- [ ] Admin user created
- [ ] Storage link created (`php artisan storage:link`)
- [ ] File permissions set correctly
- [ ] CORS configured for frontend domain
- [ ] Sanctum stateful domains configured
- [ ] Email configuration tested
- [ ] Scheduled tasks configured
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Rate limiting tested
- [ ] Image upload tested
- [ ] Frontend API connection verified
- [ ] All features tested end-to-end

---

## Support & Resources

- **Laravel Documentation**: https://laravel.com/docs
- **React Documentation**: https://react.dev
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org

---

## Additional Notes

### Development vs Production

| Feature       | Development | Production |
| ------------- | ----------- | ---------- |
| APP_DEBUG     | true        | false      |
| APP_ENV       | local       | production |
| Cache         | file        | redis      |
| Session       | file        | redis      |
| Log Level     | debug       | error      |
| Error Display | enabled     | disabled   |

### Security Best Practices

1. Never commit `.env` files
2. Use strong passwords for all services
3. Keep software updated
4. Regular security audits
5. Use HTTPS everywhere
6. Implement proper backup strategy
7. Monitor logs regularly
8. Keep dependencies updated

---

**Last Updated**: December 2024
**Version**: 1.0
