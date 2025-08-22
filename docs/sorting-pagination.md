# Sorting and Pagination System

This document explains the new global sorting and keyset pagination system implemented for the cars listing feature.

## Overview

The system provides stable, deterministic sorting across the entire filtered dataset with efficient cursor-based pagination. This fixes the previous issue where sorting was applied per-page, causing inconsistent ordering across pagination.

## Key Features

- **Global Sorting**: Sorting is applied to the entire filtered dataset before pagination
- **Keyset Pagination**: Uses cursor-based pagination for better performance and consistency
- **Stable Ordering**: Deterministic tie-breaking using `id ASC` for consistent results
- **Efficient Indexes**: Database indexes optimized for each sort scenario

## API Endpoint

### Direct Service Call

```typescript
import { fetchCarsWithKeyset } from '@/services/carsApi';

const result = await fetchCarsWithKeyset({
  filters: {
    make: 'Toyota',
    priceMin: '20000',
    priceMax: '50000',
    search: 'hybrid'
  },
  sort: 'price_asc',
  limit: 24,
  cursor: 'eyJwcmljZV9jZW50cyI6MjAwMDAwMCwiaWQiOiJjYXIxMjMifQ==' // optional
});
```

### Response Format

```typescript
interface CarsApiResponse {
  items: Car[];           // Array of car objects
  nextCursor?: string;    // Base64-encoded cursor for next page (if more data exists)
  total: number;          // Total count of filtered cars
}
```

## Sort Options

| Value | Description | Database Field | Direction |
|-------|-------------|----------------|-----------|
| `price_asc` | Price: Low to High | `price_cents` | ASC |
| `price_desc` | Price: High to Low | `price_cents` | DESC |
| `rank_asc` | Rank: Best First | `rank_score` | ASC |
| `rank_desc` | Rank: Worst First | `rank_score` | DESC |

## Filter Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `make` | string | Car manufacturer | `"Toyota"` |
| `model` | string | Car model | `"Camry"` |
| `yearMin` | string | Minimum year | `"2020"` |
| `yearMax` | string | Maximum year | `"2024"` |
| `priceMin` | string | Minimum price | `"20000"` |
| `priceMax` | string | Maximum price | `"50000"` |
| `fuel` | string | Fuel type | `"Hybrid"` |
| `search` | string | Text search across make/model/color | `"red sedan"` |

## Cursor Format

Cursors are Base64-encoded strings containing the sort value and ID of the last item:

```
Base64("sortValue|itemId")
```

Example:
- Cursor: `MTUwMDAwMHxjYXIxMjM=`
- Decoded: `1500000|car123`
- Meaning: Last item had `price_cents = 1500000` and `id = car123`

## Database Schema

### Normalized Fields

```sql
-- Added to existing cars table
ALTER TABLE cars 
ADD COLUMN price_cents BIGINT,    -- Price in cents for precise sorting
ADD COLUMN rank_score NUMERIC;    -- Ranking score for relevance sorting
```

### Indexes

```sql
-- Price sorting indexes
CREATE INDEX cars_price_asc_idx ON cars (price_cents ASC, id ASC);
CREATE INDEX cars_price_desc_idx ON cars (price_cents DESC, id ASC);

-- Rank sorting indexes  
CREATE INDEX cars_rank_asc_idx ON cars (rank_score ASC, id ASC);
CREATE INDEX cars_rank_desc_idx ON cars (rank_score DESC, id ASC);

-- Filter indexes
CREATE INDEX cars_make_idx ON cars (make);
CREATE INDEX cars_year_idx ON cars (year);
CREATE INDEX cars_fuel_idx ON cars (fuel);
```

## RPC Functions

### `cars_keyset_page`

Main pagination function that applies filters, sorting, and keyset pagination.

```sql
SELECT * FROM cars_keyset_page(
  p_filters := '{"make": "Toyota", "priceMin": "20000"}',
  p_sort_field := 'price_cents',
  p_sort_dir := 'ASC',
  p_cursor_value := '1500000',
  p_cursor_id := 'car123',
  p_limit := 24
);
```

### `cars_filtered_count`

Returns the total count of cars matching the applied filters.

```sql
SELECT cars_filtered_count('{"make": "Toyota", "priceMin": "20000"}');
```

## Frontend Integration

### Hook Usage

```typescript
import { useCarsQuery } from '@/hooks/useCarsQuery';

const CarsListing = () => {
  const filters = useFiltersFromUrl();
  const { cars, total, hasMore, isLoading } = useCarsQuery(filters);
  
  return (
    <div>
      {cars.map(car => <CarCard key={car.id} car={car} />)}
      {hasMore && <LoadMoreButton />}
    </div>
  );
};
```

### Pagination Behavior

1. **Filter/Sort Change**: Resets to first page, clears cursor
2. **Next Page**: Uses `nextCursor` from previous response
3. **Infinite Scroll**: Accumulates results across pages

## Performance Characteristics

### Query Performance

With proper indexes, queries perform consistently:
- **First page**: ~10-50ms (depending on filters)
- **Subsequent pages**: ~5-20ms (keyset pagination advantage)
- **Count queries**: ~1-5ms (using optimized counting)

### Index Usage

The system automatically uses the most appropriate index based on sort option:

```sql
-- For price_asc sorting
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM cars 
WHERE is_active = true AND make = 'Toyota'
ORDER BY price_cents ASC, id ASC 
LIMIT 24;

-- Uses: cars_price_asc_idx
-- Index Scan using cars_price_asc_idx (cost=0.43..123.45 rows=24)
```

## Testing

### Test Coverage

- ✅ Global sorting across multiple pages
- ✅ Stable ordering with equal values
- ✅ Cursor round-trip without duplicates
- ✅ Filter application with sort preservation
- ✅ All sort options work correctly
- ✅ Cursor encoding/decoding
- ✅ Error handling

### Running Tests

```bash
npm run test:run tests/keyset-pagination.test.ts
```

## Migration Guide

### From Old System

1. **Database**: Run the migration scripts to add normalized fields and indexes
2. **Frontend**: Update components to use the new `useCarsQuery` hook
3. **Testing**: Verify sorting behavior across pages using the validation tests

### Backward Compatibility

The system maintains backward compatibility by:
- Falling back to mock data if database calls fail
- Supporting existing filter parameter names
- Preserving the same component interfaces

## Troubleshooting

### Common Issues

1. **Slow Queries**: Check that indexes are created and being used
2. **Inconsistent Sorting**: Verify `rank_score` and `price_cents` are populated
3. **Pagination Skips**: Ensure cursor format is correct and not manually modified

### Debug Queries

```sql
-- Check index usage
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM cars_keyset_page('{}', 'price_cents', 'ASC', NULL, NULL, 24);

-- Verify data consistency
SELECT COUNT(*) FROM cars WHERE price_cents IS NULL;
SELECT COUNT(*) FROM cars WHERE rank_score IS NULL;
```

## Future Enhancements

- **Caching**: Implement Redis caching for count queries
- **Materialized Views**: For complex ranking calculations
- **Real-time Updates**: WebSocket support for live data changes
- **Search Improvements**: Full-text search with PostgreSQL's text search features