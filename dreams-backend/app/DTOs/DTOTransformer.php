<?php

namespace App\DTOs;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\Paginator;

/**
 * Helper class for transforming models to DTOs and vice versa
 */
class DTOTransformer
{
    /**
     * Transform single model to DTO
     */
    public static function toDTO($model, string $dtoClass)
    {
        if ($model === null) {
            return null;
        }

        return $dtoClass::fromModel($model);
    }

    /**
     * Transform collection of models to DTOs
     */
    public static function toDTOCollection(Collection $models, string $dtoClass): array
    {
        return $models->map(fn($model) => static::toDTO($model, $dtoClass))->toArray();
    }

    /**
     * Transform paginated results to DTOs
     */
    public static function toDTOPaginated(Paginator $paginator, string $dtoClass): array
    {
        return [
            'data' => $paginator->map(fn($model) => static::toDTO($model, $dtoClass))->toArray(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ];
    }

    /**
     * Transform request array to Request DTO
     */
    public static function toRequestDTO(array $data, string $dtoClass)
    {
        return $dtoClass::fromArray($data);
    }

    /**
     * Transform Response DTO to array
     */
    public static function toArray($dto): array
    {
        if ($dto === null) {
            return [];
        }

        if (is_array($dto)) {
            return array_map(fn($item) => $item->toArray(), $dto);
        }

        return $dto->toArray();
    }
}
