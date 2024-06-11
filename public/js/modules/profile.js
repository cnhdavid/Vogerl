import { checkToken, logout } from './auth.js';
import { fetchAndDisplayPosts, populateSidebar } from './posts.js';
import { getUserIdFromToken } from './auth.js';
function setupNavbar(user) {
    const navbarEnd = document.getElementById('navbar-end');
    const username = user.username;

    const welcomeMessage = document.createElement('div');
    welcomeMessage.classList.add('navbar-item');
    welcomeMessage.innerHTML = `<span class="has-text-weight-semibold">Welcome, ${username}</span>`;

    navbarEnd.innerHTML = '';
    navbarEnd.appendChild(welcomeMessage);

    const logoutButton = document.createElement('button');
    logoutButton.setAttribute('id', 'logout-button');
    logoutButton.classList.add('navbar-item', 'button', 'is-danger', 'is-normal');
    logoutButton.textContent = 'Logout';
    logoutButton.style.color = '#000000';
    logoutButton.addEventListener('click', logout);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('buttons');
    buttonContainer.appendChild(logoutButton);

    navbarEnd.appendChild(buttonContainer);
}

function editProfile() {
    document.getElementById('aboutText').style.display = 'none';
    document.getElementById('aboutTextarea').style.display = 'block';
    document.getElementById('aboutTextarea').value = document.getElementById('aboutText').innerText;
    document.getElementById('fileInputContainer').style.display = 'block';
    document.getElementById('editButton').style.display = 'none';
    document.getElementById('saveButton').style.display = 'inline-block';
    document.getElementById('cancelButton').style.display = 'inline-block';
}

function saveProfile() {
    const aboutText = document.getElementById('aboutTextarea').value;
    document.getElementById('aboutText').style.display = 'block';
    document.getElementById('aboutTextarea').style.display = 'none';
    document.getElementById('fileInputContainer').style.display = 'none';
    document.getElementById('editButton').style.display = 'inline-block';
    document.getElementById('saveButton').style.display = 'none';
    document.getElementById('cancelButton').style.display = 'none';
}

function cancelProfileEdit() {
    document.getElementById('aboutText').style.display = 'block';
    document.getElementById('aboutTextarea').style.display = 'none';
    document.getElementById('fileInputContainer').style.display = 'none';
    document.getElementById('editButton').style.display = 'inline-block';
    document.getElementById('saveButton').style.display = 'none';
    document.getElementById('cancelButton').style.display = 'none';
}

function handleProfilePicUpload(event) {
    const fileInput = event.target;
    const fileName = fileInput.files[0].name;
    document.getElementById('file-name').innerText = fileName;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('profilePic').src = e.target.result;
    };
    reader.readAsDataURL(fileInput.files[0]);
}

document.addEventListener('DOMContentLoaded', () => {
    const user = checkToken();
    if (user) {
        setupNavbar(user);
    }
    populateSidebar(getUserIdFromToken(localStorage.getItem('token')));
    
    fetchAndDisplayPosts(null,getUserIdFromToken(localStorage.getItem('token')));
    populateSidebar(getUserIdFromToken(localStorage.getItem('token')));
});

document.getElementById('editButton').addEventListener('click', editProfile);
document.getElementById('saveButton').addEventListener('click', saveProfile);
document.getElementById('cancelButton').addEventListener('click', cancelProfileEdit);
document.getElementById('uploadProfilePic').addEventListener('change', handleProfilePicUpload);

