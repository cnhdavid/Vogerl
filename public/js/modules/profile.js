import { checkToken, logout } from './auth.js';
import { fetchAndDisplayPosts } from './posts.js';
import { populateSidebar } from './posts.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = checkToken();
    if (user) {
        const navbarEnd = document.getElementById('navbar-end');
        const username = user.username;
        const welcomeMessage = document.createElement('div');
        welcomeMessage.classList.add('navbar-item');
        welcomeMessage.innerHTML = `<span>Welcome, ${username}</span>`;
        navbarEnd.innerHTML = '';
        navbarEnd.appendChild(welcomeMessage);
        const logoutButton = document.createElement('a');
        logoutButton.setAttribute('id', 'logout-button');
        logoutButton.classList.add('navbar-item');
        logoutButton.textContent = 'Logout';
        logoutButton.addEventListener('click', logout);
        navbarEnd.appendChild(logoutButton);
    }    
    populateSidebar();
})