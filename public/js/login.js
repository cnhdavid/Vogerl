/**
 * This script handles the login functionality for the web application.
 * It includes form submission handling, reCAPTCHA verification, and redirection based on user roles.
 */

// Add an event listener for the DOMContentLoaded event
document.addEventListener("DOMContentLoaded", () => {
  // Get the login form element
  const loginForm = document.getElementById("loginForm");

  // Add an event listener for the form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the default form submission

    // Get the email, password, and reCAPTCHA response
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const recaptchaResponse = grecaptcha.getResponse();

    // Get the redirect URL from session storage if available
    const redirectToPost = sessionStorage.getItem("redirectToPost");

    // Check if reCAPTCHA is completed
    if (!recaptchaResponse) {
      alert("Please complete the reCAPTCHA.");
      return;
    }

    try {
      // Send the login request to the server
      const response = await fetch("http://localhost:3000/account/login", {
        method: "POST",
        body: JSON.stringify({ email, password, recaptchaResponse }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Handle invalid or expired token response
      if (response.status === 401 || response.status === 403) {
        alert("Session expired or token invalid. Redirecting to login page...");
        window.location.href = "login.html";
        return;
      }

      // Parse the response data
      const data = await response.json();
      const token = data.token;

      // Store the token in localStorage
      localStorage.setItem("token", token);

      // Handle invalid email or password response
      if (response.status === 400) {
        alert("Invalid email or password. Please try again.");
        return;
      }

      // Redirect based on user role or post redirection URL
      if (redirectToPost) {
        // Redirect back to the post
        window.location.href = redirectToPost;
        sessionStorage.removeItem("redirectToPost");
      } else {
        // Redirect to the appropriate dashboard
        if (data.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }
      }
    } catch (error) {
      console.error("Error logging in:", error);
    }
  });
});
