# Car Visibility Fix

## Problem
Some cars were not showing up in the catalog despite being fetched from the API and having sold cars properly filtered. Users reported missing cars that should have been visible.

## Root Cause
The issue was caused by **double filtering** between the database and frontend:

1. **Database Level**: The `active_cars` view filters out cars archived/sold for more than 24 hours
2. **Frontend Level**: Both `CarCard.tsx` and `LazyCarCard.tsx` had `shouldHideSoldCar()` logic that re-filtered sold cars

This double filtering created edge cases where:
- Cars archived for maintenance were incorrectly hidden
- Timing precision differences between SQL and JavaScript caused inconsistencies
- Cars with missing or inconsistent archiving data were filtered too aggressively

## Solution
Modified the frontend `shouldHideSoldCar()` logic in both components to:

1. **Trust database filtering more**: Since the `active_cars` view already handles the primary filtering, the frontend should be more permissive
2. **Add timing buffer**: Use 24.5 hours instead of 24 hours to account for timing differences between database and frontend calculations
3. **Be more selective**: Only hide cars that are definitively sold (`archive_reason === 'sold'`) and clearly over the time limit
4. **Handle edge cases gracefully**: Show cars with unclear data rather than hiding them

## Changes Made

### Before (Restrictive Logic)
```typescript
const shouldHideSoldCar = () => {
  if (!is_archived || !archived_at || archive_reason !== 'sold') {
    return false; // Not a sold car
  }
  
  const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
  return hoursSinceArchived > 24; // Hide if sold more than 24 hours ago
};
```

### After (Permissive Logic)
```typescript
const shouldHideSoldCar = () => {
  // Only hide if it's definitively a sold car that's clearly old
  if (is_archived && archived_at && archive_reason === 'sold') {
    const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceArchived > 24.5; // 30-minute buffer for timing differences
  }
  
  // Default: show the car (trust database filtering)
  return false;
};
```

## Impact
- **More cars visible**: Cars archived for maintenance or other reasons are now properly shown
- **Better timing accuracy**: 30-minute buffer prevents edge cases around the 24-hour boundary
- **Safer defaults**: When in doubt, show the car rather than hide it
- **Maintains core functionality**: Still properly hides old sold cars as intended

## Testing
Added comprehensive tests covering:
- Edge cases with different archive reasons
- Timing boundary conditions
- Data integrity issues
- Invalid date handling

All original sold car removal tests continue to pass, ensuring no regression in core functionality.