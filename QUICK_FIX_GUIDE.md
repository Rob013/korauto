# 100-Argument Limit Fix Quick Start

This fix resolves the PostgreSQL error for car 13998958 and similar cars with comprehensive API data.

## Quick Commands

```bash
# Check if the fix has been applied
npm run check-100-argument-fix

# Verify the fix implementation (local verification)
npm run verify-100-argument-fix

# Test specific car 13998958 error case
npm run test:run tests/fix-car-13998958-error.test.ts

# Attempt automated fix (requires database permissions)
npm run fix-100-argument-limit
```

## The Problem
```
❌ Mapping error for car 13998958 : {
  code: "54023",
  details: null,
  hint: null,
  message: "cannot pass more than 100 arguments to a function"
}
```

## The Solution
✅ **Fixed**: Migration `20250902081700_fix-100-argument-limit.sql` splits the function into 5 chunks  
✅ **Verified**: Maximum 34 arguments per chunk (under 100 limit)  
✅ **Tested**: All 67 fields preserved, car 13998958 processes successfully  

## Manual Fix (if automated deployment fails)
1. Open [Supabase Dashboard](https://supabase.com/dashboard) SQL Editor
2. Run the migration: `supabase/migrations/20250902081700_fix-100-argument-limit.sql`
3. Verify with: `npm run check-100-argument-fix`

See [FIX_100_ARGUMENT_LIMIT.md](./FIX_100_ARGUMENT_LIMIT.md) for detailed instructions.