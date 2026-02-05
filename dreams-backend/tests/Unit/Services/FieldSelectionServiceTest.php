<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Models\EventPackage;
use App\Services\FieldSelectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class FieldSelectionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected FieldSelectionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new FieldSelectionService();
    }

    public function test_parse_fields_from_string_format(): void
    {
        $request = Request::create('/api/users', 'GET', ['fields' => 'id,name,email']);
        
        $fields = $this->service->parseFields($request);
        
        $this->assertEquals(['id', 'name', 'email'], $fields);
    }

    public function test_parse_fields_from_array_format(): void
    {
        $request = Request::create('/api/users', 'GET', [
            'fields' => [
                'users' => 'id,name',
                'bookings' => 'id,status',
            ],
        ]);
        
        $fields = $this->service->parseFields($request, 'users');
        
        $this->assertEquals(['id', 'name'], $fields);
    }

    public function test_parse_fields_returns_empty_when_no_fields(): void
    {
        $request = Request::create('/api/users', 'GET');
        
        $fields = $this->service->parseFields($request);
        
        $this->assertEmpty($fields);
    }

    public function test_has_field_selection_returns_true_when_fields_present(): void
    {
        $request = Request::create('/api/users', 'GET', ['fields' => 'id,name']);
        
        $this->assertTrue($this->service->hasFieldSelection($request));
    }

    public function test_has_field_selection_returns_false_when_no_fields(): void
    {
        $request = Request::create('/api/users', 'GET');
        
        $this->assertFalse($this->service->hasFieldSelection($request));
    }

    public function test_filter_fields_returns_only_requested_fields(): void
    {
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $filtered = $this->service->filterFields($user, ['name', 'email']);

        $this->assertArrayHasKey('id', $filtered);
        $this->assertArrayHasKey('name', $filtered);
        $this->assertArrayHasKey('email', $filtered);
        $this->assertArrayNotHasKey('created_at', $filtered);
        $this->assertArrayNotHasKey('updated_at', $filtered);
    }

    public function test_filter_fields_always_includes_id(): void
    {
        $user = User::factory()->create();

        $filtered = $this->service->filterFields($user, ['name']);

        $this->assertArrayHasKey('id', $filtered);
        $this->assertArrayHasKey('name', $filtered);
    }

    public function test_filter_fields_excludes_sensitive_fields(): void
    {
        $user = User::factory()->create();

        // Try to request password field
        $filtered = $this->service->filterFields($user, ['name', 'password', 'remember_token']);

        $this->assertArrayHasKey('name', $filtered);
        $this->assertArrayNotHasKey('password', $filtered);
        $this->assertArrayNotHasKey('remember_token', $filtered);
    }

    public function test_filter_fields_returns_all_when_no_fields_requested(): void
    {
        $user = User::factory()->create();

        $filtered = $this->service->filterFields($user, []);

        // Should return all visible fields
        $this->assertArrayHasKey('id', $filtered);
        $this->assertArrayHasKey('name', $filtered);
        $this->assertArrayHasKey('email', $filtered);
    }

    public function test_filter_collection_filters_all_models(): void
    {
        $users = User::factory()->count(3)->create();
        $collection = User::all();

        $filtered = $this->service->filterCollection($collection, ['name', 'email']);

        $this->assertCount(3, $filtered);
        foreach ($filtered as $user) {
            $this->assertArrayHasKey('id', $user);
            $this->assertArrayHasKey('name', $user);
            $this->assertArrayHasKey('email', $user);
            $this->assertArrayNotHasKey('created_at', $user);
        }
    }

    public function test_get_fields_for_resource_returns_resource_specific_fields(): void
    {
        $request = Request::create('/api/bookings', 'GET', [
            'fields' => [
                'booking' => 'id,status',
                'client' => 'id,name',
            ],
        ]);

        $bookingFields = $this->service->getFieldsForResource($request, 'booking');
        $clientFields = $this->service->getFieldsForResource($request, 'client');

        $this->assertEquals(['id', 'status'], $bookingFields);
        $this->assertEquals(['id', 'name'], $clientFields);
    }

    public function test_parse_includes_returns_relationships(): void
    {
        $request = Request::create('/api/bookings', 'GET', ['include' => 'client,package,venue']);

        $includes = $this->service->parseIncludes($request);

        $this->assertEquals(['client', 'package', 'venue'], $includes);
    }

    public function test_parse_includes_returns_empty_when_none(): void
    {
        $request = Request::create('/api/bookings', 'GET');

        $includes = $this->service->parseIncludes($request);

        $this->assertEmpty($includes);
    }

    public function test_build_eager_loads_with_field_selection(): void
    {
        $request = Request::create('/api/bookings', 'GET', [
            'include' => 'client,package',
            'fields' => [
                'client' => 'id,name,email',
                'package' => 'id,name,price',
            ],
        ]);

        $eagerLoads = $this->service->buildEagerLoads($request, ['client', 'package', 'venue']);

        $this->assertArrayHasKey('client', $eagerLoads);
        $this->assertArrayHasKey('package', $eagerLoads);
        $this->assertIsCallable($eagerLoads['client']);
        $this->assertIsCallable($eagerLoads['package']);
    }

    public function test_build_eager_loads_filters_unallowed_includes(): void
    {
        $request = Request::create('/api/bookings', 'GET', [
            'include' => 'client,secret_data',
        ]);

        $eagerLoads = $this->service->buildEagerLoads($request, ['client', 'package']);

        // secret_data should be filtered out
        $this->assertContains('client', $eagerLoads);
        $this->assertNotContains('secret_data', $eagerLoads);
    }

    public function test_validate_fields_filters_unallowed(): void
    {
        $requested = ['id', 'name', 'email', 'secret_field'];
        $allowed = ['id', 'name', 'email', 'created_at'];

        $validated = $this->service->validateFields($requested, $allowed);

        $this->assertEquals(['id', 'name', 'email'], array_values($validated));
    }

    public function test_validate_fields_allows_all_when_no_restrictions(): void
    {
        $requested = ['id', 'name', 'email', 'any_field'];

        $validated = $this->service->validateFields($requested, []);

        $this->assertEquals($requested, $validated);
    }

    public function test_add_excluded_field(): void
    {
        $this->service->addExcludedField('custom_secret');

        $excluded = $this->service->getExcludedFields();

        $this->assertContains('custom_secret', $excluded);
        $this->assertContains('password', $excluded);
    }

    public function test_apply_to_query_selects_fields(): void
    {
        User::factory()->count(3)->create();

        $query = User::query();
        $query = $this->service->applyToQuery($query, ['name', 'email']);
        
        $users = $query->get();

        foreach ($users as $user) {
            $attributes = $user->getAttributes();
            $this->assertArrayHasKey('id', $attributes);
            $this->assertArrayHasKey('name', $attributes);
            $this->assertArrayHasKey('email', $attributes);
        }
    }

    public function test_fields_with_spaces_are_trimmed(): void
    {
        $request = Request::create('/api/users', 'GET', ['fields' => 'id, name , email']);
        
        $fields = $this->service->parseFields($request);
        
        $this->assertEquals(['id', 'name', 'email'], $fields);
    }
}
