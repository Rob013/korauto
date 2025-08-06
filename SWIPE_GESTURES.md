# Swipe Gesture Implementation

This document describes the swipe gesture functionality implemented for the catalog page filter panel.

## Features

### 1. Swipe Right to Show Filters
- **Gesture**: Swipe from left to right on the main content area
- **Platform**: Mobile devices only (detected via `useIsMobile` hook)
- **Behavior**: Opens the filter panel overlay
- **Requirements**: 
  - Minimum horizontal distance: 80px
  - Maximum vertical movement: 120px
  - Gesture time limit: 500ms

### 2. Swipe Left to Close Filters
- **Gesture**: Swipe from right to left on the filter panel
- **Platform**: Mobile devices only
- **Behavior**: Closes the filter panel overlay
- **Requirements**: 
  - Minimum horizontal distance: 80px
  - Maximum vertical movement: 120px
  - Gesture time limit: 500ms

## Technical Implementation

### Files Modified

1. **`src/hooks/useSwipeGesture.ts`** (New)
   - Custom hook for touch gesture detection
   - Handles `touchstart`, `touchmove`, and `touchend` events
   - Validates gesture direction, distance, and timing
   - Prevents interference with scrolling

2. **`src/components/EncarCatalog.tsx`** (Modified)
   - Added refs for main content and filter panel
   - Integrated swipe gesture hooks
   - Connected gestures to existing `showFilters` state

### Event Handling

The swipe gesture implementation uses:
- `touchstart`: Records initial touch position and timestamp
- `touchmove`: Prevents default for horizontal gestures to avoid conflicts
- `touchend`: Calculates gesture distance and direction, triggers actions

### Gesture Validation

- **Direction**: Horizontal movement must be > vertical movement
- **Distance**: Minimum 80px horizontal movement required
- **Speed**: Maximum 500ms gesture duration
- **Precision**: Prevents accidental triggers during scrolling

### Integration

The swipe functionality integrates seamlessly with:
- Existing filter panel visibility state (`showFilters`)
- Mobile responsive design
- Touch-friendly UI elements
- Accessibility features

## Usage

On mobile devices, users can:
1. **Open filters**: Swipe right anywhere on the main content area
2. **Close filters**: Swipe left on the filter panel overlay
3. **Alternative**: Use the "Filtrat" button in the header
4. **Alternative**: Use the "Mbyll Filtrat" button in the filter panel

## Browser Support

The implementation uses modern touch events and is compatible with:
- iOS Safari
- Chrome on Android
- Edge Mobile
- Other modern mobile browsers supporting Touch API

## Performance

- Event listeners use appropriate `passive` flags for scroll performance
- Touch events are only attached on mobile devices
- Minimal impact on desktop users (no touch event listeners)
- Optimized gesture detection with efficient calculations