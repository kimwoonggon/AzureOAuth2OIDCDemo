// Azure AD Configuration
const msalConfig = {
    auth: {
        clientId: "70a3cf75-694b-463d-a658-011195fc1f9d", // Your Azure AD App Client ID
        authority: "https://login.microsoftonline.com/6c01af9b-e68a-4616-bcc6-4685d9acd910", // Your Tenant ID
        redirectUri: "http://localhost:3000", // Must be registered in Azure AD
        navigateToLoginRequestUrl: false, // Prevent navigation issues in popups
    },
    cache: {
        cacheLocation: "sessionStorage", // Can be "localStorage" or "sessionStorage"
        storeAuthStateInCookie: false, // Set to true for IE11 or Edge
    },
    system: {
        windowHashTimeout: 60000, // Timeout for popup and redirect
        iframeHashTimeout: 6000,
        loadFrameTimeout: 0,
        asyncPopups: false // Disable async popups to prevent nested popup issues
    }
};

// API Configuration
const apiConfig = {
    baseUrl: "http://localhost:5000/api",
    scopes: ["User.Read"] // Using Microsoft Graph scope temporarily
};

// Login Request Configuration
const loginRequest = {
    scopes: ["openid", "profile", "email", "User.Read"]
};

// Token Request Configuration for API calls
const tokenRequest = { scopes: ["api://70a3cf75-694b-463d-a658-011195fc1f9d/access_as_user"] };