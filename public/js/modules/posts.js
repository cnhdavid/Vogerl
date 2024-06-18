// js/modules/post.js

import { fetchComments, downvotePost, upvotePost, getPostVotes, hasUserVoted } from './postManager.js';
import { openPost } from './modal.js';
import { getCommentCount } from './post.js';
import sidebarSubjects from './subjects.js';
import { getUserId } from './auth.js';


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




export function populateMenu() {
  const selectElement = document.getElementById('postMenu');

  // Loop through the sidebarSubjects array and create options
  sidebarSubjects.forEach(subject => {
    const option = document.createElement('option');
    option.textContent = subject.title;
    option.value = subject.title;
    selectElement.appendChild(option);
  });
}
export function populateSidebar(username = null) {
  const sidebarMenu = document.getElementById('sidebarMenu');

  // Clear existing sidebar menu items
  sidebarMenu.innerHTML = '';

  // Loop through the sidebarSubjects array and create options
  sidebarSubjects.forEach(subject => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.textContent = subject.title;
    link.href = '#'; // Prevent default link behavior
    link.addEventListener('click', () => {
      fetchAndDisplayPosts(subject.title, username); // Pass the username parameter
    });
    listItem.appendChild(link);
    sidebarMenu.appendChild(listItem);
  });
}

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

// Function to fetch posts and display in the sidebar
export async function populatePostsSidebar(postsPromise) {
  const posts = await postsPromise;
  const sidebarMenu = document.getElementById('sidebarPostsMenu');

  // Clear existing sidebar menu items
  sidebarMenu.innerHTML = '';

  // Ensure posts is an array before looping through it
  if (Array.isArray(posts)) {
    // Loop through the posts array and create options
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
      })



      listItem.appendChild(postElement);
      sidebarMenu.appendChild(listItem);
    });
  } else {
    console.error('Expected posts to be an array but received:', posts);
  }
}

// Function to get posts by username
export async function getPostsByUsername(username) {
  const posts = await fetchPostsByUsername(username);
  return posts;
}


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

    await Promise.all(posts.map(async (post, index) => {
      const postElement = await createPostElement(post, allComments[index]);
      postsContainer.appendChild(postElement);
    }));
  } catch (error) {
    console.error('Error displaying posts:', error);
  }
}
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
          <br>
          <em>${post.subject}</em>
          <br>
          ${post.content}
        </p>
        <i class="fa-solid fa-arrow-up is-fluid" id="upvote-${post.id}"></i>
        <span id="upvote-count-${post.id}" class="upvote-count mx-3"> Loading...</span>
        <i class="fa-solid fa-arrow-down is-fluid" id="downvote-${post.id}" ></i> 
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
    console.error('Error fetching votes:', error);
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
  getUserId(post.username)
  .then(userId => {
    
    hasUserVoted(post.id, userId)
    .then(liked => {
      if (liked==='upvote') {
        document.getElementById(`upvote-${post.id}`).classList.add('upvoted');
      }

      if (liked==='downvote') {
        document.getElementById(`downvote-${post.id}`).classList.add('downvoted');
      } 
    });
  })
  .catch(error => {
    console.error('Error fetching user ID:', error);
  });

  // Add upvotes if available

  // Add comments if available

  

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

