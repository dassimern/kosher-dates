// ====================================
// MANAGER PANEL
// ====================================

const CONFIG = {
    webAppUrl: 'https://script.google.com/macros/s/AKfycbzFpSIo8QQl8Mh0BlMwp0utFHjc5XnBAN5vne5boOq3UqbuKTjIRdLBcnedxJMtpyxvvQ/exec'
};

let managerPassword = '';

// ====================================
// LOGIN
// ====================================

document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const passwordInput = document.getElementById('password');
    const submitBtn = this.querySelector('button[type="submit"]');
    
    managerPassword = password;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'בודק...';
    hideLoginError();
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 10000); // 10 second timeout
    });
    
    // Try to load data with password
    try {
        const fetchPromise = fetch(CONFIG.webAppUrl + '?action=getAll&password=' + encodeURIComponent(password))
            .then(response => response.json());
        
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (result.success) {
            // Login successful
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('manager-panel').style.display = 'block';
            loadRestaurants();
        } else {
            // Wrong password or error
            submitBtn.disabled = false;
            submitBtn.textContent = 'כניסה';
            passwordInput.value = '';
            passwordInput.focus();
            showLoginError('❌ סיסמה שגויה. נסה שוב.');
            // Add shake animation
            passwordInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                passwordInput.style.animation = '';
            }, 500);
        }
    } catch (error) {
        console.error('Error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'כניסה';
        
        if (error.message === 'Timeout') {
            showLoginError('⏱️ הבקשה לוקחת יותר מדי זמן. נסה שוב.');
        } else {
            showLoginError('שגיאה בהתחברות. בדוק את החיבור לאינטרנט.');
        }
    }
});

function showLoginError(message) {
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = message;
    errorEl.className = 'form-message error';
    errorEl.style.display = 'block';
    errorEl.style.animation = 'slideDown 0.3s ease';
}

function hideLoginError() {
    const errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';
}

document.getElementById('logout-btn').addEventListener('click', function() {
    managerPassword = '';
    // Redirect to main page
    window.location.href = 'index.html';
});

// ====================================
// LOAD RESTAURANTS
// ====================================

async function loadRestaurants() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const container = document.getElementById('restaurants-container');
    
    try {
        loading.style.display = 'block';
        error.style.display = 'none';
        container.innerHTML = '';
        
        const url = CONFIG.webAppUrl + '?action=getAll&password=' + encodeURIComponent(managerPassword);
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.data) {
            loading.style.display = 'none';
            
            if (result.data.length === 0) {
                container.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1; font-size: 1.2rem;">אין מסעדות להצגה.</p>';
            } else {
                displayRestaurants(result.data);
            }
        } else {
            throw new Error(result.message || 'Failed to load restaurants');
        }
    } catch (err) {
        console.error('Error loading restaurants:', err);
        loading.style.display = 'none';
        error.innerHTML = '<p>שגיאה בטעינת המסעדות</p>';
        error.style.display = 'block';
    }
}

function displayRestaurants(restaurants) {
    const container = document.getElementById('restaurants-container');
    
    if (restaurants.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1;">אין מסעדות להצגה.</p>';
        return;
    }
    
    // Sort by status: pending first, then approved, then rejected
    restaurants.sort((a, b) => {
        const order = { pending: 0, approved: 1, rejected: 2 };
        return order[a.status] - order[b.status];
    });
    
    restaurants.forEach(restaurant => {
        const card = createRestaurantCard(restaurant);
        container.appendChild(card);
    });
}

function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    
    const statusClass = 'status-' + restaurant.status;
    const statusText = {
        pending: 'ממתין לאישור',
        approved: 'מאושר',
        rejected: 'נדחה'
    };
    
    let html = `
        <h2>${escapeHtml(restaurant.restaurantName)}</h2>
        <div class="restaurant-info">
            <p>
                <strong>סטטוס:</strong>
                <span class="${statusClass}">${statusText[restaurant.status] || restaurant.status}</span>
            </p>
    `;
    
    if (restaurant.city) {
        html += `<p><strong>עיר:</strong> ${escapeHtml(restaurant.city)}</p>`;
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
        html += `<p><strong>אתר:</strong> ${escapeHtml(restaurant.website)}</p>`;
    }
    
    if (restaurant.dateAdded) {
        html += `<p><strong>תאריך:</strong> ${escapeHtml(restaurant.dateAdded)}</p>`;
    }
    
    // Show action buttons only for pending items
    if (restaurant.status === 'pending') {
        html += `
            <div class="action-buttons">
                <button class="approve-btn" onclick="updateStatus(${restaurant.id}, 'approved')">
                    ✓ אשר
                </button>
                <button class="reject-btn" onclick="updateStatus(${restaurant.id}, 'rejected')">
                    ✗ דחה
                </button>
            </div>
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
// UPDATE STATUS
// ====================================

async function updateStatus(id, status) {
    const actionText = status === 'approved' ? 'מאשר' : 'דוחה';
    const successText = status === 'approved' ? '✓ המסעדה אושרה!' : '✗ המסעדה נדחתה';
    
    try {
        // Show loading overlay
        showActionLoader(actionText + '...');
        
        const response = await fetch(CONFIG.webAppUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'updateStatus',
                id: id,
                status: status,
                password: managerPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Hide loading
            hideActionLoader();
            
            // Show success message
            showSuccessMessage(successText);
            
            // Wait a moment then reload
            setTimeout(() => {
                loadRestaurants();
            }, 1000);
        } else {
            hideActionLoader();
            alert('שגיאה: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        hideActionLoader();
        alert('שגיאה בעדכון הסטטוס');
    }
}

// Show action loader
function showActionLoader(message) {
    const overlay = document.getElementById('action-overlay');
    const messageEl = document.getElementById('action-message');
    messageEl.textContent = message;
    overlay.classList.add('show');
}

// Hide action loader
function hideActionLoader() {
    const overlay = document.getElementById('action-overlay');
    overlay.classList.remove('show');
}

// Show success message
function showSuccessMessage(message) {
    const successEl = document.getElementById('success-message');
    successEl.textContent = message;
    successEl.classList.add('show');
    
    setTimeout(() => {
        successEl.classList.remove('show');
    }, 2000);
}

// Make updateStatus available globally
window.updateStatus = updateStatus;
