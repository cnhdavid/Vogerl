/**
 * This script handles the signup functionality for the web application.
 * It includes form validation, submission handling, and response processing.
 */

// Add an event listener for the form submission
document.getElementById('signup-form').addEventListener('submit', async(event) => {
    event.preventDefault(); // Prevent the default form submission

    // Get the input values from the signup form
    const first_name = document.getElementById('registerFirstName').value;
    const last_name = document.getElementById('registerLastName').value;
    const date_of_birth = document.getElementById('registerBirthdate').value;
    const date = new Date(date_of_birth);
    const formattedDOB = date.toISOString().split('T')[0]; // Format the date to YYYY-MM-DD

    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const Confirmpassword = document.getElementById('confirmPassword').value;

    // Check if the passwords match
    if (Confirmpassword === password) {
        try {
            // Send the signup request to the server
            const response = await fetch('http://localhost:3000/account/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, date_of_birth: formattedDOB, first_name, last_name })
            });

            // Parse the response from the server
            const result = await response.json();
            const messageElement = document.getElementById('signUp');

            // Handle the response based on the status code
            if (response.ok) {
                messageElement.textContent = 'User created successfully';
                messageElement.className = 'has-text-success';
            } else {
                messageElement.textContent = result.message;
                messageElement.className = 'has-text-danger';
            }
        } catch (error) {
            const messageElement = document.getElementById('message');
            messageElement.textContent = 'Error: ' + error.message;
            messageElement.className = 'has-text-danger';
        }
    } else {
        // Alert the user if the passwords do not match
        alert("Passwords do not match!");
    }
});