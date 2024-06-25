// Import necessary functions from other modules
import {
  getUserIdFromToken,
  checkToken,
  logout,
  getUserId,
  getRoleFromToken,
} from "./auth.js";
import { editPost } from "./modal.js";
import {
  getPostVotes,
  hasUserVoted,
  upvotePost,
  downvotePost,
  markCommentAsAnswer,
  deleteComment,
} from "./postManager.js";
import { fetchAndDisplayPosts } from "./posts.js";

// Retrieve the postId from the URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("postId");

/**
 * Fetch and display the post based on postId.
 * @param {string} postId - The ID of the post to be displayed.
 */
function displayPost(postId) {
  const loadingSpinner = document.getElementById("loadingSpinner");
  const postContainer = document.getElementById("post-container");
  loadingSpinner.style.display = "block";
  postContainer.innerHTML = "";
  fetch(`http://localhost:3000/post/${postId}`)
    .then((response) => response.json())
    .then((post) => {
      // Get the container where the post will be displayed
      const postContainer = document.getElementById("post-container");
      const token = localStorage.getItem("token");
      const createdAt = post.created_at;
      const date = new Date(createdAt);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`;

      // Generate HTML content for the post
      postContainer.innerHTML = `
        ${
          token && post.username === getUserIdFromToken(token)
            ? `<i id="editPostButton" class="fa-solid fa-pen-to-square is-pulled-right"></i>`
            : ""
        }
        <figure class="image is-128x128 is-pulled-left mb-6"><img id="profilePic" class="" src="https://bulma.io/assets/images/placeholders/256x256.png" alt="Author's Profile Image" class="profile-image" /></figure>
        <div class="is-flex is-justify-content-flex-start mb-3 is-align-items-flex-start is-flex-direction-column ">
          <h1 class="title">${post.title}</h1>
          ${
            post.isanswered
              ? '<span class="tag is-success">Answered</span>'
              : ""
          }
        </div>
        <div class="columns">
          <p class="subtitle column">posted by <strong>${
            post.username
          }</strong></p>
          <p class="subtitle is-pull-right">posted on ${formattedDate}</p>
        </div>
        <p class="subtitle">Subject: ${post.subject}</p>
        ${
          post.image
            ? `<figure class="image is-pulled-right mb-6"><img src="data:image/jpeg;base64,${post.image}" alt="Post Image" class="post-image " /></figure>`
            : ""
        }
        <div class="content">
          <p><strong>${post.content}</strong></p>
        </div>
        ${
          token
            ? `<i id="upvote-${post.id}" class="fa-solid fa-arrow-up mx-2"></i>`
            : ""
        }
        <span id="upvote-count-${
          post.id
        }" class="upvote-count"> Loading...</span>
        ${
          token
            ? `<i id="downvote-${post.id}" class="fa-solid fa-arrow-down ml-2"></i>`
            : ""
        }
        <span id="commentIcon-${
          post.id
        }"><i class="fa-solid fa-comment mx-3"></i></span>
        <span id="comment-count-${post.id}"> Loading...</span>
        <div class="comments-container" id="comments-container"></div>
        ${
          token
            ? ` 
          <textarea id="commentInput" class="textarea my-4" placeholder="Add a comment"></textarea>
          <button id="submitComment" class="button is-primary my-2"><i class="fa-solid fa-check mx-2"></i>Submit</button>
        `
            : `
          <p>Please log in to add a comment.</p>
          <button id="loginButton" class="button is-primary">Log In</button>
        `
        }
        ${
          token && post.username === getUserIdFromToken(token)
            ? `<button id="deletePostButton" class="button is-danger my-2 is-pulled-right">Delete Post</button>`
            : ""
        }
      `;
      postContainer.classList.add("fade-in-slide-up");
      displayProfilePicture(post.username);

      // Fetch and display upvote count
      try {
        getPostVotes(post.id).then((upvotes) => {
          const upvoteCountElement =
            postContainer.querySelector(".upvote-count");
          upvoteCountElement.textContent = upvotes;
        });
      } catch (error) {
        console.error("Error fetching votes:", error);
      }

      // Check if the user has voted on the post
      getUserId(post.username).then((userId) => {
        hasUserVoted(post.id, userId).then((liked) => {
          if (liked === "upvote") {
            document
              .getElementById(`upvote-${post.id}`)
              .classList.add("upvoted");
          }

          if (liked === "downvote") {
            document.getElementById(`downvote-${post.id}`).style.color = "red";
          }
        });
      });

      // Add event listeners for upvote and downvote buttons
      const upvoteButton = postContainer.querySelector(".fa-arrow-up");
      const downvoteButton = postContainer.querySelector(".fa-arrow-down");

      upvoteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        upvotePost(post.id);
      });

      downvoteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        downvotePost(post.id);
      });

      // Display comment count
      getCommentCount(postId);

      // If the user is not logged in, show the login button
      if (!token) {
        const loginButton = document.getElementById("loginButton");
        sessionStorage.setItem("redirectToPost", window.location.href);
        loginButton.addEventListener("click", () => {
          window.location.href = "./login.html";
        });
      }

      // If the user is the author of the post, allow them to delete or edit the post
      if (token && post.username == getUserIdFromToken(token)) {
        document
          .getElementById("deletePostButton")
          .addEventListener("click", () => {
            deletePost(postId);
          });

        // Event listener for Edit Post button
        const editPostButton = document.getElementById("editPostButton");
        editPostButton.addEventListener("click", () => {
          const editPostModal = document.getElementById("editPostModal");
          document.getElementById("editPostTitle").value = post.title;
          document.getElementById("editPostContent").value = post.content;
          editPostModal.style.display = "block";
        });

        // Event listener for Confirm Edit button inside editPostModal
        const confirmEditButton = document.getElementById("confirmEditButton");
        confirmEditButton.addEventListener("click", async () => {
          const editPostTitle = document.getElementById("editPostTitle").value;
          const editPostContent =
            document.getElementById("editPostContent").value;

          try {
            await editPost(postId, editPostTitle, editPostContent);
            const editPostModal = document.getElementById("editPostModal");
            editPostModal.style.display = "none";
            window.location.reload(); // Reload page to reflect changes
          } catch (error) {
            console.error("Error editing post:", error);
          }
        });

        document
          .getElementById("cancelEditButton")
          .addEventListener("click", () => {
            const editPostModal = document.getElementById("editPostModal");
            editPostModal.style.display = "none";
          });

        document.querySelector(".modal-close").addEventListener("click", () => {
          const editPostModal = document.getElementById("editPostModal");
          editPostModal.style.display = "none";
        });
      }

      // If the user is logged in, enable comment submission
      if (token) {
        sessionStorage.removeItem("redirectToPost");
        document
          .getElementById("submitComment")
          .addEventListener("click", () => {
            const commentContent =
              document.getElementById("commentInput").value;
            submitComment(postId, commentContent);
            document.getElementById("commentInput").value = "";
          });
      }

      // Display comments for the post
      displayComments(post.id, post.username);
    });
}

// Fetch and display the comments
function displayComments(postId, postUsername) {
  fetch(`http://localhost:3000/comments/${postId}`)
    .then((response) => response.json())
    .then((comments) => {
      // Sort comments: marked as answer first
      comments.sort((a, b) => {
        if (a.isanswer && !b.isanswer) {
          return -1; // a should come before b
        } else if (!a.isanswer && b.isanswer) {
          return 1; // b should come before a
        } else {
          return 0; // maintain existing order
        }
      });

      const commentsContainer = document.getElementById("comments-container");
      commentsContainer.innerHTML = "";
      comments.forEach((comment) => {
        const commentElement = document.createElement("div");
        commentElement.classList.add("box", "p-3", "my-3");
        commentElement.innerHTML = `
            ${
              comment.isanswer
                ? '<div class="is-pulled-right tag is-size-6 is-flex is-flex-direction-row is-success is-align-items-center is-justify-content-flex-space-between my-2"> This Comment was marked as a Valid Answer</div>'
                : ""
            }

            <h4 class="title is-6">${comment.username}</h4>
            <p class="content">${comment.content}</p>
            ${
              localStorage.getItem("token") &&
              (postUsername ===
                getUserIdFromToken(localStorage.getItem("token")) ||
                getRoleFromToken(localStorage.getItem("token")) === "admin" ||
                comment.username ===
                  getUserIdFromToken(localStorage.getItem("token")))
                ? `<button id="deleteCommentButton-${comment.id}" class="button is-danger is-small my-2">Delete Comment</button>`
                : ""
            }            ${
          !comment.isanswer &&
          postUsername === getUserIdFromToken(localStorage.getItem("token"))
            ? `<button id="MarkCommentAsAnswerButton-${comment.id}" class="button is-success is-small my-2">Mark as Answer</button>`
            : ""
        }

            </div>
          `;

        const deleteCommentButton = commentElement.querySelector(
          `#deleteCommentButton-${comment.id}`
        );
        if (deleteCommentButton) {
          deleteCommentButton.addEventListener("click", () => {
            confirmCommentDelete(comment.id);
          });
        }

        const markCommentAsAnswerButton = commentElement.querySelector(
          `#MarkCommentAsAnswerButton-${comment.id}`
        );
        if (markCommentAsAnswerButton) {
          markCommentAsAnswerButton.addEventListener("click", () => {
            markCommentAsAnswer(comment.id, postId);
          });
        }
        commentsContainer.appendChild(commentElement);
      });
      loadingSpinner.style.display = "none";
    })
    .catch((error) => console.error("Error fetching comments:", error));
}

