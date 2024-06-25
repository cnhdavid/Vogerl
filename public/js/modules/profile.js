// Import necessary functions from other modules
import { checkToken, logout } from './auth.js';
import { fetchAndDisplayPosts, populateSidebar } from './posts.js';
import { getUserIdFromToken } from './auth.js';

/**
 * Setup the navbar with user information and logout button.
 * @param {Object} user - The user object containing user information.
 */
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

/**
 * Enable profile editing by showing text area and file input.
 */
function editProfile() {
    document.getElementById('aboutText').style.display = 'none';
    document.getElementById('aboutTextarea').style.display = 'block';
    document.getElementById('aboutTextarea').value = document.getElementById('aboutText').innerText;
    document.getElementById('fileInputContainer').style.display = 'block';
    document.getElementById('editButton').style.display = 'none';
    document.getElementById('saveButton').style.display = 'inline-block';
    document.getElementById('cancelButton').style.display = 'inline-block';
}

/**
 * Save profile changes and update the profile view.
 */
function saveProfile() {
    const aboutText = document.getElementById('aboutTextarea').value;
    const image = document.getElementById('uploadProfilePic').files[0];
    const formData = new FormData();
    const username = getUserIdFromToken(localStorage.getItem('token'));
    formData.append('about', aboutText);

    if (username) {
        formData.append('username', username);
    }

    if (image) {
        formData.append('image', image);
    }
    console.log(aboutText);

    fetch('http://localhost:3000/account/editProfile', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            window.location.reload();
        })
}

/**
 * Cancel profile editing and revert the view to the original state.
 */
function cancelProfileEdit() {
    document.getElementById('aboutText').style.display = 'block';
    document.getElementById('aboutTextarea').style.display = 'none';
    document.getElementById('fileInputContainer').style.display = 'none';
    document.getElementById('editButton').style.display = 'inline-block';
    document.getElementById('saveButton').style.display = 'none';
    document.getElementById('cancelButton').style.display = 'none';
}

/**
 * Fetch user information based on the token.
 * @returns {Promise<Object>} - A promise that resolves to the user object.
 */
 async function fetchUser() {
    const token = localStorage.getItem('token');
    const userId = getUserIdFromToken(token);
    const response = await fetch(`http://localhost:3000/user/userInfo/${userId}`);
    const user = await response.json();
    return user;
}

/**
 * Populate the profile section with user information.
 */
function populateProfile() {
    
    fetchUser().then(user => {
        document.getElementById('userSince').innerText = `user since ${new Date(user.created_at).toLocaleDateString()}`;
        document.getElementById('questionTitle').innerText = `Questions by @${user.username}`;
        document.getElementById('aboutText').innerText = user.about;
        document.getElementById('username').innerText = "@" + user.username;
        document.getElementById('firstName').innerText = user.first_name;
        document.getElementById('lastName').innerText = user.last_name;
        let imageData = '';
        if (user.profilepic){
            imageData = `data:image/png;base64,${user.profilepic}`;
            document.getElementById('profilePic').src = imageData;
            
        }
        document.getElementById('profileBox').style.display = 'block';
    });
}

/**
 * Handle profile picture upload and display the selected image.
 * @param {Event} event - The file input change event.
 */
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

/**
 * Update user information with the new profile data.
 */


/**
 * Initialize the application on DOMContentLoaded.
 */
document.addEventListener('DOMContentLoaded', () => {

    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

    if ($navbarBurgers.length > 0) {
        $navbarBurgers.forEach(el => {
            el.addEventListener('click', () => {
                const target = el.dataset.target;
                const $target = document.getElementById(target);

                el.classList.toggle('is-active');
                $target.classList.toggle('is-active');
            });
        });
    }

    document.getElementById('profileBox').style.display = 'none';
    const user = checkToken();
    if (user) {
        setupNavbar(user);
        populateProfile();
    }
    populateSidebar(getUserIdFromToken(localStorage.getItem('token')));
    fetchAndDisplayPosts(null, getUserIdFromToken(localStorage.getItem('token')));
    populateSidebar(getUserIdFromToken(localStorage.getItem('token')));
});

// Add event listeners for profile editing actions
document.getElementById('editButton').addEventListener('click', editProfile);
document.getElementById('saveButton').addEventListener('click', saveProfile);
document.getElementById('cancelButton').addEventListener('click', cancelProfileEdit);
document.getElementById('uploadProfilePic').addEventListener('change', handleProfilePicUpload);