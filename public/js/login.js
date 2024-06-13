document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const recaptchaResponse = grecaptcha.getResponse();

        const redirectToPost = sessionStorage.getItem('redirectToPost');


        if (!recaptchaResponse) {
            alert('Please complete the reCAPTCHA.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                body: JSON.stringify({ email, password, recaptchaResponse }), headers: {
                    'Content-Type': 'application/json',
                }
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
            console.log('Tokennn:', token);
            console.log('Token:', localStorage.getItem('token'));
            
            if (response.status === 400) {
                alert('Invalid email or password. Please try again.');
                return;
            }

            

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
