/**
 * This script handles the admin functionalities for a web application.
 * It includes checking the user's role, displaying posts, and managing modal interactions.
 */

// Import necessary functions from other modules
import { checkToken, logout, getRoleFromToken } from './modules/auth.js';
import { fetchAndDisplayPosts, searchPosts } from './modules/posts.js';

/**
 * Main function that runs when the DOM content is fully loaded.
 * It checks the user's role, fetches and displays posts, and sets up event listeners for modal interactions.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');

    // Check if the user has the 'admin' role
    if (getRoleFromToken(token) !== 'admin') {
        // If not an admin, log the user out
        logout();
    }
<<<<<<< HEAD
    
    fetchAndDisplayPosts()
    
})
=======

    // Fetch and display posts
    fetchAndDisplayPosts();

    // Set up event listener to cancel the delete action
    document.getElementById("cancelDelete").addEventListener("click", () => {
        // Remove 'is-active' class from the confirmation modal to hide it
        document.getElementById("confirmationModal").classList.remove("is-active");
    });

    // Set up event listener to confirm the delete action
    document.getElementById("confirmDelete").addEventListener("click", () => {
        // Remove 'is-active' class from the confirmation modal to hide it
        document.getElementById("confirmationModal").classList.remove("is-active");
    });

    // Set up event listener to close the modal
    document.getElementById("modalClose").addEventListener("click", () => {
        // Remove 'is-active' class from the confirmation modal to hide it
        document.getElementById("confirmationModal").classList.remove("is-active");
    });
});
>>>>>>> 5c0f2ec (comments)
