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

document.getElementById('editButton').addEventListener('click', function() {
    document.getElementById('aboutText').style.display = 'none';
    document.getElementById('aboutTextarea').style.display = 'block';
    document.getElementById('aboutTextarea').value = document.getElementById('aboutText').innerText;
    document.getElementById('fileInputContainer').style.display = 'block';
    document.getElementById('editButton').style.display = 'none';
    document.getElementById('saveButton').style.display = 'inline-block';
    document.getElementById('cancelButton').style.display = 'inline-block';
});

document.getElementById('saveButton').addEventListener('click', function() {
    const aboutText = document.getElementById('aboutTextarea').value;
    document.getElementById('aboutText').innerText = aboutText;
    document.getElementById('aboutText').style.display = 'block';
    document.getElementById('aboutTextarea').style.display = 'none';
    document.getElementById('fileInputContainer').style.display = 'none';
    document.getElementById('editButton').style.display = 'inline-block';
    document.getElementById('saveButton').style.display = 'none';
    document.getElementById('cancelButton').style.display = 'none';
});

document.getElementById('cancelButton').addEventListener('click', function() {
    document.getElementById('aboutText').style.display = 'block';
    document.getElementById('aboutTextarea').style.display = 'none';
    document.getElementById('fileInputContainer').style.display = 'none';
    document.getElementById('editButton').style.display = 'inline-block';
    document.getElementById('saveButton').style.display = 'none';
    document.getElementById('cancelButton').style.display = 'none';
});

document.getElementById('uploadProfilePic').addEventListener('change', function(event) {
    const fileInput = event.target;
    const fileName = fileInput.files[0].name;
    document.getElementById('file-name').innerText = fileName;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('profilePic').src = e.target.result;
    };
    reader.readAsDataURL(fileInput.files[0]);
});