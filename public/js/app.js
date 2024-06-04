document.addEventListener('DOMContentLoaded', () => {
  const navbarEnd = document.getElementById('navbar-end');

  const token = localStorage.getItem('token');

  if (token) {
      // Decode token to get the username
      const payload = JSON.parse(atob(token.split('.')[1]));
      const username = payload.username;

      // Create welcome message
      const welcomeMessage = document.createElement('div');
      welcomeMessage.classList.add('navbar-item');
      welcomeMessage.innerHTML = `<span>Welcome, ${username}</span>`;

      // Create logout button
      const logoutButton = document.createElement('button');
      logoutButton.classList.add('button', 'is-danger');
      logoutButton.textContent = 'Logout';
      logoutButton.addEventListener('click', logout);

      // Clear existing content and append welcome message and logout button
      navbarEnd.innerHTML = '';
      navbarEnd.appendChild(welcomeMessage);
      navbarEnd.appendChild(logoutButton);
  }

  // Create a post

  document.getElementById('postForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const subject = document.getElementById('postMenu').value;
    const image = document.getElementById('postImage').files[0]; // Get the first selected file (if any)

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('subject', subject);
    if (image) {
        formData.append('image', image);
    }

    try {
        const token = localStorage.getItem('token'); // Get the token from localStorage

        if (!token) {
            alert('You are not logged in. Please log in first.');
            return;
        }

        const response = await fetch('http://localhost:3000/api/post', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}` // Include the token in the Authorization header
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



// Logout functionality
function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}
async function fetchAndDisplayPosts() {
    try {
        const response = await fetch('http://localhost:3000/api/posts');
        const data = await response.json();

        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = '';

        for (const post of data) {
            const postElement = document.createElement('div');
            postElement.classList.add('box');

            let imageData = '';
            if (post.image) {
                // Check for prefix
                if (post.image.startsWith('data:image/jpeg;base64,')) {
                    // If prefix exists, remove it
                    imageData = post.image.replace('data:image/jpeg;base64,', '');
                } else {
                    // If no prefix, use image data as is
                    imageData = post.image;
                }
            }

            postElement.innerHTML = `
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
                            ${imageData ? `<img src="data:image/jpeg;base64,${imageData}" alt="Post Image" />` : ''}
                        </div>
                    </div>
                </article>
            `;

            const commentsResponse = await fetch(`http://localhost:3000/api/posts/${post.id}/comments`);
            const comments = await commentsResponse.json();

            if (comments.length > 0) {
                const commentsList = document.createElement('ul');
                commentsList.classList.add('comments-list');
                comments.forEach(comment => {
                    const commentItem = document.createElement('li');
                    commentItem.textContent = `${comment.username}: "${comment.content}"`;
                    commentsList.appendChild(commentItem);
                });
                postElement.querySelector('.content').appendChild(commentsList);
            }

            postElement.addEventListener('click', () => openPost(post.id));
            postsContainer.appendChild(postElement);
        }
    } catch (error) {
        console.error('Error fetching and displaying posts:', error);
    }
}
function openPost(postId) {
    // Update the URL with the post ID
    window.history.pushState(null, null, `?post=${postId}`);
    
    // Fetch and display the post details
    fetch(`http://localhost:3000/api/posts/${postId}`)
        .then(response => response.json())
        .then(post => {
            const modalContent = document.querySelector('#postModal .modal-content');
            
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
                        </div>
                    </div>
                </article>
                <div>
                    <h4>Comments</h4>
                    <div id="commentsContainer">
                        <!-- Comments will be loaded here -->
                    </div>
                    <textarea id="commentInput" class="textarea" placeholder="Add a comment"></textarea>
                    <button id="submitComment" class="button is-primary">Submit</button>
                </div>
            `;
            
            document.getElementById('postModal').classList.add('is-active');
            loadComments(postId);
            
            // Add event listener to submit comment button
            document.getElementById('submitComment').addEventListener('click', () => submitComment(postId));
        })
        .catch(error => {
            console.error('Error fetching post:', error);
        });
}

function loadComments(postId) {
    fetch(`http://localhost:3000/api/posts/${postId}/comments`)
        .then(response => response.json())
        .then(comments => {
            const commentsContainer = document.getElementById('commentsContainer');
            commentsContainer.innerHTML = '';

            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.classList.add('comment');
                commentElement.innerHTML = `
                    <p>
                        <strong>${comment.username}</strong>
                        <br>
                        ${comment.content}
                    </p>
                `;
                commentsContainer.appendChild(commentElement);
            });
        })
        .catch(error => {
            console.error('Error fetching comments:', error);
        });
}

function submitComment(postId) {
    const commentInput = document.getElementById('commentInput');
    const commentContent = commentInput.value;

    fetch(`http://localhost:3000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentContent })
    })
        .then(response => response.json())
        .then(comment => {
            // Clear the comment input
            commentInput.value = '';
            // Reload comments
            loadComments(postId);
        })
        .catch(error => {
            console.error('Error submitting comment:', error);
        });
}


// No need to modify fetchImage() function, as we are directly setting src attribute
// with Base64 data in fetchAndDisplayPosts() function.





function submitComment(postId) {
    const commentInput = document.getElementById('commentInput');
    const commentContent = commentInput.value;
    const authToken = localStorage.getItem('token'); // Retrieve the token from localStorage

    fetch(`http://localhost:3000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ content: commentContent })
    })
    .then(response => response.json())
    .then(comment => {
        // Clear the comment input
        commentInput.value = '';
        // Reload comments
        loadComments(postId);
        fetchAndDisplayPosts();
    })
    .catch(error => {
        console.error('Error submitting comment:', error);
    });
}


// Event listener to close the modal
document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('postModal').classList.remove('is-active');
    window.history.pushState(null, null, window.location.pathname);
});

fetchAndDisplayPosts();

});

