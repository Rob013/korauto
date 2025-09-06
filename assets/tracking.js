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
    
    // Render shipping status widget if available
    if (data.shipping_status) {
        cardsHtml += renderShippingStatusCard(data);
    }
    
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
            <h3>Tracking Results for: ${escapeHtml(data.query || (data.result && data.result.chassis) || 'Unknown')}</h3>
        </div>
        ${cardsHtml}
        ${eventCards}
    `;
    resultsEl.style.display = 'block';
}

// Render shipping status card with progress steps
function renderShippingStatusCard(data) {
    if (!data.shipping_status) return '';
    
    const status = data.shipping_status;
    const result = data.result || {};
    
    // Render progress steps
    const stepsHtml = status.steps.map(step => {
        const activeClass = step.active ? 'active' : 'inactive';
        const checkmark = step.active ? ' ✓' : '';
        return `
            <div class="status-step ${activeClass}">
                <div class="step-indicator ${activeClass}"></div>
                <span class="step-name">${escapeHtml(step.name)}${checkmark}</span>
            </div>
        `;
    }).join('');
    
    // Render result details
    const resultFields = [];
    if (result.pol) {
        resultFields.push(`<div class="result-field"><strong>Port of Loading:</strong> ${escapeHtml(result.pol)}</div>`);
    }
    if (result.port) {
        resultFields.push(`<div class="result-field"><strong>Destination Port:</strong> ${escapeHtml(result.port)}</div>`);
    }
    if (result.vessel) {
        resultFields.push(`<div class="result-field"><strong>Vessel:</strong> ${escapeHtml(result.vessel)}</div>`);
    }
    if (result.eta) {
        resultFields.push(`<div class="result-field"><strong>ETA:</strong> ${escapeHtml(result.eta)}</div>`);
    }
    
    return `
        <div class="result-card shipping-status-card">
            <div class="card-header">
                <div class="event-status">🚢 Shipping Status</div>
            </div>
            <div class="card-body">
                <div class="current-status">
                    <strong>Current Status:</strong> <span class="status-badge">${escapeHtml(status.overall)}</span>
                </div>
                
                <div class="progress-section">
                    <strong>Shipping Progress:</strong>
                    <div class="status-steps">
                        ${stepsHtml}
                    </div>
                </div>
                
                ${resultFields.length > 0 ? `
                    <div class="result-details">
                        <strong>Shipment Details:</strong>
                        <div class="result-grid">
                            ${resultFields.join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="source-info">
                    <small>Source: ${escapeHtml(data.source || 'cigshipping.com')} | Last Updated: ${new Date(data.last_updated || Date.now()).toLocaleString()}</small>
                </div>
            </div>
        </div>
        
        <style>
        .shipping-status-card {
            border-left: 4px solid #7c3aed;
        }
        
        .current-status {
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: #f3f4f6;
            border-radius: 6px;
            border-left: 3px solid #7c3aed;
        }
        
        .status-badge {
            font-weight: 600;
            color: #7c3aed;
        }
        
        .progress-section {
            margin: 1.5rem 0;
        }
        
        .status-steps {
            margin-top: 0.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .status-step {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem;
            border-radius: 6px;
            transition: background-color 0.3s;
        }
        
        .status-step.active {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-step.inactive {
            background: #f3f4f6;
            color: #6b7280;
        }
        
        .step-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .step-indicator.active {
            background: #16a34a;
        }
        
        .step-indicator.inactive {
            background: #d1d5db;
        }
        
        .step-name {
            font-weight: 500;
        }
        
        .result-details {
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
        }
        
        .result-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.75rem;
            margin-top: 0.5rem;
        }
        
        .result-field {
            padding: 0.5rem;
            background: #eff6ff;
            border-radius: 4px;
            font-size: 0.9rem;
        }
        
        .source-info {
            margin-top: 1rem;
            padding-top: 0.75rem;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.8rem;
        }
        </style>
    `;
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
                    throw new Error(`Tracking service error (${response.status}). Please try again later.`);
                }
            }
            return response.json().catch(parseError => {
                console.error('Failed to parse JSON response:', parseError);
                throw new Error('Invalid response format from tracking service.');
            });
        })
        .then(data => {
            if (data) {
                console.debug('Response length:', data.rows ? data.rows.length : 0);
                handleTrackingSuccess(data, submitBtn, originalText);
            }
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

// Create mock widget data for development demo
function createMockWidgetData(query) {
    const chassis = query.substring(0, 17);
    const year = query.includes('2024') ? '2024' : '2021';
    
    return {
        query: {
            chassis: chassis,
            year: year
        },
        result: {
            shipper: "주식회사 싼카",
            model_year: "C200",
            chassis: chassis,
            vessel: "MV SANG SHIN V.2508",
            pol: "INCHEON, KOREA",
            on_board: "2025-08-06",
            port: "Durres Port, Albania", 
            eta: "2025-09-11"
        },
        shipping_status: {
            overall: "Loaded",
            steps: [
                { name: "In Port", active: true },
                { name: "Vessel Fixed", active: true },
                { name: "Shipment Ready", active: true },
                { name: "Loaded", active: true },
                { name: "Arrival", active: false }
            ]
        },
        source: "cigshipping.com",
        last_updated: new Date().toISOString(),
        rows: [
            {
                type: "metadata",
                shipper: "주식회사 싼카",
                model: "C200",
                chassis: chassis,
                vesselName: "MV SANG SHIN V.2508",
                portOfLoading: "INCHEON, KOREA",
                portOfDischarge: "Durres Port, Albania",
                onBoard: "2025-08-06",
                estimatedArrival: "2025-09-11",
                shippingLine: "CIG Shipping Line",
                billOfLading: "CIG" + chassis.substring(9, 17),
                containerNumber: "CGMU" + Math.random().toString().substring(2, 9)
            },
            {
                type: "event",
                date: "2025-08-06",
                event: "Container loaded on vessel",
                location: "INCHEON, KOREA",
                vessel: "MV SANG SHIN V.2508",
                status: "Loaded"
            },
            {
                type: "event", 
                date: "2025-08-07",
                event: "Vessel departure",
                location: "INCHEON, KOREA",
                vessel: "MV SANG SHIN V.2508",
                status: "Departed"
            },
            {
                type: "event",
                date: "2025-09-11",
                event: "Expected arrival",
                location: "Durres Port, Albania",
                vessel: "MV SANG SHIN V.2508", 
                status: "In Transit"
            }
        ]
    };
}