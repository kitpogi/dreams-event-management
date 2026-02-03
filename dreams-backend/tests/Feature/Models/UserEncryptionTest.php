<?php

namespace Tests\Feature\Models;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserEncryptionTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_encrypts_phone_field_on_save()
    {
        $plainPhone = '555-1234-5678';
        
        $user = User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'phone' => $plainPhone,
            'role' => 'client',
        ]);

        // Reload to get raw database value
        $dbUser = User::find($user->id);
        $encryptedValue = $dbUser->getEncrypted('phone');
        
        // Should be encrypted in database
        $this->assertNotEquals($plainPhone, $encryptedValue);
    }

    /** @test */
    public function it_decrypts_phone_field_on_retrieve()
    {
        $plainPhone = '555-9876-5432';
        
        User::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'phone' => $plainPhone,
            'role' => 'client',
        ]);

        $user = User::first();
        
        // Should return decrypted value
        $this->assertEquals($plainPhone, $user->phone);
    }

    /** @test */
    public function it_can_get_decrypted_array()
    {
        $plainPhone = '555-5555-5555';
        
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'phone' => $plainPhone,
            'role' => 'client',
        ]);

        $decryptedArray = $user->getDecryptedArray();
        
        $this->assertEquals($plainPhone, $decryptedArray['phone']);
        $this->assertEquals('Test User', $decryptedArray['name']);
    }

    /** @test */
    public function it_handles_null_phone_values()
    {
        $user = User::create([
            'name' => 'No Phone User',
            'email' => 'nophone@example.com',
            'password' => 'password123',
            'phone' => null,
            'role' => 'client',
        ]);

        $this->assertNull($user->phone);
        $this->assertNull($user->getEncrypted('phone'));
    }

    /** @test */
    public function it_can_update_encrypted_field()
    {
        $oldPhone = '111-1111-1111';
        $newPhone = '222-2222-2222';
        
        $user = User::create([
            'name' => 'Update Test',
            'email' => 'update@example.com',
            'password' => 'password123',
            'phone' => $oldPhone,
            'role' => 'client',
        ]);

        $user->update(['phone' => $newPhone]);
        
        // Reload and verify
        $user = User::find($user->id);
        $this->assertEquals($newPhone, $user->phone);
    }

    /** @test */
    public function it_prevents_double_encryption()
    {
        $plainPhone = '333-3333-3333';
        
        $user = User::create([
            'name' => 'Double Encrypt Test',
            'email' => 'double@example.com',
            'password' => 'password123',
            'phone' => $plainPhone,
            'role' => 'client',
        ]);

        // Save again without changing phone
        $user->save();
        
        // Should still decrypt correctly
        $this->assertEquals($plainPhone, $user->phone);
    }

    /** @test */
    public function it_can_set_encrypted_field_directly()
    {
        $user = new User([
            'name' => 'Direct Set Test',
            'email' => 'direct@example.com',
            'password' => 'password123',
            'role' => 'client',
        ]);
        
        $plainPhone = '444-4444-4444';
        $user->setEncrypted('phone', $plainPhone);
        $user->save();

        $user = User::find($user->id);
        $this->assertEquals($plainPhone, $user->phone);
    }

    /** @test */
    public function it_can_get_search_hash()
    {
        $plainPhone = '555-5555-5555';
        
        $user = User::create([
            'name' => 'Search Hash Test',
            'email' => 'hash@example.com',
            'password' => 'password123',
            'phone' => $plainPhone,
            'role' => 'client',
        ]);

        $hash = $user->getSearchHash('phone');
        
        $this->assertNotNull($hash);
        $this->assertIsString($hash);
    }
}
