<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\HttpCacheService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Mockery;

class HttpCacheServiceTest extends TestCase
{
    protected HttpCacheService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new HttpCacheService();
        Cache::flush();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function strategy_constants_are_defined()
    {
        $this->assertEquals('public', HttpCacheService::STRATEGY_PUBLIC);
        $this->assertEquals('private', HttpCacheService::STRATEGY_PRIVATE);
        $this->assertEquals('no-cache', HttpCacheService::STRATEGY_NO_CACHE);
        $this->assertEquals('no-store', HttpCacheService::STRATEGY_NO_STORE);
    }

    /** @test */
    public function it_marks_get_requests_as_cacheable()
    {
        $request = Request::create('/api/packages', 'GET');
        
        $this->assertTrue($this->service->isCacheable($request));
    }

    /** @test */
    public function it_marks_head_requests_as_cacheable()
    {
        $request = Request::create('/api/packages', 'HEAD');
        
        $this->assertTrue($this->service->isCacheable($request));
    }

    /** @test */
    public function it_marks_post_requests_as_not_cacheable()
    {
        $request = Request::create('/api/packages', 'POST');
        
        $this->assertFalse($this->service->isCacheable($request));
    }

    /** @test */
    public function it_marks_put_requests_as_not_cacheable()
    {
        $request = Request::create('/api/packages/1', 'PUT');
        
        $this->assertFalse($this->service->isCacheable($request));
    }

    /** @test */
    public function it_marks_delete_requests_as_not_cacheable()
    {
        $request = Request::create('/api/packages/1', 'DELETE');
        
        $this->assertFalse($this->service->isCacheable($request));
    }

    /** @test */
    public function it_excludes_auth_routes()
    {
        $request = Request::create('/api/auth/login', 'GET');
        
        $this->assertFalse($this->service->isCacheable($request));
    }

    /** @test */
    public function it_excludes_user_routes()
    {
        $request = Request::create('/api/user/profile', 'GET');
        
        $this->assertFalse($this->service->isCacheable($request));
    }

    /** @test */
    public function it_excludes_admin_routes()
    {
        $request = Request::create('/api/admin/users', 'GET');
        
        $this->assertFalse($this->service->isCacheable($request));
    }

    /** @test */
    public function it_excludes_webhook_routes()
    {
        $request = Request::create('/api/webhook/payment', 'GET');
        
        $this->assertFalse($this->service->isCacheable($request));
    }

    /** @test */
    public function it_respects_no_cache_header()
    {
        $request = Request::create('/api/packages', 'GET');
        $request->headers->set('Cache-Control', 'no-cache');
        
        $this->assertFalse($this->service->isCacheable($request));
    }

    /** @test */
    public function it_generates_consistent_cache_keys()
    {
        $request1 = Request::create('/api/packages', 'GET', ['page' => 1, 'limit' => 10]);
        $request2 = Request::create('/api/packages', 'GET', ['limit' => 10, 'page' => 1]);
        
        $key1 = $this->service->generateCacheKey($request1);
        $key2 = $this->service->generateCacheKey($request2);
        
        $this->assertEquals($key1, $key2);
    }

    /** @test */
    public function it_generates_different_keys_for_different_paths()
    {
        $request1 = Request::create('/api/packages', 'GET');
        $request2 = Request::create('/api/venues', 'GET');
        
        $key1 = $this->service->generateCacheKey($request1);
        $key2 = $this->service->generateCacheKey($request2);
        
        $this->assertNotEquals($key1, $key2);
    }

    /** @test */
    public function it_generates_different_keys_for_different_params()
    {
        $request1 = Request::create('/api/packages', 'GET', ['page' => 1]);
        $request2 = Request::create('/api/packages', 'GET', ['page' => 2]);
        
        $key1 = $this->service->generateCacheKey($request1);
        $key2 = $this->service->generateCacheKey($request2);
        
        $this->assertNotEquals($key1, $key2);
    }

    /** @test */
    public function it_generates_etag()
    {
        $content = 'Test content';
        $etag = $this->service->generateEtag($content);
        
        $this->assertStringStartsWith('"', $etag);
        $this->assertStringEndsWith('"', $etag);
        $this->assertEquals(34, strlen($etag)); // md5 hash + quotes
    }

    /** @test */
    public function it_generates_weak_etag()
    {
        $content = 'Test content';
        $etag = $this->service->generateWeakEtag($content);
        
        $this->assertStringStartsWith('W/"', $etag);
        $this->assertStringEndsWith('"', $etag);
    }

