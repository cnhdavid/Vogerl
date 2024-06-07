// js/modules/modal.js

import { getUserIdFromToken } from './auth.js';
import { loadComments, submitComment } from './comment.js';

// js/modules/modal.js

export function openPost(postId) {
  console.log('Opening post:', postId);

  // Update the URL
  history.pushState({}, '', `post.html?postId=${postId}`);

  // Add event listener for popstate
  window.addEventListener('popstate', () => {
    // Redirect to the dashboard page
    console.log('Popstate event triggered, redirecting to dashboard.');
    window.location.href = 'dashboard.html';
  });

  fetch(`http://localhost:3000/api/posts/${postId}`)
    .then(response => response.json())
    .then(post => {
      // Redirect to the new page
      console.log('Post loaded, redirecting to:', `post.html?postId=${postId}`);
      window.location.href = `post.html?postId=${postId}`;
    })
    .catch(error => console.error('Error fetching post:', error));
}

 export function editPost(postId, title, content) {
  fetch(`http://localhost:3000/api/posts/${postId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ title, content }),
  })
    .then(response => response.json())
    .then(post => {
      // Redirect to the new page
      
      openPost(postId);
    })
    .catch(error => console.error('Error editing post:', error));
}