//
function confirmCommentDelete(commentId) {
  var confirmation = confirm("Are you sure you want to delete this comment?");

  if (confirmation) {
    deleteComment(commentId);
  } else {
    return;
  }
}

/**
 * Get the count of comments for the post with the given postId.
 * @param {string} postId - The ID of the post.
 */
export function getCommentCount(postId) {
  return fetch(`http://localhost:3000/comments/${postId}`)
    .then((response) => response.json())
    .then((comments) => {
      const commentCount = comments.length;
      const commentCountElement = document.getElementById(
        `comment-count-${postId}`
      );
      if (commentCountElement) {
        commentCountElement.textContent = commentCount;
      } else {
        console.error(`Element with id comment-count-${postId} not found`);
      }
    })
    .catch((error) => {
      console.error("Error fetching comments:", error);
    });
}


/**
 * Submit a comment or reply to a comment on a post.
 * @param {string} postId - The ID of the post.
 * @param {string} content - The content of the comment.
 * @param {string|null} parentId - The ID of the parent comment if replying to a comment.
 */
const submitComment = async (postId, content, parentId = null) => {
  try {
    const token = localStorage.getItem("token");
    const userId = getUserIdFromToken(token);

    const response = await fetch(
      `http://localhost:3000/comments/${postId}/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, userId, parentId }),
      }
    );

    if (response.status === 403 || response.status === 401) {
      window.location.href = "login.html";

      return;
    }

    if (response.ok) {
      window.location.reload();
    } else {
      console.error("Error submitting comment:", response.statusText);
    }
  } catch (error) {
    console.error("Error submitting comment:", error);
  }
};

/**
 * Delete the post with the given postId.
 * @param {string} postId - The ID of the post to be deleted.
 */
export async function deletePost(postId) {
  try {
    const token = localStorage.getItem("token");
    const userId = getUserIdFromToken(token);
    toggleModal();
    document
      .getElementById("cancelDelete")
      .addEventListener("click", toggleModal);
    document
      .getElementById("modalClose")
      .addEventListener("click", toggleModal);
    document
      .getElementById("confirmDelete")
      .addEventListener("click", async () => {
        try {
          const response = await fetch(
            `http://localhost:3000/post/Deletepost/${postId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const postElement = document.getElementById(`post-${postId}`);
            if (postElement) {
              postElement.remove();
            }
            if (getRoleFromToken(token) === "admin") {
              fetchAndDisplayPosts();
              toggleModal();
            } else {
              alert("Post deleted successfully");
              window.location.href = "dashboard.html";
            }
          } else {
            console.error("Error deleting post:", response.status);
          }
        } catch (error) {
          console.error("Error deleting post:", error);
        }
      });
  } catch (error) {
    console.error("Error deleting post:", error);
  }
}

