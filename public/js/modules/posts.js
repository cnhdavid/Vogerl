// js/modules/post.js

import { fetchComments } from './comment.js';
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

export function populateMenu(){
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
