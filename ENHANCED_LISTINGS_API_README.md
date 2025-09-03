# Enhanced Listings API - Implementation Summary

This implementation provides a single, comprehensive listings endpoint with global backend sorting, complete filter support, and exact external API JSON parity.

## API Endpoints

### `/api/cars` - Car Listings with Global Sorting

**HTTP Method:** `GET`

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | integer | Page number (min: 1) | `page=1` |
| `pageSize` | integer | Results per page (min: 1, max: 100) | `pageSize=24` |
| `sort` | string | Sort option (see Sort Options below) | `sort=price_asc` |
| `make` | string | Car manufacturer filter | `make=Toyota` |
| `model` | string | Car model filter | `model=Camry` |
| `fuel` | string | Fuel type filter | `fuel=Gasoline` |
| `gearbox` | string | Transmission type filter | `gearbox=Automatic` |
| `drivetrain` | string | Drivetrain filter | `drivetrain=AWD` |
| `city` | string | Location/city filter | `city=Tokyo` |
| `yearMin` | integer | Minimum year filter | `yearMin=2020` |
| `yearMax` | integer | Maximum year filter | `yearMax=2024` |
| `priceMin` | number | Minimum price filter | `priceMin=20000` |
| `priceMax` | number | Maximum price filter | `priceMax=50000` |
| `mileageMax` | integer | Maximum mileage filter | `mileageMax=100000` |
| `q` | string | Text search query | `q=hybrid sedan` |

**Example Request:**
```
GET /api/cars?sort=price_asc&page=1&pageSize=24&make=Toyota&priceMin=20000&priceMax=50000
```

**Response Format:**
```json
{
  "items": [
    {
      "id": "car123",
      "api_id": "api456",
      "make": "Toyota",
      "model": "Camry",
      "year": 2021,
      "price": 25000,
      "price_cents": 2500000,
      "mileage": 50000,
      "fuel": "Gasoline",
      "transmission": "Automatic",
      "color": "Blue",
      "condition": "Used",
      "vin": "ABC123456",
      "location": "Tokyo",
      "image_url": "https://example.com/image.jpg",
      "images": [...],
      "title": "2021 Toyota Camry",
      "rank_score": 85,
      "lot_number": "LOT001",
      "created_at": "2023-01-01T00:00:00Z",
      "lots": [...]
    }
  ],
  "total": 1250,
  "page": 1,
  "pageSize": 24,
  "totalPages": 53,
  "hasPrev": false,
  "hasNext": true,
  "facets": {
    "makes": [
      { "value": "Toyota", "count": 150 },
      { "value": "Honda", "count": 120 }
    ],
    "models": [...],
    "fuels": [...],
    "gearboxes": [...],
    "cities": [...],
    "year_ranges": { "min": 2015, "max": 2024 },
    "price_ranges": { "min": 5000, "max": 100000 },
    "mileage_ranges": [...]
  }
}
```

### `/api/cars/:id` - Individual Car Details

**HTTP Method:** `GET`

**Path Parameters:**
- `id` - Car identifier

**Example Request:**
```
GET /api/cars/car123
```

**Response Format:**
Returns the exact same JSON structure as individual items in the listings response, ensuring complete API parity.

## Sort Options

The API uses a SORT_MAP whitelist to prevent unsafe dynamic ordering:

| Sort Value | Database Field | Direction | Description |
|------------|----------------|-----------|-------------|
| `price_asc` | `price_cents` | ASC | Price: Low to High |
| `price_desc` | `price_cents` | DESC | Price: High to Low |
| `year_asc` | `year` | ASC | Year: Oldest First |
| `year_desc` | `year` | DESC | Year: Newest First |
| `mileage_asc` | `mileage_km` | ASC | Mileage: Low to High |
| `mileage_desc` | `mileage_km` | DESC | Mileage: High to Low |
| `rank_asc` | `rank_score` | ASC | Rank: Best First |
| `rank_desc` | `rank_score` | DESC | Rank: Worst First |
| `make_asc` | `make` | ASC | Make: A-Z |
| `make_desc` | `make` | DESC | Make: Z-A |
| `created_asc` | `created_at` | ASC | Oldest Listed |
| `created_desc` | `created_at` | DESC | Recently Added |

**Frontend Compatibility Mappings:**
- `price_low` → `price_asc`
- `price_high` → `price_desc`
- `year_new` → `year_desc`
- `year_old` → `year_asc`
- `mileage_low` → `mileage_asc`
- `mileage_high` → `mileage_desc`
- `recently_added` → `created_desc`
- `popular` → `rank_desc`

## Global Backend Sorting

### Implementation Details