    /** @test */
    public function it_validates_matching_etag()
    {
        $content = 'Test content';
        $etag = $this->service->generateEtag($content);
        
        $request = Request::create('/api/packages', 'GET');
        $request->headers->set('If-None-Match', $etag);
        
        $this->assertTrue($this->service->hasValidEtag($request, $etag));
    }

    /** @test */
    public function it_validates_wildcard_etag()
    {
        $request = Request::create('/api/packages', 'GET');
        $request->headers->set('If-None-Match', '*');
        
        $this->assertTrue($this->service->hasValidEtag($request, '"any-etag"'));
    }

    /** @test */
    public function it_rejects_non_matching_etag()
    {
        $request = Request::create('/api/packages', 'GET');
        $request->headers->set('If-None-Match', '"different-etag"');
        
        $this->assertFalse($this->service->hasValidEtag($request, '"my-etag"'));
    }

    /** @test */
    public function it_handles_multiple_etags()
    {
        $request = Request::create('/api/packages', 'GET');
        $request->headers->set('If-None-Match', '"etag1", "etag2", "etag3"');
        
        $this->assertTrue($this->service->hasValidEtag($request, '"etag2"'));
    }

    /** @test */
    public function it_validates_last_modified()
    {
        $lastModified = new \DateTime('2024-01-01 12:00:00');
        
        $request = Request::create('/api/packages', 'GET');
        $request->headers->set('If-Modified-Since', 'Mon, 01 Jan 2024 13:00:00 GMT');
        
        $this->assertTrue($this->service->hasValidLastModified($request, $lastModified));
    }

    /** @test */
    public function it_rejects_older_last_modified()
    {
        $lastModified = new \DateTime('2024-01-02 12:00:00');
        
        $request = Request::create('/api/packages', 'GET');
        $request->headers->set('If-Modified-Since', 'Mon, 01 Jan 2024 12:00:00 GMT');
        
        $this->assertFalse($this->service->hasValidLastModified($request, $lastModified));
    }

    /** @test */
    public function it_stores_and_retrieves_response()
    {
        $response = new Response('{"data": "test"}', 200);
        $key = 'test_cache_key';
        
        $this->service->store($key, $response, 300);
        $cached = $this->service->getCached($key);
        
        $this->assertNotNull($cached);
        $this->assertEquals('{"data": "test"}', $cached['content']);
        $this->assertEquals(200, $cached['status']);
        $this->assertArrayHasKey('etag', $cached);
    }

    /** @test */
    public function it_returns_null_for_cache_miss()
    {
        $cached = $this->service->getCached('nonexistent_key');
        
        $this->assertNull($cached);
    }

    /** @test */
    public function it_builds_cached_response()
    {
        $cached = [
            'content' => '{"data": "test"}',
            'headers' => ['Content-Type' => ['application/json']],
            'status' => 200,
            'etag' => '"test-etag"',
            'cached_at' => time() - 60,
        ];
        
        $response = $this->service->buildCachedResponse($cached);
        
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('{"data": "test"}', $response->getContent());
        $this->assertEquals('HIT', $response->headers->get('X-Cache'));
        $this->assertGreaterThanOrEqual(60, $response->headers->get('X-Cache-Age'));
    }

    /** @test */
    public function it_applies_public_cache_headers()
    {
        $response = new Response('content');
        
        $result = $this->service->applyCacheHeaders(
            $response,
            HttpCacheService::STRATEGY_PUBLIC,
            3600
        );
        
        $this->assertStringContainsString('public', $result->headers->get('Cache-Control'));
        $this->assertStringContainsString('max-age=3600', $result->headers->get('Cache-Control'));
        $this->assertNotNull($result->headers->get('ETag'));
        $this->assertNotNull($result->headers->get('Expires'));
    }

    /** @test */
    public function it_applies_private_cache_headers()
    {
        $response = new Response('content');
        
        $result = $this->service->applyCacheHeaders(
            $response,
            HttpCacheService::STRATEGY_PRIVATE,
            1800
        );
        
        $this->assertStringContainsString('private', $result->headers->get('Cache-Control'));
        $this->assertStringContainsString('max-age=1800', $result->headers->get('Cache-Control'));
    }