// Check if the user is logged in and update the navbar accordingly

if (localStorage.getItem("token")) {
  const user = checkToken();
  const navbarEnd = document.getElementById("navbar-end");
  const username = user.username;

  const welcomeMessage = document.createElement("div");
  welcomeMessage.classList.add("navbar-item");
  welcomeMessage.innerHTML = `<span>Welcome, ${username}</span>`;

  const logoutButton = document.createElement("a");
  logoutButton.setAttribute("id", "logout-button");
  logoutButton.classList.add("navbar-item");
  logoutButton.textContent = "Logout";
  logoutButton.addEventListener("click", logout);

  const profileButton = document.createElement("a");
  profileButton.setAttribute("id", "profile-button");
  profileButton.classList.add("navbar-item");
  profileButton.textContent = "Profile";
  profileButton.addEventListener("click", () => {
    window.location.href = "profile.html";
  });

  navbarEnd.innerHTML = "";
  navbarEnd.appendChild(welcomeMessage);
  navbarEnd.appendChild(logoutButton);
  navbarEnd.appendChild(profileButton);
}

/**
 * Toggle the confirmation modal visibility.
 */
function toggleModal() {
  const modal = document.getElementById("confirmationModal");
  modal.classList.toggle("is-active");
}

document.addEventListener("DOMContentLoaded", () => {
  const postContainer = document.getElementById("post-container");
  if (postContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("postId");
    if (postId) {
      displayPost(postId);
    }
  }
});
window.addEventListener("popstate", () => {
  if (getRoleFromToken(localStorage.getItem("token")) === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "dashboard.html";
  }
});

function displayProfilePicture(username) {
  fetch(`http://localhost:3000/user/userInfo/${username}`)
    .then((response) => response.json())
    .then((response) => {
      const profilePicture = document.getElementById("profilePic");
      let imageData;
      if (profilePicture) {
        imageData = `data:image/png;base64,${response.profilepic}`;
        profilePicture.src = imageData;
      }
    })
    .catch((error) => console.error("Error:", error));
}
