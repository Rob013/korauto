// Client-side cache refresh handler
// This script handles service worker messages about cache updates

(function() {
  'use strict';

  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('🔄 New version available:', event.data.version);
        
        // Show user notification about update
        showUpdateNotification();
        
        // Optionally auto-refresh after a delay
        setTimeout(() => {
          if (confirm('A new version of KORAUTO is available. Would you like to refresh to get the latest features?')) {
            window.location.reload(true);
          }
        }, 2000);
      }
    });
    
    // Function to show update notification
    function showUpdateNotification() {
      // Create or update notification element
      let notification = document.getElementById('update-notification');
      
      if (!notification) {
        notification = document.createElement('div');
        notification.id = 'update-notification';
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 14px;
          z-index: 10000;
          cursor: pointer;
          transition: opacity 0.3s ease;
        `;
        
        notification.innerHTML = `
          <strong>🔄 New Version Available!</strong><br>
          <small>Click to refresh and get the latest updates</small>
        `;
        
        notification.onclick = function() {
          window.location.reload(true);
        };
        
        document.body.appendChild(notification);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }, 10000);
      }
    }

    // Force service worker update check on page load
    window.addEventListener('load', function() {
      navigator.serviceWorker.ready.then(function(registration) {
        // Check for service worker updates
        registration.update();
        
        // Set up periodic update checks (every 30 minutes)
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);
      });
    });

    // Handle page visibility changes to check for updates
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        navigator.serviceWorker.ready.then(function(registration) {
          registration.update();
        });
      }
    });
  }
})();