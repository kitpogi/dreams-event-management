<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\RecommendationService;
use App\Models\EventPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;

class RecommendationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $recommendationService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->recommendationService = new RecommendationService();
    }

    /** @test */
    public function it_scores_packages_based_on_type_match()
    {
        $package1 = EventPackage::factory()->create([
            'package_category' => 'wedding',
            'package_price' => 50000,
        ]);
        $package2 = EventPackage::factory()->create([
            'package_category' => 'birthday',
            'package_price' => 30000,
        ]);

        $packages = collect([$package1, $package2]);
        $criteria = ['type' => 'wedding'];

        $scored = $this->recommendationService->scorePackages($packages, $criteria);

        $this->assertInstanceOf(Collection::class, $scored);
        $this->assertEquals(2, $scored->count());
        
        $weddingPackage = $scored->firstWhere('package.package_id', $package1->package_id);
        $this->assertEquals(40, $weddingPackage['score']);
        $this->assertStringContainsString('Type match', $weddingPackage['justification']);
    }

    /** @test */
    public function it_scores_packages_based_on_budget()
    {
        $package1 = EventPackage::factory()->create([
            'package_price' => 50000,
        ]);
        $package2 = EventPackage::factory()->create([
            'package_price' => 60000,
        ]);
        $package3 = EventPackage::factory()->create([
            'package_price' => 70000,
        ]);

        $packages = collect([$package1, $package2, $package3]);
        $criteria = ['budget' => 50000];

        $scored = $this->recommendationService->scorePackages($packages, $criteria);

        $withinBudget = $scored->firstWhere('package.package_id', $package1->package_id);
        $slightlyOver = $scored->firstWhere('package.package_id', $package2->package_id);
        $overBudget = $scored->firstWhere('package.package_id', $package3->package_id);

        $this->assertEquals(30, $withinBudget['score']);
        $this->assertEquals(10, $slightlyOver['score']);
        $this->assertEquals(0, $overBudget['score']);
    }

    /** @test */
    public function it_scores_packages_based_on_theme_match()
    {
        $package1 = EventPackage::factory()->create([
            'package_name' => 'Elegant Wedding Package',
            'package_description' => 'A beautiful elegant wedding',
        ]);
        $package2 = EventPackage::factory()->create([
            'package_name' => 'Casual Birthday',
            'package_description' => 'Fun and casual event',
        ]);

        $packages = collect([$package1, $package2]);
        $criteria = ['theme' => 'elegant'];

        $scored = $this->recommendationService->scorePackages($packages, $criteria);

        $elegantPackage = $scored->firstWhere('package.package_id', $package1->package_id);
        $this->assertEquals(15, $elegantPackage['score']);
        $this->assertStringContainsString('motif/theme match', $elegantPackage['justification']);
    }

    /** @test */
    public function it_scores_packages_based_on_preferences()
    {
        $package1 = EventPackage::factory()->create([
            'package_name' => 'Package with flowers and music',
            'package_description' => 'Includes beautiful flowers and live music',
        ]);
        $package2 = EventPackage::factory()->create([
            'package_name' => 'Simple Package',
            'package_description' => 'Basic event package',
        ]);

        $packages = collect([$package1, $package2]);
        $criteria = ['preferences' => ['flowers', 'music', 'decoration']];

        $scored = $this->recommendationService->scorePackages($packages, $criteria);

        $matchedPackage = $scored->firstWhere('package.package_id', $package1->package_id);
        $this->assertGreaterThan(0, $matchedPackage['score']);
        $this->assertStringContainsString('preference match', $matchedPackage['justification']);
    }

    /** @test */
    public function it_sorts_packages_by_score_descending()
    {
        $package1 = EventPackage::factory()->create([
            'package_category' => 'wedding',
            'package_price' => 50000,
        ]);
        $package2 = EventPackage::factory()->create([
            'package_category' => 'birthday',
            'package_price' => 30000,
        ]);

        $packages = collect([$package1, $package2]);
        $criteria = ['type' => 'wedding', 'budget' => 50000];

        $scored = $this->recommendationService->scorePackages($packages, $criteria);

        $scores = $scored->pluck('score')->toArray();
        $this->assertEquals([70, 30], $scores); // 40 (type) + 30 (budget) = 70, then 30 (budget only)
    }

    /** @test */
    public function it_formats_recommendation_results()
    {
        $package = EventPackage::factory()->create([
            'package_name' => 'Test Package',
            'package_description' => 'Test Description',
            'package_price' => 50000,
        ]);

        $scoredPackages = collect([
            [
                'package' => $package,
                'score' => 70,
                'justification' => 'Type match, Within budget',
            ],
        ]);

        $formatted = $this->recommendationService->formatResults($scoredPackages);

        $this->assertCount(1, $formatted);
        $this->assertEquals($package->package_id, $formatted[0]['id']);
        $this->assertEquals('Test Package', $formatted[0]['name']);
        $this->assertEquals(50000, $formatted[0]['price']);
        $this->assertEquals(70, $formatted[0]['raw_score']); // Check raw_score instead of normalized score
        $this->assertGreaterThanOrEqual(0, $formatted[0]['score']); // Normalized score should be 0-1
        $this->assertLessThanOrEqual(1, $formatted[0]['score']);
    }

    /** @test */
    public function it_limits_formatted_results()
    {
        $packages = EventPackage::factory()->count(10)->create();
        $scoredPackages = $packages->map(function ($package) {
            return [
                'package' => $package,
                'score' => 50,
                'justification' => 'Test',
            ];
        });

        $formatted = $this->recommendationService->formatResults($scoredPackages, 5);

        $this->assertCount(5, $formatted);
    }
}

