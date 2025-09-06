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
                    <p>No results found for ${escapeHtml(data.query)}.</p>
                </div>
            </div>
        `;
        resultsEl.style.display = 'block';
        return;
    }

    let cardsHtml = '';
    
    // Check if first row is metadata
    let startIndex = 0;
    if (data.rows[0] && data.rows[0].type === 'metadata') {
        const metadata = data.rows[0];
        cardsHtml += renderMetadataCard(metadata);
        startIndex = 1;
    }
    
    // Render tracking events
    const eventCards = data.rows.slice(startIndex).map((row, index) => {
        return renderTrackingEventCard(row, index);
    }).join('');

    resultsEl.innerHTML = `
        <div class="tracking-header">
            <h3>Tracking Results for: ${escapeHtml(data.query)}</h3>
        </div>
        ${cardsHtml}
        ${eventCards}
    `;
    resultsEl.style.display = 'block';
}

// Render metadata card with comprehensive shipment information
function renderMetadataCard(metadata) {
    const fields = [];
    
    if (metadata.containerNumber) {
        fields.push(`<div class="metadata-field"><strong>Container Number:</strong> ${escapeHtml(metadata.containerNumber)}</div>`);
    }
    if (metadata.billOfLading) {
        fields.push(`<div class="metadata-field"><strong>Bill of Lading:</strong> ${escapeHtml(metadata.billOfLading)}</div>`);
    }
    if (metadata.vesselName) {
        fields.push(`<div class="metadata-field"><strong>Vessel:</strong> ${escapeHtml(metadata.vesselName)}</div>`);
    }
    if (metadata.voyageNumber) {
        fields.push(`<div class="metadata-field"><strong>Voyage:</strong> ${escapeHtml(metadata.voyageNumber)}</div>`);
    }
    if (metadata.shippingLine) {
        fields.push(`<div class="metadata-field"><strong>Shipping Line:</strong> ${escapeHtml(metadata.shippingLine)}</div>`);
    }
    if (metadata.portOfLoading) {
        fields.push(`<div class="metadata-field"><strong>Port of Loading:</strong> ${escapeHtml(metadata.portOfLoading)}</div>`);
    }
    if (metadata.portOfDischarge) {
        fields.push(`<div class="metadata-field"><strong>Port of Discharge:</strong> ${escapeHtml(metadata.portOfDischarge)}</div>`);
    }
    if (metadata.shipper) {
        fields.push(`<div class="metadata-field"><strong>Shipper:</strong> ${escapeHtml(metadata.shipper)}</div>`);
    }
    if (metadata.model) {
        fields.push(`<div class="metadata-field"><strong>Model (Year):</strong> ${escapeHtml(metadata.model)}</div>`);
    }
    if (metadata.chassis) {
        fields.push(`<div class="metadata-field"><strong>Chassis:</strong> ${escapeHtml(metadata.chassis)}</div>`);
    }
    if (metadata.onBoard) {
        fields.push(`<div class="metadata-field"><strong>On Board:</strong> ${escapeHtml(metadata.onBoard)}</div>`);
    }
    if (metadata.estimatedArrival) {
        fields.push(`<div class="metadata-field"><strong>Estimated Arrival:</strong> ${escapeHtml(metadata.estimatedArrival)}</div>`);
    }
    
    if (fields.length === 0) {
        return '';
    }
    
    return `
        <div class="result-card metadata-card">
            <div class="card-header">
                <div class="event-status">📋 Shipment Information</div>
            </div>
            <div class="card-body">
                <div class="metadata-grid">
                    ${fields.join('')}
                </div>
            </div>
        </div>
    `;
}

// Render individual tracking event card
function renderTrackingEventCard(row, index) {
    const fields = [];
    
    if (row.date) {
        fields.push(`<div><strong>Date:</strong> ${escapeHtml(row.date)}</div>`);
    }
    if (row.location) {
        fields.push(`<div><strong>Location:</strong> ${escapeHtml(row.location)}</div>`);
    }
    if (row.vessel) {
        fields.push(`<div><strong>Vessel:</strong> ${escapeHtml(row.vessel)}</div>`);
    }
    if (row.containerNumber) {
        fields.push(`<div><strong>Container:</strong> ${escapeHtml(row.containerNumber)}</div>`);
    }
    if (row.status) {
        fields.push(`<div><strong>Status:</strong> ${escapeHtml(row.status)}</div>`);
    }
    
    const statusIcon = getStatusIcon(row.event || row.status || 'Update');
    
    return `
        <div class="result-card tracking-event-card">
            <div class="card-header">
                <div class="event-status">${statusIcon} ${escapeHtml(row.event || row.status || 'Status Update')}</div>
            </div>
            <div class="card-body">
                <div class="event-details">
                    ${fields.join('')}
                </div>
            </div>
        </div>
    `;
}

// Get appropriate icon for status
function getStatusIcon(status) {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('arrived') || statusLower.includes('arrival')) {
        return '🚢';
    } else if (statusLower.includes('departed') || statusLower.includes('departure')) {
        return '⚓';
    } else if (statusLower.includes('loaded') || statusLower.includes('loading')) {
        return '📦';
    } else if (statusLower.includes('discharged') || statusLower.includes('discharge')) {
        return '🏗️';
    } else if (statusLower.includes('customs') || statusLower.includes('cleared')) {
        return '✅';
    } else if (statusLower.includes('gate')) {
        return '🚪';
    } else {
        return '📍';
    }
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
    let query = formData.get('q')?.trim();
    
    if (!query) {
        showStatus('Please enter a VIN or B/L number', 'error');
        return;
    }
    
    // Preprocessing: uppercase if length >= 10 (VINs), collapse internal spaces
    if (query.length >= 10) {
        query = query.toUpperCase();
    }
    // Collapse internal spaces
    query = query.replace(/\s+/g, ' ').trim();
    
    console.debug('Sent query:', query);
    
    // Validate VIN format if it looks like a VIN (17 characters, alphanumeric)
    if (query.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(query)) {
        // Valid VIN format - proceed with tracking
        console.log('Tracking VIN:', query);
    } else if (query.length > 5) {
        // Assume it's a B/L number or container number
        console.log('Tracking B/L or container number:', query);
    } else {
        showStatus('Please enter a valid VIN (17 characters) or B/L number', 'error');
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
    
    // Call tracking API - always fetch from real website
    
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
            console.debug('Response length:', data.rows ? data.rows.length : 0);
            handleTrackingSuccess(data, submitBtn, originalText);
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

// Handle successful tracking response
function handleTrackingSuccess(data, submitBtn, originalText) {
    hideStatus();
    renderResults(data);
    
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
}

// Make submitTracking available globally for the HTML form
window.submitTracking = submitTracking;

// Auto-focus on the input field when page loads
document.addEventListener('DOMContentLoaded', function() {
    const input = document.querySelector('#trackForm input[name="q"]');
    if (input) {
        input.focus();
    }
});