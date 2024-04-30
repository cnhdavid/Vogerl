// Set the dropdown to be hidden on page load
document.addEventListener('DOMContentLoaded', function() {
  var dropdown = document.getElementById('loginDropdown');
  dropdown.style.display = 'none'; // Initially hide the dropdown element on page load
});

// Toggle the visibility of the dropdown when the login button is clicked
document.getElementById('loginBtn').addEventListener('click', function(event) {
  var dropdown = document.getElementById('loginDropdown');
  dropdown.style.display = (dropdown.style.display === 'none' ? 'block' : 'none'); // Toggle between hidden and visible
  event.stopPropagation(); // Prevents the click from bubbling up to the document level
});

// Prevents the dropdown from closing when clicking inside of it
document.getElementById('loginDropdown').addEventListener('click', function(event) {
  event.stopPropagation(); // Stops the click event from propagating to other elements
});

// Close the dropdown by clicking outside of it
window.onclick = function(event) {
  var dropdown = document.getElementById('loginDropdown');
  if (dropdown.style.display === 'block') { // Checks if the dropdown is open
      dropdown.style.display = 'none'; // Closes the dropdown
  }
};

// Handles form submission for login
document.getElementById('loginForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevents the form from submitting traditionally
  const email = document.getElementById('loginEmail').value; // Retrieves the email from the form
  const password = document.getElementById('loginPassword').value; // Retrieves the password from the form

  // Sends a POST request to the server to attempt login
  fetch('/api/users/login', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }) // Converts login details into JSON format
  })
  .then(response => response.json()) // Parses the JSON response from the server
  .then(data => {
      if (data.message === 'Login successful') {
          // If login is successful, redirect to the user account page
          window.location.href = `/user.html?userId=${data.userId}`;
      } else {
          alert(data.message); // Displays an alert with the server message if login fails
      }
  })
  .catch((error) => {
      console.error('Error:', error); // Logs errors to the console
      alert('Error during login'); // Alerts the user to the error
  });
});

// Handles form submission for posting content
document.getElementById('postForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevents the form from submitting traditionally
  const title = document.getElementById('postTitle').value; // Retrieves the title from the form
  const content = document.getElementById('postContent').value; // Retrieves the content from the form
  console.log('Posting question', title, content); // Logs the submission for debugging
});

// Function to load posts
function loadPosts() {
  console.log('Fetching posts'); // Logs the action of fetching posts
}

// Calls the loadPosts function immediately when the script runs
loadPosts();
