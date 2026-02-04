<?php

namespace App\DTO\Common;

use App\DTO\BaseDTO;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Pagination DTO
 * 
 * Encapsulates pagination metadata for API responses.
 */
class PaginationDTO extends BaseDTO
{
    public function __construct(
        public readonly int $currentPage,
        public readonly int $perPage,
        public readonly int $total,
        public readonly int $lastPage,
        public readonly ?string $nextPageUrl = null,
        public readonly ?string $prevPageUrl = null,
        public readonly int $from = 0,
        public readonly int $to = 0,
    ) {}

    /**
     * Create DTO from Laravel's LengthAwarePaginator.
     */
    public static function fromPaginator(LengthAwarePaginator $paginator): static
    {
        return new static(
            currentPage: $paginator->currentPage(),
            perPage: $paginator->perPage(),
            total: $paginator->total(),
            lastPage: $paginator->lastPage(),
            nextPageUrl: $paginator->nextPageUrl(),
            prevPageUrl: $paginator->previousPageUrl(),
            from: $paginator->firstItem() ?? 0,
            to: $paginator->lastItem() ?? 0,
        );
    }

    /**
     * Create DTO from request (extracts pagination params).
     */
    public static function fromRequest(Request $request): static
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 100)); // Clamp between 1 and 100

        return new static(
            currentPage: (int) $request->query('page', 1),
            perPage: $perPage,
            total: 0,
            lastPage: 1,
        );
    }

    /**
     * Create DTO from array.
     */
    public static function fromArray(array $data): static
    {
        return new static(
            currentPage: (int) ($data['current_page'] ?? 1),
            perPage: (int) ($data['per_page'] ?? 15),
            total: (int) ($data['total'] ?? 0),
            lastPage: (int) ($data['last_page'] ?? 1),
            nextPageUrl: $data['next_page_url'] ?? null,
            prevPageUrl: $data['prev_page_url'] ?? null,
            from: (int) ($data['from'] ?? 0),
            to: (int) ($data['to'] ?? 0),
        );
    }

    /**
     * Check if there are more pages.
     */
    public function hasMorePages(): bool
    {
        return $this->currentPage < $this->lastPage;
    }

    /**
     * Check if on first page.
     */
    public function isFirstPage(): bool
    {
        return $this->currentPage === 1;
    }

    /**
     * Check if on last page.
     */
    public function isLastPage(): bool
    {
        return $this->currentPage >= $this->lastPage;
    }

    /**
     * Get pagination for meta response.
     */
    public function toMeta(): array
    {
        return [
            'current_page' => $this->currentPage,
            'per_page' => $this->perPage,
            'total' => $this->total,
            'last_page' => $this->lastPage,
            'from' => $this->from,
            'to' => $this->to,
        ];
    }

    /**
     * Get pagination links.
     */
    public function toLinks(): array
    {
        return [
            'next' => $this->nextPageUrl,
            'prev' => $this->prevPageUrl,
        ];
    }
}
