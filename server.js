// Sample data for posts
let posts = [
    { id: 1, title: "First post", content: "This is the content of the first post.", votes: 10, comments: ["Comment 1", "Comment 2"] },
    { id: 2, title: "Second post", content: "This is the content of the second post.", votes: 5, comments: ["Comment 1", "Comment 2", "Comment 3"] },
    { id: 3, title: "Third post", content: "This is the content of the third post.", votes: 15, comments: ["Comment 1"] }
];

// Function to render posts
function renderPosts() {
    const postsContainer = document.getElementById("posts");
    postsContainer.innerHTML = "";

    posts.forEach(post => {
        const postDiv = document.createElement("div");
        postDiv.classList.add("post");

        const title = document.createElement("h2");
        title.classList.add("post-title");
        title.textContent = post.title;

        const content = document.createElement("p");
        content.textContent = post.content;

        const votes = document.createElement("div");
        votes.classList.add("post-votes");
        votes.textContent = `Votes: ${post.votes}`;

        const comments = document.createElement("div");
        comments.classList.add("post-comments");
        comments.innerHTML = `<strong>Comments:</strong>`;
        post.comments.forEach(comment => {
            const commentDiv = document.createElement("div");
            commentDiv.classList.add("comment");
            commentDiv.textContent = comment;
            comments.appendChild(commentDiv);
        });

        postDiv.appendChild(title);
        postDiv.appendChild(content);
        postDiv.appendChild(votes);
        postDiv.appendChild(comments);

        postsContainer.appendChild(postDiv);
    });
}

// Function to handle submitting a post
function submitPost() {
    const title = document.getElementById("post-title").value;
    const content = document.getElementById("post-content").value;

    // Generate a unique ID for the new post
    const id = posts.length + 1;

    // Create the new post object
    const newPost = {
        id: id,
        title: title,
        content: content,
        votes: 0,
        comments: []
    };

    // Add the new post to the posts array
    posts.push(newPost);

    // Render the updated list of posts
    renderPosts();
}

// Event listener for submitting a post
document.getElementById("submit-post").addEventListener("click", submitPost);

// Initial rendering of posts
renderPosts();
