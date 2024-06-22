// js/modules/post.js

// Import necessary functions from other modules
import { fetchComments, downvotePost, upvotePost, getPostVotes, hasUserVoted } from './postManager.js';
import { openPost } from './modal.js';
import { getCommentCount, deletePost } from './post.js';
import sidebarSubjects from './subjects.js';
import { getUserId, getRoleFromToken, getUserIdFromToken } from './auth.js';

/**
 * Fetch posts from the API with optional filters for subject and username.
 * @param {string|null} subject - The subject to filter posts by.
 * @param {string|null} username - The username to filter posts by.
 * @returns {Promise<Array>} - A promise that resolves to an array of posts.
 */
async function fetchPosts(subject = null, username = null) {
    let url = 'http://localhost:3000/api/posts';

    if (subject) {
        url += `?subject=${encodeURIComponent(subject)}`;
    }

    if (username) {
        url += subject ? `&username=${encodeURIComponent(username)}` : `?username=${encodeURIComponent(username)}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.error('Error fetching posts:', response.status);
            return [];
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

/**
 * Populate the post menu with options from the sidebarSubjects array.
 */
export function populateMenu() {
    const selectElement = document.getElementById('postMenu');

    sidebarSubjects.forEach(subject => {
        const option = document.createElement('option');
        option.textContent = subject.title;
        option.value = subject.title;
        selectElement.appendChild(option);
    });
}

/**
 * Populate the sidebar with subjects from the sidebarSubjects array.
 * @param {string|null} username - The username to filter posts by (optional).
 */
export function populateSidebar(username = null) {
    const sidebarMenu = document.getElementById('sidebarMenu');
    sidebarMenu.innerHTML = '';

    sidebarSubjects.forEach(subject => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.textContent = subject.title;
        
        link.addEventListener('click', () => {
            fetchAndDisplayPosts(subject.title, username);
        });
        listItem.appendChild(link);
        sidebarMenu.appendChild(listItem);
    });
}

/**
 * Fetch posts by a specific username.
 * @param {string} username - The username to filter posts by.
 * @returns {Promise<Array>} - A promise that resolves to an array of posts.
 */
export async function fetchPostsByUsername(username) {
    try {
        const response = await fetch(`http://localhost:3000/api/users/${username}/posts`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.error('Error fetching posts:', response.status);
            return [];
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

/**
 * Populate the sidebar with posts fetched from the given promise.
 * @param {Promise<Array>} postsPromise - A promise that resolves to an array of posts.
 */
export async function populatePostsSidebar(postsPromise) {
    const posts = await postsPromise;
    const sidebarMenu = document.getElementById('sidebarPostsMenu');
    sidebarMenu.innerHTML = '';

    if (Array.isArray(posts)) {
        posts.forEach(post => {
            const listItem = document.createElement('li');
            const postElement = document.createElement('div');
            postElement.classList.add('box', 'is-clickable', 'my-3');
            postElement.innerHTML = `
        <article class="media is-clickable">
          <div class="media-content">
            <div class="content">
              <p>
                <strong>${post.title}</strong> 
                <br>
                <content class="is-pulled-right my-3"><em>${post.subject}</em></content>
                ${post.content}
              </p>
            </div>
          </div>
        </article>
      `;

            listItem.addEventListener('click', () => {
                openPost(post.id);
            });

            listItem.appendChild(postElement);
            sidebarMenu.appendChild(listItem);
        });
    } else {
        console.error('Expected posts to be an array but received:', posts);
    }
}

/**
 * Get posts by a specific username and return them.
 * @param {string} username - The username to filter posts by.
 * @returns {Promise<Array>} - A promise that resolves to an array of posts.
 */
export async function getPostsByUsername(username) {
    const posts = await fetchPostsByUsername(username);
    return posts;
}

/**
 * Fetch and display posts with optional filters for subject, username, and search term.
 * @param {string|null} subject - The subject to filter posts by (optional).
 * @param {string|null} username - The username to filter posts by (optional).
 * @param {string|null} searchTerm - The search term to filter posts by (optional).
 */
export async function fetchAndDisplayPosts(subject = null, username = null, searchTerm = null) {
    try {
        let posts;
        if (searchTerm) {
            posts = await searchPosts(searchTerm);
        } else {
            posts = await fetchPosts(subject, username);
        }
        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = '';

        const commentsPromises = posts.map(post => fetchComments(post.id));
        const allComments = await Promise.all(commentsPromises);

        await Promise.all(posts.map(async(post, index) => {
            const postElement = await createPostElement(post, allComments[index]);
            postsContainer.appendChild(postElement);
            await getCommentCount(post.id);
            
        }));
    } catch (error) {
        console.error('Error displaying posts:', error);
    }
}

/**
 * Search posts by a given search term.
 * @param {string} searchTerm - The search term to filter posts by.
 * @returns {Promise<Array>} - A promise that resolves to an array of filtered posts.
 */
export async function searchPosts(searchTerm) {
    const posts = await fetchPosts();
    const filteredPosts = posts.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
        const contentMatch = post.content.toLowerCase().includes(searchTerm.toLowerCase());
        const subjectMatch = post.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const usernameMatch = post.username.toLowerCase().includes(searchTerm.toLowerCase());

        return titleMatch || contentMatch || subjectMatch || usernameMatch;
    });
    return filteredPosts;
}
// Filter posts by subject


