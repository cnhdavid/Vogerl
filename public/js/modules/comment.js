// js/modules/comment.js

import { fetchAndDisplayPosts } from './post.js';
export async function fetchComments(postId) {
    try {
      const response = await fetch(`http://localhost:3000/api/posts/${postId}/comments`);
      if (!response.ok) {
        throw new Error(`Failed to fetch comments for post ${postId}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return [];
    }
  }
  
  export function organizeComments(comments) {
    const commentMap = {};
    comments.forEach(comment => {
      comment.replies = [];
      commentMap[comment.id] = comment;
    });
  
    const organizedComments = [];
    comments.forEach(comment => {
      if (comment.parent_id) {
        commentMap[comment.parent_id].replies.push(comment);
      } else {
        organizedComments.push(comment);
      }
    });
  
    return organizedComments;
  }
  
  export async function loadComments(postId) {
    try {
      const comments = await fetchComments(postId);
      const commentsContainer = document.getElementById('commentsContainer');
      commentsContainer.innerHTML = '';
  
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
              <button class="button is-danger is-small submit-close">close</button>
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
            renderComments(comment.replies, parentElement, level + 1, comment.username);
          }
        });
      };
  
      renderComments(organizeComments(comments), commentsContainer);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }
  
  export function submitComment(postId, content, parentId = null) {
    const authToken = localStorage.getItem('token');
  
    fetch(`http://localhost:3000/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ content, parentId })
    })
    .then(response => response.json())
    .then(comment => {
      if (!parentId) {
        document.getElementById('commentInput').value = '';
      }
      loadComments(postId);
      fetchAndDisplayPosts();
    })
    .catch(error => {
      console.error('Error submitting comment:', error);
    });
  }
  