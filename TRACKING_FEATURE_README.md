# KORAUTO Tracking Feature

A members-only shipment tracking feature that allows signed-in users to track VIN/B/L numbers using CIG Shipping data.

## Files Overview

### 1. `/tracking.html`
- Clean tracking page with authentication check
- Form for VIN/B/L input (name="q")
- Status area for loading/error messages
- Results container for tracking data
- Collapsible iframe fallback to CIG Shipping

### 2. `/assets/tracking.js`
- Vanilla JavaScript module for form handling
- Exports `submitTracking(e)` function
- Calls `/api/cig-track` API endpoint
- Renders tracking results as cards
- Comprehensive error handling

### 3. `cloudflare-worker.js`
- Cloudflare Worker for `/api/cig-track` endpoint
- Fetches data from CIG Shipping website
- Parses HTML tables using tolerant regex
- Deduplicates similar tracking entries
- Optional authentication enforcement

### 4. `/login.html`
- Simple login redirect page
- Placeholder for auth integration

## Setup Instructions

### 1. Authentication Integration

Replace the placeholder `CHECK_AUTH()` function in `tracking.html`:

```javascript
function CHECK_AUTH() {
    // Replace with your actual authentication check
    // Example: Check Supabase auth, cookies, localStorage, etc.
    return supabase.auth.getUser().then(user => !!user);
}
```

### 2. Cloudflare Worker Deployment

1. Deploy `cloudflare-worker.js` to Cloudflare Workers
2. Set up route: `/api/cig-track*` → your worker
3. Optional: Set environment variable `AUTH_ENABLED=true` to enable auth

### 3. Authentication in Worker (Optional)

To enable authentication in the worker:

```javascript
// Set in Cloudflare Worker environment
AUTH_ENABLED = "true"
AUTH_COOKIE_NAME = "your_session_cookie"
```

Then customize the `checkAuthentication()` function to validate with your auth system.

### 4. Connect Logout Functionality

Update the logout button in `tracking.html`:

```javascript
function handleLogout() {
    // Replace with your logout logic
    await supabase.auth.signOut();
    window.location.href = '/';
}
```

## Usage

1. User visits `/tracking.html`
2. Page checks authentication with `requireAuthOrRedirect()`
3. If not authenticated, redirects to `/login.html`
4. Authenticated users can enter VIN/B/L numbers
5. Form submission calls `/api/cig-track` API
6. Results displayed as cards with event details
7. Fallback iframe available for direct CIG Shipping access

## Features

- ✅ Members-only access with auth check
- ✅ Clean, responsive UI with gradient design
- ✅ Form validation and error handling
- ✅ Loading states and status messages
- ✅ Card-based results display
- ✅ Collapsible iframe fallback
- ✅ CORS headers for cross-origin requests
- ✅ XSS protection with HTML escaping
- ✅ Comprehensive error handling (400, 401, 5xx)
- ✅ Tolerant HTML parsing with deduplication

## Error Handling

The system handles various error scenarios:

- **400**: Invalid or missing query parameter
- **401**: Authentication required
- **5xx**: Service temporarily unavailable
- **Network**: Connection issues
- **Parsing**: HTML parsing failures

## Mobile Support

The interface is fully responsive and works on:
- Desktop browsers
- Mobile phones
- Tablets

## Security Notes

- All user input is validated and escaped
- CORS headers properly configured
- Optional authentication enforcement
- No sensitive data logged
- XSS protection implemented

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used (fetch, arrow functions, etc.)
- No external dependencies required