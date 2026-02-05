<?php

namespace Tests\Unit\Services;

use App\Services\VirusScanService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VirusScanServiceTest extends TestCase
{
    protected VirusScanService $scanner;

    protected function setUp(): void
    {
        parent::setUp();

        // Configure for mock scanning
        Config::set('filescan.enabled', true);
        Config::set('filescan.driver', 'mock');
        Config::set('filescan.max_file_size', 25 * 1024 * 1024);

        $this->scanner = new VirusScanService();
    }

    public function test_scan_returns_skipped_when_disabled(): void
    {
        Config::set('filescan.enabled', false);
        $scanner = new VirusScanService();

        $file = UploadedFile::fake()->create('test.pdf', 100);
        $result = $scanner->scan($file);

        $this->assertEquals(VirusScanService::RESULT_SKIPPED, $result['status']);
        $this->assertEquals('none', $result['scanner']);
    }

    public function test_scan_returns_clean_for_safe_file(): void
    {
        $file = UploadedFile::fake()->create('document.pdf', 100);
        $result = $this->scanner->scan($file);

        $this->assertEquals(VirusScanService::RESULT_CLEAN, $result['status']);
        $this->assertEquals('mock', $result['scanner']);
        $this->assertArrayHasKey('scanned_at', $result);
    }

    public function test_scan_detects_file_with_virus_in_name(): void
    {
        $file = UploadedFile::fake()->create('virus_test.exe', 100);
        $result = $this->scanner->scan($file);

        $this->assertEquals(VirusScanService::RESULT_INFECTED, $result['status']);
        $this->assertEquals('EICAR-Test-File', $result['threat']);
    }

    public function test_scan_detects_file_with_eicar_in_name(): void
    {
        $file = UploadedFile::fake()->create('eicar_test.txt', 100);
        $result = $this->scanner->scan($file);

        $this->assertEquals(VirusScanService::RESULT_INFECTED, $result['status']);
        $this->assertArrayHasKey('threat', $result);
    }

    public function test_scan_detects_eicar_test_string_in_content(): void
    {
        // Create a file with EICAR test string
        $tempFile = tempnam(sys_get_temp_dir(), 'scan_test_');
        file_put_contents($tempFile, 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');

        try {
            $result = $this->scanner->scan($tempFile);
            $this->assertEquals(VirusScanService::RESULT_INFECTED, $result['status']);
        } finally {
            @unlink($tempFile);
        }
    }

    public function test_scan_returns_error_for_nonexistent_file(): void
    {
        $result = $this->scanner->scan('/nonexistent/file/path.txt');

        $this->assertEquals(VirusScanService::RESULT_ERROR, $result['status']);
        $this->assertStringContainsString('not found', $result['message']);
    }

    public function test_scan_skips_files_exceeding_max_size(): void
    {
        Config::set('filescan.max_file_size', 1024); // 1KB
        $scanner = new VirusScanService();

        // Create a file larger than max size
        $tempFile = tempnam(sys_get_temp_dir(), 'large_');
        file_put_contents($tempFile, str_repeat('x', 2048)); // 2KB

        try {
            $result = $scanner->scan($tempFile);
            $this->assertEquals(VirusScanService::RESULT_SKIPPED, $result['status']);
            $this->assertStringContainsString('exceeds', $result['message']);
        } finally {
            @unlink($tempFile);
        }
    }

    public function test_is_safe_returns_true_for_clean_result(): void
    {
        $result = [
            'status' => VirusScanService::RESULT_CLEAN,
            'message' => 'No threats detected',
            'scanner' => 'mock',
        ];

        $this->assertTrue($this->scanner->isSafe($result));
    }

    public function test_is_safe_returns_true_for_skipped_result(): void
    {
        $result = [
            'status' => VirusScanService::RESULT_SKIPPED,
            'message' => 'Scanning disabled',
            'scanner' => 'none',
        ];

        $this->assertTrue($this->scanner->isSafe($result));
    }

    public function test_is_safe_returns_false_for_infected_result(): void
    {
        $result = [
            'status' => VirusScanService::RESULT_INFECTED,
            'message' => 'Threat detected',
            'threat' => 'Trojan.GenericKD',
            'scanner' => 'mock',
        ];

        $this->assertFalse($this->scanner->isSafe($result));
    }

    public function test_is_safe_returns_false_for_error_result(): void
    {
        $result = [
            'status' => VirusScanService::RESULT_ERROR,
            'message' => 'Scan failed',
            'scanner' => 'mock',
        ];

        $this->assertFalse($this->scanner->isSafe($result));
    }

    public function test_is_enabled_reflects_config(): void
    {
        Config::set('filescan.enabled', true);
        $scanner = new VirusScanService();
        $this->assertTrue($scanner->isEnabled());

        Config::set('filescan.enabled', false);
        $scanner = new VirusScanService();
        $this->assertFalse($scanner->isEnabled());
    }

    public function test_get_driver_returns_configured_driver(): void
    {
        Config::set('filescan.driver', 'clamav');
        $scanner = new VirusScanService();
        $this->assertEquals('clamav', $scanner->getDriver());

        Config::set('filescan.driver', 'virustotal');
        $scanner = new VirusScanService();
        $this->assertEquals('virustotal', $scanner->getDriver());
    }

    public function test_validate_upload_returns_true_for_clean_file(): void
    {
        $file = UploadedFile::fake()->create('safe_document.pdf', 100);
        $this->assertTrue($this->scanner->validateUpload($file));
    }

    public function test_validate_upload_returns_false_for_infected_file(): void
    {
        $file = UploadedFile::fake()->create('virus_infected.exe', 100);
        $this->assertFalse($this->scanner->validateUpload($file));
    }

    public function test_scan_result_includes_timestamp(): void
    {
        $file = UploadedFile::fake()->create('test.pdf', 100);
        $result = $this->scanner->scan($file);

        $this->assertArrayHasKey('scanned_at', $result);
        $this->assertNotEmpty($result['scanned_at']);
    }

    public function test_unknown_driver_returns_error(): void
    {
        Config::set('filescan.driver', 'unknown_scanner');
        $scanner = new VirusScanService();

        $file = UploadedFile::fake()->create('test.pdf', 100);
        $result = $scanner->scan($file);

        $this->assertEquals(VirusScanService::RESULT_ERROR, $result['status']);
        $this->assertStringContainsString('Unknown scanner', $result['message']);
    }

    public function test_static_rule_creates_closure(): void
    {
        $rule = VirusScanService::rule();

        $this->assertInstanceOf(\Closure::class, $rule);
    }
}
