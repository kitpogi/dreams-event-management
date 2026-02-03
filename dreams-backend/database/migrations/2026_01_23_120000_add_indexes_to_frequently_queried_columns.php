<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add indexes to frequently queried columns for better query performance.
     */
    public function up(): void
    {
        // Add indexes to booking_details table
        Schema::table('booking_details', function (Blueprint $table) {
            // Check if indexes don't already exist before adding
            if (!$this->indexExists('booking_details', 'booking_details_client_id_index')) {
                $table->index('client_id', 'booking_details_client_id_index');
            }
            if (!$this->indexExists('booking_details', 'booking_details_package_id_index')) {
                $table->index('package_id', 'booking_details_package_id_index');
            }
            if (!$this->indexExists('booking_details', 'booking_details_coordinator_id_index')) {
                $table->index('coordinator_id', 'booking_details_coordinator_id_index');
            }
            if (!$this->indexExists('booking_details', 'booking_details_booking_status_index')) {
                $table->index('booking_status', 'booking_details_booking_status_index');
            }
            if (!$this->indexExists('booking_details', 'booking_details_created_at_index')) {
                $table->index('created_at', 'booking_details_created_at_index');
            }
            if (!$this->indexExists('booking_details', 'booking_details_event_date_index')) {
                $table->index('event_date', 'booking_details_event_date_index');
            }
            
            // Composite index for common query pattern: status + created_at
            if (!$this->indexExists('booking_details', 'booking_details_status_created_at_index')) {
                $table->index(['booking_status', 'created_at'], 'booking_details_status_created_at_index');
            }
        });

        // Add indexes to reviews table
        Schema::table('reviews', function (Blueprint $table) {
            if (!$this->indexExists('reviews', 'reviews_package_id_index')) {
                $table->index('package_id', 'reviews_package_id_index');
            }
            if (!$this->indexExists('reviews', 'reviews_client_id_index')) {
                $table->index('client_id', 'reviews_client_id_index');
            }
            if (!$this->indexExists('reviews', 'reviews_created_at_index')) {
                $table->index('created_at', 'reviews_created_at_index');
            }
            
            // Composite index for package reviews query
            if (!$this->indexExists('reviews', 'reviews_package_created_index')) {
                $table->index(['package_id', 'created_at'], 'reviews_package_created_index');
            }
        });

        // Add indexes to portfolio_items table
        if (Schema::hasTable('portfolio_items')) {
            Schema::table('portfolio_items', function (Blueprint $table) {
                if (!$this->indexExists('portfolio_items', 'portfolio_items_category_index')) {
                    $table->index('category', 'portfolio_items_category_index');
                }
                if (!$this->indexExists('portfolio_items', 'portfolio_items_is_featured_index')) {
                    $table->index('is_featured', 'portfolio_items_is_featured_index');
                }
                if (!$this->indexExists('portfolio_items', 'portfolio_items_display_order_index')) {
                    $table->index('display_order', 'portfolio_items_display_order_index');
                }
                if (!$this->indexExists('portfolio_items', 'portfolio_items_event_date_index')) {
                    $table->index('event_date', 'portfolio_items_event_date_index');
                }
                
                // Composite index for featured items query
                if (!$this->indexExists('portfolio_items', 'portfolio_items_featured_order_index')) {
                    $table->index(['is_featured', 'display_order', 'event_date'], 'portfolio_items_featured_order_index');
                }
            });
        }

        // Add indexes to testimonials table
        if (Schema::hasTable('testimonials')) {
            Schema::table('testimonials', function (Blueprint $table) {
                if (!$this->indexExists('testimonials', 'testimonials_is_featured_index')) {
                    $table->index('is_featured', 'testimonials_is_featured_index');
                }
                if (!$this->indexExists('testimonials', 'testimonials_rating_index')) {
                    $table->index('rating', 'testimonials_rating_index');
                }
                if (!$this->indexExists('testimonials', 'testimonials_created_at_index')) {
                    $table->index('created_at', 'testimonials_created_at_index');
                }
            });
        }

        // Add indexes to contact_inquiries table
        if (Schema::hasTable('contact_inquiries')) {
            Schema::table('contact_inquiries', function (Blueprint $table) {
                if (!$this->indexExists('contact_inquiries', 'contact_inquiries_status_index')) {
                    $table->index('status', 'contact_inquiries_status_index');
                }
                if (!$this->indexExists('contact_inquiries', 'contact_inquiries_created_at_index')) {
                    $table->index('created_at', 'contact_inquiries_created_at_index');
                }
                if (!$this->indexExists('contact_inquiries', 'contact_inquiries_updated_at_index')) {
                    $table->index('updated_at', 'contact_inquiries_updated_at_index');
                }
                
                // Composite index for status + date filtering
                if (!$this->indexExists('contact_inquiries', 'contact_inquiries_status_updated_index')) {
                    $table->index(['status', 'updated_at'], 'contact_inquiries_status_updated_index');
                }
            });
        }

        // Add indexes to event_packages table (if not already present)
        if (Schema::hasTable('event_packages')) {
            Schema::table('event_packages', function (Blueprint $table) {
                if (!$this->indexExists('event_packages', 'event_packages_package_category_index')) {
                    $table->index('package_category', 'event_packages_package_category_index');
                }
                if (!$this->indexExists('event_packages', 'event_packages_venue_id_index')) {
                    $table->index('venue_id', 'event_packages_venue_id_index');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes from booking_details
        Schema::table('booking_details', function (Blueprint $table) {
            $table->dropIndex('booking_details_client_id_index');
            $table->dropIndex('booking_details_package_id_index');
            $table->dropIndex('booking_details_coordinator_id_index');
            $table->dropIndex('booking_details_booking_status_index');
            $table->dropIndex('booking_details_created_at_index');
            $table->dropIndex('booking_details_event_date_index');
            $table->dropIndex('booking_details_status_created_at_index');
        });

        // Drop indexes from reviews
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex('reviews_package_id_index');
            $table->dropIndex('reviews_client_id_index');
            $table->dropIndex('reviews_created_at_index');
            $table->dropIndex('reviews_package_created_index');
        });

        // Drop indexes from portfolio_items
        if (Schema::hasTable('portfolio_items')) {
            Schema::table('portfolio_items', function (Blueprint $table) {
                $table->dropIndex('portfolio_items_category_index');
                $table->dropIndex('portfolio_items_is_featured_index');
                $table->dropIndex('portfolio_items_display_order_index');
                $table->dropIndex('portfolio_items_event_date_index');
                $table->dropIndex('portfolio_items_featured_order_index');
            });
        }

        // Drop indexes from testimonials
        if (Schema::hasTable('testimonials')) {
            Schema::table('testimonials', function (Blueprint $table) {
                $table->dropIndex('testimonials_is_featured_index');
                $table->dropIndex('testimonials_rating_index');
                $table->dropIndex('testimonials_created_at_index');
            });
        }

        // Drop indexes from contact_inquiries
        if (Schema::hasTable('contact_inquiries')) {
            Schema::table('contact_inquiries', function (Blueprint $table) {
                $table->dropIndex('contact_inquiries_status_index');
                $table->dropIndex('contact_inquiries_created_at_index');
                $table->dropIndex('contact_inquiries_updated_at_index');
                $table->dropIndex('contact_inquiries_status_updated_index');
            });
        }

        // Drop indexes from event_packages
        if (Schema::hasTable('event_packages')) {
            Schema::table('event_packages', function (Blueprint $table) {
                $table->dropIndex('event_packages_package_category_index');
                $table->dropIndex('event_packages_venue_id_index');
            });
        }
    }

    /**
     * Check if an index exists on a table.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $databaseName = $connection->getDatabaseName();
        
        $result = $connection->select(
            "SELECT COUNT(*) as count FROM information_schema.statistics 
             WHERE table_schema = ? AND table_name = ? AND index_name = ?",
            [$databaseName, $table, $indexName]
        );
        
        return $result[0]->count > 0;
    }
};
