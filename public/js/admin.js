/**
 * This script handles the admin functionalities for a web application.
 * It includes checking the user's role, displaying posts, and managing modal interactions.
 */

// Import necessary functions from other modules
import { logout, getRoleFromToken } from "./modules/auth.js";
import { fetchAndDisplayPosts } from "./modules/posts.js";

/**
 * Main function that runs when the DOM content is fully loaded.
 * It checks the user's role, fetches and displays posts, and sets up event listeners for modal interactions.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Get the token from localStorage
  const token = localStorage.getItem("token");

  // Check if the user has the 'admin' role
  console.log(getRoleFromToken(token));
  if (getRoleFromToken(token) !== "admin") {
    // If not an admin, log the user out
    logout();
  }
  fetchAndDisplayPosts();

  const profileButton = document.getElementById("profile-button");
  if (profileButton) {
    profileButton.remove();
  }
});
