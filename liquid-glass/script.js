// Device detection and dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    
    // Sample car data
    const carsData = [
        { brand: 'audi', model: 'A4 Quattro', price: '$45,000' },
        { brand: 'audi', model: 'Q7 Premium', price: '$68,000' },
        { brand: 'bmw', model: 'M3 Competition', price: '$75,000' },
        { brand: 'bmw', model: 'X5 xDrive', price: '$62,000' },
        { brand: 'mercedes-benz', model: 'E-Class AMG', price: '$71,000' },
        { brand: 'mercedes-benz', model: 'GLE Coupe', price: '$78,000' },
        { brand: 'volkswagen', model: 'Golf GTI', price: '$32,000' },
        { brand: 'volkswagen', model: 'Atlas Cross', price: '$38,000' },
        { brand: 'porsche', model: '911 Carrera', price: '$115,000' },
        { brand: 'porsche', model: 'Cayenne Turbo', price: '$95,000' },
        { brand: 'land-rover', model: 'Range Rover Sport', price: '$85,000' },
        { brand: 'land-rover', model: 'Defender 110', price: '$72,000' },
        { brand: 'volvo', model: 'XC90 T8', price: '$58,000' },
        { brand: 'volvo', model: 'S60 Polestar', price: '$52,000' },
        { brand: 'aston-martin', model: 'DB11 V8', price: '$215,000' },
        { brand: 'aston-martin', model: 'Vantage F1', price: '$185,000' },
        { brand: 'bentley', model: 'Continental GT', price: '$245,000' },
        { brand: 'bentley', model: 'Bentayga Speed', price: '$285,000' }
    ];
    
    let filteredCars = [...carsData];
    let currentFilter = 'all';
    
    // Device detection
    function detectDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        
        const body = document.body;
        body.classList.remove('device-unknown');
        
        if (isIOS) {
            body.classList.add('ios-device');
            body.classList.remove('non-ios-device');
            setupNativeDropdown();
        } else {
            body.classList.add('non-ios-device');
            body.classList.remove('ios-device');
            setupCustomDropdown();
        }
    }
    
    // Setup native dropdown for iOS
    function setupNativeDropdown() {
        const nativeSelect = document.getElementById('native-select');
        nativeSelect.addEventListener('change', function(e) {
            currentFilter = e.target.value;
            filterCars(currentFilter);
        });
    }
    
    // Setup custom dropdown for other devices
    function setupCustomDropdown() {
        const customDropdown = document.getElementById('custom-dropdown');
        const dropdownSelected = document.getElementById('dropdown-selected');
        const dropdownOptions = document.getElementById('dropdown-options');
        const options = dropdownOptions.querySelectorAll('.dropdown-option');
        
        // Toggle dropdown
        dropdownSelected.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDropdown();
        });
        
        // Handle option selection
        options.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                const value = this.getAttribute('data-value');
                const text = this.textContent;
                
                selectOption(value, text);
                closeDropdown();
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            closeDropdown();
        });
        
        // Handle keyboard navigation
        customDropdown.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (dropdownOptions.classList.contains('show')) {
                    closeDropdown();
                } else {
                    openDropdown();
                }
            } else if (e.key === 'Escape') {
                closeDropdown();
            }
        });
        
        customDropdown.setAttribute('tabindex', '0');
    }
    
    function toggleDropdown() {
        const dropdownOptions = document.getElementById('dropdown-options');
        const dropdownSelected = document.getElementById('dropdown-selected');
        
        if (dropdownOptions.classList.contains('show')) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }
    
    function openDropdown() {
        const dropdownOptions = document.getElementById('dropdown-options');
        const dropdownSelected = document.getElementById('dropdown-selected');
        
        dropdownOptions.classList.add('show');
        dropdownSelected.classList.add('active');
    }
    
    function closeDropdown() {
        const dropdownOptions = document.getElementById('dropdown-options');
        const dropdownSelected = document.getElementById('dropdown-selected');
        
        dropdownOptions.classList.remove('show');
        dropdownSelected.classList.remove('active');
    }
    
    function selectOption(value, text) {
        const dropdownSelectedSpan = document.querySelector('#dropdown-selected span');
        dropdownSelectedSpan.textContent = text;
        currentFilter = value;
        filterCars(currentFilter);
    }
    
    // Filter cars based on selected brand
    function filterCars(brand) {
        if (brand === 'all') {
            filteredCars = [...carsData];
        } else {
            filteredCars = carsData.filter(car => car.brand === brand);
        }
        renderCars();
    }
    
    // Render cars in the grid
    function renderCars() {
        const carsGrid = document.getElementById('cars-grid');
        
        if (filteredCars.length === 0) {
            carsGrid.innerHTML = `
                <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <h3 style="color: var(--text-secondary); margin-bottom: 10px;">No cars found</h3>
                    <p style="color: var(--text-secondary);">Try selecting a different brand filter.</p>
                </div>
            `;
            return;
        }
        
        carsGrid.innerHTML = filteredCars.map(car => `
            <div class="car-card glass-card" data-brand="${car.brand}">
                <div class="car-brand">${formatBrandName(car.brand)}</div>
                <div class="car-model">${car.model}</div>
                <div class="car-price">${car.price}</div>
            </div>
        `).join('');
        
        // Add staggered animation to cards
        const cards = carsGrid.querySelectorAll('.car-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.style.animation = 'fadeInUp 0.6s ease-out forwards';
        });
    }
    
    // Format brand names for display
    function formatBrandName(brand) {
        const brandNames = {
            'audi': 'Audi',
            'bmw': 'BMW',
            'mercedes-benz': 'Mercedes-Benz',
            'volkswagen': 'Volkswagen',
            'porsche': 'Porsche',
            'land-rover': 'Land Rover',
            'volvo': 'Volvo',
            'aston-martin': 'Aston Martin',
            'bentley': 'Bentley'
        };
        return brandNames[brand] || brand;
    }
    
    // Add fade-in animation keyframes if not already defined
    if (!document.querySelector('style[data-animations]')) {
        const style = document.createElement('style');
        style.setAttribute('data-animations', 'true');
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize
    detectDevice();
    renderCars();
    
    // Add subtle parallax effect to background
    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        document.body.style.backgroundPosition = `center ${rate}px`;
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
    
    // Add touch feedback for mobile devices
    if ('ontouchstart' in window) {
        const cards = document.querySelectorAll('.car-card');
        cards.forEach(card => {
            card.addEventListener('touchstart', function() {
                this.style.transform = 'translateY(-2px) scale(0.98)';
            });
            
            card.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });
    }
    
    // Performance optimization: debounce scroll events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Optimize scroll performance
    const debouncedParallax = debounce(updateParallax, 10);
    window.removeEventListener('scroll', requestTick);
    window.addEventListener('scroll', debouncedParallax);
});