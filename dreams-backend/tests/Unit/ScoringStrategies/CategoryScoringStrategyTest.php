<?php

namespace Tests\Unit\ScoringStrategies;

use Tests\TestCase;
use App\Services\ScoringStrategies\CategoryScoringStrategy;
use App\Models\EventPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CategoryScoringStrategyTest extends TestCase
{
    use RefreshDatabase;

    protected $strategy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->strategy = new CategoryScoringStrategy();
    }

    /** @test */
    public function it_scores_40_points_for_exact_category_match()
    {
        $package = EventPackage::factory()->create([
            'package_category' => 'wedding',
        ]);

        $criteria = ['type' => 'wedding'];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(40, $result['score']);
        $this->assertEquals('Type match (+40)', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_for_category_mismatch()
    {
        $package = EventPackage::factory()->create([
            'package_category' => 'birthday',
        ]);

        $criteria = ['type' => 'wedding'];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_type_is_not_provided()
    {
        $package = EventPackage::factory()->create([
            'package_category' => 'wedding',
        ]);

        $criteria = [];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_type_is_null()
    {
        $package = EventPackage::factory()->create([
            'package_category' => 'wedding',
        ]);

        $criteria = ['type' => null];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_type_is_empty_string()
    {
        $package = EventPackage::factory()->create([
            'package_category' => 'wedding',
        ]);

        $criteria = ['type' => ''];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_handles_case_sensitive_category_matching()
    {
        $package = EventPackage::factory()->create([
            'package_category' => 'Wedding', // Capital W
        ]);

        $criteria = ['type' => 'wedding']; // lowercase
        $result = $this->strategy->score($package, $criteria);

        // Should not match due to case sensitivity
        $this->assertEquals(0, $result['score']);
    }

    /** @test */
    public function it_matches_different_event_types()
    {
        $types = ['wedding', 'birthday', 'corporate', 'anniversary', 'debut', 'pageant', 'other'];

        foreach ($types as $type) {
            $package = EventPackage::factory()->create([
                'package_category' => $type,
            ]);

            $criteria = ['type' => $type];
            $result = $this->strategy->score($package, $criteria);

            $this->assertEquals(40, $result['score'], "Failed for type: {$type}");
            $this->assertEquals('Type match (+40)', $result['justification']);
        }
    }
}

