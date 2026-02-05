<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Trait for implementing sparse fieldsets (field selection) in API responses.
 * 
 * Allows clients to request only specific fields using:
 * - ?fields=id,name,email (comma-separated list)
 * - ?fields[users]=id,name&fields[bookings]=id,status (per-resource fields)
 * 
 * @example GET /api/users?fields=id,name,email
 * @example GET /api/bookings?fields=id,status&include=client&fields[client]=id,name
 */
trait HasSparseFieldsets
{
    /**
     * Default fields to return if no specific fields requested.
     * Override in model to customize.
     */
    public function getDefaultFields(): array
    {
        return ['*'];
    }

    /**
     * Fields that are always included regardless of selection.
     * Override in model to customize.
     */
    public function getAlwaysIncludedFields(): array
    {
        return ['id'];
    }

    /**
     * Fields that cannot be selected (hidden from API).
     * Override in model to customize.
     */
    public function getExcludedFields(): array
    {
        return ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'];
    }

    /**
     * Get allowed fields that can be selected.
     * Override in model to restrict available fields.
     */
    public function getAllowedFields(): array
    {
        return [];  // Empty means all non-excluded fields are allowed
    }

    /**
     * Scope to apply field selection from request.
     */
    public function scopeSelectFields(Builder $query, ?Request $request = null): Builder
    {
        $request = $request ?? request();
        $fields = $this->parseFieldsFromRequest($request);

        if (empty($fields) || $fields === ['*']) {
            return $query;
        }

        // Ensure always-included fields are present
        $fields = array_unique(array_merge($fields, $this->getAlwaysIncludedFields()));

        // Filter out excluded fields
        $fields = array_diff($fields, $this->getExcludedFields());

        // If allowed fields are specified, only allow those
        $allowedFields = $this->getAllowedFields();
        if (!empty($allowedFields)) {
            $fields = array_intersect($fields, array_merge($allowedFields, $this->getAlwaysIncludedFields()));
        }

        return $query->select($fields);
    }

    /**
     * Parse fields from request.
     */
    protected function parseFieldsFromRequest(Request $request): array
    {
        $fieldsParam = $request->input('fields');

        if (empty($fieldsParam)) {
            return $this->getDefaultFields();
        }

        // Handle array format: fields[resource]=field1,field2
        if (is_array($fieldsParam)) {
            $resourceType = $this->getResourceType();
            $fieldsParam = $fieldsParam[$resourceType] ?? null;
            
            if (empty($fieldsParam)) {
                return $this->getDefaultFields();
            }
        }

        // Parse comma-separated fields
        return array_map('trim', explode(',', $fieldsParam));
    }

    /**
     * Get the resource type name for this model.
     * Override in model to customize.
     */
    public function getResourceType(): string
    {
        return strtolower(class_basename($this));
    }

    /**
     * Transform model to array with only selected fields.
     */
    public function toSelectedArray(?array $fields = null): array
    {
        $fields = $fields ?? $this->parseFieldsFromRequest(request());

        if (empty($fields) || $fields === ['*']) {
            return $this->toArray();
        }

        // Ensure always-included fields
        $fields = array_unique(array_merge($fields, $this->getAlwaysIncludedFields()));
        
        // Filter out excluded fields
        $fields = array_diff($fields, $this->getExcludedFields());

        $data = [];
        foreach ($fields as $field) {
            if ($this->offsetExists($field) || isset($this->$field)) {
                $data[$field] = $this->$field;
            }
        }

        return $data;
    }
}
