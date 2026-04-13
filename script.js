// ====================================
// CONFIGURATION
// ====================================

// Set to true to use demo mode with sample data (no Google Sheets needed)
// Set to false when you're ready to connect to Google Sheets
const DEMO_MODE = false;

// You need to set up a Google Apps Script Web App to handle data read/write
// Instructions in README.md
const CONFIG = {
    // Your Google Apps Script Web App URL
    webAppUrl: 'https://script.google.com/macros/s/AKfycbzFpSIo8QQl8Mh0BlMwp0utFHjc5XnBAN5vne5boOq3UqbuKTjIRdLBcnedxJMtpyxvvQ/exec'
};

// Sample data for demo mode
const DEMO_RESTAURANTS = [
    {
        restaurantName: 'Market Restaurant',
        address: 'Rothschild Blvd 12, תל אביב',
        website: 'https://example.com',
        kashrut: 'רבנות תל אביב',
        dateAdded: new Date().toLocaleString('en-US')
    },
    {
        restaurantName: 'Pizza Bella',
        address: 'King George St 45, ירושלים',
        website: 'https://example.com',
        kashrut: 'בד"ץ עדה חרדית',
        dateAdded: new Date().toLocaleString('en-US')
    },
    {
        restaurantName: 'The Kosher Burger',
        address: 'Rabbi Akiva 23, בני ברק',
        website: '',
        kashrut: 'רבנות ירושלים',
        dateAdded: new Date().toLocaleString('en-US')
    },
    {
        restaurantName: 'Tokyo Sushi',
        address: 'HaNevi\'im 78, חיפה',
        website: 'https://example.com',
        kashrut: 'בד"ץ חוג חת"ם סופר בני ברק',
        dateAdded: new Date().toLocaleString('en-US')
    }
];

// Store for demo mode
let demoData = [...DEMO_RESTAURANTS];

// ====================================
// MODAL MANAGEMENT
// ====================================

const modal = document.getElementById('modal');
const addBtn = document.getElementById('add-restaurant-btn');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancel-btn');
const form = document.getElementById('restaurant-form');

// ====================================
// GOOGLE PLACES AUTOCOMPLETE
// ====================================

let autocomplete;
let googleMapsLoaded = false;

// Check if Google Maps is loaded
function checkGoogleMapsLoaded() {
    return typeof google !== 'undefined' && typeof google.maps !== 'undefined' && typeof google.maps.places !== 'undefined';
}

// Wait for Google Maps to load
function waitForGoogleMaps(callback, maxAttempts = 20) {
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        if (checkGoogleMapsLoaded()) {
            clearInterval(interval);
            googleMapsLoaded = true;
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.warn('Google Maps API did not load in time');
        }
    }, 500);
}

function initAutocomplete() {
    const addressInput = document.getElementById('address');
    
    if (!addressInput) {
        return;
    }
    
    // Check if already initialized
    if (autocomplete) {
        return;
    }
    
    // Check if Google Maps API is loaded
    if (!checkGoogleMapsLoaded()) {
        // Wait for it to load
        waitForGoogleMaps(initAutocomplete);
        return;
    }
    
    // Create autocomplete instance restricted to Israel
    autocomplete = new google.maps.places.Autocomplete(addressInput, {
        componentRestrictions: { country: 'il' },
        fields: ['formatted_address', 'address_components', 'name'],
        types: ['address']
    });
    
    // Listen for place selection
    autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
            addressInput.value = place.formatted_address;
        }
    });
}

// ====================================
// CUSTOM SELECT DROPDOWN (REMOVED)
// ====================================

// City dropdown functionality removed - now using single address field with autocomplete

// ====================================
// KASHRUT DROPDOWN
// ====================================

const kashrutInput = document.getElementById('kashrut');
const kashrutSearch = document.getElementById('kashrut-search');
const kashrutDropdown = document.getElementById('kashrut-dropdown');
const kashrutOptions = kashrutDropdown.querySelectorAll('.custom-select-option');

// Open dropdown when clicking on the input
kashrutInput.addEventListener('click', function() {
    kashrutInput.style.display = 'none';
    kashrutSearch.style.display = 'block';
    kashrutDropdown.classList.add('show');
    kashrutSearch.focus();
    kashrutSearch.value = '';
    // Show all options
    kashrutOptions.forEach(opt => opt.classList.remove('hidden'));
});

// Search functionality
kashrutSearch.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    
    kashrutOptions.forEach(option => {
        const text = option.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            option.classList.remove('hidden');
        } else {
            option.classList.add('hidden');
        }
    });
});

// Select option
kashrutOptions.forEach(option => {
    option.addEventListener('click', function() {
        const value = this.getAttribute('data-value');
        kashrutInput.value = value;
        closeKashrutDropdown();
    });
});

