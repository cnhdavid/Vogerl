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
async function fetchPosts() {
    try {
        const response = await fetch('http://localhost:3000/api/posts');
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

async function fetchComments(postId) {
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
async function fetchAndDisplayPosts() {
    try {
        const posts = await fetchPosts();
        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = '';

        const commentsPromises = posts.map(post => fetchComments(post.id));
        const allComments = await Promise.all(commentsPromises);

        posts.forEach((post, index) => {
            const postElement = createPostElement(post, allComments[index]);
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error displaying posts:', error);
    }
}
function createPostElement(post, comments) {
    const postElement = document.createElement('div');
    postElement.classList.add('box');

    let imageData = '';
    if (post.image) {
        imageData = `data:image/jpeg;base64,${post.image}`;
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
                    ${imageData ? `<img src="${imageData}" alt="Post Image" class="post-image" />` : ''}
                </div>
            </div>
        </article>
    `;

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

    if (imageData) {
        const imageElement = postElement.querySelector('.post-image');
        imageElement.addEventListener('click', () => {
            const newTab = window.open();
            newTab.document.body.innerHTML = `<img src="${imageData}" alt="Post Image" style="max-width: 100%; height: auto;" />`;
        });
    }

    postElement.addEventListener('click', () => openPost(post.id));

    return postElement;
}

function openPost(postId) {
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
                    ${token && post.username === getUserIdFromToken(token) ? `<button id="deletePostButton" class="button is-danger">Delete Post</button>` : ''}
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

function getUserIdFromToken(token) {
    // Implement this function to extract and return the user ID from the token
    // For example:
     
     const payload = JSON.parse(atob(token.split('.')[1]));
      const username = payload.username;
     return username;
}

function deletePost(postId) {
    // Implement the logic to delete the post
}

async function fetchComments(postId) {
    try {
        const response = await fetch(`http://localhost:3000/api/posts/${postId}/comments`);
        if (!response.ok) {
            throw new Error(`Failed to fetch comments for post ${postId}`);
        }
        const comments = await response.json();
        return organizeComments(comments);
    } catch (error) {
        console.error(`Error fetching comments for post ${postId}:`, error);
        return [];
    }
}
function organizeComments(comments) {
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

function loadComments(postId) {
    fetch(`http://localhost:3000/api/posts/${postId}/comments`)
        .then(response => response.json())
        .then(comments => {
            const commentsContainer = document.getElementById('commentsContainer');
            commentsContainer.innerHTML = '';

            const renderComments = (comments, parentElement, level = 0) => {
                comments.forEach(comment => {
                    const commentElement = document.createElement('div');
                    commentElement.classList.add('comment');
                    commentElement.style.marginLeft = `${level * 20}px`;
                    commentElement.innerHTML = `
                        <p>
                            <strong>${comment.username}</strong>
                            <br>
                            ${comment.content}
                        </p>
                        <button class="button is-small is-light reply-button">Reply</button>
                        <div class="reply-input" style="display: none;">
                            <textarea class="textarea" placeholder="Reply to comment"></textarea>
                            <button class="button is-primary is-small submit-reply">Submit</button>
                        </div>
                    `;

                    const replyButton = commentElement.querySelector('.reply-button');
                    const replyInput = commentElement.querySelector('.reply-input');
                    const submitReplyButton = commentElement.querySelector('.submit-reply');

                    replyButton.addEventListener('click', () => {
                        replyInput.style.display = 'block';
                    });

                    submitReplyButton.addEventListener('click', () => {
                        const replyContent = replyInput.querySelector('textarea').value;
                        submitComment(postId, replyContent, comment.id);
                    });

                    parentElement.appendChild(commentElement);

                    if (comment.replies) {
                        renderComments(comment.replies, parentElement, level + 1);
                    }
                });
            };

            renderComments(organizeComments(comments), commentsContainer);
        })
        .catch(error => {
            console.error('Error fetching comments:', error);
        });
}


function submitComment(postId, content, parentId = null) {
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



// No need to modify fetchImage() function, as we are directly setting src attribute
// with Base64 data in fetchAndDisplayPosts() function.








// Event listener to close the modal
document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('postModal').classList.remove('is-active');
    window.history.pushState(null, null, window.location.pathname);
});

fetchAndDisplayPosts();

});