    /** @test */
    public function it_applies_no_cache_headers()
    {
        $response = new Response('content');
        
        $result = $this->service->applyCacheHeaders(
            $response,
            HttpCacheService::STRATEGY_NO_CACHE
        );
        
        $this->assertStringContainsString('no-cache', $result->headers->get('Cache-Control'));
        $this->assertStringContainsString('must-revalidate', $result->headers->get('Cache-Control'));
    }

    /** @test */
    public function it_applies_no_store_headers()
    {
        $response = new Response('content');
        
        $result = $this->service->applyCacheHeaders(
            $response,
            HttpCacheService::STRATEGY_NO_STORE
        );
        
        $this->assertStringContainsString('no-store', $result->headers->get('Cache-Control'));
        $this->assertStringContainsString('no-cache', $result->headers->get('Cache-Control'));
    }

    /** @test */
    public function it_includes_vary_header()
    {
        $response = new Response('content');
        
        $result = $this->service->applyCacheHeaders(
            $response,
            HttpCacheService::STRATEGY_PUBLIC
        );
        
        $this->assertEquals('Accept, Accept-Encoding', $result->headers->get('Vary'));
    }

    /** @test */
    public function it_creates_304_response()
    {
        $response = $this->service->notModifiedResponse('"test-etag"');
        
        $this->assertEquals(304, $response->getStatusCode());
        $this->assertEquals('', $response->getContent());
        $this->assertEquals('"test-etag"', $response->headers->get('ETag'));
    }

    /** @test */
    public function it_gets_route_specific_ttl()
    {
        $request = Request::create('/api/packages', 'GET');
        $ttl = $this->service->getTtlForRoute($request);
        
        $this->assertEquals(1800, $ttl); // 30 minutes for packages
    }

    /** @test */
    public function it_returns_default_ttl_for_unknown_routes()
    {
        $request = Request::create('/api/unknown', 'GET');
        $ttl = $this->service->getTtlForRoute($request);
        
        $this->assertEquals(3600, $ttl); // Default TTL
    }

    /** @test */
    public function it_invalidates_cache()
    {
        $key = 'test_key';
        Cache::put($key, 'value', 300);
        
        $result = $this->service->invalidate($key);
        
        $this->assertTrue($result);
        $this->assertNull(Cache::get($key));
    }

    /** @test */
    public function it_invalidates_many_keys()
    {
        Cache::put('key1', 'value1', 300);
        Cache::put('key2', 'value2', 300);
        Cache::put('key3', 'value3', 300);
        
        $count = $this->service->invalidateMany(['key1', 'key2']);
        
        $this->assertEquals(2, $count);
        $this->assertNull(Cache::get('key1'));
        $this->assertNull(Cache::get('key2'));
        $this->assertNotNull(Cache::get('key3'));
    }

    /** @test */
    public function it_sets_and_gets_default_ttl()
    {
        $this->service->setDefaultTtl(7200);
        
        $this->assertEquals(7200, $this->service->getDefaultTtl());
    }

    /** @test */
    public function it_adds_excluded_route()
    {
        $this->service->addExcludedRoute('api/custom/*');
        
        $request = Request::create('/api/custom/endpoint', 'GET');
        
        $this->assertFalse($this->service->isCacheable($request));
    }

    /** @test */
    public function it_sets_route_ttl()
    {
        $this->service->setRouteTtl('api/custom/*', 600);
        
        $request = Request::create('/api/custom/endpoint', 'GET');
        $ttl = $this->service->getTtlForRoute($request);
        
        $this->assertEquals(600, $ttl);
    }

    /** @test */
    public function it_tracks_statistics()
    {
        $this->service->recordHit();
        $this->service->recordHit();
        $this->service->recordMiss();
        $this->service->recordStore();
        
        $stats = $this->service->getStatistics();
        
        $this->assertEquals(2, $stats['hits']);
        $this->assertEquals(1, $stats['misses']);
        $this->assertEquals(1, $stats['stores']);
    }

    /** @test */
    public function it_calculates_hit_ratio()
    {
        $this->service->recordHit();
        $this->service->recordHit();
        $this->service->recordHit();
        $this->service->recordMiss();
        
        $ratio = $this->service->getHitRatio();
        
        $this->assertEquals(75.0, $ratio);
    }

    /** @test */
    public function it_returns_zero_hit_ratio_when_no_requests()
    {
        $ratio = $this->service->getHitRatio();
        
        $this->assertEquals(0.0, $ratio);
    }

    /** @test */
    public function it_resets_statistics()
    {
        $this->service->recordHit();
        $this->service->resetStatistics();
        
        $stats = $this->service->getStatistics();
        
        $this->assertEquals(0, $stats['hits']);
    }

