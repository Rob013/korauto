/**
 * Cookie Management Tests
 * 
 * Simple tests to validate cookie functionality without a full test framework
 */

import { CookieManager } from '../utils/cookieManager';

export class CookieManagerTests {
  private static testResults: Array<{ name: string; passed: boolean; error?: string }> = [];

  private static log(testName: string, passed: boolean, error?: string) {
    this.testResults.push({ name: testName, passed, error });
    console.log(`${passed ? '✅' : '❌'} ${testName}${error ? `: ${error}` : ''}`);
  }

  static async runTests(): Promise<void> {
    console.log('🧪 Running Cookie Manager Tests...\n');
    this.testResults = [];

    // Clean up before tests
    CookieManager.clearAllCookies();

    await this.testBasicCookieOperations();
    await this.testSizeValidation();
    await this.testSessionManagement();
    await this.testPreferencesManagement();
    await this.testSecurityFeatures();
    await this.testLimitEnforcement();

    this.printSummary();
  }

  private static async testBasicCookieOperations() {
    console.log('\n📝 Testing Basic Cookie Operations...');

    try {
      // Test setting a cookie
      const success = CookieManager.setCookie('test_cookie', 'test_value');
      this.log('Set cookie', success);

      // Test getting a cookie
      const value = CookieManager.getCookie('test_cookie');
      this.log('Get cookie', value === 'test_value');

      // Test deleting a cookie
      CookieManager.deleteCookie('test_cookie');
      const deletedValue = CookieManager.getCookie('test_cookie');
      this.log('Delete cookie', deletedValue === null);

    } catch (error) {
      this.log('Basic operations', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private static async testSizeValidation() {
    console.log('\n📏 Testing Size Validation...');

    try {
      // Test normal size cookie
      const normalCookie = CookieManager.setCookie('normal', 'a'.repeat(100));
      this.log('Normal size cookie', normalCookie);

      // Test large cookie (should fail)
      const largeCookie = CookieManager.setCookie('large', 'a'.repeat(2000));
      this.log('Large cookie rejection', !largeCookie);

      // Test cookie stats
      const stats = CookieManager.getCookieStats();
      this.log('Cookie stats generation', stats && typeof stats.totalSize === 'number');

      // Clean up
      CookieManager.deleteCookie('normal');

    } catch (error) {
      this.log('Size validation', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private static async testSessionManagement() {
    console.log('\n🔐 Testing Session Management...');

    try {
      // Test session ID setting
      const sessionSuccess = CookieManager.setSessionId('test_session_123');
      this.log('Set session ID', sessionSuccess);

      // Test session ID retrieval
      const sessionId = CookieManager.getSessionId();
      this.log('Get session ID', sessionId === 'test_session_123');

      // Test session clearing
      CookieManager.clearSession();
      const clearedSession = CookieManager.getSessionId();
      this.log('Clear session', clearedSession === null);

    } catch (error) {
      this.log('Session management', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private static async testPreferencesManagement() {
    console.log('\n⚙️ Testing Preferences Management...');

    try {
      // Test setting preferences
      const prefs = { theme: 'dark', language: 'en', notifications: true };
      const prefSuccess = CookieManager.setPreferences(prefs);
      this.log('Set preferences', prefSuccess);

      // Test getting preferences
      const retrievedPrefs = CookieManager.getPreferences();
      this.log('Get preferences', JSON.stringify(retrievedPrefs) === JSON.stringify(prefs));

      // Test updating preferences
      const updateSuccess = CookieManager.updatePreferences({ theme: 'light' });
      this.log('Update preferences', updateSuccess);

      const updatedPrefs = CookieManager.getPreferences();
      this.log('Verify preference update', updatedPrefs?.theme === 'light');

      // Clean up
      CookieManager.deleteCookie('user_preferences');

    } catch (error) {
      this.log('Preferences management', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private static async testSecurityFeatures() {
    console.log('\n🛡️ Testing Security Features...');

    try {
      // Test secure cookie options
      const secureSuccess = CookieManager.setCookie('secure_test', 'value', {
        secure: true,
        sameSite: 'strict',
        path: '/'
      });
      this.log('Set secure cookie', secureSuccess);

      // Test invalid cookie name
      const invalidName = CookieManager.setCookie('invalid=name', 'value');
      this.log('Reject invalid cookie name', !invalidName);

      // Clean up
      CookieManager.deleteCookie('secure_test');

    } catch (error) {
      this.log('Security features', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private static async testLimitEnforcement() {
    console.log('\n⚖️ Testing Limit Enforcement...');

    try {
      // Add multiple cookies to approach limit
      const cookies = [];
      for (let i = 0; i < 5; i++) {
        const success = CookieManager.setCookie(`test_${i}`, 'x'.repeat(500));
        cookies.push(`test_${i}`);
        if (!success) break;
      }

      // Check if we're approaching limits
      const stats = CookieManager.getCookieStats();
      this.log('Limit monitoring', stats.totalSize > 0);

      // Test monitoring function
      const monitorStats = CookieManager.monitorUsage();
      this.log('Usage monitoring', monitorStats && typeof monitorStats.totalSize === 'number');

      // Clean up test cookies
      cookies.forEach(name => CookieManager.deleteCookie(name));

    } catch (error) {
      this.log('Limit enforcement', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private static printSummary() {
    console.log('\n📊 Test Summary:');
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    console.log(`${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('❌ Some tests failed:');
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.name}: ${result.error || 'Failed'}`);
      });
    }
  }

  static getResults() {
    return this.testResults;
  }
}

// Export a function to run tests from console
(window as any).runCookieTests = () => CookieManagerTests.runTests();