// Close dropdown
function closeKashrutDropdown() {
    kashrutDropdown.classList.remove('show');
    kashrutSearch.style.display = 'none';
    kashrutInput.style.display = 'block';
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-select-wrapper')) {
        closeKashrutDropdown();
    }
});

// Open modal
addBtn.onclick = function() {
    modal.classList.add('show');
    form.reset();
    hideFormMessage();
    closeKashrutDropdown();
    // Initialize autocomplete when modal opens
    initAutocomplete();
};

// Close modal
closeBtn.onclick = function() {
    modal.classList.remove('show');
    closeKashrutDropdown();
};

cancelBtn.onclick = function() {
    modal.classList.remove('show');
    closeKashrutDropdown();
};

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === modal) {
        modal.classList.remove('show');
    }
};

// ====================================
// FORM SUBMISSION
// ====================================

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formLoading = document.getElementById('form-loading');
    
    const formData = {
        action: 'addRestaurant',
        restaurantName: document.getElementById('restaurant-name').value,
        address: document.getElementById('address').value,
        website: document.getElementById('website').value,
        kashrut: document.getElementById('kashrut').value
    };
    
    // DEMO MODE - Add to local array
    if (DEMO_MODE) {
        formLoading.classList.add('show');
        
        setTimeout(() => {
            demoData.push({
                restaurantName: formData.restaurantName,
                address: formData.address,
                website: formData.website,
                kashrut: formData.kashrut,
                dateAdded: new Date().toLocaleString('en-US')
            });
            
            formLoading.classList.remove('show');
            form.reset();
            modal.classList.remove('show');
            loadRestaurants();
        }, 1000);
        
        return;
    }
    
    // REAL MODE - Save to Google Sheets
    try {
        formLoading.classList.add('show');
        hideFormMessage();
        
        const response = await fetch(CONFIG.webAppUrl, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        formLoading.classList.remove('show');
        
        if (result.success) {
            form.reset();
            modal.classList.remove('show');
            hideFormMessage();
        } else {
            showFormMessage('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        formLoading.classList.remove('show');
        showFormMessage('Error saving data. Please try again.', 'error');
    }
});

function showFormMessage(message, type) {
    const messageEl = document.getElementById('form-message');
    messageEl.textContent = message;
    messageEl.className = 'form-message ' + type;
}

function hideFormMessage() {
    const messageEl = document.getElementById('form-message');
    messageEl.className = 'form-message';
}

// ====================================
// LOAD AND DISPLAY RESTAURANTS
// ====================================

async function loadRestaurants() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const container = document.getElementById('restaurants-container');
    
    // DEMO MODE - Use sample data
    if (DEMO_MODE) {
        loading.style.display = 'block';
        error.style.display = 'none';
        container.innerHTML = '';
        
        // Simulate loading delay
        setTimeout(() => {
            loading.style.display = 'none';
            allRestaurants = [...demoData];
            populateFilterDropdowns();
            displayRestaurants(allRestaurants);
            document.getElementById('results-counter').textContent = `Showing ${allRestaurants.length} restaurants`;
        }, 500);
        
        return;
    }
    
    // REAL MODE - Load from Google Sheets
    try {
        loading.style.display = 'block';
        error.style.display = 'none';
        container.innerHTML = '';
        
        const response = await fetch(CONFIG.webAppUrl + '?action=getRestaurants');
        const result = await response.json();
        
        if (result.success && result.data) {
            loading.style.display = 'none';
            allRestaurants = result.data;
            populateFilterDropdowns();
            displayRestaurants(allRestaurants);
            document.getElementById('results-counter').textContent = `Showing ${allRestaurants.length} restaurants`;
        } else {
            throw new Error(result.message || 'Failed to load restaurants');
        }
    } catch (err) {
        console.error('Error loading restaurants:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
    }
}

function displayRestaurants(restaurants) {
    const container = document.getElementById('restaurants-container');
    
    if (restaurants.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1;">No restaurants to display. Add the first one!</p>';
        return;
    }
    
    restaurants.forEach(restaurant => {
        const card = createRestaurantCard(restaurant);
        container.appendChild(card);
    });
}

function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    
    let html = `
        <h2>${escapeHtml(restaurant.restaurantName)}</h2>
        <div class="restaurant-info">
    `;
    
    // Support both old format (street + city) and new format (address)
    const hasAddress = restaurant.address || restaurant.street || restaurant.city;
    
    if (hasAddress) {
        if (restaurant.address) {
            html += `
                <p>
                    <strong>Address:</strong>
                    ${escapeHtml(restaurant.address)}
                </p>
            `;
        } else if (restaurant.street || restaurant.city) {
            // Fallback for old data format
            const addressParts = [];
            if (restaurant.street) addressParts.push(restaurant.street);
            if (restaurant.city) addressParts.push(restaurant.city);
            html += `
                <p>
                    <strong>Address:</strong>
                    ${escapeHtml(addressParts.join(', '))}
                </p>
            `;
        }
    } else {
        // Show placeholder when no address is available
        html += `
            <p>
                <strong>Address:</strong>
                <span style="color: #999;">Not provided</span>
            </p>
        `;
    }
    
    if (restaurant.kashrut) {
        html += `
            <p>
                <strong>Kashrut:</strong>
                <span class="kashrut-badge">${escapeHtml(restaurant.kashrut)}</span>
            </p>
        `;
    }
    
    if (restaurant.website) {
        html += `
            <a href="${escapeHtml(restaurant.website)}" 
               class="restaurant-link" 
               target="_blank" 
               rel="noopener">
               🌐 Visit Website
            </a>
        `;
    }
    
    html += '</div>';
    
    card.innerHTML = html;
    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====================================
// INITIALIZE
// ====================================

// Store all restaurants for filtering
let allRestaurants = [];
let uniqueKashrut = new Set();
let uniqueCities = new Set();

// Active filter state
let activeFilters = { kashrut: '', city: '' };

// Setup search functionality
document.getElementById('search-input').addEventListener('input', applyFilters);

// Clear filters button
document.getElementById('clear-filters-btn').addEventListener('click', clearAllFilters);

// Close panels when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.filter-pill-wrapper')) {
        closeAllFilterPanels();
    }
});

