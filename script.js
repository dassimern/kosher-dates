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

// Callback function for Google Maps API
function initGoogleMaps() {
    // Initialize autocomplete when Google Maps API is ready
    initAutocomplete();
}

function initAutocomplete() {
    const addressInput = document.getElementById('address');
    
    if (!addressInput) {
        return;
    }
    
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.warn('Google Maps API not loaded yet');
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

// Make initGoogleMaps available globally for the callback
window.initGoogleMaps = initGoogleMaps;

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
    // Re-initialize autocomplete when modal opens to ensure it works
    setTimeout(initAutocomplete, 100);
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
            displayRestaurants(allRestaurants);
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
            displayRestaurants(allRestaurants);
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
    
    if (restaurant.address) {
        html += `
            <p>
                <strong>Address:</strong>
                ${escapeHtml(restaurant.address)}
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
        // Extract domain from URL for cleaner display
        let displayUrl = restaurant.website;
        try {
            const url = new URL(restaurant.website);
            displayUrl = url.hostname.replace('www.', '');
        } catch (e) {
            // If URL parsing fails, just use the original
            displayUrl = restaurant.website.replace('https://', '').replace('http://', '').split('/')[0];
        }
        
        html += `
            <p><strong>Website:</strong> <a href="${escapeHtml(restaurant.website)}" 
               class="website-link" 
               target="_blank" 
               rel="noopener"
               title="${escapeHtml(restaurant.website)}">${escapeHtml(displayUrl)}</a></p>
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

// Setup search functionality
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    filterRestaurants(searchTerm);
});

function filterRestaurants(searchTerm) {
    const container = document.getElementById('restaurants-container');
    
    if (!searchTerm) {
        // Show all restaurants if search is empty
        displayRestaurants(allRestaurants);
        return;
    }
    
    // Filter restaurants by name, address, or kashrut
    const filtered = allRestaurants.filter(restaurant => {
        const name = (restaurant.restaurantName || '').toLowerCase();
        const address = (restaurant.address || '').toLowerCase();
        const kashrut = (restaurant.kashrut || '').toLowerCase();
        
        return name.includes(searchTerm) || 
               address.includes(searchTerm) ||
               kashrut.includes(searchTerm);
    });
    
    displayRestaurants(filtered);
    
    // Show message if no results
    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1; font-size: 1.2rem;">No results found.</p>';
    }
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
