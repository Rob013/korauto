# KORAUTO Logo Setup Instructions

## High-Quality Logo Implementation

The homepage now supports separate light and dark mode logos for optimal visual experience.

### Required Logo Files

Place these files in the `public/lovable-uploads/` directory:

1. **Light Mode Logo**: `korauto-logo-light.png`
   - Optimized for light backgrounds
   - High resolution (recommended: 512x512px or higher)
   - PNG format with transparency support
   - Background should be transparent or match light theme

2. **Dark Mode Logo**: `korauto-logo-dark.png`
   - Optimized for dark backgrounds
   - Same resolution as light mode logo
   - PNG format with transparency support
   - Background should be transparent or match dark theme

### Logo Preparation Tips

#### Background Removal
- Use tools like Photoshop, GIMP, or online background removers
- Ensure clean edges with proper anti-aliasing
- Save as PNG with transparency

#### Color Optimization
- **Light Mode**: Use darker colors that contrast well with light backgrounds
- **Dark Mode**: Use lighter colors that contrast well with dark backgrounds
- Consider using white/light colors for dark mode version

#### File Specifications
- **Format**: PNG (for transparency support)
- **Resolution**: 512x512px minimum (256x256px will be displayed)
- **Color Depth**: 24-bit with alpha channel
- **File Size**: Keep under 100KB for optimal loading

### Current Fallback

If the new logo files are not available, the system will automatically fall back to the original logo:
- `d1ff645d-f293-44ab-b806-ae5eb2483633.png`

### Testing

1. Upload both logo files to `public/lovable-uploads/`
2. Test in both light and dark modes
3. Verify logo quality and contrast
4. Check mobile responsiveness

### Performance Features

- **Preloading**: Both logos are preloaded for fast display
- **LCP Optimization**: Logo loads with high priority
- **Responsive**: Automatically scales for different screen sizes
- **Fallback**: Graceful degradation if files are missing

## Implementation Details

The logo system uses:
- `<picture>` element for responsive image selection
- `prefers-color-scheme` media query for theme detection
- Error handling for missing files
- Critical CSS for optimal loading performance
