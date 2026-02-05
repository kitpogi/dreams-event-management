<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class FieldSelectionService
{
    /**
     * Default excluded fields for security.
     */
    protected array $globalExcludedFields = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'api_token',
        'encryption_key',
    ];

    /**
     * Parse requested fields from the request.
     */
    public function parseFields(Request $request, ?string $resourceType = null): array
    {
        $fieldsParam = $request->input('fields');

        if (empty($fieldsParam)) {
            return [];
        }

        // Handle string format: ?fields=id,name,email
        if (is_string($fieldsParam)) {
            return array_map('trim', explode(',', $fieldsParam));
        }

        // Handle array format: ?fields[users]=id,name&fields[posts]=id,title
        if (is_array($fieldsParam)) {
            if ($resourceType && isset($fieldsParam[$resourceType])) {
                return array_map('trim', explode(',', $fieldsParam[$resourceType]));
            }
            return [];
        }

        return [];
    }

    /**
     * Check if specific fields were requested.
     */
    public function hasFieldSelection(Request $request): bool
    {
        return $request->has('fields') && !empty($request->input('fields'));
    }

    /**
     * Get fields for a specific resource type.
     */
    public function getFieldsForResource(Request $request, string $resourceType): array
    {
        $fieldsParam = $request->input('fields');

        if (empty($fieldsParam)) {
            return [];
        }

        if (is_array($fieldsParam) && isset($fieldsParam[$resourceType])) {
            return array_map('trim', explode(',', $fieldsParam[$resourceType]));
        }

        // If fields is a string and no resource type specified, assume it's for the main resource
        if (is_string($fieldsParam)) {
            return array_map('trim', explode(',', $fieldsParam));
        }

        return [];
    }

    /**
     * Filter model attributes to only include requested fields.
     */
    public function filterFields(Model $model, array $requestedFields, array $alwaysInclude = ['id']): array
    {
        if (empty($requestedFields)) {
            return $model->toArray();
        }

        // Merge always-included fields
        $fields = array_unique(array_merge($requestedFields, $alwaysInclude));

        // Remove globally excluded fields
        $fields = array_diff($fields, $this->globalExcludedFields);

        $data = [];
        $modelArray = $model->toArray();

        foreach ($fields as $field) {
            if (array_key_exists($field, $modelArray)) {
                $data[$field] = $modelArray[$field];
            }
        }

        return $data;
    }

    /**
     * Filter a collection of models.
     */
    public function filterCollection(Collection $collection, array $requestedFields, array $alwaysInclude = ['id']): Collection
    {
        if (empty($requestedFields)) {
            return $collection;
        }

        return $collection->map(function ($model) use ($requestedFields, $alwaysInclude) {
            if ($model instanceof Model) {
                return $this->filterFields($model, $requestedFields, $alwaysInclude);
            }
            return $model;
        });
    }

    /**
     * Apply field selection to a query builder.
     */
    public function applyToQuery($query, array $requestedFields, array $alwaysInclude = ['id']): mixed
    {
        if (empty($requestedFields)) {
            return $query;
        }

        $fields = array_unique(array_merge($requestedFields, $alwaysInclude));
        $fields = array_diff($fields, $this->globalExcludedFields);

        return $query->select($fields);
    }

    /**
     * Get the include parameter for eager loading specific fields.
     */
    public function parseIncludes(Request $request): array
    {
        $includeParam = $request->input('include');

        if (empty($includeParam)) {
            return [];
        }

        return array_map('trim', explode(',', $includeParam));
    }

    /**
     * Build eager loading with field selection.
     */
    public function buildEagerLoads(Request $request, array $allowedIncludes = []): array
    {
        $includes = $this->parseIncludes($request);
        $eagerLoads = [];

        foreach ($includes as $include) {
            // Skip if not in allowed includes
            if (!empty($allowedIncludes) && !in_array($include, $allowedIncludes)) {
                continue;
            }

            $fields = $this->getFieldsForResource($request, $include);

            if (!empty($fields)) {
                // Add 'id' and any foreign key for the relationship
                $fields = array_unique(array_merge($fields, ['id']));
                $eagerLoads[$include] = function ($query) use ($fields) {
                    $query->select($fields);
                };
            } else {
                $eagerLoads[] = $include;
            }
        }

        return $eagerLoads;
    }

    /**
     * Validate requested fields against allowed fields.
     */
    public function validateFields(array $requestedFields, array $allowedFields): array
    {
        if (empty($allowedFields)) {
            return $requestedFields;
        }

        return array_intersect($requestedFields, $allowedFields);
    }

    /**
     * Add a globally excluded field.
     */
    public function addExcludedField(string $field): self
    {
        if (!in_array($field, $this->globalExcludedFields)) {
            $this->globalExcludedFields[] = $field;
        }
        return $this;
    }

    /**
     * Get all globally excluded fields.
     */
    public function getExcludedFields(): array
    {
        return $this->globalExcludedFields;
    }
}
