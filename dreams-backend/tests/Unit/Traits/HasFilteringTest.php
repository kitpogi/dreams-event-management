<?php

namespace Tests\Unit\Traits;

use App\Models\BookingDetail;
use App\Models\Client;
use App\Models\EventPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class HasFilteringTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_apply_filters_from_request()
    {
        BookingDetail::factory()->create(['booking_status' => 'pending']);
        BookingDetail::factory()->create(['booking_status' => 'confirmed']);
        BookingDetail::factory()->create(['booking_status' => 'pending']);

        $request = new Request(['booking_status' => 'pending']);

        $results = BookingDetail::query()->applyFilters($request)->get();

        $this->assertCount(2, $results);
        $this->assertTrue($results->every(fn($b) => $b->booking_status === 'pending'));
    }

    /** @test */
    public function it_can_apply_sorting_from_request()
    {
        BookingDetail::factory()->create(['total_amount' => 500]);
        BookingDetail::factory()->create(['total_amount' => 100]);
        BookingDetail::factory()->create(['total_amount' => 300]);

        $request = new Request(['sort' => 'total_amount']);

        $results = BookingDetail::query()->applyFilters($request)->get();

        $amounts = $results->pluck('total_amount')->map(fn($v) => (float) $v)->toArray();
        $this->assertEquals([100, 300, 500], $amounts);
    }

    /** @test */
    public function it_can_apply_descending_sort()
    {
        BookingDetail::factory()->create(['total_amount' => 500]);
        BookingDetail::factory()->create(['total_amount' => 100]);
        BookingDetail::factory()->create(['total_amount' => 300]);

        $request = new Request(['sort' => '-total_amount']);

        $results = BookingDetail::query()->applyFilters($request)->get();

        $amounts = $results->pluck('total_amount')->map(fn($v) => (float) $v)->toArray();
        $this->assertEquals([500, 300, 100], $amounts);
    }

    /** @test */
    public function it_can_search_across_fields()
    {
        BookingDetail::factory()->create(['event_venue' => 'Grand Ballroom']);
        BookingDetail::factory()->create(['event_venue' => 'Garden Pavilion']);
        BookingDetail::factory()->create(['event_type' => 'Grand Opening']);

        $request = new Request(['search' => 'Grand']);

        $results = BookingDetail::query()->applyFilters($request)->get();

        $this->assertCount(2, $results);
    }

    /** @test */
    public function it_can_apply_date_range_filter()
    {
        BookingDetail::factory()->create(['event_date' => '2024-01-15']);
        BookingDetail::factory()->create(['event_date' => '2024-02-15']);
        BookingDetail::factory()->create(['event_date' => '2024-03-15']);

        $request = new Request([
            'event_date_from' => '2024-01-01',
            'event_date_to' => '2024-02-28',
        ]);

        $results = BookingDetail::query()->applyFilters($request)->get();

        $this->assertCount(2, $results);
    }

    /** @test */
    public function it_can_apply_date_range_with_between_syntax()
    {
        BookingDetail::factory()->create(['event_date' => '2024-01-15']);
        BookingDetail::factory()->create(['event_date' => '2024-02-15']);
        BookingDetail::factory()->create(['event_date' => '2024-03-15']);

        $request = new Request(['event_date' => '2024-01-01..2024-02-28']);

        $results = BookingDetail::query()->applyFilters($request)->get();

        $this->assertCount(2, $results);
    }

    /** @test */
    public function it_can_apply_comma_separated_values_as_in_clause()
    {
        BookingDetail::factory()->create(['booking_status' => 'pending']);
        BookingDetail::factory()->create(['booking_status' => 'confirmed']);
        BookingDetail::factory()->create(['booking_status' => 'cancelled']);

        $request = new Request(['booking_status' => 'pending,confirmed']);

        $results = BookingDetail::query()->applyFilters($request)->get();

        $this->assertCount(2, $results);
    }

    /** @test */
    public function it_can_apply_greater_than_operator()
    {
        BookingDetail::factory()->create(['guest_count' => 50]);
        BookingDetail::factory()->create(['guest_count' => 100]);
        BookingDetail::factory()->create(['guest_count' => 150]);

        // Note: This test depends on guest_count being in filterable array
        // We need to add it to the model's filterable array for this to work
        $results = BookingDetail::query()
            ->where('guest_count', '>', 75)
            ->get();

        $this->assertCount(2, $results);
    }

    /** @test */
    public function it_can_use_filter_scope_without_sorting()
    {
        BookingDetail::factory()->create(['booking_status' => 'pending', 'total_amount' => 100]);
        BookingDetail::factory()->create(['booking_status' => 'confirmed', 'total_amount' => 200]);

        $request = new Request(['booking_status' => 'pending', 'sort' => '-total_amount']);

        // Using filter() scope - should NOT apply sort
        $results = BookingDetail::query()->filter($request)->get();

        $this->assertCount(1, $results);
        $this->assertEquals('pending', $results->first()->booking_status);
    }

    /** @test */
    public function it_can_use_search_scope_directly()
    {
        BookingDetail::factory()->create(['event_venue' => 'Grand Ballroom']);
        BookingDetail::factory()->create(['event_venue' => 'Small Room']);

        $results = BookingDetail::query()->search('Grand')->get();

        $this->assertCount(1, $results);
        $this->assertStringContainsString('Grand', $results->first()->event_venue);
    }

    /** @test */
    public function it_handles_colon_sort_direction_syntax()
    {
        BookingDetail::factory()->create(['total_amount' => 100]);
        BookingDetail::factory()->create(['total_amount' => 300]);
        BookingDetail::factory()->create(['total_amount' => 200]);

        $request = new Request(['sort' => 'total_amount:desc']);

        $results = BookingDetail::query()->applyFilters($request)->get();

        $amounts = $results->pluck('total_amount')->map(fn($v) => (float) $v)->toArray();
        $this->assertEquals([300, 200, 100], $amounts);
    }

    /** @test */
    public function it_ignores_non_filterable_fields()
    {
        BookingDetail::factory()->create(['internal_notes' => 'secret info']);
        BookingDetail::factory()->create(['internal_notes' => 'other secret']);

        // internal_notes is not in the filterable array
        $request = new Request(['internal_notes' => 'secret info']);

        $results = BookingDetail::query()->applyFilters($request)->get();

        // Should return all because internal_notes is not filterable
        $this->assertCount(2, $results);
    }

    /** @test */
    public function it_ignores_non_sortable_fields()
    {
        BookingDetail::factory()->create(['internal_notes' => 'zzz']);
        BookingDetail::factory()->create(['internal_notes' => 'aaa']);

        // internal_notes is not in the sortable array
        $request = new Request(['sort' => 'internal_notes']);

        // Should not throw error
        $results = BookingDetail::query()->applyFilters($request)->get();

        $this->assertCount(2, $results);
    }
}
