-- Set replica identity for cars table to enable deletions
ALTER TABLE cars REPLICA IDENTITY FULL;

-- Remove cars with price 25,024 from both tables
DELETE FROM cars_cache WHERE price = 25024 OR price_cents = 2502400;
DELETE FROM cars WHERE price = 25024;

-- Log the cleanup operation
INSERT INTO website_analytics (
    action_type,
    page_url,
    metadata,
    created_at
) VALUES (
    'data_cleanup',
    '/admin/data-cleanup',
    jsonb_build_object(
        'operation', 'remove_cars_by_price',
        'price_removed', 25024,
        'reason', 'price_filter_cleanup'
    ),
    now()
);