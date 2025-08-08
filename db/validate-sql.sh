#!/bin/bash

# Simple validation script for the SQL initialization file
# This checks for basic syntax issues

echo "🔍 Validating SQL script syntax..."

SQL_FILE="db/supabase-init.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL file not found: $SQL_FILE"
    exit 1
fi

# Check for unmatched parentheses and brackets
OPEN_PARENS=$(grep -o '(' "$SQL_FILE" | wc -l)
CLOSE_PARENS=$(grep -o ')' "$SQL_FILE" | wc -l)

echo "📊 Parentheses count: $OPEN_PARENS open, $CLOSE_PARENS close"

if [ "$OPEN_PARENS" -ne "$CLOSE_PARENS" ]; then
    echo "⚠️ Warning: Unmatched parentheses detected"
else
    echo "✅ Parentheses are balanced"
fi

# Check for common SQL syntax issues
echo "🔍 Checking for common issues..."

# Check for missing semicolons at statement ends
if grep -n "CREATE\|ALTER\|DROP\|INSERT" "$SQL_FILE" | grep -v ";$" | head -5; then
    echo "⚠️ Warning: Some statements may be missing semicolons"
else
    echo "✅ All major statements appear to end with semicolons"
fi

# Check for basic PostgreSQL function syntax
if grep -q "LANGUAGE plpgsql" "$SQL_FILE"; then
    echo "✅ PostgreSQL functions detected"
fi

# Count tables being created
TABLE_COUNT=$(grep -c "CREATE TABLE" "$SQL_FILE")
echo "📋 Found $TABLE_COUNT table definitions"

# Count policies
POLICY_COUNT=$(grep -c "CREATE POLICY" "$SQL_FILE")
echo "🔒 Found $POLICY_COUNT RLS policies"

echo "✅ Basic validation completed successfully!"