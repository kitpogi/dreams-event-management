<?php

namespace Tests\Unit\ScoringStrategies;

use Tests\TestCase;
use App\Services\ScoringStrategies\CapacityScoringStrategy;
use App\Models\EventPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CapacityScoringStrategyTest extends TestCase
{
    use RefreshDatabase;

    protected $strategy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->strategy = new CapacityScoringStrategy();
    }

    /** @test */
    public function it_scores_25_points_for_perfect_capacity_match()
    {
        $package = EventPackage::factory()->create([
            'capacity' => 100,
        ]);

        $criteria = ['guests' => 100];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(25, $result['score']);
        $this->assertEquals('Perfect capacity match (+25)', $result['justification']);
    }

    /** @test */
    public function it_scores_25_points_when_capacity_is_within_20_percent()
    {
        $package = EventPackage::factory()->create([
            'capacity' => 120, // Exactly 20% over 100
        ]);

        $criteria = ['guests' => 100];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(25, $result['score']);
        $this->assertEquals('Perfect capacity match (+25)', $result['justification']);
    }

    /** @test */
    public function it_scores_15_points_when_capacity_is_within_50_percent()
    {
        $package = EventPackage::factory()->create([
            'capacity' => 150, // Exactly 50% over 100
        ]);

        $criteria = ['guests' => 100];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(15, $result['score']);
        $this->assertEquals('Good capacity match (+15)', $result['justification']);
    }

    /** @test */
    public function it_scores_5_points_when_capacity_is_over_50_percent()
    {
        $package = EventPackage::factory()->create([
            'capacity' => 200, // 100% over 100
        ]);

        $criteria = ['guests' => 100];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(5, $result['score']);
        $this->assertEquals('Can accommodate guests (+5)', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_capacity_is_less_than_guests()
    {
        $package = EventPackage::factory()->create([
            'capacity' => 50,
        ]);

        $criteria = ['guests' => 100];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_guests_is_not_provided()
    {
        $package = EventPackage::factory()->create([
            'capacity' => 100,
        ]);

        $criteria = [];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_guests_is_null()
    {
        $package = EventPackage::factory()->create([
            'capacity' => 100,
        ]);

        $criteria = ['guests' => null];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_guests_is_zero()
    {
        $package = EventPackage::factory()->create([
            'capacity' => 100,
        ]);

        $criteria = ['guests' => 0];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_guests_is_negative()
    {
        $package = EventPackage::factory()->create([
            'capacity' => 100,
        ]);

        $criteria = ['guests' => -10];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_capacity_is_null()
    {
        $package = EventPackage::factory()->create([
            'capacity' => null,
        ]);

        $criteria = ['guests' => 100];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_handles_exact_20_percent_boundary()
    {
        $guests = 100;
        $package = EventPackage::factory()->create([
            'capacity' => (int)($guests * 1.2), // Exactly 20% over
        ]);

        $criteria = ['guests' => $guests];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(25, $result['score']);
        $this->assertEquals('Perfect capacity match (+25)', $result['justification']);
    }

    /** @test */
    public function it_handles_just_over_20_percent_boundary()
    {
        $guests = 100;
        $package = EventPackage::factory()->create([
            'capacity' => (int)($guests * 1.2) + 1, // Just over 20%
        ]);

        $criteria = ['guests' => $guests];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(15, $result['score']);
        $this->assertEquals('Good capacity match (+15)', $result['justification']);
    }

    /** @test */
    public function it_handles_exact_50_percent_boundary()
    {
        $guests = 100;
        $package = EventPackage::factory()->create([
            'capacity' => (int)($guests * 1.5), // Exactly 50% over
        ]);

        $criteria = ['guests' => $guests];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(15, $result['score']);
        $this->assertEquals('Good capacity match (+15)', $result['justification']);
    }

    /** @test */
    public function it_handles_just_over_50_percent_boundary()
    {
        $guests = 100;
        $package = EventPackage::factory()->create([
            'capacity' => (int)($guests * 1.5) + 1, // Just over 50%
        ]);

        $criteria = ['guests' => $guests];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(5, $result['score']);
        $this->assertEquals('Can accommodate guests (+5)', $result['justification']);
    }

    /** @test */
    public function it_handles_string_capacity_values()
    {
        $package = EventPackage::factory()->create([
            'capacity' => '100', // String value
        ]);

        $criteria = ['guests' => 100];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(25, $result['score']);
        $this->assertEquals('Perfect capacity match (+25)', $result['justification']);
    }

    /** @test */
    public function it_handles_string_guest_values()
    {
        $package = EventPackage::factory()->create([
            'capacity' => 100,
        ]);

        $criteria = ['guests' => '100']; // String value
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(25, $result['score']);
        $this->assertEquals('Perfect capacity match (+25)', $result['justification']);
    }
}

