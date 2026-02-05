<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\JobManagementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Mockery;

class JobManagementServiceTest extends TestCase
{
    use RefreshDatabase;

    protected JobManagementService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new JobManagementService();
        
        // Ensure tables exist
        $this->createJobTables();
    }

    protected function createJobTables(): void
    {
        // Create jobs table if not exists
        if (!$this->tableExists('jobs')) {
            DB::statement('CREATE TABLE jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                queue VARCHAR(255) NOT NULL,
                payload TEXT NOT NULL,
                attempts INTEGER NOT NULL,
                reserved_at INTEGER,
                available_at INTEGER NOT NULL,
                created_at INTEGER NOT NULL
            )');
        }
        
        // Create failed_jobs table if not exists
        if (!$this->tableExists('failed_jobs')) {
            DB::statement('CREATE TABLE failed_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid VARCHAR(255) UNIQUE,
                connection VARCHAR(255) NOT NULL,
                queue VARCHAR(255) NOT NULL,
                payload TEXT NOT NULL,
                exception TEXT NOT NULL,
                failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )');
        }
    }

    protected function tableExists(string $table): bool
    {
        try {
            DB::table($table)->limit(1)->get();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_returns_priority_weights()
    {
        $this->assertEquals(1, $this->service->getPriorityWeight(JobManagementService::PRIORITY_URGENT));
        $this->assertEquals(2, $this->service->getPriorityWeight(JobManagementService::PRIORITY_HIGH));
        $this->assertEquals(3, $this->service->getPriorityWeight(JobManagementService::PRIORITY_NORMAL));
        $this->assertEquals(4, $this->service->getPriorityWeight(JobManagementService::PRIORITY_LOW));
    }

    /** @test */
    public function it_returns_default_weight_for_unknown_priority()
    {
        $this->assertEquals(3, $this->service->getPriorityWeight('unknown'));
    }

    /** @test */
    public function it_returns_empty_failed_jobs_when_none_exist()
    {
        $result = $this->service->getFailedJobs();
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('total', $result);
        $this->assertEmpty($result['data']);
        $this->assertEquals(0, $result['total']);
    }

    /** @test */
    public function it_returns_paginated_failed_jobs()
    {
        // Insert test failed jobs
        for ($i = 1; $i <= 25; $i++) {
            $this->insertFailedJob("job-uuid-{$i}", 'default');
        }
        
        $result = $this->service->getFailedJobs(1, 15);
        
        $this->assertCount(15, $result['data']);
        $this->assertEquals(25, $result['total']);
        $this->assertEquals(1, $result['page']);
        $this->assertEquals(15, $result['per_page']);
        $this->assertEquals(2, $result['last_page']);
    }

    /** @test */
    public function it_filters_failed_jobs_by_queue()
    {
        $this->insertFailedJob('job-1', 'emails');
        $this->insertFailedJob('job-2', 'emails');
        $this->insertFailedJob('job-3', 'notifications');
        
        $result = $this->service->getFailedJobs(1, 15, 'emails');
        
        $this->assertCount(2, $result['data']);
        $this->assertEquals(2, $result['total']);
    }

    /** @test */
    public function it_formats_failed_job_correctly()
    {
        $this->insertFailedJob('test-uuid', 'default', 'App\\Jobs\\TestJob');
        
        $result = $this->service->getFailedJobs();
        $job = $result['data'][0];
        
        $this->assertArrayHasKey('id', $job);
        $this->assertArrayHasKey('uuid', $job);
        $this->assertArrayHasKey('connection', $job);
        $this->assertArrayHasKey('queue', $job);
        $this->assertArrayHasKey('job_name', $job);
        $this->assertArrayHasKey('exception_message', $job);
        $this->assertArrayHasKey('exception_class', $job);
        $this->assertArrayHasKey('can_retry', $job);
    }

    /** @test */
    public function it_extracts_exception_message()
    {
        $exception = "RuntimeException: Something went wrong\n#0 /path/to/file.php(10)";
        
        $this->insertFailedJobWithException('test-uuid', $exception);
        
        $result = $this->service->getFailedJobs();
        $job = $result['data'][0];
        
        $this->assertEquals('Something went wrong', $job['exception_message']);
        $this->assertEquals('RuntimeException', $job['exception_class']);
    }

    /** @test */
    public function it_deletes_single_failed_job()
    {
        $this->insertFailedJob('delete-me', 'default');
        
        $result = $this->service->deleteJob('delete-me');
        
        $this->assertTrue($result);
        $this->assertEquals(0, DB::table('failed_jobs')->where('uuid', 'delete-me')->count());
    }

    /** @test */
    public function it_returns_false_when_deleting_non_existent_job()
    {
        $result = $this->service->deleteJob('non-existent');
        
        $this->assertFalse($result);
    }

    /** @test */
    public function it_deletes_multiple_failed_jobs()
    {
        $this->insertFailedJob('job-1', 'default');
        $this->insertFailedJob('job-2', 'default');
        $this->insertFailedJob('job-3', 'default');
        
        $count = $this->service->deleteJobs(['job-1', 'job-2']);
        
        $this->assertEquals(2, $count);
        $this->assertEquals(1, DB::table('failed_jobs')->count());
    }

    /** @test */
    public function it_flushes_all_failed_jobs()
    {
        $this->insertFailedJob('job-1', 'default');
        $this->insertFailedJob('job-2', 'default');
        $this->insertFailedJob('job-3', 'default');
        
        $count = $this->service->flushAllJobs();
        
        $this->assertEquals(3, $count);
        $this->assertEquals(0, DB::table('failed_jobs')->count());
    }

    /** @test */
    public function it_flushes_old_failed_jobs()
    {
        // Insert old job
        DB::table('failed_jobs')->insert([
            'uuid' => 'old-job',
            'connection' => 'database',
            'queue' => 'default',
            'payload' => json_encode(['displayName' => 'OldJob']),
            'exception' => 'Test exception',
            'failed_at' => now()->subHours(48)->toDateTimeString(),
        ]);
        
        // Insert recent job
        $this->insertFailedJob('recent-job', 'default');
        
        $count = $this->service->flushAllJobs(24);
        
        $this->assertEquals(1, $count);
        $this->assertEquals(1, DB::table('failed_jobs')->count());
        $this->assertNotNull(DB::table('failed_jobs')->where('uuid', 'recent-job')->first());
    }

    /** @test */
    public function it_returns_statistics()
    {
        Cache::flush();
        
        $this->insertFailedJob('job-1', 'emails');
        $this->insertFailedJob('job-2', 'emails');
        $this->insertFailedJob('job-3', 'notifications');
        
        $stats = $this->service->getStatistics();
        
        $this->assertEquals(3, $stats['total']);
        $this->assertArrayHasKey('by_queue', $stats);
        $this->assertArrayHasKey('by_exception', $stats);
        $this->assertArrayHasKey('last_24_hours', $stats);
        $this->assertArrayHasKey('last_7_days', $stats);
        $this->assertEquals(2, $stats['by_queue']['emails']);
        $this->assertEquals(1, $stats['by_queue']['notifications']);
    }

    /** @test */
    public function it_caches_statistics()
    {
        Cache::flush();
        
        $this->insertFailedJob('job-1', 'default');
        
        // First call
        $stats1 = $this->service->getStatistics();
        
        // Add another job
        $this->insertFailedJob('job-2', 'default');
        
        // Second call should return cached result
        $stats2 = $this->service->getStatistics();
        
        $this->assertEquals($stats1['total'], $stats2['total']);
    }

    /** @test */
    public function it_clears_statistics_cache()
    {
        Cache::flush();
        
        $this->insertFailedJob('job-1', 'default');
        $this->service->getStatistics();
        
        $this->service->clearStatisticsCache();
        
        $this->assertNull(Cache::get('failed_jobs_stats'));
    }

    /** @test */
    public function it_returns_queue_status()
    {
        $this->insertFailedJob('job-1', 'emails');
        $this->insertPendingJob('emails');
        $this->insertPendingJob('emails');
        
        $status = $this->service->getQueueStatus('emails');
        
        $this->assertArrayHasKey('emails', $status);
        $this->assertEquals(2, $status['emails']['pending']);
        $this->assertEquals(1, $status['emails']['failed']);
        $this->assertArrayHasKey('health', $status['emails']);
    }

    /** @test */
    public function it_calculates_queue_health()
    {
        // Queue with no failures has 100% health
        $this->insertPendingJob('healthy');
        
        $status = $this->service->getQueueStatus('healthy');
        
        $this->assertEquals(100, $status['healthy']['health']);
    }

    /** @test */
    public function it_gets_job_details()
    {
        $this->insertFailedJob('detail-job', 'default', 'App\\Jobs\\DetailJob');
        
        $details = $this->service->getJobDetails('detail-job');
        
        $this->assertNotNull($details);
        $this->assertEquals('detail-job', $details['uuid']);
        $this->assertArrayHasKey('full_exception', $details);
        $this->assertArrayHasKey('payload', $details);
    }

    /** @test */
    public function it_returns_null_for_non_existent_job_details()
    {
        $details = $this->service->getJobDetails('non-existent');
        
        $this->assertNull($details);
    }

    /** @test */
    public function it_searches_failed_jobs()
    {
        $this->insertFailedJobWithException('job-1', 'ConnectionException: Database connection failed');
        $this->insertFailedJobWithException('job-2', 'RuntimeException: Something else');
        $this->insertFailedJobWithException('job-3', 'ConnectionException: Redis connection failed');
        
        $results = $this->service->searchJobs('ConnectionException');
        
        $this->assertCount(2, $results);
    }

    /** @test */
    public function it_gets_retry_history()
    {
        $history = $this->service->getRetryHistory('some-uuid');
        
        $this->assertIsArray($history);
        $this->assertEmpty($history);
    }

    /** @test */
    public function priority_constants_are_defined()
    {
        $this->assertEquals('low', JobManagementService::PRIORITY_LOW);
        $this->assertEquals('normal', JobManagementService::PRIORITY_NORMAL);
        $this->assertEquals('high', JobManagementService::PRIORITY_HIGH);
        $this->assertEquals('urgent', JobManagementService::PRIORITY_URGENT);
    }

    /** @test */
    public function it_handles_empty_exception_gracefully()
    {
        DB::table('failed_jobs')->insert([
            'uuid' => 'empty-exception',
            'connection' => 'database',
            'queue' => 'default',
            'payload' => json_encode(['displayName' => 'TestJob']),
            'exception' => '',
            'failed_at' => now()->toDateTimeString(),
        ]);
        
        $result = $this->service->getFailedJobs();
        $job = $result['data'][0];
        
        $this->assertEquals('', $job['exception_message']);
    }

    /** @test */
    public function it_handles_retry_job()
    {
        $this->insertFailedJob('retry-me', 'default');
        
        // Mock Artisan facade
        Artisan::shouldReceive('call')
            ->once()
            ->with('queue:retry', ['id' => ['retry-me']])
            ->andReturn(0);
        
        $result = $this->service->retryJob('retry-me');
        
        $this->assertTrue($result);
    }

    /** @test */
    public function it_handles_failed_retry()
    {
        $this->insertFailedJob('fail-retry', 'default');
        
        Artisan::shouldReceive('call')
            ->once()
            ->andThrow(new \Exception('Retry failed'));
        
        $result = $this->service->retryJob('fail-retry');
        
        $this->assertFalse($result);
    }

    /** @test */
    public function it_retries_multiple_jobs()
    {
        $this->insertFailedJob('job-1', 'default');
        $this->insertFailedJob('job-2', 'default');
        
        Artisan::shouldReceive('call')
            ->times(2)
            ->andReturn(0);
        
        $results = $this->service->retryJobs(['job-1', 'job-2']);
        
        $this->assertCount(2, $results);
        $this->assertTrue($results['job-1']);
        $this->assertTrue($results['job-2']);
    }

    /** @test */
    public function it_returns_all_active_queues()
    {
        $this->insertPendingJob('queue1');
        $this->insertPendingJob('queue2');
        $this->insertFailedJob('job-1', 'queue3');
        
        $status = $this->service->getQueueStatus();
        
        $this->assertArrayHasKey('queue1', $status);
        $this->assertArrayHasKey('queue2', $status);
        $this->assertArrayHasKey('queue3', $status);
        $this->assertArrayHasKey('default', $status);
    }

    // Helper methods

    protected function insertFailedJob(string $uuid, string $queue, string $jobClass = 'App\\Jobs\\TestJob'): void
    {
        DB::table('failed_jobs')->insert([
            'uuid' => $uuid,
            'connection' => 'database',
            'queue' => $queue,
            'payload' => json_encode([
                'displayName' => $jobClass,
                'data' => ['commandName' => $jobClass],
            ]),
            'exception' => 'Exception: Test exception message',
            'failed_at' => now()->toDateTimeString(),
        ]);
    }

    protected function insertFailedJobWithException(string $uuid, string $exception): void
    {
        DB::table('failed_jobs')->insert([
            'uuid' => $uuid,
            'connection' => 'database',
            'queue' => 'default',
            'payload' => json_encode(['displayName' => 'TestJob']),
            'exception' => $exception,
            'failed_at' => now()->toDateTimeString(),
        ]);
    }

    protected function insertPendingJob(string $queue): void
    {
        DB::table('jobs')->insert([
            'queue' => $queue,
            'payload' => json_encode(['displayName' => 'TestJob']),
            'attempts' => 0,
            'available_at' => now()->timestamp,
            'created_at' => now()->timestamp,
        ]);
    }
}
