<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\DatabaseBackupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DatabaseBackupServiceTest extends TestCase
{
    use RefreshDatabase;

    protected DatabaseBackupService $service;

    protected function setUp(): void
    {
        parent::setUp();
        
        Storage::fake('local');
        Cache::flush();
        
        $this->service = new DatabaseBackupService();
        $this->service->ensureDirectoryExists();
    }

    /** @test */
    public function type_constants_are_defined()
    {
        $this->assertEquals('full', DatabaseBackupService::TYPE_FULL);
        $this->assertEquals('incremental', DatabaseBackupService::TYPE_INCREMENTAL);
        $this->assertEquals('differential', DatabaseBackupService::TYPE_DIFFERENTIAL);
    }

    /** @test */
    public function status_constants_are_defined()
    {
        $this->assertEquals('pending', DatabaseBackupService::STATUS_PENDING);
        $this->assertEquals('in_progress', DatabaseBackupService::STATUS_IN_PROGRESS);
        $this->assertEquals('completed', DatabaseBackupService::STATUS_COMPLETED);
        $this->assertEquals('failed', DatabaseBackupService::STATUS_FAILED);
    }

    /** @test */
    public function it_creates_a_backup()
    {
        $result = $this->service->backup();
        
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('backup', $result);
        $this->assertArrayHasKey('id', $result['backup']);
        $this->assertArrayHasKey('filename', $result['backup']);
        $this->assertEquals(DatabaseBackupService::TYPE_FULL, $result['backup']['type']);
    }

    /** @test */
    public function it_creates_backup_with_description()
    {
        $result = $this->service->backup(DatabaseBackupService::TYPE_FULL, 'Test backup');
        
        $this->assertTrue($result['success']);
        $this->assertEquals('Test backup', $result['backup']['description']);
    }

    /** @test */
    public function it_creates_backup_with_different_types()
    {
        $full = $this->service->backup(DatabaseBackupService::TYPE_FULL);
        $incremental = $this->service->backup(DatabaseBackupService::TYPE_INCREMENTAL);
        $differential = $this->service->backup(DatabaseBackupService::TYPE_DIFFERENTIAL);
        
        $this->assertEquals(DatabaseBackupService::TYPE_FULL, $full['backup']['type']);
        $this->assertEquals(DatabaseBackupService::TYPE_INCREMENTAL, $incremental['backup']['type']);
        $this->assertEquals(DatabaseBackupService::TYPE_DIFFERENTIAL, $differential['backup']['type']);
    }

    /** @test */
    public function it_lists_backups()
    {
        $this->service->backup();
        $this->service->backup();
        
        $backups = $this->service->listBackups();
        
        $this->assertCount(2, $backups);
    }

    /** @test */
    public function it_gets_specific_backup()
    {
        $result = $this->service->backup();
        $backupId = $result['backup']['id'];
        
        $backup = $this->service->getBackup($backupId);
        
        $this->assertNotNull($backup);
        $this->assertEquals($backupId, $backup['id']);
    }

    /** @test */
    public function it_returns_null_for_nonexistent_backup()
    {
        $backup = $this->service->getBackup('nonexistent');
        
        $this->assertNull($backup);
    }

    /** @test */
    public function it_deletes_backup()
    {
        $result = $this->service->backup();
        $backupId = $result['backup']['id'];
        
        $deleted = $this->service->deleteBackup($backupId);
        
        $this->assertTrue($deleted);
        $this->assertNull($this->service->getBackup($backupId));
    }

    /** @test */
    public function it_returns_false_when_deleting_nonexistent_backup()
    {
        $deleted = $this->service->deleteBackup('nonexistent');
        
        $this->assertFalse($deleted);
    }

    /** @test */
    public function it_downloads_backup()
    {
        $result = $this->service->backup();
        $backupId = $result['backup']['id'];
        
        $content = $this->service->downloadBackup($backupId);
        
        $this->assertNotNull($content);
        $this->assertJson($content);
    }

    /** @test */
    public function it_returns_null_when_downloading_nonexistent_backup()
    {
        $content = $this->service->downloadBackup('nonexistent');
        
        $this->assertNull($content);
    }

    /** @test */
    public function it_gets_backup_status()
    {
        $result = $this->service->backup();
        $backupId = $result['backup']['id'];
        
        $status = $this->service->getBackupStatus($backupId);
        
        $this->assertNotNull($status);
        $this->assertEquals(DatabaseBackupService::STATUS_COMPLETED, $status['status']);
    }

    /** @test */
    public function it_gets_backup_history()
    {
        $this->service->backup();
        $this->service->backup();
        
        $history = $this->service->getBackupHistory();
        
        $this->assertCount(2, $history);
    }

    /** @test */
    public function it_returns_empty_history_when_none()
    {
        $history = $this->service->getBackupHistory();
        
        $this->assertIsArray($history);
        $this->assertEmpty($history);
    }

    /** @test */
    public function it_gets_statistics()
    {
        $this->service->backup();
        
        $stats = $this->service->getStatistics();
        
        $this->assertArrayHasKey('total_backups', $stats);
        $this->assertArrayHasKey('total_size', $stats);
        $this->assertArrayHasKey('total_size_formatted', $stats);
        $this->assertArrayHasKey('by_type', $stats);
        $this->assertArrayHasKey('last_backup', $stats);
        $this->assertEquals(1, $stats['total_backups']);
    }

    /** @test */
    public function it_verifies_valid_backup()
    {
        $result = $this->service->backup();
        $backupId = $result['backup']['id'];
        
        $verification = $this->service->verifyBackup($backupId);
        
        $this->assertTrue($verification['valid']);
        $this->assertArrayHasKey('tables', $verification);
        $this->assertArrayHasKey('rows', $verification);
    }

    /** @test */
    public function it_returns_invalid_for_nonexistent_backup()
    {
        $verification = $this->service->verifyBackup('nonexistent');
        
        $this->assertFalse($verification['valid']);
        $this->assertEquals('Backup not found', $verification['error']);
    }

    /** @test */
    public function it_sets_disk()
    {
        $result = $this->service->setDisk('s3');
        
        $this->assertInstanceOf(DatabaseBackupService::class, $result);
    }

    /** @test */
    public function it_sets_directory()
    {
        $result = $this->service->setDirectory('custom/backups');
        
        $this->assertInstanceOf(DatabaseBackupService::class, $result);
    }

    /** @test */
    public function it_sets_max_backups()
    {
        $result = $this->service->setMaxBackups(10);
        
        $this->assertInstanceOf(DatabaseBackupService::class, $result);
    }

    /** @test */
    public function it_sets_exclude_tables()
    {
        $result = $this->service->setExcludeTables(['table1', 'table2']);
        
        $this->assertInstanceOf(DatabaseBackupService::class, $result);
    }

    /** @test */
    public function it_sets_include_tables()
    {
        $result = $this->service->setIncludeTables(['users', 'bookings']);
        
        $this->assertInstanceOf(DatabaseBackupService::class, $result);
    }

    /** @test */
    public function it_excludes_table()
    {
        $result = $this->service->excludeTable('new_table');
        
        $this->assertInstanceOf(DatabaseBackupService::class, $result);
    }

    /** @test */
    public function it_includes_table()
    {
        $result = $this->service->includeTable('important_table');
        
        $this->assertInstanceOf(DatabaseBackupService::class, $result);
    }

    /** @test */
    public function it_gets_configuration()
    {
        $config = $this->service->getConfiguration();
        
        $this->assertArrayHasKey('disk', $config);
        $this->assertArrayHasKey('directory', $config);
        $this->assertArrayHasKey('max_backups', $config);
        $this->assertArrayHasKey('exclude_tables', $config);
        $this->assertArrayHasKey('include_tables', $config);
    }

    /** @test */
    public function it_ensures_directory_exists()
    {
        $result = $this->service->ensureDirectoryExists();
        
        $this->assertTrue($result);
    }

    /** @test */
    public function it_gets_schedule_config()
    {
        $config = $this->service->getScheduleConfig();
        
        $this->assertArrayHasKey('daily', $config);
        $this->assertArrayHasKey('weekly', $config);
        $this->assertArrayHasKey('monthly', $config);
    }

    /** @test */
    public function it_restores_backup()
    {
        // Create a user
        $user = \App\Models\User::factory()->create();
        
        // Create backup
        $result = $this->service
            ->setIncludeTables(['users'])
            ->backup();
        
        $backupId = $result['backup']['id'];
        
        // Delete the user
        $user->delete();
        
        // Reset include tables for restore
        $this->service->setIncludeTables([]);
        
        // Restore
        $restoreResult = $this->service->restore($backupId, [
            'tables' => ['users'],
            'truncate' => true,
        ]);
        
        $this->assertTrue($restoreResult['success']);
        $this->assertArrayHasKey('tables_restored', $restoreResult);
    }

    /** @test */
    public function it_returns_error_when_restoring_nonexistent_backup()
    {
        $result = $this->service->restore('nonexistent');
        
        $this->assertFalse($result['success']);
        $this->assertEquals('Backup not found', $result['error']);
    }

    /** @test */
    public function backup_includes_metadata()
    {
        $result = $this->service->backup();
        
        $content = $this->service->downloadBackup($result['backup']['id']);
        $data = json_decode($content, true);
        
        $this->assertArrayHasKey('metadata', $data);
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('id', $data['metadata']);
        $this->assertArrayHasKey('created_at', $data['metadata']);
    }

    /** @test */
    public function it_cleans_up_old_backups()
    {
        $this->service->setMaxBackups(2);
        
        // Create 4 backups
        for ($i = 0; $i < 4; $i++) {
            $this->service->backup();
        }
        
        $backups = $this->service->listBackups();
        
        $this->assertLessThanOrEqual(2, count($backups));
    }

    /** @test */
    public function it_formats_bytes_correctly()
    {
        $this->service->backup();
        $stats = $this->service->getStatistics();
        
        $this->assertStringContainsString('B', $stats['total_size_formatted']);
    }

    /** @test */
    public function statistics_include_type_breakdown()
    {
        $this->service->backup(DatabaseBackupService::TYPE_FULL);
        $this->service->backup(DatabaseBackupService::TYPE_INCREMENTAL);
        
        $stats = $this->service->getStatistics();
        
        $this->assertArrayHasKey('full', $stats['by_type']);
        $this->assertArrayHasKey('incremental', $stats['by_type']);
    }

    /** @test */
    public function backup_stores_row_count()
    {
        $result = $this->service->backup();
        
        $this->assertArrayHasKey('row_count', $result['backup']);
    }

    /** @test */
    public function backup_stores_table_list()
    {
        $result = $this->service->backup();
        
        $this->assertArrayHasKey('tables', $result['backup']);
        $this->assertIsArray($result['backup']['tables']);
    }

    /** @test */
    public function chainable_configuration()
    {
        $result = $this->service
            ->setDisk('local')
            ->setDirectory('custom/path')
            ->setMaxBackups(5)
            ->excludeTable('temp')
            ->includeTable('users');
        
        $this->assertInstanceOf(DatabaseBackupService::class, $result);
    }
}
