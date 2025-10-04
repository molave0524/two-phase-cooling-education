# Database Migrations

## Account Management Migration

This migration adds account management features including:

- Email/password authentication
- Email verification
- Address management
- Password reset functionality

### For PostgreSQL (Vercel/Production)

Run the PostgreSQL migration file on your Vercel Postgres database:

**Option 1: Using Vercel Postgres Dashboard**

1. Go to your Vercel project dashboard
2. Navigate to Storage → Your Postgres database
3. Click on the "Query" tab
4. Copy and paste the contents of `account_management_postgres.sql`
5. Click "Run Query"

**Option 2: Using psql CLI**

```bash
# Get your database URL from Vercel
# Then run:
psql $DATABASE_URL -f drizzle/migrations/account_management_postgres.sql
```

**Option 3: Using Drizzle Kit**

```bash
# Push schema to production
npx drizzle-kit push
```

### For SQLite (Local Development)

The SQLite migration has already been applied locally. If you need to reapply:

```bash
node run-account-migration.js
```

### Schema Changes

**users table:**

- Added `new_email` (TEXT) - For pending email changes
- Added `email_verification_token` (TEXT) - Email verification token
- Added `email_verification_expires` (TIMESTAMP) - Token expiry

**addresses table (new):**

- `id` - Primary key
- `user_id` - Foreign key to users
- `type` - 'shipping' | 'billing' | 'both'
- `is_default` - Boolean flag for default address
- `first_name`, `last_name` - Name fields
- `company` - Optional company name
- `address1`, `address2` - Address lines
- `city`, `state`, `postal_code`, `country` - Location fields
- `phone` - Contact number
- `created_at`, `updated_at` - Timestamps

**password_reset_tokens table (new):**

- `id` - Primary key
- `user_id` - Foreign key to users
- `token` - Unique reset token
- `expires` - Token expiration timestamp
- `used` - Boolean flag for one-time use
- `created_at` - Timestamp

### Verification

After running the migration, verify with:

```sql
-- Check users table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users';

-- Check if addresses table exists
SELECT * FROM addresses LIMIT 1;

-- Check if password_reset_tokens table exists
SELECT * FROM password_reset_tokens LIMIT 1;
```
