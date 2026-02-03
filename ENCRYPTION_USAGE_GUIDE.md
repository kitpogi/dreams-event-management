# Encryption System Usage Guide

Quick reference for using the field-level encryption system.

## Adding Encryption to a Model

### Step 1: Add the Trait

```php
use App\Traits\HasEncryptedFields;

class User extends Model
{
    use HasEncryptedFields;

    // List which fields to encrypt
    protected array $encrypted = ['phone', 'ssn', 'address'];
}
```

### Step 2: That's It!

The encryption is now automatic:

```php
// Creating a user - phone is automatically encrypted on save
$user = User::create([
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'phone' => '555-1234-5678',  // Will be encrypted in database
]);

// Accessing the user - phone is automatically decrypted in memory
echo $user->phone;  // Outputs: 555-1234-5678 (plaintext)

// Updating - just save normally
$user->phone = '555-9999-9999';
$user->save();  // Automatically re-encrypted for database
```

---

## Common Operations

### Get Plaintext Value

```php
$user = User::find(1);
$plainText = $user->phone;  // Automatically decrypted via getAttribute
```

### Get Encrypted Value (Raw from DB)

```php
$user = User::find(1);
$encrypted = $user->getEncrypted('phone');
// Returns the encrypted string: "eyJpdiI6ImFqamM1UUJxZ1NxcDhHbU9UTHFDSmc9PSI..."
```

### Get Decrypted Value (Explicit)

```php
$user = User::find(1);
$plainText = $user->getDecrypted('phone');  // Same as $user->phone
```

### Set Encrypted Field Directly

```php
$user = new User(['name' => 'Jane', 'email' => 'jane@example.com']);
$user->setEncrypted('phone', '555-1234-5678');
$user->save();
```

### Get Decrypted Array

```php
$user = User::find(1);
$data = $user->getDecryptedArray();
// ['id' => 1, 'name' => 'John', 'phone' => '555-1234-5678', ...]
```

---

## Searchable Encryption

### Query by Encrypted Field

Use the `whereEncrypted()` scope:

```php
// Find user by encrypted phone number
$user = User::whereEncrypted('phone', '555-1234-5678')->first();

// Uses hash comparison internally - secure and efficient
```

### Get Search Hash

```php
$user = User::find(1);
$hash = $user->getSearchHash('phone');
// Store this hash in a separate column for efficient queries
```

### Manual Hash Creation

```php
$service = app(\App\Services\Encryption\FieldEncryptionService::class);
$hash = $service->hashForSearch('555-1234-5678');
// Use for creating searchable indexes
```

---

## Direct Service Usage

For operations outside of models:

```php
use App\Services\Encryption\FieldEncryptionService;

$encryption = app(FieldEncryptionService::class);

// Single value encryption
$encrypted = $encryption->encrypt('sensitive-data');
$plaintext = $encryption->decrypt($encrypted);

// Batch encryption
$data = ['phone' => '555-1234', 'ssn' => '123-45-6789'];
$encrypted = $encryption->encryptFields($data, ['phone', 'ssn']);

// Batch decryption
$plaintext = $encryption->decryptFields($encrypted, ['phone', 'ssn']);

// Utilities
$isEncrypted = $encryption->isEncrypted($value);  // true/false
$safeEncrypted = $encryption->encryptIfNotEncrypted($value);
$safeDecrypted = $encryption->decryptIfEncrypted($value);

// Hashing for search
$hash = $encryption->hashForSearch('555-1234-5678');
$searchable = $encryption->createSearchableField('555-1234-5678');
// Returns ['encrypted' => '...', 'hash' => '...']
```

---

## Database Migrations

When creating a new table with encrypted fields:

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->string('phone')->nullable();  // Will store encrypted value
    $table->timestamps();
});
```

The column can be regular varchar - encryption happens in the ORM.

---

## Testing Encrypted Models

### Basic Test

```php
public function test_phone_is_encrypted_in_database()
{
    $plainPhone = '555-1234-5678';

    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'phone' => $plainPhone,
    ]);

    // Verify encrypted in database
    $encrypted = $user->getEncrypted('phone');
    $this->assertNotEquals($plainPhone, $encrypted);

    // Verify decrypted in memory
    $this->assertEquals($plainPhone, $user->phone);
}
```

### Search Test

```php
public function test_can_query_encrypted_field()
{
    $plainPhone = '555-1234-5678';

    User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'phone' => $plainPhone,
    ]);

    // Query by encrypted field
    $found = User::whereEncrypted('phone', $plainPhone)->first();
    $this->assertNotNull($found);
    $this->assertEquals($plainPhone, $found->phone);
}
```

---

## Troubleshooting

### "Field is not configured for encryption"

```php
// This happens when you try to encrypt a field not in $encrypted array
$model->setEncrypted('undefined_field', 'value');  // ❌ Error

