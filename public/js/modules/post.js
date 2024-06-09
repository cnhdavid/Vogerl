import { getUserIdFromToken, checkToken, logout,getUserId } from './auth.js';
import { editPost  } from './modal.js';
import { getPostVotes, hasUserVoted, upvotePost, downvotePost } from './postManager.js';

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
    const createdAt = post.created_at;
    const date = new Date(createdAt);


    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    

    const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`;
    


    postContainer.innerHTML = `
  ${token && post.username === getUserIdFromToken(token) ? `<i id="editPostButton" class="fa-solid fa-pen-to-square is-pulled-right"></i>` : ''}
  <h1 class="title">${post.title}</h1>
  <div class="columns">
  <p class="subtitle column">posted by <strong>${post.username}</strong></p>
  <p class="subtitle" column>posted on <strong>${formattedDate}</strong></p>
  </div>
  <p class="subtitle">Subject: ${post.subject}</p>
  
  <div class="content">
    <p>${post.content}</p>
    ${post.image ? `<img src="data:image/jpeg;base64,${post.image}" alt="Post Image" class="post-image" />` : ''}
  </div>
  ${token ? `<i id="upvote-${post.id}" class="fa-solid fa-arrow-up mx-2"></i>` : ''}
  <span class="upvote-count"> Loading...</span>
  ${token ?  `<i id="downvote-${post.id}" class="fa-solid fa-arrow-down ml-2 "></i>` : ''}
  <h3 class="title is-5 my-3">Comments</h3>
  <div id="comments-container"></div>
  
  ${token ? `
    <textarea id="commentInput" class="textarea" placeholder="Add a comment"></textarea>
    <button id="submitComment" class="button is-primary"><i  class="fa-solid fa-check"></i>Submit</button>
  ` : `
    <p>Please log in to add a comment.</p>
    <button id="loginButton" class="button is-primary">Log In</button>
  `}
  ${token && post.username === getUserIdFromToken(token) ? `<button id="deletePostButton" class="button is-danger">Delete Post</button>` : ''}
`;
try {
  getPostVotes(post.id)
  .then(upvotes => {
    const upvoteCountElement = postContainer.querySelector('.upvote-count');
  upvoteCountElement.textContent = upvotes;
  });  
} catch (error) {
  console.error('Error fetching votes:', error);
}
getUserId(post.username)
  .then(userId => {
    console.log('User ID:', userId);
    hasUserVoted(post.id, userId)
    .then(liked => {
      if (liked==='upvote') {
        document.getElementById(`upvote-${post.id}`).classList.add('upvoted');
      }

      if (liked==='downvote') {
        document.getElementById(`downvote-${post.id}`).style.color = 'red';
      } 
    });
  })
const upvoteButton = postContainer.querySelector('.fa-arrow-up');
  const downvoteButton = postContainer.querySelector('.fa-arrow-down');
  upvoteButton.addEventListener('click', (event) => {
    event.stopPropagation();
    upvotePost(post.id);
  });

  downvoteButton.addEventListener('click', (event) => {
    event.stopPropagation();
    downvotePost(post.id);
  });
    if (!token) {
      const loginButton = document.getElementById('loginButton');
      sessionStorage.setItem('redirectToPost', window.location.href);
      loginButton.addEventListener('click', () => {
        window.location.href = './login.html';
      });
    }
    if (token && post.username == getUserIdFromToken(token)) {
      const editPostButton = document.getElementById('editPostButton');
      editPostButton.addEventListener('click', () => {
        const editPostModal = document.getElementById('editPostModal');
        document.getElementById('editPostTitle').value = post.title;
        document.getElementById('editPostContent').value = post.content;
        editPostModal.style.display = 'block';
        document.getElementById('confirmEditButton').addEventListener('click', () => {
          const editPostTitle = document.getElementById('editPostTitle').value;
          const editPostContent = document.getElementById('editPostContent').value;
          editPost(postId, editPostTitle, editPostContent);
        });
      });
      document.getElementById('cancelEditButton').addEventListener('click', () => {
        const editPostModal = document.getElementById('editPostModal');
        editPostModal.style.display = 'none';
      });
    
      document.querySelector('.modal-close').addEventListener('click', () => {
        const editPostModal = document.getElementById('editPostModal');
        editPostModal.style.display = 'none';
      });
    }


    if (token) {
      sessionStorage.removeItem('redirectToPost');
      document.getElementById('editPostButton').addEventListener('click', () => {

      })
      document.getElementById('submitComment').addEventListener('click', () => {
        const commentContent = document.getElementById('commentInput').value;
        submitComment(postId, commentContent);

      });
      document.getElementById('deletePostButton').addEventListener('click', () => {
        deletePost(postId);
      });

    }


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

async function deletePost(postId) {
  try {
    const token = localStorage.getItem('token');
    const userId = getUserIdFromToken(token);

    // Show modal
    toggleModal();

    // Wait for user confirmation
    document.getElementById('confirmDelete').addEventListener('click', async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/post/${postId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // Delete the post from the UI
          // For example, remove the post element from the DOM
          const postElement = document.getElementById(`post-${postId}`);
          if (postElement) {
            postElement.remove();
          }
          alert('Post deleted successfully');
          window.location.href = 'dashboard.html';
        } else {
          console.error('Error deleting post:', response.status);
        }
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    });



  } catch (error) {
    console.error('Error deleting post:', error);
  }
}
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

