<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Carbon;

class DatabaseBackupService
{
    /**
     * Backup types.
     */
    public const TYPE_FULL = 'full';
    public const TYPE_INCREMENTAL = 'incremental';
    public const TYPE_DIFFERENTIAL = 'differential';

    /**
     * Backup statuses.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    /**
     * Storage disk for backups.
     */
    protected string $disk = 'local';

    /**
     * Backup directory.
     */
    protected string $directory = 'backups/database';

    /**
     * Maximum backups to retain.
     */
    protected int $maxBackups = 30;

    /**
     * Tables to exclude from backup.
     */
    protected array $excludeTables = [
        'personal_access_tokens',
        'failed_jobs',
        'jobs',
        'password_reset_tokens',
        'cache',
        'sessions',
    ];

    /**
     * Tables to include (empty means all).
     */
    protected array $includeTables = [];

    /**
     * Create a new backup.
     */
    public function backup(string $type = self::TYPE_FULL, ?string $description = null): array
    {
        $backupId = $this->generateBackupId();
        $filename = $this->generateFilename($type, $backupId);
        
        try {
            $this->updateBackupStatus($backupId, self::STATUS_IN_PROGRESS);
            
            $tables = $this->getTablesToBackup();
            $data = [];
            $rowCount = 0;
            
            foreach ($tables as $table) {
                $tableData = $this->backupTable($table);
                $data[$table] = $tableData;
                $rowCount += count($tableData);
            }
            
            $backup = [
                'id' => $backupId,
                'type' => $type,
                'filename' => $filename,
                'description' => $description,
                'tables' => $tables,
                'row_count' => $rowCount,
                'created_at' => now()->toIso8601String(),
                'database' => config('database.connections.mysql.database', 'default'),
                'connection' => config('database.default'),
            ];
            
            // Prepare backup content
            $content = json_encode([
                'metadata' => $backup,
                'data' => $data,
            ], JSON_PRETTY_PRINT);
            
            // Store backup
            Storage::disk($this->disk)->put(
                "{$this->directory}/{$filename}",
                $content
            );
            
            $backup['size'] = strlen($content);
            $backup['status'] = self::STATUS_COMPLETED;
            
            $this->updateBackupStatus($backupId, self::STATUS_COMPLETED, $backup);
            $this->recordBackupHistory($backup);
            $this->cleanupOldBackups();
            
            Log::channel('backups')->info('Database backup completed', $backup);
            
            return [
                'success' => true,
                'backup' => $backup,
            ];
        } catch (\Throwable $e) {
            $this->updateBackupStatus($backupId, self::STATUS_FAILED, [
                'error' => $e->getMessage(),
            ]);
            
            Log::channel('backups')->error('Database backup failed', [
                'backup_id' => $backupId,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'backup_id' => $backupId,
            ];
        }
    }

    /**
     * Backup a single table.
     */
    protected function backupTable(string $table): array
    {
        return DB::table($table)->get()->toArray();
    }

    /**
     * Restore from a backup.
     */
    public function restore(string $backupId, array $options = []): array
    {
        $backup = $this->getBackup($backupId);
        
        if (!$backup) {
            return [
                'success' => false,
                'error' => 'Backup not found',
            ];
        }
        
        try {
            $content = Storage::disk($this->disk)->get(
                "{$this->directory}/{$backup['filename']}"
            );
            
            $data = json_decode($content, true);
            
            if (!isset($data['data'])) {
                return [
                    'success' => false,
                    'error' => 'Invalid backup format',
                ];
            }
            
            $restoredTables = [];
            $truncate = $options['truncate'] ?? true;
            $selectedTables = $options['tables'] ?? array_keys($data['data']);
            
            DB::beginTransaction();
            
            try {
                foreach ($selectedTables as $table) {
                    if (!isset($data['data'][$table])) {
                        continue;
                    }
                    
                    if ($truncate) {
                        DB::table($table)->truncate();
                    }
                    
                    $rows = $data['data'][$table];
                    
                    foreach (array_chunk($rows, 100) as $chunk) {
                        $insertData = array_map(fn($row) => (array) $row, $chunk);
                        DB::table($table)->insert($insertData);
                    }
                    
                    $restoredTables[$table] = count($rows);
                }
                
                DB::commit();
                
                Log::channel('backups')->info('Database restored', [
                    'backup_id' => $backupId,
                    'tables' => $restoredTables,
                ]);
                
                return [
                    'success' => true,
                    'tables_restored' => $restoredTables,
                    'backup_id' => $backupId,
                ];
            } catch (\Throwable $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Throwable $e) {
            Log::channel('backups')->error('Database restore failed', [
                'backup_id' => $backupId,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get list of backups.
     */
    public function listBackups(): array
    {
        $files = Storage::disk($this->disk)->files($this->directory);
        $backups = [];
        
        foreach ($files as $file) {
            if (!str_ends_with($file, '.json')) {
                continue;
            }
            
            try {
                $content = Storage::disk($this->disk)->get($file);
                $data = json_decode($content, true);
                
                if (isset($data['metadata'])) {
                    $backup = $data['metadata'];
                    $backup['size'] = Storage::disk($this->disk)->size($file);
                    $backups[] = $backup;
                }
            } catch (\Throwable $e) {
                // Skip invalid files
                continue;
            }
        }
        
        // Sort by created_at descending
        usort($backups, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));
        
        return $backups;
    }

    /**
     * Get a specific backup.
     */
    public function getBackup(string $backupId): ?array
    {
        $backups = $this->listBackups();
        
        foreach ($backups as $backup) {
            if ($backup['id'] === $backupId) {
                return $backup;
            }
        }
        
        return null;
    }

    /**
     * Delete a backup.
     */
    public function deleteBackup(string $backupId): bool
    {
        $backup = $this->getBackup($backupId);
        
        if (!$backup) {
            return false;
        }
        
        try {
            Storage::disk($this->disk)->delete("{$this->directory}/{$backup['filename']}");
            
            Log::channel('backups')->info('Backup deleted', ['backup_id' => $backupId]);
            
            return true;
        } catch (\Throwable $e) {
            Log::channel('backups')->error('Failed to delete backup', [
                'backup_id' => $backupId,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * Download backup content.
     */
    public function downloadBackup(string $backupId): ?string
    {
        $backup = $this->getBackup($backupId);
        
        if (!$backup) {
            return null;
        }
        
        return Storage::disk($this->disk)->get("{$this->directory}/{$backup['filename']}");
    }

    /**
     * Get tables to backup.
     */
    protected function getTablesToBackup(): array
    {
        $allTables = $this->getAllTables();
        
        if (!empty($this->includeTables)) {
            return array_intersect($allTables, $this->includeTables);
        }
        
        return array_diff($allTables, $this->excludeTables);
    }

    /**
     * Get all database tables.
     */
    protected function getAllTables(): array
    {
        $driver = config('database.default');
        
        if ($driver === 'sqlite') {
            $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            return array_map(fn($t) => $t->name, $tables);
        }
        
        $tables = DB::select('SHOW TABLES');
        $key = 'Tables_in_' . config('database.connections.mysql.database');
        
        return array_map(function($t) use ($key) {
            if (isset($t->$key)) {
                return $t->$key;
            }
            $arr = (array) $t;
            return reset($arr);
        }, $tables);
    }

    /**
     * Generate a unique backup ID.
     */
    protected function generateBackupId(): string
    {
        return 'bkp_' . date('Ymd_His') . '_' . substr(md5(uniqid()), 0, 8);
    }

    /**
     * Generate backup filename.
     */
    protected function generateFilename(string $type, string $backupId): string
    {
        return "{$backupId}_{$type}.json";
    }

    /**
     * Update backup status.
     */
    protected function updateBackupStatus(string $backupId, string $status, array $data = []): void
    {
        Cache::put("backup_status_{$backupId}", [
            'status' => $status,
            'data' => $data,
            'updated_at' => now()->toIso8601String(),
        ], 3600);
    }

    /**
     * Get backup status.
     */
    public function getBackupStatus(string $backupId): ?array
    {
        return Cache::get("backup_status_{$backupId}");
    }

    /**
     * Record backup in history.
     */
    protected function recordBackupHistory(array $backup): void
    {
        $history = Cache::get('backup_history', []);
        $history[] = $backup;
        
        // Keep last 100 entries
        $history = array_slice($history, -100);
        
        Cache::put('backup_history', $history, 86400 * 30);
    }

    /**
     * Get backup history.
     */
    public function getBackupHistory(): array
    {
        return Cache::get('backup_history', []);
    }

    /**
     * Cleanup old backups.
     */
    protected function cleanupOldBackups(): int
    {
        $backups = $this->listBackups();
        $deleted = 0;
        
        if (count($backups) <= $this->maxBackups) {
            return 0;
        }
        
        // Sort by created_at and keep only maxBackups
        usort($backups, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));
        
        $toDelete = array_slice($backups, $this->maxBackups);
        
        foreach ($toDelete as $backup) {
            if ($this->deleteBackup($backup['id'])) {
                $deleted++;
            }
        }
        
        return $deleted;
    }

    /**
     * Get backup statistics.
     */
    public function getStatistics(): array
    {
        $backups = $this->listBackups();
        $totalSize = 0;
        $byType = [];
        
        foreach ($backups as $backup) {
            $totalSize += $backup['size'] ?? 0;
            $type = $backup['type'] ?? 'unknown';
            $byType[$type] = ($byType[$type] ?? 0) + 1;
        }
        
        $lastBackup = $backups[0] ?? null;
        
        return [
            'total_backups' => count($backups),
            'total_size' => $totalSize,
            'total_size_formatted' => $this->formatBytes($totalSize),
            'by_type' => $byType,
            'last_backup' => $lastBackup ? $lastBackup['created_at'] : null,
            'oldest_backup' => !empty($backups) ? end($backups)['created_at'] : null,
            'disk' => $this->disk,
            'directory' => $this->directory,
            'max_backups' => $this->maxBackups,
        ];
    }

    /**
     * Format bytes to human readable.
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Verify backup integrity.
     */
    public function verifyBackup(string $backupId): array
    {
        $backup = $this->getBackup($backupId);
        
        if (!$backup) {
            return [
                'valid' => false,
                'error' => 'Backup not found',
            ];
        }
        
        try {
            $content = Storage::disk($this->disk)->get("{$this->directory}/{$backup['filename']}");
            $data = json_decode($content, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                return [
                    'valid' => false,
                    'error' => 'Invalid JSON format',
                ];
            }
            
            if (!isset($data['metadata']) || !isset($data['data'])) {
                return [
                    'valid' => false,
                    'error' => 'Missing required sections',
                ];
            }
            
            $tableCount = count($data['data']);
            $rowCount = array_sum(array_map('count', $data['data']));
            
            return [
                'valid' => true,
                'backup_id' => $backupId,
                'tables' => $tableCount,
                'rows' => $rowCount,
                'size' => strlen($content),
            ];
        } catch (\Throwable $e) {
            return [
                'valid' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Set storage disk.
     */
    public function setDisk(string $disk): self
    {
        $this->disk = $disk;
        return $this;
    }

    /**
     * Set backup directory.
     */
    public function setDirectory(string $directory): self
    {
        $this->directory = $directory;
        return $this;
    }

    /**
     * Set max backups to retain.
     */
    public function setMaxBackups(int $max): self
    {
        $this->maxBackups = $max;
        return $this;
    }

    /**
     * Set tables to exclude.
     */
    public function setExcludeTables(array $tables): self
    {
        $this->excludeTables = $tables;
        return $this;
    }

    /**
     * Set tables to include.
     */
    public function setIncludeTables(array $tables): self
    {
        $this->includeTables = $tables;
        return $this;
    }

    /**
     * Add table to exclude list.
     */
    public function excludeTable(string $table): self
    {
        $this->excludeTables[] = $table;
        return $this;
    }

    /**
     * Add table to include list.
     */
    public function includeTable(string $table): self
    {
        $this->includeTables[] = $table;
        return $this;
    }

    /**
     * Get current configuration.
     */
    public function getConfiguration(): array
    {
        return [
            'disk' => $this->disk,
            'directory' => $this->directory,
            'max_backups' => $this->maxBackups,
            'exclude_tables' => $this->excludeTables,
            'include_tables' => $this->includeTables,
        ];
    }

    /**
     * Check if backups directory exists.
     */
    public function ensureDirectoryExists(): bool
    {
        if (!Storage::disk($this->disk)->exists($this->directory)) {
            return Storage::disk($this->disk)->makeDirectory($this->directory);
        }
        
        return true;
    }

    /**
     * Schedule automatic backup (returns schedule config).
     */
    public function getScheduleConfig(): array
    {
        return [
            'daily' => [
                'time' => '02:00',
                'type' => self::TYPE_FULL,
                'retention' => 7,
            ],
            'weekly' => [
                'day' => 'sunday',
                'time' => '03:00',
                'type' => self::TYPE_FULL,
                'retention' => 4,
            ],
            'monthly' => [
                'day' => 1,
                'time' => '04:00',
                'type' => self::TYPE_FULL,
                'retention' => 12,
            ],
        ];
    }
}
