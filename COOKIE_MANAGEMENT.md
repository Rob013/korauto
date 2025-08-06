# Cookie Management System

This document describes the comprehensive cookie management system implemented for the Korauto application.

## Overview

The cookie management system provides secure, size-limited cookie handling with automatic validation and monitoring capabilities. It ensures compliance with the following requirements:

- Each cookie must be less than 1KB in size
- Total cookie storage must be less than 4KB per request
- Store only session IDs and basic user preferences
- Implement HttpOnly and Secure flags for sensitive cookies
- Provide comprehensive size checking and validation

## Features

### 🍪 Core Cookie Management
- **Size Validation**: Automatic validation ensures no cookie exceeds 1KB
- **Total Size Monitoring**: Prevents total cookie storage from exceeding 4KB
- **Secure Configuration**: Automatic application of Secure and SameSite attributes
- **Error Handling**: Comprehensive error reporting and validation feedback

### 🔐 Session Management
- **Secure Session IDs**: Automatic generation and management of session identifiers
- **Security Flags**: HttpOnly and Secure flags applied automatically for session cookies
- **Session Lifecycle**: Easy session creation, validation, and cleanup

### ⚙️ Preferences Management
- **JSON Storage**: Efficient storage of user preferences as JSON in cookies
- **Partial Updates**: Update individual preference values without replacing all data
- **Type Safety**: TypeScript support for typed preference objects

### 📊 Monitoring & Analytics
- **Real-time Monitoring**: Live tracking of cookie usage and size limits
- **Usage Statistics**: Detailed reporting on cookie count, sizes, and storage usage
- **Optimization Tools**: Automatic detection and cleanup of unnecessary cookies

## API Reference

### CookieManager Class

#### Basic Operations
```typescript
// Set a cookie with validation
CookieManager.setCookie(name: string, value: string, options?: CookieOptions): boolean

// Get a cookie value
CookieManager.getCookie(name: string): string | null

// Delete a cookie
CookieManager.deleteCookie(name: string, path?: string, domain?: string): void
```

#### Session Management
```typescript
// Set secure session ID
CookieManager.setSessionId(sessionId: string): boolean

// Get current session ID
CookieManager.getSessionId(): string | null

// Clear session
CookieManager.clearSession(): void
```

#### Preferences Management
```typescript
// Set user preferences
CookieManager.setPreferences(preferences: Record<string, any>): boolean

// Get user preferences
CookieManager.getPreferences<T>(): T | null

// Update specific preferences
CookieManager.updatePreferences(updates: Record<string, any>): boolean
```

#### Monitoring & Optimization
```typescript
// Get cookie usage statistics
CookieManager.getCookieStats(): CookieStats

// Monitor usage with warnings
CookieManager.monitorUsage(): CookieStats

// Optimize cookie storage
CookieManager.optimizeCookies(): void
```

### React Hooks

#### useCookie Hook
```typescript
const { value, setValue, remove, loading } = useCookie('cookieName', 'defaultValue');
```

#### useSessionId Hook
```typescript
const { sessionId, setSession, clearSession, generateSession, loading } = useSessionId();
```

#### usePreferences Hook
```typescript
const { preferences, updatePreferences, setPreferences, clearPreferences, loading } = usePreferences<UserPrefs>();
```

#### useCookieMonitor Hook
```typescript
const { stats, refreshStats, optimize, clearAll, loading } = useCookieMonitor();
```

#### useSidebarState Hook
```typescript
const { isOpen, setOpen, toggle, loading } = useSidebarState(defaultOpen);
```

## Usage Examples

### Basic Cookie Operations
```typescript
import { CookieManager } from '@/utils/cookieManager';

// Set a secure cookie
const success = CookieManager.setCookie('user_setting', 'dark_mode', {
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 // 7 days
});

// Get the cookie value
const setting = CookieManager.getCookie('user_setting');

// Delete the cookie
CookieManager.deleteCookie('user_setting');
```

### Session Management
```typescript
import { useSessionId } from '@/hooks/useCookieManagement';

function LoginComponent() {
  const { sessionId, generateSession, clearSession } = useSessionId();
  
  const handleLogin = async () => {
    // Generate a new session after authentication
    const success = generateSession();
    if (success) {
      console.log('Session created successfully');
    }
  };
  
  const handleLogout = () => {
    clearSession();
  };
  
  return (
    <div>
      <p>Session: {sessionId || 'Not logged in'}</p>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

### User Preferences
```typescript
import { usePreferences } from '@/hooks/useCookieManagement';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
}

