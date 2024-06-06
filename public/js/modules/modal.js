// js/modules/modal.js

import { getUserIdFromToken } from './auth.js';
import { loadComments, submitComment } from './comment.js';

export function openPost(postId) {
  fetch(`http://localhost:3000/api/posts/${postId}`)
    .then(response => response.json())
    .then(post => {
      const modalContent = document.querySelector('#postModal .modal-content');
      const token = localStorage.getItem('token');
      let imageData = '';
      if (post.image) {
        imageData = `data:image/jpeg;base64,${post.image}`;
      }
      modalContent.innerHTML = `
        <article class="media">
          <div class="media-content">
            <div class="content">
              <p>
                <strong>${post.title}</strong> <small>@${post.username}</small>
                <br>
                <em>${post.subject}</em>
                <br>
                ${post.content}
              </p>
              ${imageData ? `<img src="${imageData}" alt="Post Image" class="post-image" />` : ''}
            </div>
          </div>
        </article>
        <div>
          <h4>Comments</h4>
          <div id="commentsContainer">
          </div>
          ${token ? `
          <textarea id="commentInput" class="textarea" placeholder="Add a comment"></textarea>
          <button id="submitComment" class="button is-primary">Submit</button>
          ` : `
          <p>Please log in to add a comment.</p>
          `}
          ${token && post.userId === getUserIdFromToken(token) ? `<button id="deletePostButton" class="button is-danger">Delete Post</button>` : ''}
        </div>
      `;

      if (token && post.userId === getUserIdFromToken(token)) {
        document.getElementById('deletePostButton').addEventListener('click', () => {
        deletePost(postId);
      });
        
        
      }

      if (token) {
        document.getElementById('submitComment').addEventListener('click', function() {
          const commentInput = document.getElementById('commentInput').value;
          submitComment(postId, commentInput, null);
        });
      }

      loadComments(postId);
      document.getElementById('postModal').classList.add('is-active');

      if (imageData) {
        const imageElement = modalContent.querySelector('.post-image');
        imageElement.addEventListener('click', () => {
          const newTab = window.open();
          newTab.document.body.innerHTML = `<img src="${imageData}" alt="Post Image" style="max-width: 100%; height: auto;" />`;
        });
      }
    })
    .catch(error => console.error('Error fetching post:', error));
}
async function deletePost(postId) {
  console.log("deleted")
}

// Event listener to close the modal
document.querySelector('.modal-close').addEventListener('click', () => {
  document.getElementById('postModal').classList.remove('is-active');
  window.history.pushState(null, null, window.location.pathname);
});
