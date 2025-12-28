# API Response Caching

This document describes the API response caching implementation for the Dreams Event Management System.

## Overview

API response caching is implemented to improve performance by reducing database queries and response times for frequently accessed data. The system uses Laravel's built-in caching system with configurable cache drivers.

## Cached Endpoints

### 1. Packages

**Endpoint:** `GET /api/packages`

- **Cache Duration:** 15 minutes
- **Cache Key:** `packages_{md5_hash_of_parameters}`
- **Caching Strategy:** Only caches when no search/filter parameters are provided (to avoid cache bloat)
- **Cache Invalidation:** Cleared on package create/update/delete

**Endpoint:** `GET /api/packages/{id}`

- **Cache Duration:** 30 minutes
- **Cache Key:** `package_{id}_details`
- **Cache Invalidation:** Cleared when package is updated or deleted, or when reviews are added/updated/deleted

### 2. Venues

**Endpoint:** `GET /api/venues`

- **Cache Duration:** 1 hour (3600 seconds)
- **Cache Key:** `venues_all`
- **Cache Invalidation:** Cleared on venue create/update/delete

### 3. Testimonials

**Endpoint:** `GET /api/testimonials`

- **Cache Duration:** 1 hour
- **Cache Key:** `testimonials_{md5_hash_of_parameters}`
- **Cache Invalidation:** Cleared on testimonial create/update/delete

### 4. Portfolio Items

**Endpoint:** `GET /api/portfolio-items`

- **Cache Duration:** 1 hour
- **Cache Key:** `portfolio_{md5_hash_of_parameters}`
- **Caching Strategy:** Only caches when no search/filter parameters are provided
- **Cache Invalidation:** Cleared on portfolio item create/update/delete

### 5. Reviews

**Endpoint:** `GET /api/packages/{packageId}/reviews`

- **Cache Duration:** 30 minutes
- **Cache Key:** `package_{packageId}_reviews`
- **Cache Invalidation:** Cleared when reviews are created/updated/deleted for that package

## Cache Configuration

### Cache Driver

The cache driver is configured in `.env`:

```env
CACHE_DRIVER=redis  # Recommended for production
# or
CACHE_DRIVER=file   # For development
# or
CACHE_DRIVER=database  # Alternative for production
```

### Recommended Setup

**For Production:**

- Use **Redis** for best performance
- Use **Database** cache driver if Redis is not available

**For Development:**

- Use **File** cache driver (default)

## Cache Invalidation Strategy

### Automatic Invalidation

Cache is automatically cleared when:

1. **Packages:**

   - Package created → Clears all package caches
   - Package updated → Clears package details and list caches
   - Package deleted → Clears package details and list caches
   - Review added/updated/deleted → Clears package details and reviews cache

2. **Venues:**

   - Venue created/updated/deleted → Clears venues cache

3. **Testimonials:**

   - Testimonial created/updated/deleted → Clears testimonials cache

4. **Portfolio:**

   - Portfolio item created/updated/deleted → Clears portfolio cache

5. **Reviews:**
   - Review created/updated/deleted → Clears package reviews and package details cache

### Manual Cache Clearing

To manually clear all caches:

```bash
php artisan cache:clear
```

To clear specific cache:

```php
Cache::forget('cache_key_here');
```

## Cache Key Naming Convention

Cache keys follow this pattern:

- **List endpoints:** `{resource}_{md5_hash_of_parameters}`
- **Detail endpoints:** `{resource}_{id}_{type}`
- **Static lists:** `{resource}_all`

Examples:

- `packages_abc123def456` (packages list with specific filters)
- `package_1_details` (package details)
- `venues_all` (all venues)
- `package_1_reviews` (reviews for package 1)

## Performance Benefits

### Before Caching

- Every request hits the database
- Response time: 50-200ms (depending on query complexity)
- Database load: High

### After Caching

- Cached requests served from memory/cache
- Response time: 5-20ms (cache hit)
- Database load: Significantly reduced

### Expected Improvements

- **Response Time:** 70-90% reduction for cached endpoints
- **Database Queries:** 80-95% reduction for frequently accessed data
- **Server Load:** 60-80% reduction
- **Scalability:** Better handling of traffic spikes

## Cache Warming

Cache warming is not implemented by default, but can be added if needed. To warm caches:

```bash
php artisan tinker
```

```php
// Warm packages cache
$packages = \App\Models\EventPackage::with('venue')->get();

// Warm venues cache
$venues = \App\Models\Venue::all();

// Warm testimonials cache
$testimonials = \App\Models\Testimonial::where('is_featured', true)->get();
```

## Monitoring Cache Performance

### Check Cache Hit Rate

Monitor your cache driver's hit rate:

**Redis:**

```bash
redis-cli INFO stats
```

**File Cache:**
Check cache file access times in `storage/framework/cache/data/`

### Laravel Debugbar

If using Laravel Debugbar in development, you can see cache operations in the "Cache" tab.

## Troubleshooting

### Cache Not Working

1. **Check cache driver:**

   ```bash
   php artisan config:show cache
   ```

2. **Clear config cache:**

   ```bash
   php artisan config:clear
   ```

3. **Verify cache driver is installed:**
   - Redis: `php -m | grep redis`
   - Database: Ensure cache table exists

### Stale Data

If you see stale data:

1. Clear cache manually:

   ```bash
   php artisan cache:clear
   ```

2. Check cache TTL settings in controllers

3. Verify cache invalidation is working on create/update/delete

### High Memory Usage (Redis)

If using Redis and experiencing high memory:

1. Set max memory policy:

   ```redis
   CONFIG SET maxmemory-policy allkeys-lru
   ```

2. Monitor memory:
   ```bash
   redis-cli INFO memory
   ```

## Best Practices

1. **Cache Duration:**

   - Static data (venues): 1 hour or more
   - Frequently changing data (packages): 15-30 minutes
   - User-specific data: Don't cache or use short TTL

2. **Cache Keys:**

   - Use descriptive, unique keys
   - Include relevant parameters in key hash
   - Avoid cache key collisions

3. **Cache Invalidation:**

   - Always clear cache on data mutations
   - Clear related caches (e.g., package details when reviews change)
   - Use cache tags if available (Redis supports tags)

4. **Monitoring:**
   - Monitor cache hit rates
   - Set up alerts for low hit rates
   - Track cache memory usage

## Future Enhancements

Potential improvements:

1. **Cache Tags:** Use Redis cache tags for more efficient invalidation
2. **Cache Warming:** Pre-populate cache on deployment
3. **Conditional Caching:** Cache based on request headers (e.g., don't cache for admins)
4. **CDN Integration:** Use CDN for static API responses
5. **HTTP Caching:** Add ETags and Last-Modified headers for browser caching

---

**Last Updated:** December 2024
**Version:** 1.0