function toggleFilterPanel(type) {
    const panel = document.getElementById(type + '-panel');
    const arrow = document.getElementById(type + '-arrow');
    const isOpen = panel.classList.contains('open');

    // Close all first
    closeAllFilterPanels();

    if (!isOpen) {
        panel.classList.add('open');
        arrow.classList.add('open');
        document.getElementById(type + '-btn').classList.add('active');
    }
}

function closeAllFilterPanels() {
    ['kashrut', 'city'].forEach(type => {
        document.getElementById(type + '-panel').classList.remove('open');
        document.getElementById(type + '-arrow').classList.remove('open');
        document.getElementById(type + '-btn').classList.remove('active');
    });
}

function selectFilter(type, value, label, el) {
    activeFilters[type] = value;

    // Update button label
    document.getElementById(type + '-label').textContent = label;

    // Style: highlight pill if a real filter is selected
    const btn = document.getElementById(type + '-btn');
    if (value) {
        btn.classList.add('has-selection');
    } else {
        btn.classList.remove('has-selection');
    }

    // Update selected state in the list
    el.closest('.filter-panel').querySelectorAll('.filter-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    el.classList.add('selected');

    // Show/hide clear button
    const hasAnyFilter = activeFilters.kashrut || activeFilters.city || document.getElementById('search-input').value;
    document.getElementById('clear-filters-btn').style.display = hasAnyFilter ? 'block' : 'none';

    closeAllFilterPanels();
    applyFilters();
}

function clearAllFilters() {
    document.getElementById('search-input').value = '';
    activeFilters = { kashrut: '', city: '' };

    // Reset labels
    document.getElementById('kashrut-label').textContent = 'All Kashrut';
    document.getElementById('city-label').textContent = 'All Cities';

    // Reset pill styles
    document.getElementById('kashrut-btn').classList.remove('has-selection');
    document.getElementById('city-btn').classList.remove('has-selection');

    // Reset selected options
    document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelectorAll('.filter-option[data-value=""]').forEach(opt => opt.classList.add('selected'));

    document.getElementById('clear-filters-btn').style.display = 'none';
    applyFilters();
}

// Make functions available globally (called from onclick in HTML)
window.toggleFilterPanel = toggleFilterPanel;
window.selectFilter = selectFilter;

function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const kashrutFilter = activeFilters.kashrut;
    const cityFilter = activeFilters.city;

    // Show/hide clear button
    const hasAnyFilter = kashrutFilter || cityFilter || searchTerm;
    document.getElementById('clear-filters-btn').style.display = hasAnyFilter ? 'block' : 'none';
    
    let filtered = allRestaurants;
    
    // Apply text search across name, address, city and kashrut
    if (searchTerm) {
        filtered = filtered.filter(restaurant => {
            const name = (restaurant.restaurantName || '').toLowerCase();
            const address = (restaurant.address || '').toLowerCase();
            const street = (restaurant.street || '').toLowerCase();
            const city = (restaurant.city || '').toLowerCase();
            const kashrut = (restaurant.kashrut || '').toLowerCase();
            
            return name.includes(searchTerm) || 
                   address.includes(searchTerm) ||
                   street.includes(searchTerm) ||
                   city.includes(searchTerm) ||
                   kashrut.includes(searchTerm);
        });
    }
    
    // Apply kashrut filter
    if (kashrutFilter) {
        filtered = filtered.filter(restaurant => 
            (restaurant.kashrut || '') === kashrutFilter
        );
    }
    
    // Apply city filter
    if (cityFilter) {
        filtered = filtered.filter(restaurant => {
            const restaurantCity = extractCity(restaurant);
            return restaurantCity === cityFilter;
        });
    }
    
    displayFilteredRestaurants(filtered);
}

