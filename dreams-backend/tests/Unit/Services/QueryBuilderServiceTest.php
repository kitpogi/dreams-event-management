<?php

namespace Tests\Unit\Services;

use App\Models\BookingDetail;
use App\Models\Client;
use App\Models\EventPackage;
use App\Models\User;
use App\Services\QueryBuilderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class QueryBuilderServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    /** @test */
    public function it_can_apply_exact_filter()
    {
        // Create test packages
        EventPackage::factory()->create(['package_category' => 'Wedding']);
        EventPackage::factory()->create(['package_category' => 'Birthday']);
        EventPackage::factory()->create(['package_category' => 'Wedding']);

        $request = new Request(['filter' => ['package_category' => 'Wedding']]);

        $results = QueryBuilderService::for(EventPackage::class, $request)
            ->allowedFilters(['package_category'])
            ->apply()
            ->get();

        $this->assertCount(2, $results);
        $this->assertTrue($results->every(fn($p) => $p->package_category === 'Wedding'));
    }

    /** @test */
    public function it_can_apply_comma_separated_filter_as_in_clause()
    {
        EventPackage::factory()->create(['package_category' => 'Wedding']);
        EventPackage::factory()->create(['package_category' => 'Birthday']);
        EventPackage::factory()->create(['package_category' => 'Corporate']);

        $request = new Request(['package_category' => 'Wedding,Birthday']);

        $results = QueryBuilderService::for(EventPackage::class, $request)
            ->allowedFilters(['package_category'])
            ->apply()
            ->get();

        $this->assertCount(2, $results);
    }

    /** @test */
    public function it_can_apply_sorting_ascending()
    {
        EventPackage::factory()->create(['package_name' => 'Zebra Package', 'package_price' => 300]);
        EventPackage::factory()->create(['package_name' => 'Alpha Package', 'package_price' => 100]);
        EventPackage::factory()->create(['package_name' => 'Beta Package', 'package_price' => 200]);

        $request = new Request(['sort' => 'package_name']);

        $results = QueryBuilderService::for(EventPackage::class, $request)
            ->allowedSorts(['package_name', 'package_price'])
            ->apply()
            ->get();

        $this->assertEquals('Alpha Package', $results->first()->package_name);
        $this->assertEquals('Zebra Package', $results->last()->package_name);
    }

    /** @test */
    public function it_can_apply_sorting_descending_with_minus_prefix()
    {
        EventPackage::factory()->create(['package_price' => 100]);
        EventPackage::factory()->create(['package_price' => 300]);
        EventPackage::factory()->create(['package_price' => 200]);

        $request = new Request(['sort' => '-package_price']);

        $results = QueryBuilderService::for(EventPackage::class, $request)
            ->allowedSorts(['package_price'])
            ->apply()
            ->get();

        $this->assertEquals(300, (float) $results->first()->package_price);
        $this->assertEquals(100, (float) $results->last()->package_price);
    }

    /** @test */
    public function it_can_search_across_multiple_fields()
    {
        EventPackage::factory()->create([
            'package_name' => 'Elegant Wedding',
            'package_description' => 'A beautiful ceremony',
        ]);
        EventPackage::factory()->create([
            'package_name' => 'Birthday Bash',
            'package_description' => 'Fun party for all',
        ]);
        EventPackage::factory()->create([
            'package_name' => 'Corporate Event',
            'package_description' => 'Professional gathering',
        ]);

        $request = new Request(['search' => 'wedding']);

        $results = QueryBuilderService::for(EventPackage::class, $request)
            ->searchable(['package_name', 'package_description'])
            ->apply()
            ->get();

        $this->assertCount(1, $results);
        $this->assertStringContainsString('Wedding', $results->first()->package_name);
    }

    /** @test */
    public function it_can_apply_numeric_range_filter()
    {
        EventPackage::factory()->create(['package_price' => 100]);
        EventPackage::factory()->create(['package_price' => 250]);
        EventPackage::factory()->create(['package_price' => 500]);

        $request = new Request(['filter' => ['package_price' => '150..400']]);

        $results = QueryBuilderService::for(EventPackage::class, $request)
            ->allowedFilters([['field' => 'package_price', 'type' => 'numeric']])
            ->apply()
            ->get();

        $this->assertCount(1, $results);
        $this->assertEquals(250, (float) $results->first()->package_price);
    }

    /** @test */
    public function it_can_apply_greater_than_operator()
    {
        EventPackage::factory()->create(['package_price' => 100]);
        EventPackage::factory()->create(['package_price' => 200]);
        EventPackage::factory()->create(['package_price' => 300]);

        $request = new Request(['filter' => ['package_price' => '>150']]);

        $results = QueryBuilderService::for(EventPackage::class, $request)
            ->allowedFilters(['package_price'])
            ->apply()
            ->get();

        $this->assertCount(2, $results);
        $this->assertTrue($results->every(fn($p) => $p->package_price > 150));
    }

    /** @test */
    public function it_can_handle_pagination_with_metadata()
    {
        EventPackage::factory()->count(25)->create();

        $request = new Request(['per_page' => 10]);

        $result = QueryBuilderService::for(EventPackage::class, $request)
            ->apply()
            ->getWithMeta();

        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('meta', $result);
        $this->assertArrayHasKey('links', $result);
        $this->assertEquals(10, $result['meta']['per_page']);
        $this->assertEquals(1, $result['meta']['current_page']);
        $this->assertEquals(25, $result['meta']['total']);
        $this->assertEquals(3, $result['meta']['last_page']);
    }

    /** @test */
    public function it_respects_max_per_page_limit()
    {
        EventPackage::factory()->count(50)->create();

        $request = new Request(['per_page' => 200]); // Requesting more than max

        $result = QueryBuilderService::for(EventPackage::class, $request)
            ->paginate(15, 100) // Max 100
            ->apply()
            ->getPaginated();

        $this->assertEquals(100, $result->perPage());
    }

    /** @test */
    public function it_applies_default_sort_when_no_sort_specified()
    {
        $oldest = EventPackage::factory()->create(['created_at' => now()->subDays(5)]);
        $newest = EventPackage::factory()->create(['created_at' => now()]);
        $middle = EventPackage::factory()->create(['created_at' => now()->subDays(2)]);

        $request = new Request();

        $results = QueryBuilderService::for(EventPackage::class, $request)
            ->defaultSort('created_at', 'desc')
            ->apply()
            ->get();

        $this->assertEquals($newest->package_id, $results->first()->package_id);
        $this->assertEquals($oldest->package_id, $results->last()->package_id);
    }

    /** @test */
    public function it_can_apply_null_filter()
    {
        EventPackage::factory()->create(['venue_id' => null]);
        EventPackage::factory()->create(['venue_id' => 1]);
        EventPackage::factory()->create(['venue_id' => null]);

        $request = new Request(['filter' => ['venue_id' => 'null']]);

        $results = QueryBuilderService::for(EventPackage::class, $request)
            ->allowedFilters(['venue_id'])
            ->apply()
            ->get();

        $this->assertCount(2, $results);
        $this->assertTrue($results->every(fn($p) => $p->venue_id === null));
    }

    /** @test */
    public function it_can_apply_not_null_filter()
    {
        EventPackage::factory()->create(['venue_id' => null]);
        EventPackage::factory()->create(['venue_id' => 1]);
        EventPackage::factory()->create(['venue_id' => 2]);

        $request = new Request(['filter' => ['venue_id' => '!null']]);

        $results = QueryBuilderService::for(EventPackage::class, $request)
            ->allowedFilters(['venue_id'])
            ->apply()
            ->get();

        $this->assertCount(2, $results);
        $this->assertTrue($results->every(fn($p) => $p->venue_id !== null));
    }

    /** @test */
    public function it_can_apply_multiple_sorts()
    {
        EventPackage::factory()->create(['package_category' => 'Wedding', 'package_price' => 200]);
        EventPackage::factory()->create(['package_category' => 'Birthday', 'package_price' => 100]);
        EventPackage::factory()->create(['package_category' => 'Wedding', 'package_price' => 100]);

        $request = new Request(['sort' => 'package_category,-package_price']);

        $results = QueryBuilderService::for(EventPackage::class, $request)
            ->allowedSorts(['package_category', 'package_price'])
            ->apply()
            ->get();

        // First should be Birthday (alphabetically first), then Wedding sorted by price desc
        $this->assertEquals('Birthday', $results->get(0)->package_category);
        $this->assertEquals('Wedding', $results->get(1)->package_category);
        $this->assertEquals(200, (float) $results->get(1)->package_price); // Higher price first in Wedding
    }

    /** @test */
    public function it_ignores_unallowed_sort_fields()
    {
        EventPackage::factory()->count(3)->create();

        $request = new Request(['sort' => 'secret_field']);

        // Should not throw error, just ignore the invalid sort
        $results = QueryBuilderService::for(EventPackage::class, $request)
            ->allowedSorts(['package_name'])
            ->apply()
            ->get();

        $this->assertCount(3, $results);
    }

    /** @test */
    public function it_can_eager_load_relationships()
    {
        $package = EventPackage::factory()->create();

        $request = new Request(['include' => 'bookings']);

        $result = QueryBuilderService::for(EventPackage::class, $request)
            ->apply()
            ->first();

        $this->assertTrue($result->relationLoaded('bookings'));
    }
}
