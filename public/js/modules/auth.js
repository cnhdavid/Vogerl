/**
 * Checks the validity of the token stored in localStorage.
 * @returns {Object|null} Decoded token payload or null if invalid.
 */
export function checkToken() {
    const token = localStorage.getItem('token'); // Retrieve the token from localStorage

    if (!token) {
        console.error('No token found');
        return null; // Return null if no token is found
    }

    const parts = token.split('.'); // Split the token into its parts (header, payload, signature)
    if (parts.length !== 3) {
        console.error('Token format is invalid');
        return null; // Return null if token format is incorrect
    }

    const payload = parts[1]; // Get the payload part of the token
    try {
        const decodedPayload = atob(payload); // Decode the payload from Base64
        return JSON.parse(decodedPayload); // Parse and return the decoded payload as an object
    } catch (error) {
        console.error('Failed to decode or parse token payload:', error);
        return null; // Return null if decoding or parsing fails
    }
}

/**
 * Logs the user out by removing the token from localStorage and redirecting to the login page.
 */
export function logout() {
    localStorage.removeItem('token'); // Remove the token from localStorage
    window.location.href = 'login.html'; // Redirect the user to the login page
}

/**
 * Fetches the user ID from the server based on the provided username.
 * @param {string} username - The username of the user.
 * @returns {Object|null} The user data or null if an error occurs.
 */
export async function getUserId(username) {
    try {
        const response = await fetch(`http://localhost:3000/api/users/${username}`); // Fetch user data from the server
        if (!response.ok) {
            throw new Error('Failed to fetch user ID'); // Throw an error if the response is not ok
        }
        const data = await response.json(); // Parse the response JSON
        return data; // Return the user data
    } catch (error) {
        console.error('Error fetching user ID:', error);
        return null; // Return null if an error occurs
    }
}

/**
 * Extracts the username from the provided token.
 * @param {string} token - The token from which to extract the username.
 * @returns {string|null} The username or null if an error occurs.
 */
export function getUserIdFromToken(token) {
    if (!token) {
        throw new Error("Token is undefined or null"); // Throw an error if the token is not provided
    }

    try {
        const base64Url = token.split('.')[1]; // Get the payload part of the token
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Replace URL-safe characters
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        ); // Decode the payload from Base64
        const decodedToken = JSON.parse(jsonPayload); // Parse the decoded payload
        return decodedToken.username; // Return the username from the token
    } catch (error) {
        console.error('Error decoding token:', error);
        return null; // Return null if decoding or parsing fails
    }
}

/**
 * Extracts the role from the provided token.
 * @param {string} token - The token from which to extract the role.
 * @returns {string|null} The role or null if an error occurs.
 */
export function getRoleFromToken(token) {
    if (!token) {
        throw new Error("Token is undefined or null"); // Throw an error if the token is not provided
    }

    try {
        const base64Url = token.split('.')[1]; // Get the payload part of the token
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Replace URL-safe characters
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        ); // Decode the payload from Base64
        const decodedToken = JSON.parse(jsonPayload); // Parse the decoded payload
        return decodedToken.role; // Return the role from the token
    } catch (error) {
        console.error('Error decoding token:', error);
        return null; // Return null if decoding or parsing fails
    }
}
