// js/modules/modal.js

import { loadComments, submitComment } from './postManager.js';

/**
 * Opens a post by its ID, updating the URL and fetching post data.
 * @param {string} postId - The ID of the post to open.
 */
export function openPost(postId) {
  console.log('Opening post:', postId);

  // Update the URL to reflect the opened post
  history.pushState({}, '', `post.html?postId=${postId}`);

  // Add event listener for the browser's back/forward navigation
  window.addEventListener('popstate', () => {
    console.log('Popstate event triggered, redirecting to dashboard.');
    window.location.href = 'dashboard.html'; // Redirect to the dashboard page on popstate
  });

  // Fetch the post data from the server
  fetch(`http://localhost:3000/post/${postId}`)
    .then(response => response.json())
    .then(post => {
      console.log('Post loaded, redirecting to:', `post.html?postId=${postId}`);
      window.location.href = `post.html?postId=${postId}`; // Redirect to the post page
    })
    .catch(error => console.error('Error fetching post:', error));
}

/**
 * Edits a post by its ID with the given title and content.
 * @param {string} postId - The ID of the post to edit.
 * @param {string} title - The new title of the post.
 * @param {string} content - The new content of the post.
 */
export function editPost(postId, title, content) {
  // Send a PUT request to update the post on the server
  fetch(`http://localhost:3000/post/${postId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`, // Include the authorization token
    },
    body: JSON.stringify({ title, content }), // Send the updated title and content
  })
    .then(response => response.json())
    .then(post => {
      openPost(postId);
    })
    .catch(error => console.error('Error editing post:', error));
}
