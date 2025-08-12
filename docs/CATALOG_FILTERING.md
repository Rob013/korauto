# Catalog Filtering Documentation

## Zero Car Filtering

This document describes the filtering functionality that removes categories (manufacturers) and models with 0 cars from the catalog display.

### Overview

The application implements comprehensive filtering to ensure that only manufacturers and models with available cars are displayed to users. This improves the user experience by preventing selection of empty categories.

### Implementation

#### Manufacturer Filtering

Implemented in `src/utils/catalog-filter.ts` in the `sortManufacturers` function:

```typescript
return manufacturers
  .filter(m => {
    // Ensure manufacturer has valid data from API
    return m.id && 
           m.name && 
           typeof m.name === 'string' && 
           m.name.trim().length > 0 &&
           (m.cars_qty && m.cars_qty > 0);
  })
```

**Criteria for exclusion:**
- `cars_qty` is 0, null, undefined, or negative
- Missing or invalid `id`
- Missing, empty, or whitespace-only `name`

#### Model Filtering

Implemented in multiple filter components:

1. **FilterForm.tsx** (line 290):
   ```typescript
   models.filter((model) => model.cars_qty && model.cars_qty > 0)
   ```

2. **EncarStyleFilter.tsx** (lines 305, 642, 812):
   ```typescript
   models.filter(model => model.cars_qty && model.cars_qty > 0)
   ```

**Criteria for exclusion:**
- `cars_qty` is 0, null, undefined, or negative

### Testing

Comprehensive test suite in `tests/catalog-zero-car-filtering.test.ts` covers:

- ✅ Manufacturer filtering with various edge cases
- ✅ Model filtering logic simulation
- ✅ Edge cases (negative values, null/undefined, invalid data)
- ✅ Data consistency and referential integrity

### User Experience

#### Before Filtering
```
Brand: BMW (245)
Brand: Mercedes (189)
Brand: EmptyBrand (0)  ← Would be confusing to users
Brand: Audi (167)
```

#### After Filtering
```
Brand: BMW (245)
Brand: Mercedes (189)
Brand: Audi (167)
```

### API Integration

The filtering relies on the `cars_qty` field provided by the API for both manufacturers and models. This field should contain the current count of available cars for each category.

### Maintenance

When adding new filter components or modifying existing ones:

1. **Always apply the zero-car filter**: `items.filter(item => item.cars_qty && item.cars_qty > 0)`
2. **Run the test suite**: `npm run test tests/catalog-zero-car-filtering.test.ts`
3. **Verify in browser**: Check that no "(0)" entries appear in dropdowns

### Performance Considerations

- Filtering is applied client-side after API data is received
- No additional API calls are needed
- Filtering occurs during render, so it's optimized for small-medium datasets
- Consider server-side filtering for very large datasets

### Related Files

- `src/utils/catalog-filter.ts` - Main filtering utilities
- `src/components/FilterForm.tsx` - Primary filter component
- `src/components/EncarStyleFilter.tsx` - Alternative filter styles
- `tests/catalog-zero-car-filtering.test.ts` - Test suite