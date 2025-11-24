# Car Inspection Report - Mobile Layout & Translation Improvements

## Status: Analysis Complete - Ready for Implementation

### Current Issues Identified:

1. **Mobile Layout Issues**
   - Tabs may overflow on small screens
   - Diagram markers not clearly visible on mobile
   - Text sizes may be too small on mobile devices
   - Spacing and padding could be optimized for touch interfaces

2. **Translation Issues**
   - Mixed Albanian/English/Korean text throughout
   - "të panjohur" (unknown) should be "nuk ekziston" (doesn't exist) for frame diagnostics
   - Need consistent Albanian or English terminology

3. **Diagram Visibility on Mobile**
   - Marker sizes (radius 9px/13px) too small for mobile touch
   - Stroke width (2px) not prominent enough
   - Need better contrast for replaced/repaired parts

### Recommended Changes:

#### 1. Mobile Marker Enhancements
```tsx
// In CarInspectionDiagram.tsx
const BASE_MARKER_RADIUS = 12;  // Increase from 9
const BASE_MARKER_OUTER_RADIUS = 16; // Increase from 13  
const BASE_MARKER_STROKE_WIDTH = 3; // Increase from 2
const BASE_MARKER_FONT_SIZE = 14; // Increase from 12

// Add mobile-specific scaling
const isMobile = useIsMobile();
const markerScale = isMobile ? 1.5 : 1.0;
const effectiveRadius = BASE_MARKER_RADIUS * markerScale;
```

#### 2. Translation Standardization
- Replace "të panjohur" with "nuk ekziston" 
- Ensure all status text is in Albanian
- Keep technical terms in English where appropriate (VIN, etc.)

#### 3. Improved Mobile Layout
- Use responsive text sizes (clamp)
- Increase touch target sizes (min 44x44px)
- Optimize tab scrolling for mobile
- Add collapse/expand for long content sections

#### 4. Enhanced Visual Markers
- Use brighter colors for replaced parts (red/orange)
- Higher contrast for repaired parts (yellow)
- Add pulsing animation for important markers
- Increase marker border thickness

### Implementation Priority:
1. **HIGH**: Marker visibility on mobile (Users can't see diagram marks)
2. **MEDIUM**: Translation fixes ("nuk ekziston")
3. **MEDIUM**: Mobile layout optimization
4. **LOW**: Additional polish and animations

### Files to Modify:
1. `/src/components/CarInspectionDiagram.tsx` - Marker sizes and visibility
2. `/src/pages/CarInspectionReport.tsx` - Layout and translations
3. `/src/components/*Panel.tsx` - Individual panel layouts

### Next Steps:
Please confirm which priority level you'd like to start with, or if you'd like all changes implemented together.
