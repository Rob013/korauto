# Cache Management System

## Overview
Comprehensive cache management system to ensure all users automatically receive the latest updates without seeing stale/old content.

## Components

### 1. Service Worker (`public/sw.js`)
**Version:** `2025.06.01.001` (YYYY.MM.DD.BUILD format)

**Features:**
- **Automatic cache invalidation** - Old caches are deleted when version changes
- **Network-first strategy** for API calls (always fetch fresh data)
- **Shorter cache durations:**
  - API responses: 2 minutes
  - Images: 30 minutes
  - Static assets: 12 hours
  - JS/CSS: 24 hours
- **Version tracking** in cached responses
- **Client notification** when caches are updated

**How it works:**
1. When service worker activates, it deletes ALL old caches
2. Immediately claims all clients to use new cache
3. Sends message to all clients about cache update
4. Always tries network first for fresh data

### 2. Cache Manager (`src/utils/cacheManager.ts`)
Central utility for managing all caches.

**Key Functions:**
```typescript
// Initialize on app load - clears cache if version changed
cacheManager.initialize()

// Force clear all caches
cacheManager.clearAllCaches()

// Update service worker
cacheManager.updateServiceWorker()

// Setup periodic refresh checks (every 30 minutes)
cacheManager.setupPeriodicRefresh(30)
```

**What gets cleared:**
- localStorage (except theme and auth settings)
- sessionStorage
- All service worker caches

**What's preserved:**
- User theme preference
- Authentication state (rememberMe)

### 3. Cache Update Notification (`src/components/CacheUpdateNotification.tsx`)
Beautiful UI notification that appears when updates are available.

**Features:**
- Auto-detects service worker updates
- Checks version changes
- Shows update prompt to users
- One-click update with loading state
- Dismissible notification

### 4. Main App Integration (`src/main.tsx`)
**Initialization:**
- Cache manager runs on app load
- Service worker registered immediately
- Checks for updates every 30 seconds
- Listens for service worker messages
- Periodic refresh check every 30 minutes

### 5. React Query Configuration (`src/App.tsx`)
**Optimized for fresh data:**
- Stale time: 5 minutes (reduced from 10)
- GC time: 15 minutes (reduced from 30)
- Refetch on window focus: enabled
- Refetch on mount: always

## How Users Get Updates

### Automatic Updates
1. **First Visit After Update:**
   - Service worker version changes
   - All old caches automatically deleted
   - Fresh content served immediately

2. **Periodic Checks:**
   - Every 30 seconds: Check for service worker updates
   - Every 30 minutes: Version check and cache refresh
   - On window focus: Refetch stale data

3. **Manual Update:**
   - User sees notification about update
   - Clicks "Update Now"
   - All caches cleared
   - Page reloads with fresh content

### Developer Updates
**To force all users to update:**

1. **Update Service Worker Version:**
   ```javascript
   // In public/sw.js - Line 3
   const VERSION = '2025.06.01.002'; // Increment build number
   ```

2. **Deploy the change:**
   - All users will automatically get the update
   - Old caches will be cleared
   - Fresh content will be served

## Cache Strategies

### API Responses
**Strategy:** Network-first with cache fallback
- Always tries to fetch fresh data from network
- Only uses cache if network fails
- Cache expires after 2 minutes

### Images
**Strategy:** Network-first with cache fallback
- Fresh images fetched from network
- Cache expires after 30 minutes

### Static Assets (JS/CSS)
**Strategy:** Cache-first (safe because versioned)
- Cached indefinitely
- New versions have different filenames (hashed)

### HTML Documents
**Strategy:** Network-first
- Always fetch latest HTML from network
- Ensures users get latest version

## Benefits

### For Users
✅ Always see the latest content
✅ No need to manually clear cache
✅ Seamless updates with notification
✅ Fast performance with smart caching
✅ Works offline with cached fallbacks

### For Developers
✅ One version bump forces global update
✅ No more "try clearing your cache" support
✅ Automatic cache invalidation
✅ Version tracking and monitoring
✅ Easy to control update deployment

## Monitoring

### Console Logs
```javascript
// Service worker updates
'✅ Service Worker registered'
'🔄 New service worker available'
'🔄 Cache updated to version: X'

// Cache manager
'✅ All caches cleared successfully'
'🔄 App version changed, clearing caches...'
'✅ Service worker updated successfully'
```

### Version Tracking
- Current version stored in localStorage
- Compared on every app load
- Automatic cleanup when version changes

## Testing

### Test Cache Updates
1. Change VERSION in `public/sw.js`
2. Deploy or reload app
3. Should see notification about update
4. All caches should be cleared
5. Fresh content should load

### Test Offline Support
1. Load the app
2. Go offline
3. Navigate between pages
4. Should work with cached content
5. Go online - should fetch fresh data

## Best Practices

### When to Update Version
- Bug fixes
- New features
- Data structure changes
- UI updates
- Security patches

### Version Format
`YYYY.MM.DD.BUILD`
- Year: 4 digits
- Month: 2 digits
- Day: 2 digits
- Build: 3 digits (increment for multiple updates per day)

### Example Updates
```
2025.06.01.001 - Initial version
2025.06.01.002 - Bug fix
2025.06.02.001 - New feature
2025.06.02.002 - Hotfix
```

## Troubleshooting

### Users Still See Old Content
1. Check service worker version is updated
2. Verify service worker is registered
3. Check browser console for errors
4. Try incognito mode to test fresh load

### Cache Not Clearing
1. Verify `cacheManager.initialize()` is called in main.tsx
2. Check localStorage for version key
3. Verify service worker activation
4. Check browser cache settings

### Update Notification Not Showing
1. Verify CacheUpdateNotification is in App.tsx
2. Check console for version change logs
3. Verify service worker update events
4. Check component is not being unmounted

## Future Enhancements

- [ ] Real-time database sync with Supabase
- [ ] Background data refresh
- [ ] Progressive updates (staged rollout)
- [ ] Update size estimation
- [ ] Rollback capability
- [ ] Analytics for update adoption
