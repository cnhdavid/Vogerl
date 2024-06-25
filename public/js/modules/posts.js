// js/modules/post.js

// Import necessary functions from other modules
import { fetchComments, downvotePost, upvotePost, getPostVotes, hasUserVoted, applyVoteAnimation, fetchCommentCountsForPosts } from './postManager.js';
import { openPost } from './modal.js';
import { getCommentCount, deletePost } from './post.js';
import sidebarSubjects from './subjects.js';
import { getUserId, getRoleFromToken, getUserIdFromToken } from './auth.js';
import { fetchVotesForPosts, fetchUserVotesForPosts } from './voteManager.js';

/**
 * Fetch posts from the API with optional filters for subject and username.
 * @param {string|null} subject - The subject to filter posts by.
 * @param {string|null} username - The username to filter posts by.
 * @returns {Promise<Array>} - A promise that resolves to an array of posts.
 */
async function fetchPosts(subject = null, username = null) {
  let url = 'http://localhost:3000/post/posts';

  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (!subject) params.append('subject', 'All');
  if (username) params.append('username', username);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  console.log(url);
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
    listItem.classList.add('hvr-grow', 'fade-in-slide-up');
    const link = document.createElement('a');
    link.textContent = subject.title;

    link.addEventListener('click', () => {
      fetchAndDisplayPosts(subject.title, username);
      console.log(subject.title);
    });
    listItem.appendChild(link);
    sidebarMenu.appendChild(listItem);
  });
}
export function populateFilterDropdown() {
  const filterDropdownButton = document.getElementById('filterDropdownButton');
  filterDropdownButton.addEventListener('click', () => {
    const filterDropdown = document.getElementById('filterDropdownMenu');
    filterDropdown.classList.toggle('is-active');
  })
  const selectElement = document.getElementById('filterDropdown');
  sidebarSubjects.forEach(subject => {
    const div = document.createElement('div');
    div.classList.add('dropdown-item', 'hvr-grow');
    div.textContent = subject.title;
    div.value = subject.title;
    div.addEventListener('click', () => {
      fetchAndDisplayPosts(subject.title);
      filterDropdownButton.textContent = "Showing posts in " + subject.title;
      const filterDropdown = document.getElementById('filterDropdownMenu');
      filterDropdown.classList.toggle('is-active');
    })
    selectElement.appendChild(div);
  });
}

/**
 * Fetch posts by a specific username.
 * @param {string} username - The username to filter posts by.
 * @returns {Promise<Array>} - A promise that resolves to an array of posts.
 */
export async function fetchPostsByUsername(username) {
  try {
    const response = await fetch(`http://localhost:3000/user/${username}/posts`, {
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
      listItem.classList.add('my-3', 'hvr-grow');
      const postElement = document.createElement('div');
      postElement.classList.add('box', 'is-clickable', 'my-3', 'fade-in-slide-up');
      const truncatedTitle = truncateText(post.title, 50); // Limit title to 50 characters
  const truncatedContent = truncateText(post.content, 50); // Limit content to 200 characters
      postElement.innerHTML = `
        <article class="media is-clickable">
          <div class="media-content">
            <div class="content">
              ${post.isanswered ? '<span class="tag is-success is-pulled-right">Answered</span>' : ''}
              <br>
              <p>
                <strong>${truncatedTitle}</strong> 
                <br>
                ${truncatedContent}
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
      const loadingSpinner = document.getElementById('loadingSpinner');
      const postsContainer = document.getElementById('postsContainer');

      // Show the loading spinner
      loadingSpinner.style.display = 'block';
      postsContainer.innerHTML = '';

      let posts;
      if (searchTerm) {
          posts = await searchPosts(searchTerm);
      } else {
          console.log(subject, username);
          posts = await fetchPosts(subject, username);
      }

      if (posts.length === 0) {
          postsContainer.innerHTML = 'No posts found.';
          loadingSpinner.style.display = 'none';
          return;
      }

      const postIds = posts.map(post => post.id);

      // Fetch votes, comment counts, and user votes concurrently
      const [votes, commentCounts, userVotes] = await Promise.all([
          fetchVotesForPosts(postIds),
          fetchCommentCountsForPosts(postIds),
          fetchUserVotesForPosts(postIds)
      ]);

      await Promise.all(posts.map(async (post) => {
          const postElement = await createPostElement(post, votes, commentCounts, userVotes);
          postsContainer.appendChild(postElement);
      }));

      // Hide the loading spinner after all posts are added to the DOM
      loadingSpinner.style.display = 'none';
  } catch (error) {
      console.error('Error displaying posts:', error);
      // Hide the loading spinner in case of an error as well
      loadingSpinner.style.display = 'none';
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

function truncateText(text, maxLength) {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
}
export async function createPostElement(post, voteData, commentCounts, userVotes) {
  const postElement = document.createElement('div');
  postElement.classList.add('box', 'is-clickable', 'my-3');

  let imageData = '';
  if (post.image) {
      imageData = `data:image/jpeg;base64,${post.image}`;
  }
  const date = new Date(post.created_at);
  const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  const truncatedTitle = truncateText(post.title, 50); // Limit title to 50 characters
  const truncatedContent = truncateText(post.content, 150); // Limit content to 200 characters

  postElement.innerHTML = `
      <article class="media ">
          <div class="media-content">
              <div class="content">
                  <div class="post-content ">
                      <p>
                          <strong>${truncatedTitle}</strong> <small>@${post.username}</small>
                          ${post.isanswered ? '<span class="tag is-success is-pulled-right">Answered</span>' : ''}
                          <br>
                          <em>${post.subject}</em>
                          <br>
                          ${truncatedContent}
                          ${post.image ? `<figure class="image is-128x128 hvr-grow is-pulled-right is-pulled-right-mobile"><img src="${imageData}" alt="Post Image"  /> </figure>` : ''}
                          <small>${formattedDate}</small>
                      </p>
                      <div>
                      <i class="fa-solid fa-arrow-up is-fluid hvr-float" id="upvote-${post.id}"></i>
                      <span id="upvote-count-${post.id}" class="upvote-count mx-3">${voteData[post.id] || 0}</span>
                      <i class="fa-solid fa-arrow-down is-fluid hvr-sink" id="downvote-${post.id}"></i>
                      <span id="commentIcon-${post.id}"><i class="fa-solid fa-comment mx-3"></i></span>
                      <span id="comment-count-${post.id}">${commentCounts[post.id] || 0}</span>
                      </div>
                      
                      ${localStorage.getItem('token') && getRoleFromToken(localStorage.getItem('token')) === 'admin' ? `<button class="button is-danger is-small is-pulled-right" id="deletePost-${post.id}">Delete Post</button>` : ''}
                  </div>
                   
              </div>
          </div>
         
      </article>
  `;
  postElement.classList.add('fade-in-slide-up');

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

  // Apply vote colors based on user votes
  if (userVotes[post.id] === 1) {
      upvoteButton.classList.add('upvoted'); // Add a class to indicate upvoted
  } else if (userVotes[post.id] === -1) {
      downvoteButton.classList.add('downvoted'); // Add a class to indicate downvoted
  }

  if (imageData) {
      const imageElement = postElement.querySelector('.image');
      imageElement.addEventListener('click', () => {
          const newTab = window.open();
          newTab.document.body.innerHTML = `<img src="${imageData}" alt="Post Image" style="max-width: 100%; height: auto;" />`;
      });
  }

  postElement.addEventListener('click', () => openPost(post.id));

  return postElement;
}