// js/modules/modal.js

import { getUserIdFromToken } from './auth.js';
import { loadComments, submitComment } from './comment.js';

export function openPost(postId) {
  // Update the URL
  history.pushState({}, '', `post.html?postId=${postId}`);

  fetch(`http://localhost:3000/api/posts/${postId}`)
    .then(response => response.json())
    .then(post => {
      // Redirect to the new page
      window.location.href = `post.html?postId=${postId}`;
    })
    .catch(error => console.error('Error fetching post:', error));
}