<?php

namespace Tests\Unit\Services;

use App\Models\Webhook;
use App\Models\WebhookDelivery;
use App\Services\WebhookService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebhookServiceTest extends TestCase
{
    use RefreshDatabase;

    protected WebhookService $webhookService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->webhookService = new WebhookService();
    }

    public function test_can_register_webhook(): void
    {
        $result = $this->webhookService->register(
            'https://example.com/webhook',
            ['booking.created', 'booking.updated']
        );

        $this->assertArrayHasKey('id', $result);
        $this->assertArrayHasKey('url', $result);
        $this->assertArrayHasKey('events', $result);
        $this->assertArrayHasKey('secret', $result);
        $this->assertEquals('https://example.com/webhook', $result['url']);
        $this->assertContains('booking.created', $result['events']);
    }

    public function test_cannot_register_webhook_with_invalid_url(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid webhook URL');

        $this->webhookService->register(
            'not-a-valid-url',
            ['booking.created']
        );
    }

    public function test_cannot_register_webhook_with_invalid_events(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('No valid events specified');

        $this->webhookService->register(
            'https://example.com/webhook',
            ['invalid.event', 'another.invalid']
        );
    }

    public function test_can_unregister_webhook(): void
    {
        $webhook = Webhook::create([
            'url' => 'https://example.com/webhook',
            'events' => ['booking.created'],
            'secret' => 'test-secret',
            'is_active' => true,
        ]);

        $result = $this->webhookService->unregister($webhook->id);

        $this->assertTrue($result);
        $this->assertNull(Webhook::find($webhook->id));
    }

    public function test_unregister_returns_false_for_nonexistent_webhook(): void
    {
        $result = $this->webhookService->unregister(99999);

        $this->assertFalse($result);
    }

    public function test_verify_signature_with_valid_signature(): void
    {
        $secret = 'my-secret-key';
        $payload = '{"event":"test","data":{}}';
        $signature = hash_hmac('sha256', $payload, $secret);

        $result = $this->webhookService->verifySignature($payload, $signature, $secret);

        $this->assertTrue($result);
    }

    public function test_verify_signature_with_invalid_signature(): void
    {
        $secret = 'my-secret-key';
        $payload = '{"event":"test","data":{}}';
        $wrongSignature = 'invalid-signature';

        $result = $this->webhookService->verifySignature($payload, $wrongSignature, $secret);

        $this->assertFalse($result);
    }

    public function test_get_all_webhooks_returns_active_webhooks(): void
    {
        Webhook::create([
            'url' => 'https://example1.com/webhook',
            'events' => ['booking.created'],
            'secret' => 'secret1',
            'is_active' => true,
        ]);

        Webhook::create([
            'url' => 'https://example2.com/webhook',
            'events' => ['booking.updated'],
            'secret' => 'secret2',
            'is_active' => true,
        ]);

        Webhook::create([
            'url' => 'https://inactive.com/webhook',
            'events' => ['booking.cancelled'],
            'secret' => 'secret3',
            'is_active' => false,
        ]);

        $webhooks = $this->webhookService->getAllWebhooks();

        $this->assertCount(2, $webhooks);
    }

    public function test_update_webhook(): void
    {
        $webhook = Webhook::create([
            'url' => 'https://example.com/webhook',
            'events' => ['booking.created'],
            'secret' => 'test-secret',
            'is_active' => true,
        ]);

        $result = $this->webhookService->updateWebhook($webhook->id, [
            'url' => 'https://new-url.com/webhook',
            'events' => ['booking.updated', 'booking.cancelled'],
            'is_active' => false,
        ]);

        $this->assertEquals('https://new-url.com/webhook', $result['url']);
        $this->assertContains('booking.updated', $result['events']);
        $this->assertFalse($result['is_active']);
    }

    public function test_get_delivery_logs(): void
    {
        $webhook = Webhook::create([
            'url' => 'https://example.com/webhook',
            'events' => ['booking.created'],
            'secret' => 'test-secret',
            'is_active' => true,
        ]);

        WebhookDelivery::create([
            'webhook_id' => $webhook->id,
            'event' => 'booking.created',
            'payload' => '{"test":"data"}',
            'status' => 'success',
            'status_code' => 200,
            'attempts' => 1,
        ]);

        WebhookDelivery::create([
            'webhook_id' => $webhook->id,
            'event' => 'booking.updated',
            'payload' => '{"test":"data2"}',
            'status' => 'failed',
            'status_code' => 500,
            'attempts' => 3,
        ]);

        $logs = $this->webhookService->getDeliveryLogs($webhook->id);

        $this->assertCount(2, $logs);
        // Check that we have both success and failed statuses in the logs
        $statuses = array_column($logs, 'status');
        $this->assertContains('success', $statuses);
        $this->assertContains('failed', $statuses);
    }
}
