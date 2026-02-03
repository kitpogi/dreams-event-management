<?php

namespace Tests\Feature\Services;

use Tests\TestCase;
use App\Services\Encryption\FieldEncryptionService;
use Illuminate\Contracts\Encryption\DecryptException;

class FieldEncryptionServiceTest extends TestCase
{
    private FieldEncryptionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(FieldEncryptionService::class);
    }

    /** @test */
    public function it_can_encrypt_and_decrypt_a_value()
    {
        $originalValue = '123-456-7890';
        
        $encrypted = $this->service->encrypt($originalValue);
        $decrypted = $this->service->decrypt($encrypted);
        
        $this->assertNotEquals($originalValue, $encrypted);
        $this->assertEquals($originalValue, $decrypted);
    }

    /** @test */
    public function it_handles_null_values()
    {
        $encrypted = $this->service->encrypt(null);
        $decrypted = $this->service->decrypt(null);
        
        $this->assertNull($encrypted);
        $this->assertNull($decrypted);
    }

    /** @test */
    public function it_can_encrypt_multiple_fields()
    {
        $data = [
            'name' => 'John Doe',
            'phone' => '123-456-7890',
            'email' => 'john@example.com',
        ];
        
        $encrypted = $this->service->encryptFields($data, ['phone', 'email']);
        
        $this->assertEquals($data['name'], $encrypted['name']);
        $this->assertNotEquals($data['phone'], $encrypted['phone']);
        $this->assertNotEquals($data['email'], $encrypted['email']);
    }

    /** @test */
    public function it_can_decrypt_multiple_fields()
    {
        $data = [
            'name' => 'John Doe',
            'phone' => '123-456-7890',
            'email' => 'john@example.com',
        ];
        
        $encrypted = $this->service->encryptFields($data, ['phone', 'email']);
        $decrypted = $this->service->decryptFields($encrypted, ['phone', 'email']);
        
        $this->assertEquals($data, $decrypted);
    }

    /** @test */
    public function it_can_detect_encrypted_strings()
    {
        $plaintext = 'plain text';
        $encrypted = $this->service->encrypt($plaintext);
        
        $this->assertFalse($this->service->isEncrypted($plaintext));
        $this->assertTrue($this->service->isEncrypted($encrypted));
    }

    /** @test */
    public function it_safely_encrypts_if_not_already_encrypted()
    {
        $plaintext = 'phone number';
        
        $encrypted1 = $this->service->encryptIfNotEncrypted($plaintext);
        $encrypted2 = $this->service->encryptIfNotEncrypted($encrypted1);
        
        // Both should decrypt to the same value
        $decrypted1 = $this->service->decrypt($encrypted1);
        $decrypted2 = $this->service->decrypt($encrypted2);
        
        $this->assertEquals($decrypted1, $decrypted2);
        $this->assertEquals($plaintext, $decrypted1);
    }

    /** @test */
    public function it_safely_decrypts_if_encrypted()
    {
        $plaintext = 'secret data';
        $encrypted = $this->service->encrypt($plaintext);
        
        $result1 = $this->service->decryptIfEncrypted($encrypted);
        $result2 = $this->service->decryptIfEncrypted($plaintext);
        
        $this->assertEquals($plaintext, $result1);
        $this->assertEquals($plaintext, $result2);
    }

    /** @test */
    public function it_can_hash_for_search()
    {
        $value = '123-456-7890';
        
        $hash1 = $this->service->hashForSearch($value);
        $hash2 = $this->service->hashForSearch($value);
        
        // Same value should produce same hash
        $this->assertEquals($hash1, $hash2);
        
        // Different values should produce different hashes
        $hash3 = $this->service->hashForSearch('different-value');
        $this->assertNotEquals($hash1, $hash3);
    }

    /** @test */
    public function it_can_create_searchable_field()
    {
        $value = '555-1234';
        
        $searchable = $this->service->createSearchableField($value);
        
        $this->assertArrayHasKey('encrypted', $searchable);
        $this->assertArrayHasKey('hash', $searchable);
        $this->assertTrue($this->service->isEncrypted($searchable['encrypted']));
        $this->assertEquals($value, $this->service->decrypt($searchable['encrypted']));
    }
}
