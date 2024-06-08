// js/modules/post.js

import { fetchComments } from './postManager.js';
import { openPost } from './modal.js';
import sidebarSubjects from './subjects.js';

async function fetchPosts(subject = null) {
  const url = subject
    ? `http://localhost:3000/api/posts?subject=${encodeURIComponent(subject)}`
    : 'http://localhost:3000/api/posts';

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
export function populateSidebar() {
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
      fetchAndDisplayPosts(subject.title);
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


export async function fetchAndDisplayPosts(subject = null) {
  try {
    const posts = await fetchPosts(subject);
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


export function createPostElement(post, comments) {
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
          <i class="fa-solid fa-arrow-up"></i>
          <i class="fa-solid fa-arrow-down"></i>
        </div>
      </div>
    </article>
  `;

  const upvoteButton = postElement.querySelector('.fa-arrow-up');
  const downvoteButton = postElement.querySelector('.fa-arrow-down');
  upvoteButton.addEventListener('click', () => upvotePost(post.id));
  downvoteButton.addEventListener('click', () => downvotePost(post.id));

  // Add upvotes if available
  if (post.upvotes) {
    const upvoteCount = document.createElement('span');
    upvoteCount.classList.add('upvote-count');
    upvoteCount.textContent = post.upvotes;
    postElement.appendChild(upvoteCount);
  }
  // Add comments if available

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
