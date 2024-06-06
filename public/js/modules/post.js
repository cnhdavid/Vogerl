import { getUserIdFromToken } from './auth.js';
// Retrieve the postId from the URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('postId');

// Fetch the post and its comments
fetch(`http://localhost:3000/api/posts/${postId}`)
  .then(response => response.json())
  .then(post => {
    // Display the post and its comments on the page
    const postContainer = document.getElementById('post-container');
    const token = localStorage.getItem('token');
    postContainer.innerHTML = `
      <h2 class="title">${post.title}</h2>
      <p class="subtitle">@${post.username}</p>
      <div class="content">
        <p>${post.content}</p>
        ${post.image ? `<img src="data:image/jpeg;base64,${post.image}" alt="Post Image" class="post-image" />` : ''}
      </div>
      <h3 class="title is-5">Comments</h3>
      <div id="comments-container"></div>
       ${token ? `
          <textarea id="commentInput" class="textarea" placeholder="Add a comment"></textarea>
          <button id="submitComment" class="button is-primary">Submit</button>
          ` : `
          <p>Please log in to add a comment.</p>
          `}
          ${token && post.userId === getUserIdFromToken(token) ? `<button id="deletePostButton" class="button is-danger">Delete Post</button>` : ''}
        </div>
    `;
    document.getElementById('submitComment').addEventListener('click', () => {
      const commentContent = document.getElementById('commentInput').value;
      submitComment(postId, commentContent);
    });
    document.getElementById('deletePostButton').addEventListener('click', () => {
      deletePost(postId);
    });

    // Fetch and display the comments
    fetch(`http://localhost:3000/api/posts/${postId}/comments`)
  .then(response => response.json())
  .then(comments => {
    const commentsContainer = document.getElementById('comments-container');
    comments.forEach(comment => {
      const commentElement = document.createElement('div');
      commentElement.classList.add('box');
      commentElement.innerHTML = `
        <h4 class="title is-6">${comment.username}</h4>
        <p class="content">${comment.content}</p>
        <button id="replyButton" class="button is-primary"">Reply</button>
        <div class="reply-input" style="display: none;">
          <textarea class="textarea" placeholder="Reply to comment"></textarea>
          <button class="button is-primary is-small submit-reply">Submit</button>
          <button class="button is-danger is-small submit-close">Close</button>
        </div>
      `;

      const replyButton = commentElement.querySelector('#replyButton');
      replyButton.addEventListener('click', () => {
        const replyInput = commentElement.querySelector('.reply-input');
        replyInput.style.display = 'block';
      });

      const submitCloseButton = commentElement.querySelector('.submit-close');
      submitCloseButton.addEventListener('click', () => {
        const replyInput = commentElement.querySelector('.reply-input');
        replyInput.style.display = 'none';
      });

      const submitReplyButton = commentElement.querySelector('.submit-reply');
      submitReplyButton.addEventListener('click', () => {
        const replyContent = commentElement.querySelector('.reply-input textarea').value;
        submitComment(postId, replyContent, comment.id);
      });
      commentsContainer.appendChild(commentElement);
    });
  })
  .catch(error => console.error('Error fetching comments:', error));
  
  })
  .catch(error => console.error('Error fetching post:', error));

  
  
  const renderComments = (comments, parentElement, level = 0, replyTo = null) => {
    comments.forEach(comment => {
      const commentElement = document.createElement('div');
      commentElement.classList.add('comment');
      commentElement.style.marginLeft = `${level * 20}px`;
      const replyText = replyTo ? `<span class="replying-to-text">Replying to ${replyTo}</span>` : '';
      commentElement.innerHTML = `
        <p>
          <strong>${comment.username}</strong> ${replyText}
          <br>
          ${comment.content}
        </p>
        <button class="button is-small is-light reply-button">Reply</button>
        <div class="reply-input" style="display: none;">
          <textarea class="textarea" placeholder="Reply to comment"></textarea>
          <button class="button is-primary is-small submit-reply">Submit</button>
          <button class="button is-danger is-small submit-close">Close</button>
        </div>
      `;
  
      const replyButton = commentElement.querySelector('.reply-button');
      const replyInput = commentElement.querySelector('.reply-input');
      const submitReplyButton = commentElement.querySelector('.submit-reply');
      const submitCloseButton = commentElement.querySelector('.submit-close');
  
      replyButton.addEventListener('click', () => {
        replyInput.style.display = 'block';
      });
  
      submitReplyButton.addEventListener('click', () => {
        const replyContent = replyInput.querySelector('textarea').value;
        submitComment(postId, replyContent, comment.id);
      });
  
      submitCloseButton.addEventListener('click', () => {
        replyInput.style.display = 'none';
      });
  
      parentElement.appendChild(commentElement);
  
      if (comment.replies) {
        renderReplies(comment.replies, commentElement, level + 1, comment.username);
      }
    });
  };
  
  
  const submitComment = async (postId, content, parentId = null) => {
    try {
      const token = localStorage.getItem('token');
      const userId = getUserIdFromToken(token);
  
      const response = await fetch(`http://localhost:3000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, userId, parentId }),
      });
  
      if (response.ok) {
        
        location.reload();
        const comment = await response.json();
        const commentsContainer = document.getElementById('comments-container');
        renderComments([comment], commentsContainer);
        
      } else {
        console.error('Error submitting comment:', response.statusText);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };