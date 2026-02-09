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
        restaurantName: 'מסעדת השוק',
        city: 'תל אביב',
        website: 'https://example.com',
        kashrut: 'רבנות תל אביב',
        dateAdded: new Date().toLocaleString('he-IL')
    },
    {
        restaurantName: 'פיצה בלה',
        city: 'ירושלים',
        website: 'https://example.com',
        kashrut: 'בד"ץ עדה חרדית',
        dateAdded: new Date().toLocaleString('he-IL')
    },
    {
        restaurantName: 'הבורגר הכשר',
        city: 'בני ברק',
        website: '',
        kashrut: 'רבנות ירושלים',
        dateAdded: new Date().toLocaleString('he-IL')
    },
    {
        restaurantName: 'סושי טוקיו',
        city: 'חיפה',
        website: 'https://example.com',
        kashrut: 'בד"ץ חוג חת"ם סופר',
        dateAdded: new Date().toLocaleString('he-IL')
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

// Custom Select Dropdown for City
const cityInput = document.getElementById('city');
const citySearch = document.getElementById('city-search');
const cityDropdown = document.getElementById('city-dropdown');
const cityOptions = cityDropdown.querySelectorAll('.custom-select-option');

// Open dropdown when clicking on the input
cityInput.addEventListener('click', function() {
    cityInput.style.display = 'none';
    citySearch.style.display = 'block';
    cityDropdown.classList.add('show');
    citySearch.focus();
    citySearch.value = '';
    // Show all options
    cityOptions.forEach(opt => opt.classList.remove('hidden'));
});

// Search functionality
citySearch.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    
    cityOptions.forEach(option => {
        const text = option.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            option.classList.remove('hidden');
        } else {
            option.classList.add('hidden');
        }
    });
});

// Select option
cityOptions.forEach(option => {
    option.addEventListener('click', function() {
        const value = this.getAttribute('data-value');
        cityInput.value = value;
        closeDropdown();
    });
});

// Close dropdown
function closeDropdown() {
    cityDropdown.classList.remove('show');
    citySearch.style.display = 'none';
    cityInput.style.display = 'block';
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-select-wrapper')) {
        closeDropdown();
    }
});

// Open modal
addBtn.onclick = function() {
    modal.classList.add('show');
    form.reset();
    hideFormMessage();
    closeDropdown();
};

// Close modal
closeBtn.onclick = function() {
    modal.classList.remove('show');
    closeDropdown();
};

cancelBtn.onclick = function() {
    modal.classList.remove('show');
    closeDropdown();
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
        city: document.getElementById('city').value,
        website: document.getElementById('website').value,
        kashrut: document.getElementById('kashrut').value
    };
    
    // DEMO MODE - Add to local array
    if (DEMO_MODE) {
        formLoading.classList.add('show');
        
        setTimeout(() => {
            demoData.push({
                restaurantName: formData.restaurantName,
                city: formData.city,
                website: formData.website,
                kashrut: formData.kashrut,
                dateAdded: new Date().toLocaleString('he-IL')
            });
            
            formLoading.classList.remove('show');
            showFormMessage('המסעדה נוספה בהצלחה! ✓ (מצב הדגמה)', 'success');
            form.reset();
            
            setTimeout(() => {
                modal.classList.remove('show');
                loadRestaurants();
            }, 1500);
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
            showFormMessage('✓ המסעדה נשלחה לאישור המנהל!', 'success');
            form.reset();
            
            // Close modal after a short delay
            setTimeout(() => {
                modal.classList.remove('show');
                hideFormMessage();
            }, 2500);
        } else {
            showFormMessage('שגיאה: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        formLoading.classList.remove('show');
        showFormMessage('שגיאה בשמירת הנתונים. אנא נסה שוב.', 'error');
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
        container.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1;">אין מסעדות להצגה. הוסף מסעדה ראשונה!</p>';
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
    
    if (restaurant.city) {
        html += `
            <p>
                <strong>עיר:</strong>
                ${escapeHtml(restaurant.city)}
            </p>
        `;
    }
    
    if (restaurant.kashrut) {
        html += `
            <p>
                <strong>כשרות:</strong>
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
               🌐 לאתר המסעדה
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
    
    // Filter restaurants by name, city, or kashrut
    const filtered = allRestaurants.filter(restaurant => {
        const name = (restaurant.restaurantName || '').toLowerCase();
        const city = (restaurant.city || '').toLowerCase();
        const kashrut = (restaurant.kashrut || '').toLowerCase();
        
        return name.includes(searchTerm) || 
               city.includes(searchTerm) || 
               kashrut.includes(searchTerm);
    });
    
    displayRestaurants(filtered);
    
    // Show message if no results
    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1; font-size: 1.2rem;">לא נמצאו תוצאות לחיפוש.</p>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Show demo mode indicator
    if (DEMO_MODE) {
        const header = document.querySelector('header');
        const demoBanner = document.createElement('div');
        demoBanner.style.cssText = 'background: #ffc107; color: #000; padding: 10px; border-radius: 8px; margin-top: 10px; font-weight: bold;';
        demoBanner.textContent = '🎯 מצב הדגמה - השינויים לא נשמרים';
        header.appendChild(demoBanner);
    }
    
    // Check if Web App URL is configured (only in real mode)
    if (!DEMO_MODE && CONFIG.webAppUrl === 'YOUR_WEB_APP_URL_HERE') {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').innerHTML = '<p>אנא הגדר את ה-Web App URL בקובץ script.js<br>עיין ב-README.md להוראות</p>';
        document.getElementById('error').style.display = 'block';
        return;
    }
    
    loadRestaurants();
});
