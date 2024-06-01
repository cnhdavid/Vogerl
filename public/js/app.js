document.addEventListener('DOMContentLoaded', () => {
  const navbarEnd = document.getElementById('navbar-end');

  const token = localStorage.getItem('token');

  if (token) {
      // Decode token to get the username
      const payload = JSON.parse(atob(token.split('.')[1]));
      const username = payload.username;

      // Create welcome message
      const welcomeMessage = document.createElement('div');
      welcomeMessage.classList.add('navbar-item');
      welcomeMessage.innerHTML = `<span>Welcome, ${username}</span>`;

      // Create logout button
      const logoutButton = document.createElement('button');
      logoutButton.classList.add('button', 'is-danger');
      logoutButton.textContent = 'Logout';
      logoutButton.addEventListener('click', logout);

      // Clear existing content and append welcome message and logout button
      navbarEnd.innerHTML = '';
      navbarEnd.appendChild(welcomeMessage);
      navbarEnd.appendChild(logoutButton);
  }
});

// Logout functionality
function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}