1. **Filter → Sort → Paginate Flow**
   - All filters applied first in WHERE clause
   - Global ORDER BY with NULLS LAST and stable ID tie-breaking
   - LIMIT/OFFSET pagination applied last

2. **Database Indexes**
   - All sort fields have optimized indexes with ID tie-breaking
   - Composite indexes for common filter+sort combinations
   - Full-text search indexes for text queries

3. **Guaranteed Global Results**
   - `sort=price_asc&page=1` always shows cheapest cars from entire filtered dataset
   - `sort=year_desc&page=1` always shows newest cars globally
   - No client-side sorting - all ordering happens in database

## Facets and Filtering

### Facet Computation
Facets represent the **entire filtered dataset**, not just the current page:

```sql
-- Example: When filtering by make=Toyota, model facets show 
-- all models available for Toyota across the whole dataset
SELECT model, COUNT(*) 
FROM cars_cache 
WHERE is_active = true AND make = 'Toyota'
GROUP BY model;
```

### Supported Facets
- **makes**: Car manufacturers with counts
- **models**: Car models with counts  
- **fuels**: Fuel types with counts
- **gearboxes**: Transmission types with counts
- **cities**: Available locations with counts
- **year_ranges**: Min/max year range
- **price_ranges**: Min/max price range
- **mileage_ranges**: Predefined mileage brackets with counts

## External API Mapping Parity

### mapDbToExternal Function

The `mapDbToExternal` function ensures identical JSON structure to external APIs:

```typescript
function mapDbToExternal(row: any): any {
  return {
    // Core identifiers - same keys as external API
    id: row.id,
    api_id: row.api_id,
    
    // Basic car info with correct types
    make: row.make,
    model: row.model,
    year: Number(row.year) || 0,
    price: row.price_cents ? Number(row.price_cents) / 100 : null,
    mileage: Number(row.mileage_km) || 0,
    
    // Preserve complete external API structure
    ...(row.car_data || {}),
    
    // Include lots array (external API format)
    lots: row.lot_data ? [row.lot_data] : [],
    
    // Override with normalized values for consistency
    // ...
  };
}
```

### Field Mapping Guarantees

- **Price**: Always numeric, stored as `price_cents` for precision
- **Year/Mileage**: Coerced to numbers for proper sorting
- **Images**: Preserved as arrays matching external API format
- **Options/Specs**: Pulled from `car_data` JSON column if not explicitly modeled
- **Seller/Location**: Mapped from `location` field or `car_data.city`

## Database Architecture

### Read-Only Denormalized Table
- Primary data source: `cars_cache` table
- Contains normalized fields for sorting/filtering
- Preserves complete external API data in `car_data` JSON column
- Regular sync from external APIs maintains data freshness

### Performance Optimizations
- Comprehensive indexes on all sort and filter fields
- Full-text search indexes for text queries
- Cursor-based pagination support for large datasets
- Edge caching with stale-while-revalidate strategy

## Testing Coverage

### Quick Validation Tests

1. **Sorting Verification**
   ```bash
   # Verify global price sorting
   curl "/api/cars?sort=price_asc&page=1&pageSize=5"
   # Page 1 should show cheapest cars from entire dataset
   
   curl "/api/cars?sort=price_asc&page=2&pageSize=5"  
   # Page 2 should continue ascending with no duplicates
   ```

2. **API Parity Check**
   ```bash
   # Pick any car ID from listings
   curl "/api/cars/car123"
   # Response should deep-equal the same car from listings
   ```

3. **Facets Validation**
   ```bash
   # Filter by make and check facet counts
   curl "/api/cars?make=Toyota&pageSize=1"
   # facets.models should show all Toyota models with accurate counts
   ```

### Test Files
- `tests/api-parity.test.ts` - Mapping function validation
- `tests/enhanced-listings-api.test.ts` - Complete requirements coverage
- `tests/global-sorting-simple.test.ts` - Sort field mapping tests

## Implementation Summary

✅ **Single listings endpoint** `/api/cars` with all filters and pagination  
✅ **Individual car endpoint** `/api/cars/:id` with identical JSON structure  
✅ **Global backend sorting** with SORT_MAP whitelist and NULLS LAST  
✅ **Complete filter support** for make, model, fuel, gearbox, drivetrain, city, ranges, search  
✅ **Whole-dataset facets** computed server-side with accurate counts  
✅ **External API mapping parity** via `mapDbToExternal` function  
✅ **DB-only reads** from denormalized `cars_cache` table  
✅ **Proper data types** with numeric coercion for price/year/mileage  
✅ **Performance indexes** for all sort and filter combinations  
✅ **Comprehensive tests** validating sorting, parity, and facets  

This implementation provides a robust, scalable API that meets all requirements while maintaining excellent performance and data consistency.