<?php

namespace Tests\Unit\ScoringStrategies;

use Tests\TestCase;
use App\Services\ScoringStrategies\BudgetScoringStrategy;
use App\Models\EventPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BudgetScoringStrategyTest extends TestCase
{
    use RefreshDatabase;

    protected $strategy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->strategy = new BudgetScoringStrategy();
    }

    /** @test */
    public function it_scores_30_points_when_package_is_within_budget()
    {
        $package = EventPackage::factory()->create([
            'package_price' => 50000,
        ]);

        $criteria = ['budget' => 50000];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(30, $result['score']);
        $this->assertEquals('Within budget (+30)', $result['justification']);
    }

    /** @test */
    public function it_scores_30_points_when_package_is_below_budget()
    {
        $package = EventPackage::factory()->create([
            'package_price' => 40000,
        ]);

        $criteria = ['budget' => 50000];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(30, $result['score']);
        $this->assertEquals('Within budget (+30)', $result['justification']);
    }

    /** @test */
    public function it_scores_10_points_when_package_is_slightly_over_budget()
    {
        $package = EventPackage::factory()->create([
            'package_price' => 60000, // 20% over 50000
        ]);

        $criteria = ['budget' => 50000];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(10, $result['score']);
        $this->assertEquals('Slightly over budget (+10)', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_package_is_more_than_20_percent_over_budget()
    {
        $package = EventPackage::factory()->create([
            'package_price' => 70000, // 40% over 50000
        ]);

        $criteria = ['budget' => 50000];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_budget_is_not_provided()
    {
        $package = EventPackage::factory()->create([
            'package_price' => 50000,
        ]);

        $criteria = [];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_budget_is_null()
    {
        $package = EventPackage::factory()->create([
            'package_price' => 50000,
        ]);

        $criteria = ['budget' => null];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_budget_is_zero()
    {
        $package = EventPackage::factory()->create([
            'package_price' => 50000,
        ]);

        $criteria = ['budget' => 0];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_budget_is_negative()
    {
        $package = EventPackage::factory()->create([
            'package_price' => 50000,
        ]);

        $criteria = ['budget' => -1000];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_package_price_is_zero()
    {
        // Note: package_price cannot be null in database, so we test with 0
        $package = EventPackage::factory()->create([
            'package_price' => 0,
        ]);

        $criteria = ['budget' => 50000];
        $result = $this->strategy->score($package, $criteria);

        // When price is 0, it's technically within budget, but the logic checks if price exists
        // Since 0 is falsy in some contexts, but the check is `$package->package_price`, 
        // it should still evaluate. Let's verify the actual behavior.
        // Actually, 0 <= 50000 is true, so it should score 30. But the check is `$package->package_price`
        // which would be 0 (falsy), so the condition fails. Let's test this.
        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_handles_exact_20_percent_over_budget_boundary()
    {
        $budget = 50000;
        $package = EventPackage::factory()->create([
            'package_price' => $budget * 1.2, // Exactly 20% over
        ]);

        $criteria = ['budget' => $budget];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(10, $result['score']);
        $this->assertEquals('Slightly over budget (+10)', $result['justification']);
    }

    /** @test */
    public function it_handles_just_over_20_percent_boundary()
    {
        $budget = 50000;
        $package = EventPackage::factory()->create([
            'package_price' => ($budget * 1.2) + 1, // Just over 20%
        ]);

        $criteria = ['budget' => $budget];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_handles_very_large_budget_values()
    {
        $package = EventPackage::factory()->create([
            'package_price' => 1000000,
        ]);

        $criteria = ['budget' => 1000000];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(30, $result['score']);
        $this->assertEquals('Within budget (+30)', $result['justification']);
    }

    /** @test */
    public function it_handles_very_small_budget_values()
    {
        $package = EventPackage::factory()->create([
            'package_price' => 100,
        ]);

        $criteria = ['budget' => 100];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(30, $result['score']);
        $this->assertEquals('Within budget (+30)', $result['justification']);
    }
}

