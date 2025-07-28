-- Clear stuck running sync and test direct API call
UPDATE sync_status SET status = 'failed', completed_at = now(), error_message = 'Clearing stuck sync' WHERE status = 'running';

-- Test if the API is working by making a direct call
SELECT 
    net.http_get(
        url:='https://auctionsapi.com/api/cars?api_key=d00985c77981fe8d26be16735f932ed1&limit=1'
    ) as direct_api_test;