    /** @test */
    public function it_determines_public_strategy_for_unauthenticated()
    {
        $request = Request::create('/api/packages', 'GET');
        $response = new Response('content', 200);
        
        $strategy = $this->service->determineCacheStrategy($request, $response);
        
        $this->assertEquals(HttpCacheService::STRATEGY_PUBLIC, $strategy);
    }

    /** @test */
    public function it_determines_no_store_for_error_responses()
    {
        $request = Request::create('/api/packages', 'GET');
        $response = new Response('error', 500);
        
        $strategy = $this->service->determineCacheStrategy($request, $response);
        
        $this->assertEquals(HttpCacheService::STRATEGY_NO_STORE, $strategy);
    }

    /** @test */
    public function it_determines_no_store_for_post_requests()
    {
        $request = Request::create('/api/packages', 'POST');
        $response = new Response('created', 201);
        
        $strategy = $this->service->determineCacheStrategy($request, $response);
        
        $this->assertEquals(HttpCacheService::STRATEGY_NO_STORE, $strategy);
    }

    /** @test */
    public function it_checks_response_cacheability()
    {
        $response = new Response('content', 200);
        // Clear any default cache-control headers
        $response->headers->remove('Cache-Control');
        
        $this->assertTrue($this->service->isResponseCacheable($response));
    }

    /** @test */
    public function it_rejects_error_response_as_not_cacheable()
    {
        $response = new Response('error', 404);
        
        $this->assertFalse($this->service->isResponseCacheable($response));
    }

    /** @test */
    public function it_rejects_no_store_response_as_not_cacheable()
    {
        $response = new Response('content', 200);
        $response->headers->set('Cache-Control', 'no-store');
        
        $this->assertFalse($this->service->isResponseCacheable($response));
    }

    /** @test */
    public function it_handles_weak_etag_comparison()
    {
        $request = Request::create('/api/packages', 'GET');
        $request->headers->set('If-None-Match', 'W/"abc123"');
        
        $this->assertTrue($this->service->hasValidEtag($request, 'W/"abc123"'));
        $this->assertTrue($this->service->hasValidEtag($request, '"abc123"'));
    }

    /** @test */
    public function it_applies_custom_etag()
    {
        $response = new Response('content');
        
        $result = $this->service->applyCacheHeaders(
            $response,
            HttpCacheService::STRATEGY_PUBLIC,
            3600,
            '"custom-etag"'
        );
        
        $this->assertEquals('"custom-etag"', $result->headers->get('ETag'));
    }

    /** @test */
    public function it_applies_last_modified_header()
    {
        $response = new Response('content');
        $lastModified = new \DateTime('2024-01-15 10:30:00');
        
        $result = $this->service->applyCacheHeaders(
            $response,
            HttpCacheService::STRATEGY_PUBLIC,
            3600,
            null,
            $lastModified
        );
        
        $this->assertNotNull($result->headers->get('Last-Modified'));
    }

    /** @test */
    public function it_returns_false_for_missing_if_none_match()
    {
        $request = Request::create('/api/packages', 'GET');
        
        $this->assertFalse($this->service->hasValidEtag($request, '"any-etag"'));
    }

    /** @test */
    public function it_returns_false_for_missing_if_modified_since()
    {
        $request = Request::create('/api/packages', 'GET');
        
        $this->assertFalse($this->service->hasValidLastModified($request, new \DateTime()));
    }

    /** @test */
    public function it_handles_invalid_if_modified_since_format()
    {
        $request = Request::create('/api/packages', 'GET');
        $request->headers->set('If-Modified-Since', 'invalid-date-format');
        
        $this->assertFalse($this->service->hasValidLastModified($request, new \DateTime()));
    }

    /** @test */
    public function set_default_ttl_is_chainable()
    {
        $result = $this->service->setDefaultTtl(1800);
        
        $this->assertInstanceOf(HttpCacheService::class, $result);
    }

    /** @test */
    public function add_excluded_route_is_chainable()
    {
        $result = $this->service->addExcludedRoute('api/test/*');
        
        $this->assertInstanceOf(HttpCacheService::class, $result);
    }

    /** @test */
    public function set_route_ttl_is_chainable()
    {
        $result = $this->service->setRouteTtl('api/test/*', 600);
        
        $this->assertInstanceOf(HttpCacheService::class, $result);
    }
}
