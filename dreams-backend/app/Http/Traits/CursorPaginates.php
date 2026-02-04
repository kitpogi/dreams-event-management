<?php

namespace App\Http\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\CursorPaginator;

/**
 * Trait for adding cursor-based pagination to controllers.
 * 
 * Cursor pagination is more efficient for large datasets as it doesn't
 * need to count total records and uses indexed lookups.
 * 
 * Usage:
 * return $this->cursorPaginate($query, $request, ['id', 'created_at']);
 */
trait CursorPaginates
{
    /**
     * Apply cursor pagination to a query.
     *
     * @param Builder $query
     * @param Request $request
     * @param array $columns Columns to include in the cursor (must be unique/ordered)
     * @param int $perPage
     * @return array
     */
    protected function cursorPaginate(
        Builder $query, 
        Request $request, 
        array $columns = ['id'], 
        int $perPage = 15
    ): array {
        $perPage = min((int) $request->input('per_page', $perPage), 100);
        
        $paginator = $query->cursorPaginate($perPage, ['*'], 'cursor', $request->input('cursor'));

        return $this->formatCursorPaginatedResponse($paginator);
    }

    /**
     * Format cursor paginated response.
     *
     * @param CursorPaginator $paginator
     * @return array
     */
    protected function formatCursorPaginatedResponse(CursorPaginator $paginator): array
    {
        return [
            'data' => $paginator->items(),
            'meta' => [
                'per_page' => $paginator->perPage(),
                'has_more_pages' => $paginator->hasMorePages(),
                'next_cursor' => $paginator->nextCursor()?->encode(),
                'prev_cursor' => $paginator->previousCursor()?->encode(),
                'path' => $paginator->path(),
            ],
            'links' => [
                'next' => $paginator->nextPageUrl(),
                'prev' => $paginator->previousPageUrl(),
            ],
        ];
    }

    /**
     * Apply cursor pagination with resource transformation.
     *
     * @param Builder $query
     * @param Request $request
     * @param string $resourceClass The API Resource class to use
     * @param int $perPage
     * @return array
     */
    protected function cursorPaginateWithResource(
        Builder $query,
        Request $request,
        string $resourceClass,
        int $perPage = 15
    ): array {
        $perPage = min((int) $request->input('per_page', $perPage), 100);
        
        $paginator = $query->cursorPaginate($perPage, ['*'], 'cursor', $request->input('cursor'));

        return [
            'data' => $resourceClass::collection($paginator->items()),
            'meta' => [
                'per_page' => $paginator->perPage(),
                'has_more_pages' => $paginator->hasMorePages(),
                'next_cursor' => $paginator->nextCursor()?->encode(),
                'prev_cursor' => $paginator->previousCursor()?->encode(),
                'path' => $paginator->path(),
            ],
            'links' => [
                'next' => $paginator->nextPageUrl(),
                'prev' => $paginator->previousPageUrl(),
            ],
        ];
    }

    /**
     * Determine if cursor pagination should be used based on request.
     *
     * @param Request $request
     * @return bool
     */
    protected function shouldUseCursorPagination(Request $request): bool
    {
        // Use cursor pagination if:
        // 1. Client explicitly requests it
        // 2. Cursor parameter is present
        return $request->boolean('use_cursor') || $request->has('cursor');
    }

    /**
     * Smart pagination that auto-selects between offset and cursor.
     *
     * @param Builder $query
     * @param Request $request
     * @param int $perPage
     * @return array
     */
    protected function smartPaginate(Builder $query, Request $request, int $perPage = 15): array
    {
        if ($this->shouldUseCursorPagination($request)) {
            return $this->cursorPaginate($query, $request, ['id'], $perPage);
        }

        // Fall back to offset pagination
        $perPage = min((int) $request->input('per_page', $perPage), 100);
        $page = max((int) $request->input('page', 1), 1);
        
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'links' => [
                'first' => $paginator->url(1),
                'last' => $paginator->url($paginator->lastPage()),
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ],
        ];
    }
}
