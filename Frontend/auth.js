// Initialize MSAL instance
const msalInstance = new msal.PublicClientApplication(msalConfig);

// Current user account
let currentAccount = null;

// Initialize MSAL
async function initializeMsal() {
    try {
        // Handle redirect response if coming back from login
        const response = await msalInstance.handleRedirectPromise();
        if (response && response.account) {
            currentAccount = response.account;
            msalInstance.setActiveAccount(response.account);
        }

        // Check if user is already signed in
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            msalInstance.setActiveAccount(accounts[0]);
        }

        return currentAccount;
    } catch (error) {
        console.error("MSAL initialization error:", error);
        return null;
    }
}

// Check if running inside popup/iframe
function isRunningInPopup() {
    try {
        return window.opener !== null || window !== window.parent || window !== window.top;
    } catch (e) {
        return true;
    }
}

// Sign in function (Popup mode)
async function signIn() {
    // If already running in popup, use redirect
    if (isRunningInPopup()) {
        console.log("Running in popup/iframe, using redirect");
        await msalInstance.loginRedirect(loginRequest);
        return;
    }
    
    try {
        // Try popup first if not in popup
        const response = await msalInstance.loginPopup(loginRequest);
        currentAccount = response.account;
        msalInstance.setActiveAccount(response.account);
        return response.account;
    } catch (popupError) {
        // If popup fails, fallback to redirect
        console.log("Popup blocked or failed:", popupError.errorCode);
        await msalInstance.loginRedirect(loginRequest);
    }
}

// Sign in function (Redirect mode - always use redirect)
async function signInWithRedirect() {
    console.log("Using redirect for sign in");
    await msalInstance.loginRedirect(loginRequest);
}

// Sign out function
async function signOut() {
    const logoutRequest = {
        account: currentAccount,
        postLogoutRedirectUri: window.location.origin
    };
    
    await msalInstance.logoutRedirect(logoutRequest);
}

// Get access token for API calls
async function getAccessToken() {
    if (!currentAccount) {
        throw new Error("No user signed in");
    }

    const request = {
        ...tokenRequest,
        account: currentAccount
    };

    try {
        // Try to get token silently first
        const response = await msalInstance.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        console.log("Silent token acquisition failed");
        
        // Check if running in popup/iframe
        if (isRunningInPopup()) {
            console.log("Running in popup/iframe, using redirect for token acquisition");
            await msalInstance.acquireTokenRedirect(request);
            return;
        }
        
        try {
            // If not in popup and silent fails, try popup
            const response = await msalInstance.acquireTokenPopup(request);
            return response.accessToken;
        } catch (popupError) {
            // If popup fails, use redirect
            console.log("Popup failed for token acquisition:", popupError.errorCode);
            await msalInstance.acquireTokenRedirect(request);
        }
    }
}

// Make authenticated API call
async function makeAuthenticatedRequest(url, options = {}) {
    try {
        const token = await getAccessToken();
        
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            // Token might be expired, try to refresh
            msalInstance.clearCache();
            const newToken = await getAccessToken();
            
            // Retry with new token
            return fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${newToken}`,
                    'Content-Type': 'application/json'
                }
            });
        }

        return response;
    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
}

// Decode JWT token for display
function decodeToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }
        
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        
        return {
            header,
            payload,
            expires: new Date(payload.exp * 1000),
            issued: new Date(payload.iat * 1000)
        };
    } catch (error) {
        console.error("Token decode error:", error);
        return null;
    }
}

// Check if token is expired
function isTokenExpired(token) {
    try {
        const decoded = decodeToken(token);
        if (!decoded) return true;
        
        return decoded.expires < new Date();
    } catch {
        return true;
    }
}