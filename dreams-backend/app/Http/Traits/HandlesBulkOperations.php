<?php

namespace App\Http\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * Trait for adding bulk operation capabilities to controllers.
 * 
 * Provides standardized methods for bulk create, update, delete, and
 * status change operations with validation and transaction support.
 */
trait HandlesBulkOperations
{
    /**
     * Get the model class for bulk operations.
     * Override in controller to return the model class.
     */
    abstract protected function getBulkModel(): string;

    /**
     * Get validation rules for bulk create.
     * Override to customize validation.
     *
     * @return array<string, mixed>
     */
    protected function getBulkCreateRules(): array
    {
        return [];
    }

    /**
     * Get validation rules for bulk update.
     * Override to customize validation.
     *
     * @return array<string, mixed>
     */
    protected function getBulkUpdateRules(): array
    {
        return [];
    }

    /**
     * Get allowed status values for bulk status change.
     * Override to customize allowed statuses.
     *
     * @return array<int, string>
     */
    protected function getAllowedStatuses(): array
    {
        return ['pending', 'confirmed', 'cancelled', 'completed'];
    }

    /**
     * Get the status field name.
     */
    protected function getStatusField(): string
    {
        return 'status';
    }

    /**
     * Bulk create multiple records.
     */
    public function bulkCreate(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array|min:1|max:100',
            'items.*' => 'required|array',
        ]);

        $items = $request->input('items');
        $rules = $this->getBulkCreateRules();
        $results = [
            'created' => [],
            'failed' => [],
        ];

        DB::beginTransaction();

        try {
            foreach ($items as $index => $itemData) {
                // Validate each item
                if (!empty($rules)) {
                    $validator = Validator::make($itemData, $rules);
                    if ($validator->fails()) {
                        $results['failed'][] = [
                            'index' => $index,
                            'data' => $itemData,
                            'errors' => $validator->errors()->toArray(),
                        ];
                        continue;
                    }
                }

                try {
                    $modelClass = $this->getBulkModel();
                    /** @var Model $model */
                    $model = new $modelClass();
                    $model->fill($itemData);
                    $model->save();

                    $results['created'][] = [
                        'index' => $index,
                        'id' => $model->id,
                    ];
                } catch (\Exception $e) {
                    $results['failed'][] = [
                        'index' => $index,
                        'data' => $itemData,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            // Rollback if any failed
            if (!empty($results['failed'])) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Bulk create partially failed. Transaction rolled back.',
                    'error_code' => 'BULK_CREATE_PARTIAL_FAILURE',
                    'data' => $results,
                ], 422);
            }

            DB::commit();

            Log::info('Bulk create completed', [
                'model' => $this->getBulkModel(),
                'count' => count($results['created']),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bulk create completed successfully',
                'data' => $results,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk create failed', [
                'model' => $this->getBulkModel(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Bulk create failed',
                'error_code' => 'BULK_CREATE_FAILED',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk update multiple records.
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array|min:1|max:100',
            'items.*.id' => 'required|integer',
        ]);

        $items = $request->input('items');
        $rules = $this->getBulkUpdateRules();
        $results = [
            'updated' => [],
            'failed' => [],
        ];

        DB::beginTransaction();

        try {
            $modelClass = $this->getBulkModel();

            foreach ($items as $index => $itemData) {
                $id = $itemData['id'];
                unset($itemData['id']);

                // Validate update data
                if (!empty($rules)) {
                    $validator = Validator::make($itemData, $rules);
                    if ($validator->fails()) {
                        $results['failed'][] = [
                            'index' => $index,
                            'id' => $id,
                            'errors' => $validator->errors()->toArray(),
                        ];
                        continue;
                    }
                }

                try {
                    /** @var Model|null $model */
                    $model = $modelClass::find($id);

                    if (!$model) {
                        $results['failed'][] = [
                            'index' => $index,
                            'id' => $id,
                            'error' => 'Record not found',
                        ];
                        continue;
                    }

                    $model->update($itemData);

                    $results['updated'][] = [
                        'index' => $index,
                        'id' => $id,
                    ];
                } catch (\Exception $e) {
                    $results['failed'][] = [
                        'index' => $index,
                        'id' => $id,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            $hasFailures = !empty($results['failed']);
            $status = $hasFailures ? 207 : 200; // 207 Multi-Status for partial success

            Log::info('Bulk update completed', [
                'model' => $this->getBulkModel(),
                'updated' => count($results['updated']),
                'failed' => count($results['failed']),
            ]);

            return response()->json([
                'success' => !$hasFailures,
                'message' => $hasFailures
                    ? 'Bulk update completed with some failures'
                    : 'Bulk update completed successfully',
                'data' => $results,
            ], $status);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk update failed', [
                'model' => $this->getBulkModel(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Bulk update failed',
                'error_code' => 'BULK_UPDATE_FAILED',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk delete multiple records.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'required|integer',
        ]);

        $ids = $request->input('ids');
        $results = [
            'deleted' => [],
            'failed' => [],
        ];

        DB::beginTransaction();

        try {
            $modelClass = $this->getBulkModel();

            foreach ($ids as $id) {
                try {
                    /** @var Model|null $model */
                    $model = $modelClass::find($id);

                    if (!$model) {
                        $results['failed'][] = [
                            'id' => $id,
                            'error' => 'Record not found',
                        ];
                        continue;
                    }

                    $model->delete();
                    $results['deleted'][] = $id;

                } catch (\Exception $e) {
                    $results['failed'][] = [
                        'id' => $id,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            $hasFailures = !empty($results['failed']);
            $status = $hasFailures ? 207 : 200;

            Log::info('Bulk delete completed', [
                'model' => $this->getBulkModel(),
                'deleted' => count($results['deleted']),
                'failed' => count($results['failed']),
            ]);

            return response()->json([
                'success' => !$hasFailures,
                'message' => $hasFailures
                    ? 'Bulk delete completed with some failures'
                    : 'Bulk delete completed successfully',
                'data' => $results,
            ], $status);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk delete failed', [
                'model' => $this->getBulkModel(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Bulk delete failed',
                'error_code' => 'BULK_DELETE_FAILED',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk update status for multiple records.
     */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $allowedStatuses = $this->getAllowedStatuses();

        $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'required|integer',
            'status' => 'required|string|in:' . implode(',', $allowedStatuses),
        ]);

        $ids = $request->input('ids');
        $newStatus = $request->input('status');
        $statusField = $this->getStatusField();
        $results = [
            'updated' => [],
            'failed' => [],
        ];

        DB::beginTransaction();

        try {
            $modelClass = $this->getBulkModel();

            foreach ($ids as $id) {
                try {
                    /** @var Model|null $model */
                    $model = $modelClass::find($id);

                    if (!$model) {
                        $results['failed'][] = [
                            'id' => $id,
                            'error' => 'Record not found',
                        ];
                        continue;
                    }

                    $oldStatus = $model->{$statusField};
                    $model->{$statusField} = $newStatus;
                    $model->save();

                    $results['updated'][] = [
                        'id' => $id,
                        'old_status' => $oldStatus,
                        'new_status' => $newStatus,
                    ];

                } catch (\Exception $e) {
                    $results['failed'][] = [
                        'id' => $id,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            $hasFailures = !empty($results['failed']);
            $status = $hasFailures ? 207 : 200;

            Log::info('Bulk status update completed', [
                'model' => $this->getBulkModel(),
                'new_status' => $newStatus,
                'updated' => count($results['updated']),
                'failed' => count($results['failed']),
            ]);

            return response()->json([
                'success' => !$hasFailures,
                'message' => $hasFailures
                    ? 'Bulk status update completed with some failures'
                    : 'Bulk status update completed successfully',
                'data' => $results,
            ], $status);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk status update failed', [
                'model' => $this->getBulkModel(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Bulk status update failed',
                'error_code' => 'BULK_STATUS_UPDATE_FAILED',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
