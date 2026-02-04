<?php

namespace App\Services\Contracts;

use App\Models\Client;
use App\Models\EventPackage;

/**
 * Contract for Recommendation Service operations.
 */
interface RecommendationServiceInterface
{
    /**
     * Get package recommendations for a client.
     *
     * @param Client $client
     * @param array $criteria
     * @param int $limit
     * @return array
     */
    public function getRecommendations(Client $client, array $criteria = [], int $limit = 5): array;

    /**
     * Score a package for a given set of criteria.
     *
     * @param EventPackage $package
     * @param array $criteria
     * @return float
     */
    public function scorePackage(EventPackage $package, array $criteria): float;

    /**
     * Get top packages by category.
     *
     * @param string $category
     * @param int $limit
     * @return array
     */
    public function getTopByCategory(string $category, int $limit = 5): array;

    /**
     * Get similar packages.
     *
     * @param int $packageId
     * @param int $limit
     * @return array
     */
    public function getSimilarPackages(int $packageId, int $limit = 5): array;

    /**
     * Get personalized recommendations based on client history.
     *
     * @param Client $client
     * @param int $limit
     * @return array
     */
    public function getPersonalizedRecommendations(Client $client, int $limit = 5): array;

    /**
     * Log a recommendation view/interaction.
     *
     * @param int $clientId
     * @param int $packageId
     * @param string $interactionType
     * @return void
     */
    public function logInteraction(int $clientId, int $packageId, string $interactionType): void;
}