function SettingsComponent() {
  const { preferences, updatePreferences } = usePreferences<UserPreferences>({
    theme: 'system',
    language: 'en',
    notifications: true
  });
  
  const handleThemeChange = (theme: string) => {
    updatePreferences({ theme });
  };
  
  return (
    <div>
      <select value={preferences?.theme} onChange={(e) => handleThemeChange(e.target.value)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}
```

### Cookie Monitoring
```typescript
import { useCookieMonitor } from '@/hooks/useCookieManagement';

function CookieMonitorComponent() {
  const { stats, refreshStats, optimize } = useCookieMonitor();
  
  if (!stats) return <div>Loading...</div>;
  
  const usagePercentage = (stats.totalSize / 4096) * 100;
  
  return (
    <div>
      <h3>Cookie Usage: {Math.round(usagePercentage)}%</h3>
      <p>Total Size: {stats.totalSize} bytes / 4096 bytes</p>
      <p>Cookie Count: {stats.cookieCount}</p>
      
      {usagePercentage > 80 && (
        <div className="warning">
          Cookie storage approaching limit! Consider optimizing.
        </div>
      )}
      
      <button onClick={optimize}>Optimize Cookies</button>
      <button onClick={refreshStats}>Refresh Stats</button>
    </div>
  );
}
```

## Security Considerations

### Automatic Security Features
- **Secure Flag**: Automatically applied when using HTTPS
- **SameSite**: Configured to 'strict' for session cookies, 'lax' for preferences
- **HttpOnly**: Applied to session cookies (server-side implementation required)
- **Path**: Restricted to '/' by default for security

### Size Limits Enforcement
- **Individual Cookie Limit**: 1KB maximum per cookie
- **Total Storage Limit**: 4KB maximum total cookie storage
- **Validation**: All cookies are validated before setting
- **Monitoring**: Continuous monitoring with warnings at 80% capacity

### Best Practices
1. Store only essential data in cookies
2. Use session IDs for user identification, not sensitive data
3. Implement proper session timeout mechanisms
4. Regularly monitor and optimize cookie usage
5. Use typed interfaces for preference objects

## Integration with Existing Systems

### Sidebar State Management
The existing sidebar component has been updated to use the new cookie management system:

```typescript
// Before (manual cookie handling)
document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`

// After (secure cookie management)
const { isOpen, setOpen } = useSidebarState(defaultOpen);
```

### Supabase Integration
The cookie management system can be integrated with Supabase Edge Functions for server-side cookie handling:

```typescript
// In Supabase Edge Function
import { CookieManager } from './cookieManager.ts';

// Validate and set cookies server-side
const success = CookieManager.setCookie('session_id', sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
```

## Testing

### Automated Tests
Run the built-in tests to validate cookie functionality:

```typescript
import { CookieManagerTests } from '@/utils/cookieManagerTests';

// Run all tests
await CookieManagerTests.runTests();

// Or run from browser console
window.runCookieTests();
```

### Manual Testing
1. Navigate to `/cookie-management` to access the dashboard
2. Test setting cookies with various sizes
3. Monitor usage statistics
4. Test session management
5. Verify preference persistence

## Dashboard Features

The Cookie Management Dashboard (`/cookie-management`) provides:

- **Real-time Usage Monitoring**: Live tracking of cookie storage usage
- **Cookie Management**: View, create, and delete individual cookies
- **Session Management**: Generate and manage session IDs
- **Preferences Editor**: Manage user preferences with form controls
- **Optimization Tools**: Automated cookie cleanup and optimization
- **Visual Indicators**: Progress bars and alerts for storage limits

## Configuration

### Cookie Options Interface
```typescript
interface CookieOptions {
  maxAge?: number;           // Expiration time in seconds
  expires?: Date;            // Expiration date
  path?: string;             // Cookie path
  domain?: string;           // Cookie domain
  secure?: boolean;          // Secure flag (HTTPS only)
  httpOnly?: boolean;        // HttpOnly flag (server-only access)
  sameSite?: 'strict' | 'lax' | 'none'; // SameSite attribute
}
```

### Default Configurations
- **Session Cookies**: Secure, SameSite=strict, 24-hour expiration
- **Preference Cookies**: Secure, SameSite=lax, 30-day expiration
- **General Cookies**: Secure when on HTTPS, SameSite=lax, 7-day expiration

## Browser Compatibility

The cookie management system is compatible with all modern browsers supporting:
- ES2018+ JavaScript features
- Web Crypto API (for session ID generation)
- Document.cookie API
- TypeScript (for development)

## Troubleshooting

### Common Issues

1. **Cookie Not Set**: Check size limits and validation errors in console
2. **Total Size Exceeded**: Monitor usage and optimize existing cookies
3. **Security Warnings**: Ensure HTTPS for secure cookies
4. **Type Errors**: Use proper TypeScript interfaces for preferences

### Debug Mode
Enable detailed logging by setting cookies manually:
```typescript
CookieManager.setCookie('debug_mode', 'true');
```

This will provide additional console output for troubleshooting.