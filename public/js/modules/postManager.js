// js/modules/comment.js

// Import necessary functions from other modules
import { getUserIdFromToken } from './auth.js';
import { fetchAndDisplayPosts } from './posts.js';

/**
 * Fetch comments for a specific post.
 * @param {string} postId - The ID of the post to fetch comments for.
 * @returns {Promise<Array>} - A promise that resolves to an array of comments.
 */
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

/**
 * Organize comments by parent-child relationships.
 * @param {Array} comments - The array of comments to organize.
 * @returns {Array} - An array of organized comments.
 */
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

/**
 * Load and display comments for a specific post.
 * @param {string} postId - The ID of the post to load comments for.
 */
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

/**
 * Submit a comment or reply to a comment on a post.
 * @param {string} postId - The ID of the post.
 * @param {string} content - The content of the comment.
 * @param {string|null} parentId - The ID of the parent comment if replying to a comment.
 */
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
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to submit comment: ${response.statusText}`);
            }
            if (response.status === 403) {
                alert('Please login first');
                window.location.href = '/login.html';
            }
            return response.json();
        })
        .then(comment => {
            if (!parentId) {
                document.getElementById('commentInput').value = '';
            }
            loadComments(postId);
            fetchAndDisplayPosts();
        })
        .catch(error => {
            console.error('Error submitting comment:', error.message);
            // Handle the error, display an error message, etc.
        });
}

/**
 * Reset the vote animation state of a button.
 * @param {HTMLElement} button - The button element to reset.
 */
function resetVoteAnimation(button) {
    button.classList.remove('upvoted', 'downvoted');
    button.classList.add('normal');
}

/**
 * Upvote a post.
 * @param {string} postId - The ID of the post to upvote.
 */
export function upvotePost(postId) {
    const authToken = localStorage.getItem('token');

    fetch(`http://localhost:3000/api/posts/${postId}/upvote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            const upvoteButton = document.querySelector(`#upvote-${postId}`);
            applyVoteAnimation(upvoteButton, 'upvote');

            // Reset the downvote button state
            const downvoteButton = document.querySelector(`#downvote-${postId}`);
            resetVoteAnimation(downvoteButton);

            try {
                getPostVotes(postId)
                    .then(upvotes => {
                        const upvoteCount = document.getElementById(`upvote-count-${postId}`);
                        upvoteCount.textContent = upvotes;
                    });
            } catch (error) {
                console.error('Error fetching votes:', error);
            }
        })
        .catch(error => {
            console.error('Error upvoting post:', error);
        });
}

/**
 * Downvote a post.
 * @param {string} postId - The ID of the post to downvote.
 */
export function downvotePost(postId) {
    const authToken = localStorage.getItem('token');

    fetch(`http://localhost:3000/api/posts/${postId}/downvote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            const downvoteButton = document.querySelector(`#downvote-${postId}`);
            applyVoteAnimation(downvoteButton, 'downvote');

            // Reset the upvote button state
            const upvoteButton = document.querySelector(`#upvote-${postId}`);
            resetVoteAnimation(upvoteButton);

            try {
                getPostVotes(postId)
                    .then(upvotes => {
                        const upvoteCount = document.getElementById(`upvote-count-${postId}`);
                        upvoteCount.textContent = upvotes;
                    });
            } catch (error) {
                console.error('Error fetching votes:', error);
            }
        })
        .catch(error => {
            console.error('Error downvoting post:', error);
        });
}

/**
 * Get the total votes for a post.
 * @param {string} postId - The ID of the post.
 * @returns {Promise<number>} - A promise that resolves to the total votes count.
 */
export async function getPostVotes(postId) {
    try {
        const response = await fetch(`http://localhost:3000/api/posts/${postId}/votes`);
        if (response.status === 403 || response.status === 401) {
            window.location.href = '/public/login.html';
            alert('Please login first!');
            return;
        }
        if (!response.ok) {
            console.log('Error fetching upvotes:', response.statusText);
            throw new Error('Failed to fetch upvotes');
        }
        const data = await response.json();
        return data.totalVotes;
    } catch (error) {
        console.error('Error fetching upvotes:', error);
        return 0;
    }
}

/**
 * Check if a user has voted on a post.
 * @param {string} postId - The ID of the post.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating if the user has voted.
 */
export async function hasUserVoted(postId, userId) {
    const authToken = localStorage.getItem('token');

    getUserIdFromToken(authToken);
    try {
        const response = await fetch(`http://localhost:3000/api/posts/${postId}/hasUserLiked/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Please login first');
                window.location.href = '/public/login.html';
            }
            console.log('Error fetching upvotes:', response.statusText);
            throw new Error('Failed to fetch upvotes');
        }

        const data = await response.json();

        return data.hasUserLiked;
    } catch (error) {
        console.error('Error fetching upvotes:', error);
        return false;
    }
}

/**
 * Apply vote animation to a button.
 * @param {HTMLElement} button - The button element to apply animation to.
 * @param {string} type - The type of vote ('upvote' or 'downvote').
 */
export function applyVoteAnimation(button, type) {
    button.classList.remove('upvoted', 'downvoted', 'normal');

    if (type === 'upvote') {
        button.classList.add('upvoted');
    } else if (type === 'downvote') {
        button.classList.add('downvoted');
    }
}