function extractCity(restaurant) {
    // Use city field directly if available
    if (restaurant.city) {
        return restaurant.city;
    }
    if (restaurant.address) {
        // Google Places format: "Street, City, PostalCode, ישראל"
        // We need to skip: country names, postal codes (pure numbers)
        const parts = restaurant.address.split(',').map(p => p.trim()).filter(p => p);
        
        const ignoredParts = ['ישראל', 'israel', 'ישראל'];
        
        const meaningfulParts = parts.filter(p => {
            const lower = p.toLowerCase();
            // Skip country names
            if (ignoredParts.includes(lower)) return false;
            // Skip postal codes (purely numeric)
            if (/^\d+$/.test(p)) return false;
            return true;
        });
        
        // City is the last meaningful part (after the street)
        if (meaningfulParts.length > 1) {
            return meaningfulParts[meaningfulParts.length - 1];
        }
    }
    return '';
}

function displayFilteredRestaurants(restaurants) {
    const container = document.getElementById('restaurants-container');
    const counter = document.getElementById('results-counter');
    
    container.innerHTML = '';
    
    if (restaurants.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1; font-size: 1.2rem;">No restaurants found. Try different filters.</p>';
        counter.textContent = 'No results found';
    } else {
        restaurants.forEach(restaurant => {
            const card = createRestaurantCard(restaurant);
            container.appendChild(card);
        });
        counter.textContent = `Showing ${restaurants.length} of ${allRestaurants.length} restaurants`;
    }
}

function populateFilterDropdowns() {
    uniqueKashrut.clear();
    uniqueCities.clear();

    allRestaurants.forEach(restaurant => {
        if (restaurant.kashrut) uniqueKashrut.add(restaurant.kashrut);
        const city = extractCity(restaurant);
        if (city) uniqueCities.add(city);
    });

    // Populate kashrut panel
    const kashrutPanel = document.getElementById('kashrut-panel');
    kashrutPanel.innerHTML = `<div class="filter-option selected" data-filter="kashrut" data-value="" onclick="selectFilter('kashrut', '', 'All Kashrut', this)">All Kashrut</div>`;
    Array.from(uniqueKashrut).sort().forEach(kashrut => {
        const div = document.createElement('div');
        div.className = 'filter-option';
        div.setAttribute('data-filter', 'kashrut');
        div.setAttribute('data-value', kashrut);
        div.setAttribute('onclick', `selectFilter('kashrut', '${kashrut.replace(/'/g, "\\'")}', '${kashrut.replace(/'/g, "\\'")}', this)`);
        div.textContent = kashrut;
        kashrutPanel.appendChild(div);
    });

    // Populate city panel
    const cityPanel = document.getElementById('city-panel');
    cityPanel.innerHTML = `<div class="filter-option selected" data-filter="city" data-value="" onclick="selectFilter('city', '', 'All Cities', this)">All Cities</div>`;
    Array.from(uniqueCities).sort().forEach(city => {
        const div = document.createElement('div');
        div.className = 'filter-option';
        div.setAttribute('data-filter', 'city');
        div.setAttribute('data-value', city);
        div.setAttribute('onclick', `selectFilter('city', '${city.replace(/'/g, "\\'")}', '${city.replace(/'/g, "\\'")}', this)`);
        div.textContent = city;
        cityPanel.appendChild(div);
    });
}

function filterRestaurants(searchTerm) {
    // This function is kept for backward compatibility but now uses applyFilters
    applyFilters();
}

document.addEventListener('DOMContentLoaded', function() {
    // Google Places Autocomplete will be initialized by the callback function
    // when the API is loaded (initGoogleMaps)
    
    // Show demo mode indicator
    if (DEMO_MODE) {
        const header = document.querySelector('header');
        const demoBanner = document.createElement('div');
        demoBanner.style.cssText = 'background: #ffc107; color: #000; padding: 10px; border-radius: 8px; margin-top: 10px; font-weight: bold;';
        demoBanner.textContent = '🎯 Demo Mode - Changes are not saved';
        header.appendChild(demoBanner);
    }
    
    // Check if Web App URL is configured (only in real mode)
    if (!DEMO_MODE && CONFIG.webAppUrl === 'YOUR_WEB_APP_URL_HERE') {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').innerHTML = '<p>Please configure the Web App URL in script.js<br>See README.md for instructions</p>';
        document.getElementById('error').style.display = 'block';
        return;
    }
    
    loadRestaurants();
});
