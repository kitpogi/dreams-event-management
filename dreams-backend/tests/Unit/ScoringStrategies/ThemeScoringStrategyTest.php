<?php

namespace Tests\Unit\ScoringStrategies;

use Tests\TestCase;
use App\Services\ScoringStrategies\ThemeScoringStrategy;
use App\Models\EventPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ThemeScoringStrategyTest extends TestCase
{
    use RefreshDatabase;

    protected $strategy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->strategy = new ThemeScoringStrategy();
    }

    /** @test */
    public function it_scores_15_points_for_single_theme_match_in_description()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'An elegant wedding package',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['theme' => 'elegant'];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(15, $result['score']);
        $this->assertStringContainsString('1 motif/theme match(es)', $result['justification']);
        $this->assertStringContainsString('(+15)', $result['justification']);
    }

    /** @test */
    public function it_scores_15_points_for_single_theme_match_in_name()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'A beautiful package',
            'package_name' => 'Elegant Wedding Package',
        ]);

        $criteria = ['theme' => 'elegant'];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(15, $result['score']);
        $this->assertStringContainsString('1 motif/theme match(es)', $result['justification']);
    }

    /** @test */
    public function it_scores_20_points_for_two_theme_matches()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'An elegant and modern wedding package',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['theme' => 'elegant,modern'];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(20, $result['score']); // 15 + 5
        $this->assertStringContainsString('2 motif/theme match(es)', $result['justification']);
        $this->assertStringContainsString('(+20)', $result['justification']);
    }

    /** @test */
    public function it_scores_25_points_for_three_or_more_theme_matches()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'An elegant, modern, and rustic wedding package',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['theme' => 'elegant,modern,rustic'];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(25, $result['score']); // 15 + 5 + 5 = 25 (capped)
        $this->assertStringContainsString('3 motif/theme match(es)', $result['justification']);
        $this->assertStringContainsString('(+25)', $result['justification']);
    }

    /** @test */
    public function it_caps_score_at_25_points_for_many_matches()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'An elegant, modern, rustic, vintage, and classic wedding package',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['theme' => 'elegant,modern,rustic,vintage,classic'];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(25, $result['score']); // Capped at 25
        $this->assertStringContainsString('5 motif/theme match(es)', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_no_theme_match()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'A simple wedding package',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['theme' => 'elegant'];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_theme_is_not_provided()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'An elegant wedding package',
        ]);

        $criteria = [];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_theme_is_null()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'An elegant wedding package',
        ]);

        $criteria = ['theme' => null];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_scores_0_points_when_theme_is_empty_string()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'An elegant wedding package',
        ]);

        $criteria = ['theme' => ''];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(0, $result['score']);
        $this->assertEquals('', $result['justification']);
    }

    /** @test */
    public function it_handles_theme_matching_case_insensitively()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'An ELEGANT wedding package',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['theme' => 'elegant'];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(15, $result['score']);
    }

    /** @test */
    public function it_handles_comma_separated_themes_with_spaces()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'An elegant and modern wedding package',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['theme' => 'elegant, modern']; // With space after comma
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(20, $result['score']);
        $this->assertStringContainsString('2 motif/theme match(es)', $result['justification']);
    }

    /** @test */
    public function it_handles_empty_theme_items_in_comma_separated_list()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'An elegant wedding package',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['theme' => 'elegant,,modern']; // Empty item in middle
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(15, $result['score']); // Only one match (elegant)
    }

    /** @test */
    public function it_handles_whitespace_only_theme_items()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'An elegant and modern wedding package',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['theme' => 'elegant,  ,modern']; // Whitespace only item in middle
        $result = $this->strategy->score($package, $criteria);

        // The strategy filters out empty strings after trim, so whitespace-only items are ignored
        // This means only "elegant" and "modern" should match
        $this->assertEquals(20, $result['score']); // Two matches (elegant, modern)
    }

    /** @test */
    public function it_handles_empty_package_description()
    {
        // Note: package_description cannot be null in database, so we test with empty string
        $package = EventPackage::factory()->create([
            'package_description' => '',
            'package_name' => 'Elegant Wedding Package',
        ]);

        $criteria = ['theme' => 'elegant'];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(15, $result['score']); // Should match in name
    }

    /** @test */
    public function it_handles_empty_package_name()
    {
        // Note: package_name cannot be null in database, so we test with empty string
        $package = EventPackage::factory()->create([
            'package_description' => 'An elegant wedding package',
            'package_name' => '',
        ]);

        $criteria = ['theme' => 'elegant'];
        $result = $this->strategy->score($package, $criteria);

        $this->assertEquals(15, $result['score']); // Should match in description
    }

    /** @test */
    public function it_handles_partial_word_matches()
    {
        $package = EventPackage::factory()->create([
            'package_description' => 'An elegant wedding package',
            'package_name' => 'Wedding Package',
        ]);

        $criteria = ['theme' => 'elegan']; // Partial match
        $result = $this->strategy->score($package, $criteria);

        // strpos will match "elegan" in "elegant"
        $this->assertEquals(15, $result['score']);
    }
}

