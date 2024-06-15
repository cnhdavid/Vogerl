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
async function fetchUser() {
    const token = localStorage.getItem('token');
    const userId = getUserIdFromToken(token);
    const response = await fetch(`http://localhost:3000/api/userInfo/${userId}`);
    const user = await response.json();
    return user;
}

function populateProfile() {
    fetchUser().then(user => {
        
        document.getElementById('aboutText').innerText = user.about;
    document.getElementById('username').innerText = "@"+user.username;
    document.getElementById('firstName').innerText = user.first_name;
    document.getElementById('lastName').innerText = user.last_name;
    
    
    document.getElementById('profilePic').src = user.profilePic;
    })

    
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
async function updateUserInfo() {
    
    
    const about = document.getElementById('aboutTextarea').value;
    const firstName = document.getElementById('firstNameInput').value;
    const lastName = document.getElementById('lastNameInput').value;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`http://localhost:3000/api/users/${username}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email, password, firstName, lastName }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update user info: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.message === 'User updated successfully') {
            alert('User info updated successfully');
        } else {
            alert('Error updating user info: ' + result.message);
        }
    } catch (error) {
        console.error('Error updating user info:', error);
        alert('Error updating user info: ' + error.message);
    }
}



document.addEventListener('DOMContentLoaded', () => {
    const user = checkToken();
    if (user) {
        setupNavbar(user);
        populateProfile();
    }
    populateSidebar(getUserIdFromToken(localStorage.getItem('token')));
    
    fetchAndDisplayPosts(null,getUserIdFromToken(localStorage.getItem('token')));
    populateSidebar(getUserIdFromToken(localStorage.getItem('token')));
});

document.getElementById('editButton').addEventListener('click', editProfile);
document.getElementById('saveButton').addEventListener('click', saveProfile);
document.getElementById('cancelButton').addEventListener('click', cancelProfileEdit);
document.getElementById('uploadProfilePic').addEventListener('change', handleProfilePicUpload);

