<?php

namespace Tests\Unit\Traits;

use Tests\TestCase;
use App\Traits\HasJobPriority;
use App\Services\JobManagementService;
use Illuminate\Bus\Queueable;

class HasJobPriorityTest extends TestCase
{
    protected $job;

    protected function setUp(): void
    {
        parent::setUp();
        $this->job = new class {
            use HasJobPriority, Queueable;
            
            /** @var string|null */
            public $queue = null;
            
            /** @var int|null */
            public $delay = null;
        };
    }

    /** @test */
    public function it_has_normal_priority_by_default()
    {
        $this->assertEquals(JobManagementService::PRIORITY_NORMAL, $this->job->getPriority());
    }

    /** @test */
    public function it_sets_low_priority()
    {
        $result = $this->job->lowPriority();
        
        $this->assertSame($this->job, $result);
        $this->assertEquals(JobManagementService::PRIORITY_LOW, $this->job->getPriority());
    }

    /** @test */
    public function it_sets_normal_priority()
    {
        $this->job->lowPriority();
        $result = $this->job->normalPriority();
        
        $this->assertSame($this->job, $result);
        $this->assertEquals(JobManagementService::PRIORITY_NORMAL, $this->job->getPriority());
    }

    /** @test */
    public function it_sets_high_priority()
    {
        $result = $this->job->highPriority();
        
        $this->assertSame($this->job, $result);
        $this->assertEquals(JobManagementService::PRIORITY_HIGH, $this->job->getPriority());
    }

    /** @test */
    public function it_sets_urgent_priority()
    {
        $result = $this->job->urgentPriority();
        
        $this->assertSame($this->job, $result);
        $this->assertEquals(JobManagementService::PRIORITY_URGENT, $this->job->getPriority());
    }

    /** @test */
    public function it_sets_priority_with_custom_value()
    {
        $result = $this->job->withPriority('high');
        
        $this->assertSame($this->job, $result);
        $this->assertEquals('high', $this->job->getPriority());
    }

    /** @test */
    public function it_returns_correct_priority_queue_for_urgent()
    {
        $this->job->urgentPriority();
        
        $this->assertEquals('urgent', $this->job->getPriorityQueue());
    }

    /** @test */
    public function it_returns_correct_priority_queue_for_high()
    {
        $this->job->highPriority();
        
        $this->assertEquals('high', $this->job->getPriorityQueue());
    }

    /** @test */
    public function it_returns_correct_priority_queue_for_normal()
    {
        $this->job->normalPriority();
        
        $this->assertEquals('default', $this->job->getPriorityQueue());
    }

    /** @test */
    public function it_returns_correct_priority_queue_for_low()
    {
        $this->job->lowPriority();
        
        $this->assertEquals('low', $this->job->getPriorityQueue());
    }

    /** @test */
    public function it_sets_queue_on_priority_queue()
    {
        $this->job->highPriority()->onPriorityQueue();
        
        $this->assertEquals('high', $this->job->queue);
    }

    /** @test */
    public function it_returns_delay_for_low_priority()
    {
        $this->job->lowPriority();
        
        $this->assertEquals(300, $this->job->getPriorityDelay());
    }

    /** @test */
    public function it_returns_zero_delay_for_normal_priority()
    {
        $this->job->normalPriority();
        
        $this->assertEquals(0, $this->job->getPriorityDelay());
    }

    /** @test */
    public function it_returns_zero_delay_for_high_priority()
    {
        $this->job->highPriority();
        
        $this->assertEquals(0, $this->job->getPriorityDelay());
    }

    /** @test */
    public function it_returns_zero_delay_for_urgent_priority()
    {
        $this->job->urgentPriority();
        
        $this->assertEquals(0, $this->job->getPriorityDelay());
    }

    /** @test */
    public function it_applies_priority_delay_for_low_priority()
    {
        $this->job->lowPriority()->withPriorityDelay();
        
        $this->assertEquals(300, $this->job->delay);
    }

    /** @test */
    public function it_does_not_apply_delay_for_high_priority()
    {
        $this->job->highPriority()->withPriorityDelay();
        
        $this->assertNull($this->job->delay);
    }

    /** @test */
    public function it_is_chainable()
    {
        $result = $this->job
            ->highPriority()
            ->onPriorityQueue()
            ->withPriorityDelay();
        
        $this->assertSame($this->job, $result);
        $this->assertEquals('high', $this->job->queue);
        $this->assertEquals(JobManagementService::PRIORITY_HIGH, $this->job->getPriority());
    }
}