// Solution: Add to model's encrypted array
protected array $encrypted = ['undefined_field'];  // ✅ OK
```

### Double-Encryption (Value Encrypted Multiple Times)

```php
// This is automatically prevented by the trait
// The system detects if a value is already encrypted
// and won't re-encrypt it

$user = User::find(1);
$user->save();  // Won't double-encrypt even if saved multiple times
```

### Database Column Too Small

```php
// Encrypted values are larger than plaintext
// If you get "value too long" error, increase column size

Schema::table('users', function (Blueprint $table) {
    $table->text('phone')->change();  // From string to text
});
```

### Can't Find Records After Adding Encryption

```php
// Old plaintext values won't decrypt properly
// You need to re-save to encrypt them

// Option 1: Manual migration
foreach (User::all() as $user) {
    $user->save();  // Triggers encryption
}

// Option 2: In a migration
User::query()->each(fn($user) => $user->save());
```

---

## Performance Notes

### Encryption Overhead

- Single field: <1ms encryption/decryption
- Batch 100 fields: ~5-10ms total
- Negligible for typical applications

### Database Queries

- Encrypted field lookups use hash comparison
- Same performance as regular indexed searches
- Add a `phone_hash` column for very frequent searches

### Memory Usage

- Plaintext cache per model instance: ~100 bytes per field
- Multiple instances: Separate caches per instance

---

## Security Considerations

### Encryption Algorithm

- **AES-256-GCM** via Laravel's Crypt facade
- **HMAC-SHA1** for searchable field hashing
- Encryption keys: From app.php `APP_KEY`

### What Gets Encrypted

- Specified fields in `protected array $encrypted`
- Automatic on every save
- Transparent to application code

### What Doesn't Get Encrypted

- Fields NOT in `encrypted` array
- Indices/keys (still searchable)
- Audit logs (can see encrypted values, not plaintext)

### Rotating Keys

If you need to rotate encryption keys:

1. Keep old key available temporarily
2. Re-save all models with new key
3. Update APP_KEY in environment
4. Remove old key from rotation config

---

## Examples by Use Case

### E-commerce (Customer Phone)

```php
class Customer extends Model
{
    use HasEncryptedFields;
    protected array $encrypted = ['phone'];
}

// Usage
$customer = Customer::create(['phone' => '555-1234-5678']);
// Automatically encrypted
$found = Customer::whereEncrypted('phone', '555-1234-5678')->first();
```

### Medical (Patient SSN)

```php
class Patient extends Model
{
    use HasEncryptedFields;
    protected array $encrypted = ['ssn', 'insurance_id', 'medical_record_number'];
}
```

### Real Estate (Property Address)

```php
class Property extends Model
{
    use HasEncryptedFields;
    protected array $encrypted = ['address', 'owner_phone'];
}
```

### Multi-Field Encryption

```php
class User extends Model
{
    use HasEncryptedFields;
    protected array $encrypted = [
        'phone',
        'ssn',
        'credit_card',
        'home_address',
        'emergency_contact',
    ];
}
```

---

## Configuration

The encryption service is automatically configured in:

- `app/Providers/EncryptionServiceProvider.php` - Service registration
- `bootstrap/app.php` - Provider inclusion
- App key: Uses `APP_KEY` from .env

No additional configuration needed!

---

## API Documentation

For API endpoints returning encrypted data:

```php
// In controller
$user = User::find($id);

// Get plaintext array for JSON response
$data = $user->getDecryptedArray();
return response()->json($data);

// Or use API Resource
class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,  // Automatically decrypted
        ];
    }
}
```

The API returns plaintext (decrypted) by design - encryption is transparent to API consumers.

---

## Summary

The encryption system provides:

- ✅ Automatic encryption/decryption
- ✅ Transparent to application code
- ✅ Searchable encrypted fields
- ✅ Double-encryption prevention
- ✅ Simple model configuration

Just add `use HasEncryptedFields` and `protected array $encrypted = [...]` - the rest is automatic!
