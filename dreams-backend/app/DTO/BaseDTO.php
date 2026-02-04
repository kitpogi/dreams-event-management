<?php

namespace App\DTO;

use Illuminate\Http\Request;
use Illuminate\Contracts\Support\Arrayable;
use JsonSerializable;

/**
 * Base Data Transfer Object
 * 
 * Provides common functionality for all DTOs including:
 * - Array/JSON serialization
 * - Factory methods for creation from requests/arrays
 * - Immutability support
 */
abstract class BaseDTO implements Arrayable, JsonSerializable
{
    /**
     * Create a new DTO instance from a request.
     *
     * @param Request $request
     * @return static
     */
    abstract public static function fromRequest(Request $request): static;

    /**
     * Create a new DTO instance from an array.
     *
     * @param array $data
     * @return static
     */
    abstract public static function fromArray(array $data): static;

    /**
     * Convert the DTO to an array.
     *
     * @return array
     */
    public function toArray(): array
    {
        $reflection = new \ReflectionClass($this);
        $properties = $reflection->getProperties(\ReflectionProperty::IS_PUBLIC);
        
        $data = [];
        foreach ($properties as $property) {
            $name = $property->getName();
            $value = $this->{$name};
            
            // Handle nested DTOs
            if ($value instanceof Arrayable) {
                $data[$name] = $value->toArray();
            } elseif (is_array($value)) {
                $data[$name] = array_map(function ($item) {
                    return $item instanceof Arrayable ? $item->toArray() : $item;
                }, $value);
            } else {
                $data[$name] = $value;
            }
        }
        
        return $data;
    }

    /**
     * Specify data which should be serialized to JSON.
     *
     * @return array
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }

    /**
     * Create a new DTO with updated properties.
     *
     * @param array $properties
     * @return static
     */
    public function with(array $properties): static
    {
        $data = $this->toArray();
        return static::fromArray(array_merge($data, $properties));
    }

    /**
     * Get only specified properties.
     *
     * @param array $keys
     * @return array
     */
    public function only(array $keys): array
    {
        return array_intersect_key($this->toArray(), array_flip($keys));
    }

    /**
     * Get all properties except specified ones.
     *
     * @param array $keys
     * @return array
     */
    public function except(array $keys): array
    {
        return array_diff_key($this->toArray(), array_flip($keys));
    }

    /**
     * Check if a property is set and not null.
     *
     * @param string $property
     * @return bool
     */
    public function has(string $property): bool
    {
        return property_exists($this, $property) && $this->{$property} !== null;
    }
}
