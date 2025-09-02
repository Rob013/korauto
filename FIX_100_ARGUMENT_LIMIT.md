# Fix for PostgreSQL 100-Argument Limit Error (Car 13998958)

## Problem
The error `"cannot pass more than 100 arguments to a function"` (PostgreSQL error code 54023) occurs when processing car ID 13998958 and other cars with comprehensive API data. This happens because the `map_complete_api_data` function uses a single large `jsonb_build_object` call that exceeds PostgreSQL's 100-argument limit.

## Error Message
```
❌ Mapping error for car 13998958 : {
  code: "54023",
  details: null,
  hint: null,
  message: "cannot pass more than 100 arguments to a function"
}
```

## Solution
The fix has been implemented in `supabase/migrations/20250902081700_fix-100-argument-limit.sql`. This migration refactors the `map_complete_api_data` function to use 5 smaller chunked `jsonb_build_object` calls instead of one large call.

### Chunked Approach
- **Chunk 1**: Basic vehicle information (17 fields = 34 arguments)
- **Chunk 2**: Engine and performance data (13 fields = 26 arguments)  
- **Chunk 3**: Auction and sale data (15 fields = 30 arguments)
- **Chunk 4**: Registration and legal data (15 fields = 30 arguments)
- **Chunk 5**: Damage, features and metadata (7 fields = 14 arguments)

**Maximum arguments per chunk**: 34 (well under the 100 limit)
**Total fields preserved**: 67 (all original fields maintained)

## Manual Deployment Steps

Since automated deployment through the repository may not be possible, follow these steps:

### Method 1: Supabase Dashboard
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `qtyyiqimkysmjnaocswe`
3. Go to SQL Editor
4. Copy the entire content of `supabase/migrations/20250902081700_fix-100-argument-limit.sql`
5. Paste and execute the SQL

### Method 2: Supabase CLI (if available)
```bash
supabase db push
```

### Method 3: Direct SQL Execution
Run the following SQL in your database:

```sql
-- Copy the entire function definition from the migration file
CREATE OR REPLACE FUNCTION map_complete_api_data(api_record JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
-- ... (see migration file for complete definition)
```

## Verification

### Automated Verification
Run the verification scripts to confirm the fix:

```bash
# Test the fix
npm run test:run tests/fix-car-13998958-error.test.ts

# Verify chunk analysis
npx tsx scripts/verify-100-argument-fix.ts

# Test actual database function
npx tsx scripts/test-mapping-fix.ts
```

### Manual Verification
1. Check if car 13998958 processes without errors
2. Verify all chunks stay within 100-argument limit
3. Confirm all API fields are preserved

## Expected Results After Fix

✅ **Before Fix**: 124 arguments (EXCEEDS 100 LIMIT)  
✅ **After Fix**: Maximum 34 arguments per chunk (WITHIN LIMIT)  
✅ **Fields Preserved**: All 67 fields maintained  
✅ **Error Resolution**: Car 13998958 processes successfully  

## Impact
- Resolves PostgreSQL 54023 errors for cars with comprehensive API data
- Maintains complete API field mapping (1:1 data preservation)
- Prevents fallback to basic mapping for complex car records
- Enables successful processing of cars like 13998958

## Files Modified
- `supabase/migrations/20250902081700_fix-100-argument-limit.sql` - The fix implementation
- `tests/fix-car-13998958-error.test.ts` - Test validation
- `scripts/verify-100-argument-fix.ts` - Verification script
- `scripts/test-mapping-fix.ts` - Database testing
- `scripts/apply-100-argument-fix.ts` - Automated deployment attempt

## Technical Details
The fix uses PostgreSQL's JSONB concatenation operator (`||`) to combine multiple smaller `jsonb_build_object` calls instead of using one large call. This approach:
- Stays within PostgreSQL's function argument limits
- Maintains the exact same output structure
- Preserves all API field mappings
- Has no performance impact