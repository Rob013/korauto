/**
 * Tracking functionality for shipment tracking page
 * 
 * USAGE NOTES:
 * - This module exports submitTracking(e) for form submission
 * - Calls /api/cig-track API endpoint 
 * - Renders results as cards with event details
 * - Handles loading states and error messages
 * 
 * AUTH INTEGRATION:
 * - The tracking.html page handles auth checks
 * - This module focuses purely on tracking functionality
 */

// Show status message with different types
function showStatus(message, type = 'loading') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = type;
    statusEl.style.display = 'block';
}

// Hide status message
function hideStatus() {
    const statusEl = document.getElementById('status');
    statusEl.style.display = 'none';
}

// Render tracking results as cards
function renderResults(data) {
    const resultsEl = document.getElementById('results');
    
    if (!data.rows || data.rows.length === 0) {
        resultsEl.innerHTML = `
            <div class="result-card">
                <div class="card-body">
                    <div class="event-status">No updates found</div>
                    <p>No tracking information was found for "${data.query}". Please check your VIN or B/L number and try again.</p>
                </div>
            </div>
        `;
        resultsEl.style.display = 'block';
        return;
    }

    const cardsHtml = data.rows.map((row, index) => `
        <div class="result-card">
            <div class="card-header">
                <div class="event-status">${escapeHtml(row.event || 'Status Update')}</div>
            </div>
            <div class="card-body">
                <div class="event-details">
                    ${row.date ? `<div><strong>Date:</strong> ${escapeHtml(row.date)}</div>` : ''}
                    ${row.location ? `<div><strong>Location:</strong> ${escapeHtml(row.location)}</div>` : ''}
                    ${row.vessel ? `<div><strong>Vessel:</strong> ${escapeHtml(row.vessel)}</div>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    resultsEl.innerHTML = `
        <h3 style="color: #2c3e50; margin-bottom: 1rem;">Tracking Results for: ${escapeHtml(data.query)}</h3>
        ${cardsHtml}
    `;
    resultsEl.style.display = 'block';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Submit tracking form
export function submitTracking(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const query = formData.get('q')?.trim();
    
    if (!query) {
        showStatus('Please enter a VIN or B/L number', 'error');
        return;
    }
    
    // Show loading state
    showStatus('Searching...', 'loading');
    
    // Hide previous results
    const resultsEl = document.getElementById('results');
    resultsEl.style.display = 'none';
    
    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Searching...';
    
    // Call tracking API
    fetch(`/api/cig-track?q=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error('Invalid tracking number format');
                } else if (response.status === 401) {
                    throw new Error('Authentication required. Please log in again.');
                } else if (response.status >= 500) {
                    throw new Error('Service temporarily unavailable. Please try again later.');
                } else {
                    throw new Error(`Request failed: ${response.status}`);
                }
            }
            return response.json();
        })
        .then(data => {
            hideStatus();
            renderResults(data);
        })
        .catch(error => {
            console.error('Tracking error:', error);
            
            let errorMessage = 'An error occurred while tracking your shipment.';
            
            if (error.message.includes('Authentication')) {
                errorMessage = error.message;
                // Could redirect to login here if needed
                // window.location.href = '/login.html';
            } else if (error.message.includes('Invalid tracking')) {
                errorMessage = 'Please check your VIN or B/L number format and try again.';
            } else if (error.message.includes('Service temporarily')) {
                errorMessage = error.message;
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Unable to connect to tracking service. Please check your internet connection.';
            }
            
            showStatus(errorMessage, 'error');
            
            // Hide results on error
            resultsEl.style.display = 'none';
        })
        .finally(() => {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
}

// Make submitTracking available globally for the HTML form
window.submitTracking = submitTracking;

// Auto-focus on the input field when page loads
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('tracking-input');
    if (input) {
        input.focus();
    }
});