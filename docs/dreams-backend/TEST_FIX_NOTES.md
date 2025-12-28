# Test Configuration Fix

## Issue

When running tests, PHPUnit was failing with:
```
SQLSTATE[HY000]: General error: 1 near "MODIFY": syntax error
```

This occurred because:
1. Migrations used MySQL-specific syntax (`ENUM`, `MODIFY COLUMN`)
2. Tests use SQLite (in-memory) which doesn't support these features
3. The `phpunit.xml` configuration file was missing

## Solution

### 1. Created `phpunit.xml`

Created the PHPUnit configuration file with:
- Test suite definitions (Unit and Feature)
- SQLite database configuration for testing
- Environment variables for test environment

### 2. Fixed Migrations for SQLite Compatibility

#### `2024_01_01_000001_create_users_table.php`
- Changed to use `string` for `role` column when using SQLite
- Keeps `enum` for MySQL/MariaDB in production

#### `2025_12_03_000000_add_coordinator_role_to_users.php`
- Added database driver detection
- Skips `MODIFY COLUMN` for SQLite
- Only executes MySQL-specific SQL for MySQL/MariaDB

### 3. Result

All tests now pass successfully:
- ✅ 9 Auth tests passing
- ✅ SQLite-compatible migrations
- ✅ Production MySQL compatibility maintained

## Running Tests

```bash
# All tests
php artisan test

# Specific test file
php artisan test tests/Feature/AuthTest.php

# Specific test method
php artisan test --filter test_user_can_register
```

## Notes

- **Production**: Uses MySQL with proper ENUM constraints
- **Testing**: Uses SQLite with string columns (validation at application level)
- **Data Integrity**: Application-level validation ensures only valid role values are accepted
- **No Breaking Changes**: Production database structure remains unchanged

