# KORAUTO Liquid Glass Theme

A responsive HTML, CSS, and JavaScript website implementing the iOS 26 "Liquid Glass" design theme with adaptive dropdown functionality.

## Features

### 🔮 iOS 26 Liquid Glass Theme
- **Translucent backgrounds** with real-time light reflection effects
- **Backdrop blur filters** for authentic glass morphism
- **Rounded corners** and **soft shadows** throughout
- **Animated shimmer effects** on glass surfaces
- **Dynamic light reflection** background animation

### 📱 Adaptive Dropdown Menu
- **Device detection** automatically determines platform
- **Native HTML `<select>`** for iPhone users (triggers iOS picker)
- **Custom styled dropdown** for desktop, Android, and other devices
- **Keyboard navigation** support for accessibility
- **Touch-friendly interactions** on mobile devices

### 🚗 Car Brand Filtering
Dropdown includes the following car brands:
- All (default option)
- Audi
- BMW
- Mercedes-Benz
- Volkswagen
- Porsche
- Land Rover
- Volvo
- Aston Martin
- Bentley

### 📱 Mobile Optimization
- **Responsive design** with mobile-first approach
- **Media queries** for screens up to 768px width
- **iPhone-specific optimizations** for smaller screens
- **Touch target improvements** for better mobile UX
- **Optimized performance** on mobile devices

## Technical Implementation

### Pure Technologies Used
- **HTML5** - Semantic structure
- **CSS3** - Advanced styling with backdrop filters
- **Vanilla JavaScript** - No external libraries

### Key CSS Features
- CSS backdrop filters for glass effect
- CSS custom properties (variables) for theming
- CSS Grid and Flexbox for responsive layouts
- CSS animations and transitions
- Media queries for responsive behavior

### JavaScript Functionality
- User agent detection for iOS devices
- Dynamic DOM manipulation
- Event handling for dropdown interactions
- Keyboard navigation support
- Performance optimizations (debouncing, RAF)

## Browser Compatibility

### Desktop Browsers
- Chrome 76+
- Firefox 103+
- Safari 14+
- Edge 79+

### Mobile Browsers
- iOS Safari 14+
- Chrome Mobile 76+
- Samsung Internet 12+

**Note**: Backdrop filter support is required for the full glass effect.

## File Structure

```
liquid-glass/
├── index.html          # Main HTML structure
├── styles.css          # iOS 26 Liquid Glass CSS theme
├── script.js           # Dropdown functionality and device detection
└── README.md           # This documentation
```

## Usage

1. Open `index.html` in a web browser
2. The page will automatically detect your device type
3. On iPhone: Native iOS picker will be used for dropdown
4. On other devices: Custom styled dropdown will be displayed
5. Select different car brands to filter the displayed cars

## Responsive Breakpoints

- **Desktop**: > 768px
- **Tablet**: 768px and below
- **Mobile**: 480px and below

## Performance Features

- Debounced scroll events
- RequestAnimationFrame for smooth animations
- Optimized CSS transforms and filters
- Minimal DOM manipulation
- Efficient event delegation

## Accessibility Features

- Keyboard navigation support
- Focus management
- ARIA-friendly interactions
- Touch target optimization
- Screen reader compatibility