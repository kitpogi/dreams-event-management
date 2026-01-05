<?php

namespace Tests\Unit\ScoringStrategies;

use Tests\TestCase;
use App\Services\ScoringStrategies\PreferenceScoringStrategy;
use App\Models\EventPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PreferenceScoringStrategyTest extends TestCase
{
    use RefreshDatabase;

    protected $strategy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->strategy = new PreferenceScoringStrategy();
    }

    /** @test */
    public function it_scores_5_points_for_single_preference_match_in_description()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes beautiful flowers',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['preferences' => ['flowers']];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(5, $result['score']);
        $this->assertStringContainsString('1 preference match(es)', $result['justification']);
        $this->assertStringContainsString('(+5)', $result['justification']);
    }

    /** @test */
    public function it_scores_5_points_for_single_preference_match_in_name()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'A beautiful package',
            'package_name' => 'Flowers Wedding Package',
        ]);

        $criteria = ['preferences' => ['flowers']];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(5, $result['score']);
        $this->assertStringContainsString('1 preference match(es)', $result['justification']);
    }

    /** @test */
    public function it_scores_10_points_for_two_preference_matches()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes beautiful flowers and live music',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['preferences' => ['flowers', 'music']];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(10, $result['score']); // 2 * 5
        $this->assertStringContainsString('2 preference match(es)', $result['justification']);
        $this->assertStringContainsString('(+10)', $result['justification']);
    }

    /** @test */
    public function it_scores_15_points_for_three_preference_matches()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes beautiful flowers, live music, and photography',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['preferences' => ['flowers', 'music', 'photography']];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(15, $result['score']); // 3 * 5
        $this->assertStringContainsString('3 preference match(es)', $result['justification']);
        $this->assertStringContainsString('(+15)', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_no_preference_match()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'A simple wedding package',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['preferences' => ['flowers', 'music']];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_preferences_is_not_provided()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes beautiful flowers',
        ]);

        $criteria = [];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_preferences_is_null()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes beautiful flowers',
        ]);

        $criteria = ['preferences' => null];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_preferences_is_empty_array()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes beautiful flowers',
        ]);

        $criteria = ['preferences' => []];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_handles_preference_matching_case_insensitively()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes beautiful FLOWERS',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['preferences' => ['flowers']];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(5, $result['score']);
    }

    /** @test */
    public function it_handles_partial_word_matches()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes beautiful flowers',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['preferences' => ['flower']]; // Partial match
        $result = $this->strategy->score($package, $criteria);

        // strpos will match "flower" in "flowers"
        $this->assertEquals(5, $result['score']);
    }

    /** @test */
    public function it_handles_empty_package_description()
    {
        // Note: package_description cannot be null in database, so we test with empty string
        $package = EventPackage::factory()->create([
            'package_description' => '',
            'package_name' => 'Flowers Wedding Package',
        ]);

        $criteria = ['preferences' => ['flowers']];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(5, $result['score']); // Should match in name
    }

    /** @test */
    public function it_handles_empty_package_name()
    {
        // Note: package_name cannot be null in database, so we test with empty string
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes beautiful flowers',
            'package_name' => '',
        ]);

        $criteria = ['preferences' => ['flowers']];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(5, $result['score']); // Should match in description
    }

    /** @test */
    public function it_counts_duplicate_preferences_in_array()
    {
        // Note: The current implementation counts each occurrence in the preferences array
        // If the same preference appears twice and matches, it will be counted twice
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes beautiful flowers',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['preferences' => ['flowers', 'flowers']]; // Duplicate in array
        $result = $this->strategy->score($package, $criteria);

        // Current implementation counts each array item, so this will match twice
        // This is the actual behavior - if user provides duplicate preferences, they're counted
        $this->assertEquals(10, $result['score']); // 2 matches * 5 = 10
    }

    /** @test */
    public function it_handles_mixed_case_preferences()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes beautiful flowers and music',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['preferences' => ['Flowers', 'MUSIC']]; // Mixed case
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(10, $result['score']);
    }

    /** @test */
    public function it_handles_large_number_of_preferences()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes flowers, music, photography, catering, decoration, and more',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['preferences' => ['flowers', 'music', 'photography', 'catering', 'decoration', 'lighting', 'sound']];
        $result = $this->strategy->score($package, $criteria);

        // Should score 5 points for each match (5 matches = 25 points)
        $this->assertEquals(25, $result['score']);
        $this->assertStringContainsString('5 preference match(es)', $result['justification']);
    }

    /** @test */
    public function it_handles_empty_string_preferences()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'Includes beautiful flowers',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['preferences' => ['flowers', '', 'music']]; // Empty string in array
        $result = $this->strategy->score($package, $criteria);

        // Should match "flowers" and "music" if present
        $this->assertGreaterThanOrEqual(5, $result['score']);
    }
}

