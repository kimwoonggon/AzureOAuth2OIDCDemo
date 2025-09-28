// DOM Elements
const authSection = document.getElementById('auth-section');
const dataSection = document.getElementById('data-section');
const tokenSection = document.getElementById('token-section');
const loginArea = document.getElementById('login-area');
const userInfo = document.getElementById('user-info');
const loginBtn = document.getElementById('login-btn');
const loginRedirectBtn = document.getElementById('login-redirect-btn');
const logoutBtn = document.getElementById('logout-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearBtn = document.getElementById('clear-btn');
const refreshBtn = document.getElementById('refresh-data-btn');
const addBtn = document.getElementById('add-data-btn');
const dataResults = document.getElementById('data-results');
const tokenDisplay = document.getElementById('token-display');
const copyTokenBtn = document.getElementById('copy-token-btn');
const decodeTokenBtn = document.getElementById('decode-token-btn');
const tokenDecoded = document.getElementById('token-decoded');
const decodedContent = document.getElementById('decoded-content');
const tokenStatusText = document.getElementById('token-status-text');
const tokenExpiry = document.getElementById('token-expiry');
const messageArea = document.getElementById('message-area');
const addModal = document.getElementById('add-modal');
const addForm = document.getElementById('add-form');
const cancelAddBtn = document.getElementById('cancel-add');
const closeModal = document.querySelector('.close');

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    const account = await initializeMsal();
    if (account) {
        await updateUI(true);
        await loadData();
    } else {
        updateUI(false);
    }
});

// Event Listeners
loginBtn.addEventListener('click', async () => {
    try {
        const account = await signIn();
        if (account) {
            await updateUI(true);
            await loadData();
            showMessage('Successfully signed in!', 'success');
        }
    } catch (error) {
        showMessage('Sign in failed: ' + error.message, 'error');
    }
});

// Redirect login button
loginRedirectBtn?.addEventListener('click', async () => {
    try {
        await signInWithRedirect();
        // Note: This will redirect, so no code after this will execute
    } catch (error) {
        showMessage('Sign in failed: ' + error.message, 'error');
    }
});

logoutBtn.addEventListener('click', async () => {
    await signOut();
});

searchBtn.addEventListener('click', () => loadData(searchInput.value));
clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    loadData();
});
refreshBtn.addEventListener('click', () => loadData());

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadData(searchInput.value);
    }
});

addBtn.addEventListener('click', () => {
    addModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    addModal.style.display = 'none';
});

cancelAddBtn.addEventListener('click', () => {
    addModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === addModal) {
        addModal.style.display = 'none';
    }
});

addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addNewItem();
});

copyTokenBtn.addEventListener('click', async () => {
    try {
        const token = await getAccessToken();
        await navigator.clipboard.writeText(token);
        showMessage('Token copied to clipboard!', 'success');
    } catch (error) {
        showMessage('Failed to copy token', 'error');
    }
});

decodeTokenBtn.addEventListener('click', async () => {
    try {
        const token = await getAccessToken();
        const decoded = decodeToken(token);
        if (decoded) {
            decodedContent.textContent = JSON.stringify(decoded, null, 2);
            tokenDecoded.style.display = 'block';
        }
    } catch (error) {
        showMessage('Failed to decode token', 'error');
    }
});

// Update UI based on authentication state
async function updateUI(isAuthenticated) {
    if (isAuthenticated && currentAccount) {
        loginArea.style.display = 'none';
        userInfo.style.display = 'block';
        dataSection.style.display = 'block';
        tokenSection.style.display = 'block';
        
        document.getElementById('user-name').textContent = `Name: ${currentAccount.name}`;
        document.getElementById('user-email').textContent = `Email: ${currentAccount.username}`;
        
        // Update token display
        try {
            const token = await getAccessToken();
            tokenDisplay.value = token;
            
            const decoded = decodeToken(token);
            if (decoded) {
                tokenExpiry.textContent = decoded.expires.toLocaleString();
                tokenStatusText.textContent = 'Active';
                tokenStatusText.className = 'status-active';
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
    } else {
        loginArea.style.display = 'block';
        userInfo.style.display = 'none';
        dataSection.style.display = 'none';
        tokenSection.style.display = 'none';
    }
}

// Load data from API
async function loadData(search = '') {
    try {
        dataResults.innerHTML = '<div class="loading">Loading data...</div>';
        
        const url = search 
            ? `${apiConfig.baseUrl}/data?search=${encodeURIComponent(search)}`
            : `${apiConfig.baseUrl}/data`;
            
        const response = await makeAuthenticatedRequest(url);
        
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        
        const data = await response.json();
        displayData(data);
        
    } catch (error) {
        dataResults.innerHTML = '<div class="error">Failed to load data. Please try again.</div>';
        showMessage('Error loading data: ' + error.message, 'error');
    }
}

// Display data in grid
function displayData(items) {
    if (!items || items.length === 0) {
        dataResults.innerHTML = '<div class="no-data">No data found</div>';
        return;
    }
    
    dataResults.innerHTML = items.map(item => `
        <div class="data-item" data-id="${item.id}">
            <h3>${item.title}</h3>
            <span class="category-badge">${item.category}</span>
            <p>${item.description}</p>
            <div class="item-actions">
                <button class="btn btn-small btn-danger" onclick="deleteItem(${item.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Add new item
async function addNewItem() {
    const title = document.getElementById('item-title').value;
    const description = document.getElementById('item-description').value;
    const category = document.getElementById('item-category').value;
    
    try {
        const response = await makeAuthenticatedRequest(`${apiConfig.baseUrl}/data`, {
            method: 'POST',
            body: JSON.stringify({ title, description, category })
        });
        
        if (!response.ok) {
            throw new Error('Failed to add item');
        }
        
        addModal.style.display = 'none';
        addForm.reset();
        await loadData();
        showMessage('Item added successfully!', 'success');
        
    } catch (error) {
        showMessage('Error adding item: ' + error.message, 'error');
    }
}

// Delete item
async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${apiConfig.baseUrl}/data/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete item');
        }
        
        await loadData();
        showMessage('Item deleted successfully!', 'success');
        
    } catch (error) {
        showMessage('Error deleting item: ' + error.message, 'error');
    }
}

// Show message
function showMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = text;
    
    messageArea.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}