// js/app.js

import { checkToken, getUserIdFromToken, logout } from './modules/auth.js';
import { fetchAndDisplayPosts, searchPosts } from './modules/posts.js';
import { populateMenu, populateSidebar, populatePostsSidebar, getPostsByUsername } from './modules/posts.js';

const socket = new WebSocket('ws://localhost:3000');

export function populateNavbar(user) {
  if (user) {
    const navbarEnd = document.getElementById('navbar-end');
    const username = user.username;

    const welcomeMessage = document.createElement('div');
    welcomeMessage.classList.add('navbar-item');
    welcomeMessage.innerHTML = `<span class="has-text-weight-semibold">Welcome, ${username}</span>`;

    const logoutButton = document.createElement('button');
    logoutButton.setAttribute('id', 'logout-button');
    logoutButton.classList.add('navbar-item', 'button', 'is-danger', 'is-normal');
    logoutButton.textContent = 'Logout';
    logoutButton.style.color = '#000000';
    logoutButton.addEventListener('click', logout);

    const profileButton = document.createElement('button');
    profileButton.setAttribute('id', 'profile-button');
    profileButton.classList.add('navbar-item', 'button', 'is-info', 'is-normal');
    profileButton.textContent = 'Profile';
    profileButton.style.color = '#000000';
    profileButton.addEventListener('click', () => {
      window.location.href = 'profile.html';
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('buttons');
    buttonContainer.appendChild(profileButton);
    buttonContainer.appendChild(logoutButton);

    navbarEnd.innerHTML = '';
    navbarEnd.appendChild(welcomeMessage);
    navbarEnd.appendChild(buttonContainer);
    
    populatePostsSidebar(getPostsByUsername(username));
  }
}

populateNavbar(checkToken());

// Mobile menu
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

  const searchButton = document.getElementById('searchButton');
  searchButton.addEventListener('click', () => {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value;
    fetchAndDisplayPosts(null, null, searchTerm);
    searchInput.value = '';
    document.getElementById('questionTitle').innerText = `Search Results for "${searchTerm}"`;
  });

  function toggleFormVisibility() {
    const toggleFormButton = document.getElementById('toggleFormButton');
    const formContainer = document.getElementById('postForm');
    if (formContainer.style.display === 'none') {
      formContainer.style.display = 'block';
      toggleFormButton.textContent = 'Cancel';
      toggleFormButton.classList.add('is-danger');
    } else {
      formContainer.style.display = 'none';
      toggleFormButton.textContent = 'Create Post';
      toggleFormButton.classList.remove('is-danger');
    }
  }
  document.getElementById('toggleFormButton').addEventListener('click', toggleFormVisibility);

  // Add event listener to the form
  document.getElementById('postForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const subject = document.getElementById('postMenu').value;
    const image = document.getElementById('postImage').files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('subject', subject);
    if (image) {
      formData.append('image', image);
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        alert('You are not logged in. Please log in first.');
        return;
      }

      const response = await fetch('http://localhost:3000/api/post', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (response.status === 403) {
        alert('You are not authorized to create a post.');
        window.location.href = 'login.html';
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Success:', data);
        document.getElementById('postForm').reset();
        fetchAndDisplayPosts();
        populatePostsSidebar(getPostsByUsername(getUserIdFromToken(token)));
      } else {
        const errorData = await response.json();
        alert(`Failed to submit post: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again later.');
    }
  });

  socket.addEventListener('message', event => {
    console.log('Message from server:', event.data);
    if (event.data === 'Server is shutting down') {
      localStorage.removeItem('token');
      socket.close();
    }
  });

  socket.addEventListener('open', () => {
    console.log('Connected to WebSocket server');
  });

  socket.addEventListener('close', () => {
    console.log('Disconnected from WebSocket server');
    
    location.reload();
  });

  fetchAndDisplayPosts(null, null, null);
  populateMenu();
  populateSidebar();
});
