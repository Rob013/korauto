# Filter Panel - Quick Reference Guide

## 🚀 Quick Start

### Using the FilterSection Component

```tsx
import { FilterSection } from './EncarStyleFilter';

// Basic usage
<FilterSection 
  label="Marka" 
  icon={<Car className="h-3 w-3" />}
  compact
>
  <AdaptiveSelect ... />
</FilterSection>

// Standard mode
<FilterSection 
  label="Model" 
  icon={<Settings className="h-4 w-4" />}
>
  <AdaptiveSelect ... />
</FilterSection>
```

### Filter Classes Reference

```css
/* Core filter classes */
.filter-section      /* Container for each filter */
.filter-control      /* Input/select styling */
.filter-label        /* Label styling */
.glass-panel         /* Glass morphism effect */

/* State classes */
.filter-panel-updating    /* During filter updates */
.filter-section-collapsible  /* Expandable sections */
```

## 📐 Component Props

### FilterSection Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | required | Filter label text |
| `icon` | ReactNode | required | Icon component |
| `compact` | boolean | false | Compact mode for mobile |
| `className` | string | '' | Additional CSS classes |
| `children` | ReactNode | required | Filter control content |

### EncarStyleFilter Props

| Prop | Type | Description |
|------|------|-------------|
| `filters` | APIFilters | Current filter state |
| `manufacturers` | Manufacturer[] | Brand list |
| `models` | Model[] | Model list |
| `onFiltersChange` | function | Filter update callback |
| `onClearFilters` | function | Clear all filters |
| `compact` | boolean | Compact mode toggle |

## 🎨 Styling Guidelines

### Spacing

```tsx
// Compact mode
space-y-3  // Between sections
h-9        // Control height
p-5 sm:p-6 // Panel padding

// Standard mode
space-y-4  // Between sections
h-10       // Control height
p-6        // Panel padding
```

### Colors

```css
/* Filter panels use these CSS variables */
--card               /* Panel background */
--card-foreground    /* Text color */
--border             /* Border color */
--muted              /* Muted elements */
--primary            /* Accent color */
```

## 🔧 Common Patterns

### Adding a New Filter

1. **Create filter section:**
```tsx
<FilterSection label="New Filter" icon={<Icon />} compact={compact}>
  <AdaptiveSelect
    value={filters.newFilter || 'all'}
    onValueChange={(value) => updateFilter('newFilter', value)}
    options={newFilterOptions}
    forceNative
  />
</FilterSection>
```

2. **Update filter state:**
```tsx
// In parent component
const [filters, setFilters] = useState<APIFilters>({
  // ... existing filters
  newFilter: undefined
});
```

3. **Handle dependencies:**
```tsx
const updateFilter = useCallback((key: string, value: string) => {
  if (key === 'parentFilter') {
    // Reset dependent filters
    updatedFilters = {
      ...filters,
      parentFilter: value,
      dependentFilter: undefined
    };
  }
}, [filters]);
```

### Optimizing Performance

```tsx
// ✅ Good: Memoize options
const options = useMemo(() => 
  items.map(item => ({ value: item.id, label: item.name })),
  [items]
);

// ❌ Bad: Recalculate on every render
const options = items.map(item => ({ value: item.id, label: item.name }));

// ✅ Good: Memoize callbacks
const handleChange = useCallback((value) => {
  updateFilter('key', value);
}, [updateFilter]);

// ❌ Bad: Create new function on every render
const handleChange = (value) => updateFilter('key', value);
```

## 🐛 Troubleshooting

### Issue: Filter not updating

**Cause:** Missing dependency in useCallback/useMemo

**Fix:**
```tsx
// ❌ Wrong
const update = useCallback((value) => {
  setFilter(value);
}, []); // Missing dependency!

// ✅ Correct
const update = useCallback((value) => {
  setFilter(value);
}, [setFilter]);
```

### Issue: Layout shift during loading

**Cause:** No fixed height for loading indicator

**Fix:**
```tsx
// ✅ Add min-height
<div className="min-h-4">
  {isLoading && <LoadingSpinner />}
</div>
```

### Issue: Slow filter updates

**Cause:** Multiple re-renders

**Fix:**
```tsx
// ✅ Batch updates in single call
const updatedFilters = {
  ...filters,
  field1: value1,
  field2: value2
};
onFiltersChange(updatedFilters);

// ❌ Multiple calls
onFiltersChange({ field1: value1 });
onFiltersChange({ field2: value2 });
```

## 📱 Mobile Best Practices

### Touch Targets

```tsx
// ✅ Minimum size: 44px × 44px
<Button className="min-h-[44px] min-w-[44px]">
  Click
</Button>

// ✅ Prevent iOS zoom
<Input className="text-base" /> // 16px minimum
```

### Performance

```tsx
// ✅ Use containment
<div className="filter-section contain-layout contain-style">
  {/* filters */}
</div>

// ✅ Optimize transitions
.filter-control {
  transition-duration: 120ms; // Instant on mobile
}
```

## 🎯 Performance Checklist

- [ ] Use `useMemo` for expensive computations
- [ ] Use `useCallback` for event handlers
- [ ] Add `contain: layout style;` to containers
- [ ] Use `transform` instead of `top/left` for animations
- [ ] Remove `will-change` when not needed
- [ ] Batch state updates
- [ ] Lazy load advanced filters
- [ ] Debounce search inputs

## 📚 Related Files

```
src/
├── components/
│   ├── EncarStyleFilter.tsx     ← Main filter component
│   ├── FilterForm.tsx           ← Alternative filter
│   └── FiltersPanel.tsx         ← Legacy filter
│
├── hooks/
│   ├── useFiltersData.ts        ← Filter data hooks
│   └── useFiltersFromUrl.ts     ← URL state sync
│
└── utils/
    └── catalog-filter.ts        ← Filter utilities
```

## 🔗 Helpful Links

- [React Performance](https://react.dev/learn/render-and-commit)
- [CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment)
- [Web Vitals](https://web.dev/vitals/)

## 💡 Tips & Tricks

### Debugging Re-renders

```tsx
// Add this to component
useEffect(() => {
  console.log('FilterSection rendered', { label, filters });
});
```

### Measuring Performance

```tsx
// Wrap expensive operations
performance.mark('filter-update-start');
updateFilter('key', value);
performance.mark('filter-update-end');
performance.measure(
  'filter-update',
  'filter-update-start',
  'filter-update-end'
);
```

### Testing Filters

```tsx
// Test that filters reset correctly
it('should reset dependent filters', () => {
  const onFiltersChange = jest.fn();
  const { getByRole } = render(
    <FilterPanel onFiltersChange={onFiltersChange} />
  );
  
  // Change brand
  fireEvent.change(getByRole('combobox', { name: 'Brand' }), {
    target: { value: 'toyota' }
  });
  
  // Check that dependent filters are reset
  expect(onFiltersChange).toHaveBeenCalledWith({
    manufacturer_id: 'toyota',
    model_id: undefined,
    grade_iaai: undefined
  });
});
```

---

**Need help?** Check the main documentation files:
- `FILTER_PANEL_IMPROVEMENTS.md` - Detailed changelog
- `FILTER_PANEL_NEXT_STEPS.md` - Future improvements
- `FILTER_IMPROVEMENTS_SUMMARY.md` - Complete overview
