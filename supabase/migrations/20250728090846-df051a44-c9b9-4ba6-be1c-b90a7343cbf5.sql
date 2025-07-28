-- Test API connectivity directly
SELECT 
    net.http_post(
        url:='https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/api-test',
        headers:='{"Content-Type": "application/json"}'::jsonb
    ) as api_test_result;