document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const redirectToPost = sessionStorage.getItem('redirectToPost');

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
                window.location.href = 'login.html';
                return;
            }

            const data = await response.json();
            const token = data.token;

            localStorage.setItem('token', token);

            if (redirectToPost) {
                // Redirect back to the post
                window.location.href = redirectToPost;
                sessionStorage.removeItem('redirectToPost');
            } else {
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    });
});