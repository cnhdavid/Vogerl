// js/app.js

import { checkToken, logout } from './modules/auth.js';
import { fetchAndDisplayPosts } from './modules/posts.js';
import { populateMenu, populateSidebar } from './modules/posts.js';

document.addEventListener('DOMContentLoaded', () => {
  

  const user = checkToken();

  if (user) {
    const navbarEnd = document.getElementById('navbar-end');
    const username = user.username;

    const welcomeMessage = document.createElement('div');
    welcomeMessage.classList.add('navbar-item');
    welcomeMessage.innerHTML = `<span>Welcome, ${username}</span>`;

    const logoutButton = document.createElement('a');
    logoutButton.setAttribute('id', 'logout-button');
    logoutButton.classList.add('navbar-item' );
    logoutButton.textContent = 'Logout';
    logoutButton.addEventListener('click', logout);

    const profileButton = document.createElement('a');
    profileButton.setAttribute('id', 'profile-button');
    profileButton.classList.add('navbar-item');
    profileButton.textContent = 'Profile';
    profileButton.addEventListener('click', () => {
      window.location.href = 'profile.html';
    });

    navbarEnd.innerHTML = '';
    navbarEnd.appendChild(welcomeMessage);
    navbarEnd.appendChild(logoutButton);
    navbarEnd.appendChild(profileButton);
  }

  // Add event listener to the form
  document.getElementById('postForm').addEventListener('submit', async function(event) {
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

      if (response.ok) {
        const data = await response.json();
        console.log('Success:', data);
        document.getElementById('postForm').reset();
        fetchAndDisplayPosts();
      } else {
        const errorData = await response.json();
        alert(`Failed to submit post: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again later.');
    }
  });

  fetchAndDisplayPosts();
  populateMenu()
  populateSidebar();
});

