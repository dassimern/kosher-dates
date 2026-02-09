// ====================================
// MANAGER PANEL
// ====================================

const CONFIG = {
    webAppUrl: 'https://script.google.com/macros/s/AKfycbzFpSIo8QQl8Mh0BlMwp0utFHjc5XnBAN5vne5boOq3UqbuKTjIRdLBcnedxJMtpyxvvQ/exec'
};

let managerPassword = '';
let sessionToken = '';

// Simple hash function for session token (not cryptographically secure, but better than plain text)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'kosher_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ====================================
// LOGIN
// ====================================

// Check for saved session on page load
window.addEventListener('DOMContentLoaded', async function() {
    const savedToken = sessionStorage.getItem('managerSessionToken');
    if (savedToken) {
        // Verify session by attempting to load data
        sessionToken = savedToken;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('manager-panel').style.display = 'block';
        
        // Try to load - if it fails, session is invalid
        try {
            await loadRestaurants();
        } catch (err) {
            // Session expired or invalid - show login
            sessionStorage.removeItem('managerSessionToken');
            document.getElementById('login-screen').style.display = 'block';
            document.getElementById('manager-panel').style.display = 'none';
        }
    }
});

document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const passwordInput = document.getElementById('password');
    const submitBtn = this.querySelector('button[type="submit"]');
    
    managerPassword = password;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking...';
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
            // Generate session token (hash of password)
            sessionToken = await hashPassword(password);
            sessionStorage.setItem('managerSessionToken', sessionToken);
            managerPassword = password;
            
            // Login successful
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('manager-panel').style.display = 'block';
            loadRestaurants();
        } else {
            // Wrong password or error
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
            passwordInput.value = '';
            passwordInput.focus();
            showLoginError('❌ Wrong password. Try again.');
            // Add shake animation
            passwordInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                passwordInput.style.animation = '';
            }, 500);
        }
    } catch (error) {
        console.error('Error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
        
        if (error.message === 'Timeout') {
            showLoginError('⏱️ Request taking too long. Try again.');
        } else {
            showLoginError('Connection error. Check your internet.');
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

// Logout function for back button
function logoutAndGoBack(event) {
    event.preventDefault();
    sessionStorage.removeItem('managerSessionToken');
    managerPassword = '';
    sessionToken = '';
    window.location.href = 'index.html';
}

// Make function available globally
window.logoutAndGoBack = logoutAndGoBack;

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
                container.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1; font-size: 1.2rem;">No restaurants to display.</p>';
            } else {
                displayRestaurants(result.data);
            }
        } else {
            throw new Error(result.message || 'Failed to load restaurants');
        }
    } catch (err) {
        console.error('Error loading restaurants:', err);
        loading.style.display = 'none';
        error.innerHTML = '<p>Error loading restaurants</p>';
        error.style.display = 'block';
    }
}

// ====================================
// DISPLAY RESTAURANTS
// ====================================

let currentRestaurants = [];

function displayRestaurants(restaurants) {
    const container = document.getElementById('restaurants-container');
    currentRestaurants = restaurants;
    
    if (restaurants.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1;">No restaurants to display.</p>';
        return;
    }
    
    // Sort by status: pending first, then approved, then rejected
    restaurants.sort((a, b) => {
        const order = { pending: 0, approved: 1, rejected: 2 };
        return order[a.status] - order[b.status];
    });
    
    container.innerHTML = '';
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
        pending: 'Pending Approval',
        approved: 'Approved',
        rejected: 'Rejected'
    };
    
    let html = `
        <h2>${escapeHtml(restaurant.restaurantName)}</h2>
        <div class="restaurant-info">
            <p>
                <strong>Status:</strong>
                <span class="${statusClass}">${statusText[restaurant.status] || restaurant.status}</span>
            </p>
    `;
    
    if (restaurant.city) {
        html += `<p><strong>City:</strong> ${escapeHtml(restaurant.city)}</p>`;
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
        
        html += `<p><strong>Website:</strong> <a href="${escapeHtml(restaurant.website)}" 
               class="website-link" 
               target="_blank" 
               rel="noopener"
               title="${escapeHtml(restaurant.website)}">${escapeHtml(displayUrl)}</a></p>`;
    }
    
    if (restaurant.dateAdded) {
        html += `<p><strong>Date:</strong> ${escapeHtml(restaurant.dateAdded)}</p>`;
    }
    
    // Show action buttons only for pending items
    if (restaurant.status === 'pending') {
        html += `
            <div class="action-buttons">
                <button class="approve-btn" onclick="updateStatus('${escapeHtml(restaurant.id)}', 'approved')">
                    ✓ Approve
                </button>
                <button class="reject-btn" onclick="updateStatus('${escapeHtml(restaurant.id)}', 'rejected')">
                    ✗ Reject
                </button>
            </div>
        `;
    }
    
    // Add edit and delete buttons for all restaurants
    html += `
        <div class="action-buttons" style="margin-top: 10px;">
            <button class="edit-btn" onclick="openEditModal('${escapeHtml(restaurant.id)}')">
                ✎ Edit
            </button>
            <button class="delete-btn" onclick="deleteRestaurant('${escapeHtml(restaurant.id)}')">
                🗑 Delete
            </button>
        </div>
    `;
    
    html += '</div>';
    
    card.innerHTML = html;
    card.setAttribute('data-id', restaurant.id);
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
    const actionText = status === 'approved' ? 'Approving' : 'Rejecting';
    const successText = status === 'approved' ? '✓ Restaurant approved!' : '✗ Restaurant rejected';
    
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
            // Update the restaurant in currentRestaurants array
            const restaurant = currentRestaurants.find(r => r.id === id);
            if (restaurant) {
                restaurant.status = status;
                
                // Update the card directly in the DOM
                const card = document.querySelector(`.restaurant-card[data-id="${id}"]`);
                if (card) {
                    // Replace the card with the updated one
                    const newCard = createRestaurantCard(restaurant);
                    card.parentNode.replaceChild(newCard, card);
                }
            } else {
                console.error('Restaurant not found in currentRestaurants array');
            }
            
            // Hide loading
            hideActionLoader();
            
            // Show success message
            showSuccessMessage(successText);
        } else {
            hideActionLoader();
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        hideActionLoader();
        alert('Error updating status');
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

// ====================================
// EDIT RESTAURANT
// ====================================

const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editCloseBtn = document.getElementById('edit-close');
const editCancelBtn = document.getElementById('edit-cancel-btn');

// Open edit modal
function openEditModal(id) {
    const restaurant = currentRestaurants.find(r => r.id === id);
    if (!restaurant) {
        alert('Restaurant not found');
        return;
    }
    
    // Fill form with current data
    document.getElementById('edit-id').value = restaurant.id;
    document.getElementById('edit-restaurant-name').value = restaurant.restaurantName;
    document.getElementById('edit-city').value = restaurant.city || '';
    document.getElementById('edit-website').value = restaurant.website || '';
    document.getElementById('edit-kashrut').value = restaurant.kashrut || '';
    
    editModal.classList.add('show');
}

// Close edit modal
editCloseBtn.onclick = function() {
    editModal.classList.remove('show');
};

editCancelBtn.onclick = function() {
    editModal.classList.remove('show');
};

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === editModal) {
        editModal.classList.remove('show');
    }
};

