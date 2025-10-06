# iOS App Setup Guide

This guide covers the iOS-specific enhancements and how to build your KORAUTO app for iOS devices.

## ✅ What's Already Configured

The following iOS enhancements are now integrated:

### 1. **Capacitor Plugins Installed**
- `@capacitor/status-bar` - Control status bar appearance
- `@capacitor/splash-screen` - Native splash screen management
- `@capacitor/keyboard` - Better keyboard handling
- `@capacitor/haptics` - Tactile feedback
- `@capacitor/share` - Native share functionality
- `@capacitor/app` - App lifecycle events

### 2. **Utilities & Hooks**
- `useIOS()` - Detects iOS platform and safe area insets
- `useHaptics()` - Easy haptic feedback integration
- `iosNative` - Comprehensive iOS native features utility
- `IOSEnhancer` - Automatic iOS optimizations component

### 3. **iOS-Specific Styles**
- Safe area support for notch/Dynamic Island devices
- Touch optimizations (44px minimum touch targets)
- Smooth scrolling and better font rendering
- Hardware-accelerated animations
- Keyboard-aware layouts

## 🚀 Building for iOS

### Prerequisites
- Mac with macOS 13.0 or later
- Xcode 14.0 or later
- Apple Developer account (free or paid)

### Step-by-Step Build Process

#### 1. **Export and Clone Repository**
```bash
# Export to GitHub from Lovable
# Then clone on your Mac
git clone <your-repo-url>
cd korauto
```

#### 2. **Install Dependencies**
```bash
npm install
```

#### 3. **Add iOS Platform**
```bash
npx cap add ios
```

#### 4. **Build Web App**
```bash
npm run build
```

#### 5. **Sync to iOS**
```bash
npx cap sync ios
```

#### 6. **Update Configuration for Production**

Edit `capacitor.config.ts` and remove/comment the `server` section:

```typescript
import { defineConfig } from '@capacitor/cli';

const config: defineConfig = {
  appId: 'app.lovable.23abb83650154f11bf0037bd5abd247a',
  appName: 'korauto',
  webDir: 'dist',
  // Comment out for production builds
  // server: {
  //   url: 'https://23abb836-5015-4f11-bf00-37bd5abd247a.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // }
};

export default config;
```

#### 7. **Open in Xcode**
```bash
npx cap open ios
```

#### 8. **Configure in Xcode**

##### Bundle Identifier
1. Select project in sidebar
2. Go to "Signing & Capabilities"
3. Change Bundle Identifier to your unique ID: `com.yourcompany.korauto`

##### Signing
1. Select your Apple Developer account
2. Choose your Team
3. Xcode will automatically manage provisioning profiles

##### App Icons
1. Open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Add icons for all required sizes:
   - 20x20, 29x29, 40x40, 60x60 (2x and 3x versions)
   - 1024x1024 (App Store)

##### Launch Screen
1. Open `ios/App/App/Base.lproj/LaunchScreen.storyboard`
2. Customize your splash screen

##### Version & Build
1. Set Version (e.g., 1.0.0)
2. Set Build number (e.g., 1)

#### 9. **Test on Device/Simulator**
1. Select device/simulator from Xcode toolbar
2. Click Play button (▶️) or `Cmd + R`
3. App will build and launch

#### 10. **Archive for App Store**
1. Select "Any iOS Device" in Xcode
2. Product → Archive
3. Upload to App Store Connect
4. Submit for review

## 🎨 Using iOS Features in Code

### Haptic Feedback
```typescript
import { useHaptics } from '@/hooks/useHaptics';

const MyComponent = () => {
  const { impact, notification } = useHaptics();
  
  const handleClick = async () => {
    await impact('medium'); // light, medium, or heavy
    // Your action
  };
  
  const handleSuccess = async () => {
    await notification('success'); // success, warning, or error
  };
};
```

### iOS Detection
```typescript
import { useIOS } from '@/hooks/useIOS';

const MyComponent = () => {
  const { isIOS, isIOSNative, safeAreaInsets } = useIOS();
  
  return (
    <div style={{ paddingTop: safeAreaInsets.top }}>
      {isIOSNative && <p>Running on iOS!</p>}
    </div>
  );
};
```

### Native Share
```typescript
import { ShareButton } from '@/components/ShareButton';

const CarDetails = () => {
  return (
    <ShareButton 
      title="Check out this car!"
      text="2023 Toyota Camry"
      url={window.location.href}
    />
  );
};
```

### Status Bar Control
```typescript
import { iosNative } from '@/utils/iosNative';

// Set light status bar (for dark backgrounds)
await iosNative.statusBar.setLight();

// Set dark status bar (for light backgrounds)
await iosNative.statusBar.setDark();

// Hide status bar
await iosNative.statusBar.hide();

// Show status bar
await iosNative.statusBar.show();
```

### Keyboard Management
```typescript
import { iosNative } from '@/utils/iosNative';

// Hide keyboard
await iosNative.keyboard.hide();

// Listen for keyboard events
const removeListener = await iosNative.keyboard.addWillShowListener(() => {
  console.log('Keyboard will show');
});

// Clean up
removeListener();
```

## 🎯 iOS-Specific CSS Classes

The following classes are available for iOS optimizations:

```css
/* Safe area padding */
.ios-safe-top     /* Adds padding for notch/status bar */
.ios-safe-bottom  /* Adds padding for home indicator */
.ios-safe-left    /* Adds padding for left side */
.ios-safe-right   /* Adds padding for right side */
.ios-safe-all     /* Adds padding for all sides */

/* Layout helpers */
.header-ios       /* Header with safe area support */
.footer-ios       /* Footer with safe area support */
```

## 📱 Testing Checklist

- [ ] Test on iPhone with notch (iPhone X and newer)
- [ ] Test on iPhone with Dynamic Island (iPhone 14 Pro and newer)
- [ ] Test on older iPhones without notch
- [ ] Test on iPad (different aspect ratios)
- [ ] Test landscape orientation
- [ ] Test keyboard behavior on forms
- [ ] Test haptic feedback on buttons
- [ ] Test share functionality
- [ ] Test app going to background/foreground
- [ ] Test status bar appearance in light/dark mode

## 🔧 Development vs Production

### Development Mode (with hot-reload)
Keep `server.url` in `capacitor.config.ts`:
```typescript
server: {
  url: 'https://23abb836-5015-4f11-bf00-37bd5abd247a.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

### Production Mode
Remove or comment out the `server` section.

## 🐛 Common Issues

### Issue: White screen on launch
**Solution**: Make sure you've run `npm run build` and `npx cap sync ios` before opening Xcode.

### Issue: Keyboard covers input fields
**Solution**: Use the `keyboard-aware-container` class or implement scroll-to-input logic.

### Issue: Status bar overlaps content
**Solution**: Use `.ios-safe-top` class or `safeAreaInsets.top` from `useIOS()` hook.

### Issue: Haptics not working
**Solution**: Haptics only work on physical devices, not simulators.

## 📚 Additional Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Lovable Mobile Development Guide](https://docs.lovable.dev/mobile)

## 🎉 Next Steps

After successful iOS build:

1. Test thoroughly on multiple devices
2. Add app screenshots for App Store
3. Prepare app description and metadata
4. Set up privacy policy
5. Submit to App Store for review

Remember to run `npx cap sync ios` after any code changes to update the iOS project!
