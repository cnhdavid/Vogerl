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

  document.getElementById('postForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const subject = document.getElementById('postMenu').value;
    console.log(subject)

    const postData = {
        title: title,
        content: content,
        subject: subject
    };

    const token = localStorage.getItem('token'); // Get the token from localStorage

    if (!token) {
        alert('You are not logged in. Please log in first.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Include the token in the Authorization header
            },
            body: JSON.stringify(postData)
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
function fetchAndDisplayPosts() {
    fetch('http://localhost:3000/api/posts')
        .then(response => response.json())
        .then(data => {
            const postsContainer = document.getElementById('postsContainer');
            
            // Clear existing posts
            postsContainer.innerHTML = '';

            data.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('box');

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
                            </div>
                        </div>
                    </article>
                `;

                postsContainer.appendChild(postElement);
            });
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
        });
}

fetchAndDisplayPosts();

});

