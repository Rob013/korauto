-- Remove cars with no price (NULL) and price 25.024 from both tables
DELETE FROM cars_cache WHERE price IS NULL OR price = 25.024 OR price_cents IS NULL OR price_cents = 2502400;
DELETE FROM cars WHERE price IS NULL OR price = 25.024;

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
        'operation', 'remove_cars_null_and_specific_price',
        'price_removed', 25.024,
        'null_prices_removed', true,
        'reason', 'price_filter_cleanup_extended'
    ),
    now()
);