// Submit edit form
editForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('edit-id').value;
    const formData = {
        action: 'updateRestaurant',
        id: id,
        restaurantName: document.getElementById('edit-restaurant-name').value,
        city: document.getElementById('edit-city').value,
        website: document.getElementById('edit-website').value,
        kashrut: document.getElementById('edit-kashrut').value,
        password: managerPassword
    };
    
    try {
        showActionLoader('Updating restaurant...');
        
        const response = await fetch(CONFIG.webAppUrl, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update the restaurant in currentRestaurants array
            const restaurant = currentRestaurants.find(r => r.id === id);
            if (restaurant) {
                restaurant.restaurantName = formData.restaurantName;
                restaurant.city = formData.city;
                restaurant.website = formData.website;
                restaurant.kashrut = formData.kashrut;
                
                // Update the card directly in the DOM
                const card = document.querySelector(`.restaurant-card[data-id="${id}"]`);
                if (card) {
                    const newCard = createRestaurantCard(restaurant);
                    card.parentNode.replaceChild(newCard, card);
                }
            } else {
                console.error('Restaurant not found in currentRestaurants array');
            }
            
            hideActionLoader();
            editModal.classList.remove('show');
            showSuccessMessage('✓ Restaurant updated successfully!');
        } else {
            hideActionLoader();
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        hideActionLoader();
        alert('Error updating restaurant');
    }
});

// ====================================
// DELETE RESTAURANT
// ====================================

// Custom confirm dialog
function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        const dialog = document.getElementById('confirm-dialog');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        dialog.classList.add('show');
        
        // Remove previous listeners
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // Add new listeners
        newOkBtn.addEventListener('click', () => {
            dialog.classList.remove('show');
            resolve(true);
        });
        
        newCancelBtn.addEventListener('click', () => {
            dialog.classList.remove('show');
            resolve(false);
        });
    });
}

function deleteRestaurant(id) {
    const restaurant = currentRestaurants.find(r => r.id === id);
    if (!restaurant) {
        alert('Restaurant not found');
        return;
    }
    
    showConfirmDialog(
        `Are you sure you want to delete "${restaurant.restaurantName}"?`,
        'This action cannot be undone!'
    ).then(confirmed => {
        if (confirmed) {
            performDelete(id);
        }
    });
}

async function performDelete(id) {
    try {
        showActionLoader('Deleting restaurant...');
        
        const response = await fetch(CONFIG.webAppUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'deleteRestaurant',
                id: id,
                password: managerPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Remove from currentRestaurants array
            currentRestaurants = currentRestaurants.filter(r => r.id !== id);
            
            // Remove the card from the DOM with animation
            const card = document.querySelector(`.restaurant-card[data-id="${id}"]`);
            if (card) {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    card.remove();
                    
                    // Check if no restaurants left
                    const container = document.getElementById('restaurants-container');
                    if (container.children.length === 0) {
                        container.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1;">No restaurants to display.</p>';
                    }
                }, 300);
            }
            
            hideActionLoader();
            showSuccessMessage('✓ Restaurant deleted successfully!');
        } else {
            hideActionLoader();
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        hideActionLoader();
        alert('Error deleting restaurant');
    }
}

// Make functions available globally
window.updateStatus = updateStatus;
window.openEditModal = openEditModal;
window.deleteRestaurant = deleteRestaurant;