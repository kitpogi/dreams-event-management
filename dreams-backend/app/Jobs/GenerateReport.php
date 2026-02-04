<?php

namespace App\Jobs;

use App\Models\BookingDetail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Job to generate reports asynchronously.
 */
class GenerateReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 2;

    /**
     * The maximum number of seconds the job can run.
     */
    public int $timeout = 300;

    /**
     * Report type constants.
     */
    public const TYPE_BOOKING_SUMMARY = 'booking_summary';
    public const TYPE_REVENUE = 'revenue';
    public const TYPE_CLIENT_ACTIVITY = 'client_activity';
    public const TYPE_PACKAGE_PERFORMANCE = 'package_performance';

    /**
     * Create a new job instance.
     * 
     * @param string $type Report type
     * @param array<string, mixed> $parameters Report parameters (date range, filters, etc.)
     * @param int|null $userId User who requested the report
     */
    public function __construct(
        public string $type,
        public array $parameters = [],
        public ?int $userId = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Generating report', [
            'type' => $this->type,
            'parameters' => $this->parameters,
            'user_id' => $this->userId,
        ]);

        $data = match ($this->type) {
            self::TYPE_BOOKING_SUMMARY => $this->generateBookingSummary(),
            self::TYPE_REVENUE => $this->generateRevenueReport(),
            self::TYPE_CLIENT_ACTIVITY => $this->generateClientActivityReport(),
            self::TYPE_PACKAGE_PERFORMANCE => $this->generatePackagePerformanceReport(),
            default => throw new \InvalidArgumentException("Unknown report type: {$this->type}"),
        };

        $filename = $this->saveReport($data);

        Log::info('Report generated successfully', [
            'type' => $this->type,
            'filename' => $filename,
            'user_id' => $this->userId,
        ]);

        // TODO: Notify user that report is ready (email, notification, etc.)
    }

    /**
     * Generate booking summary report.
     *
     * @return array<string, mixed>
     */
    protected function generateBookingSummary(): array
    {
        $startDate = $this->parameters['start_date'] ?? now()->startOfMonth();
        $endDate = $this->parameters['end_date'] ?? now()->endOfMonth();

        $bookings = BookingDetail::query()
            ->whereBetween('event_date', [$startDate, $endDate])
            ->with(['client', 'package', 'venue'])
            ->get();

        $byStatus = $bookings->groupBy('status')->map->count();
        $totalRevenue = $bookings->sum('total_amount');
        $totalGuests = $bookings->sum('guest_count');

        return [
            'report_type' => 'Booking Summary',
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
            'summary' => [
                'total_bookings' => $bookings->count(),
                'total_revenue' => $totalRevenue,
                'total_guests' => $totalGuests,
                'by_status' => $byStatus,
            ],
            'bookings' => $bookings->map(fn ($b) => [
                'id' => $b->id,
                'client' => $b->client?->full_name,
                'event_date' => $b->event_date,
                'status' => $b->status,
                'total_amount' => $b->total_amount,
            ])->toArray(),
            'generated_at' => now()->toISOString(),
        ];
    }

    /**
     * Generate revenue report.
     *
     * @return array<string, mixed>
     */
    protected function generateRevenueReport(): array
    {
        $startDate = $this->parameters['start_date'] ?? now()->startOfMonth();
        $endDate = $this->parameters['end_date'] ?? now()->endOfMonth();

        $bookings = BookingDetail::query()
            ->whereBetween('event_date', [$startDate, $endDate])
            ->whereIn('status', ['confirmed', 'completed'])
            ->with('package')
            ->get();

        $byPackage = $bookings->groupBy('package_id')->map(fn ($group) => [
            'package_name' => $group->first()->package?->name ?? 'Unknown',
            'count' => $group->count(),
            'total' => $group->sum('total_amount'),
        ]);

        $byMonth = $bookings->groupBy(fn ($b) => \Carbon\Carbon::parse($b->event_date)->format('Y-m'))
            ->map(fn ($group) => [
                'count' => $group->count(),
                'total' => $group->sum('total_amount'),
            ]);

        return [
            'report_type' => 'Revenue Report',
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
            'summary' => [
                'total_revenue' => $bookings->sum('total_amount'),
                'total_bookings' => $bookings->count(),
                'average_booking_value' => $bookings->avg('total_amount'),
            ],
            'by_package' => $byPackage->toArray(),
            'by_month' => $byMonth->toArray(),
            'generated_at' => now()->toISOString(),
        ];
    }

    /**
     * Generate client activity report.
     *
     * @return array<string, mixed>
     */
    protected function generateClientActivityReport(): array
    {
        $startDate = $this->parameters['start_date'] ?? now()->startOfMonth();
        $endDate = $this->parameters['end_date'] ?? now()->endOfMonth();

        $bookings = BookingDetail::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with('client')
            ->get();

        $byClient = $bookings->groupBy('client_id')->map(fn ($group) => [
            'client_name' => $group->first()->client?->full_name ?? 'Unknown',
            'bookings_count' => $group->count(),
            'total_spent' => $group->sum('total_amount'),
        ])->sortByDesc('total_spent')->take(20);

        return [
            'report_type' => 'Client Activity Report',
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
            'summary' => [
                'total_clients' => $bookings->pluck('client_id')->unique()->count(),
                'new_bookings' => $bookings->count(),
            ],
            'top_clients' => $byClient->toArray(),
            'generated_at' => now()->toISOString(),
        ];
    }

    /**
     * Generate package performance report.
     *
     * @return array<string, mixed>
     */
    protected function generatePackagePerformanceReport(): array
    {
        $startDate = $this->parameters['start_date'] ?? now()->startOfMonth();
        $endDate = $this->parameters['end_date'] ?? now()->endOfMonth();

        $bookings = BookingDetail::query()
            ->whereBetween('event_date', [$startDate, $endDate])
            ->with(['package', 'package.reviews'])
            ->get();

        $byPackage = $bookings->groupBy('package_id')->map(fn ($group) => [
            'package_name' => $group->first()->package?->name ?? 'Unknown',
            'bookings_count' => $group->count(),
            'total_revenue' => $group->sum('total_amount'),
            'average_guests' => $group->avg('guest_count'),
            'average_rating' => $group->first()->package?->reviews->avg('rating'),
        ])->sortByDesc('bookings_count');

        return [
            'report_type' => 'Package Performance Report',
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
            'packages' => $byPackage->toArray(),
            'generated_at' => now()->toISOString(),
        ];
    }

    /**
     * Save the report to storage.
     */
    protected function saveReport(array $data): string
    {
        $filename = sprintf(
            'reports/%s/%s_%s.json',
            now()->format('Y-m'),
            $this->type,
            now()->format('Y-m-d_His')
        );

        Storage::put($filename, json_encode($data, JSON_PRETTY_PRINT));

        return $filename;
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Failed to generate report', [
            'type' => $this->type,
            'user_id' => $this->userId,
            'error' => $exception->getMessage(),
        ]);
    }

    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        $tags = ['report', 'type:' . $this->type];
        
        if ($this->userId) {
            $tags[] = 'user:' . $this->userId;
        }
        
        return $tags;
    }
}
