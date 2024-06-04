document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired
                alert('Session expired or token invalid. Redirecting to login page...');
                window.location.href = 'login.html'; // Redirect to login page
                return;
            }

            if (response.ok) {
                const data = await response.json();
                
                localStorage.setItem('token', data.token); // Store the token
                

                
                window.location.href = 'dashboard.html'; // Redirect to your desired page
            } else {
                const errorData = await response.json();
                alert(`Login failed: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again later.');
        }
    });
});