/**
 * Create a post element with comments and append it to the DOM.
 * @param {Object} post - The post object.
 * @param {Array} comments - The array of comments for the post.
 * @returns {Promise<HTMLElement>} - A promise that resolves to the created post element.
 */
export async function createPostElement(post, comments) {
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
                  <div class="post-content">
                      <p>
                          <strong>${post.title}</strong> <small>@${post.username}</small>
                          ${post.isAnswered ? '<span class="tag is-success is-pulled-right">Answered</span>' : ''}
                          <br>
                          <em>${post.subject}</em>
                          <br>
                          ${post.content}
                      </p>
                      <i class="fa-solid fa-arrow-up is-fluid" id="upvote-${post.id}"></i>
                      <span id="upvote-count-${post.id}" class="upvote-count mx-3"> Loading...</span>
                      <i class="fa-solid fa-arrow-down is-fluid" id="downvote-${post.id}"></i>
                      <span id="commentIcon-${post.id}"><i class="fa-solid fa-comment"></i></span>
                      <span id="comment-count-${post.id}"> Loading...</span>
                      ${localStorage.getItem('token') && getRoleFromToken(localStorage.getItem('token')) === 'admin' ? `<button class="button is-danger is-small is-pulled-right" id="deletePost-${post.id}">Delete Post</button>` : ''}
                  </div>
              </div>
          </div>
          ${imageData ? `<img src="${imageData}" alt="Post Image" class="post-image" />` : ''}
      </article>
  `;

  try {
      const upvotes = await getPostVotes(post.id);
      const upvoteCountElement = postElement.querySelector('.upvote-count');
      upvoteCountElement.textContent = upvotes;


      

  } catch (error) {
      console.error('Error fetching votes or comments:', error);
  }
  if (localStorage.getItem('token') && getRoleFromToken(localStorage.getItem('token')) === 'admin') {
      const deleteButton = postElement.querySelector(`#deletePost-${post.id}`);
      deleteButton.addEventListener('click', (event) => {
          event.stopPropagation();
          deletePost(post.id);
      });
  }

  const upvoteButton = postElement.querySelector('.fa-arrow-up');
  const downvoteButton = postElement.querySelector('.fa-arrow-down');
  upvoteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      upvotePost(post.id);
  });

  downvoteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      downvotePost(post.id);
  });

  async function colorVoteButtons() {
    if (localStorage.getItem('token')) {
        try {
            const userId = await getUserId(post.username);
            const liked = await hasUserVoted(post.id, userId);
            console.log(liked);

            const upvoteElement = document.getElementById(`upvote-${post.id}`);
            const downvoteElement = document.getElementById(`downvote-${post.id}`);

            if (liked === 'upvote' && upvoteElement) {
                upvoteElement.style.color = 'blue';
                downvoteButton.style.color = 'none';
            }

            if (liked === 'downvote' && downvoteElement) {
                downvoteElement.style.color = 'red';
                upvoteButton.style.color = 'none';
            }
        } catch (error) {
            console.error('Error fetching user ID or vote status:', error);
        }
    }
}

// Call this function after posts are rendered
setTimeout(colorVoteButtons, 200); // Adjust the delay as needed

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