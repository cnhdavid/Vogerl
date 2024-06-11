require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authenticateToken = require('./authenticate');



const multer = require('multer');
const upload = multer();
const { filterProfanity, containsProfanity } = require('./public/js/modules/moderate');



const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());

const sslCert = fs.readFileSync(path.resolve(__dirname, process.env.PG_SSL_CERT_PATH)).toString();
const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    ssl: {
        rejectUnauthorized: true,
        ca: sslCert
    }
});






// Check Cpnnection
app.get('/check-db-connection', async (req, res) => {
    try {
        await client.query('SELECT 1');
        res.status(200).json({ success: true, message: 'Database connection is successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
    }
});

// User registration
app.post('/signup', async (req, res) => {
    const { username, email, password, date_of_birth, first_name, last_name } = req.body;
    
    const dob = new Date(date_of_birth);
    const formattedDOB = dob.toISOString().split('T')[0];
   

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const client = await pool.connect();
        try {
            const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
            const userCheckResult = await client.query(userCheckQuery, [email]);

            if (userCheckResult.rows.length > 0) {
                return res.status(400).json({ message: 'Email already exists' });
            }

            const insertQuery = 'INSERT INTO users (username, email, password, date_of_birth, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6)';
            await client.query(insertQuery, [username, email, hashedPassword, formattedDOB, first_name, last_name]);

            return res.status(201).json({ message: 'User created successfully' });
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Error creating user' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    

    try {

        const client = await pool.connect();
        try {
            const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
            const userCheckResult = await client.query(userCheckQuery, [email]);

            if (userCheckResult.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid email or password' });
            }

            const user = userCheckResult.rows[0];

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(400).json({ message: 'Invalid email or password' });
            }
            jwtSecretKey = process.env.JWT_SECRET_KEY;



            const token = jwt.sign({ userId: user.id, username: user.username }, jwtSecretKey, { expiresIn: '1h' });
           
            res.json({ token });
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/api/users/:username', async (req, res) => {
    const username = req.params.username;
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
            
            res.status(200).json(result.rows[0].id);
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/post', authenticateToken, upload.single('image'), async (req, res) => {
    let { title, content, subject } = req.body;
    const username = req.user.username; // Extract username from the token
    let image = null;

    // If image is uploaded, convert it to Base64 string
    if (req.file) {
        image = req.file.buffer.toString('base64');
    }

    try {
        const client = await pool.connect();
        try {
            const insertQuery = 'INSERT INTO posts (username, title, content, subject, image) VALUES ($1, $2, $3, $4, $5)';
            await client.query(insertQuery, [username, title, content, subject, image]);
            res.status(201).json({ message: 'Post created successfully' });
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.delete('/api/Deletepost/:postId', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const username = req.user.username; // Extract username from the token

    try {
        // Check if the post exists and belongs to the authenticated user
        const postQuery = await client.query(
            'SELECT * FROM posts WHERE id = $1 AND username = $2',
            [postId, username]
        );
        const post = postQuery.rows[0];
        if (!post) {
            return res.status(404).json({ error: 'Post not found or unauthorized' });
        }

        // Delete the post
        await client.query(
            'DELETE FROM posts WHERE id = $1',
            [postId]
        );

        // Respond with success message
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/api/posts', async (req, res) => {
    
    let subject = req.query.subject;
    console.log(subject);
    if (!subject) {
        subject = "All";
    }
    const username = req.query.username; // Get the username from query params
    console.log(username);
    

    try {
        const client = await pool.connect();
        try {
            let result;
            if (username) {
                console.log(username);
                if (subject === "All") {
                    result = await client.query('SELECT * FROM posts WHERE username = $1', [username]);
                } else {
                    result = await client.query('SELECT * FROM posts WHERE username = $1 AND subject = $2', [username, subject]);
                }
            } else if (subject && subject !== "All") {
                result = await client.query('SELECT * FROM posts WHERE subject = $1', [subject]);
            } else {
                result = await client.query('SELECT * FROM posts');
            }
            
            res.status(200).json(result.rows);
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
});



app.get('/api/users/:username/posts', async (req, res) => {
    const username = req.params.username;
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM posts WHERE username = $1', [username]);
            res.status(200).json(result.rows);
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

})
app.put('/api/posts/:postId', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const username = req.user.username;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).send('Title and content are required');
    }
    let modifiedTitle = await filterProfanity(title);
    const modifiedContent = await filterProfanity(content);
    const titleHasProfanity = await containsProfanity(title);
    const contentHasProfanity = await containsProfanity(content);
    if (titleHasProfanity || contentHasProfanity) {
        modifiedTitle += ' (The post content was changed due to it containing profanity)';
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('UPDATE posts SET title = $1, content = $2 WHERE id = $3 AND username = $4', [modifiedTitle, modifiedContent, postId, username]);
            res.status(200).json({ message: 'Post updated successfully' });
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Function to get comments by post ID
async function getCommentsByPostId(postId) {
    const query = 'SELECT * FROM comments WHERE post_id = $1';
    const values = [postId];

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }
}

app.delete('/api/post/:postId', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const username = req.user.username; // Extract username from the token
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('DELETE FROM posts WHERE id = $1 AND username = $2', [postId, username]);
            res.status(200).json({ message: 'Post deleted successfully' });
        } finally {
            client.release();  // Release the client back to the pool   
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Function to get a post by ID
async function getPostById(postId) {
    const query = 'SELECT * FROM posts WHERE id = $1';
    const values = [postId];

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching post:', error);
        throw error;
    }
}

// Endpoint to get comments based on post ID
app.get('/api/posts/:postId/comments', async (req, res) => {
    const postId = req.params.postId;

    try {
        const comments = await getCommentsByPostId(postId);
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching comments' });
    }
});

app.get('/api/posts/:postId', async (req, res) => {
    const postId = req.params.postId;

    try {
        const client = await pool.connect();
        try {
            const post = await getPostById(postId);
            res.status(200).json(post);
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/posts/:postId/comments', async (req, res) => {
    const { postId } = req.params;
    try {
        const client = await pool.connect();
        try {
            const comments = await getCommentsByPostId(postId);
            res.status(200).json(comments);
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    let { content, parentId } = req.body; // Include parentId in the request body
    const username = req.user.username; // Extract username from the token

    try {
        const client = await pool.connect();
        try {
            // Insert the comment into the database
            const contentHasProfanity = await containsProfanity(content);
            if (contentHasProfanity) {
                content = '***PROFANITY DETECTED***';
            }
            const result = await client.query(
                `INSERT INTO comments (username, post_id, content, parent_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
                [username, postId, content, parentId]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error inserting comment into database:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/posts/:postId/upvote', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const username = req.user.username;

    try {
        const client = await pool.connect();
        try {
            // Find user ID by username
            const userResult = await client.query('SELECT id FROM Users WHERE username = $1', [username]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const userId = userResult.rows[0].id;

            // Check if the user has already voted on this post
            const voteResult = await client.query('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

            if (voteResult.rows.length === 0) {
                // User hasn't voted on this post yet, insert a new upvote
                await client.query('INSERT INTO PostVotes (post_id, user_id, vote) VALUES ($1, $2, 1)', [postId, userId]);
            } else {
                const currentVote = voteResult.rows[0].vote;
                if (currentVote === -1) {
                    // User has downvoted, update to upvote
                    await client.query('UPDATE PostVotes SET vote = 1 WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                }
                // If the user has already upvoted, do nothing or handle it as needed
            }

            res.status(200).json({ message: 'Post upvoted successfully' });
        } catch (error) {
            console.error('Error upvoting post:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/api/posts/:postId/downvote', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const username = req.user.username;

    try {
        const client = await pool.connect();
        try {
            // Find user ID by username
            const userResult = await client.query('SELECT id FROM Users WHERE username = $1', [username]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const userId = userResult.rows[0].id;

            // Check if the user has already voted on this post
            const voteResult = await client.query('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

            if (voteResult.rows.length === 0) {
                // User hasn't voted on this post yet, insert a new downvote
                await client.query('INSERT INTO PostVotes (post_id, user_id, vote) VALUES ($1, $2, -1)', [postId, userId]);
            } else {
                const currentVote = voteResult.rows[0].vote;
                if (currentVote === 1) {
                    // User has downvoted, update to upvote
                    await client.query('UPDATE PostVotes SET vote = -1 WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                }
                // If the user has already downvoted, do nothing or handle it as needed
            }

            res.status(200).json({ message: 'Post Downvoted successfully' });
        } catch (error) {
            console.error('Error upvoting post:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            client.release();  // Release the client back to the pool
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/api/posts/:postId/votes', async (req, res) => {
    const { postId } = req.params;

    try {
        const totalVotes = await getPostVotes(postId);
        res.status(200).json({ postId, totalVotes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/posts/:postId/hasUserLiked/:userId', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const user_id = req.params.userId;
    

    try {
        const hasUserLiked = await hasUserVoted(postId, user_id);
        
        res.status(200).json({ postId, hasUserLiked });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});
async function getPostVotes(postId) {
    try {
        const client = await pool.connect();
        try {
            const result = await pool.query(
                `SELECT 
                    COALESCE(SUM(vote), 0) AS total_votes 
                 FROM 
                    postvotes 
                 WHERE 
                    post_id = $1`,
                [postId]
            );

            
            return result.rows[0].total_votes;
        } catch (error) {
            console.error('Error fetching votes for post:', error);
            throw new Error('Internal Server Error');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw new Error('Internal Server Error');
    }
}
async function hasUserVoted(postId, userId) {
    

    try {
        const client = await pool.connect();
        try {
            // Query the PostVotes table to check if the user has voted on the post
            const voteResult = await pool.query('SELECT * FROM PostVotes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

            if (voteResult.rows.length === 0) {
                // User hasn't voted on the post
                return 'none';
            } else {
                // User has voted on the post, check the vote value
                const vote = voteResult.rows[0].vote;
                if (vote === 1) {
                    // User has upvoted the post
                    return 'upvote';
                } else if (vote === -1) {
                    // User has downvoted the post
                    return 'downvote';
                } else {
                    // Invalid vote value
                    throw new Error('Invalid vote value');
                }
            }
        } catch (error) {
            console.error('Error checking if user has voted on post:', error);
            // Handle the error as needed
            throw new Error('Error checking if user has voted on post');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw new Error('Internal Server Error');
    }

}


function nestComments(comments) {
    const map = {};
    const roots = [];

    comments.forEach(comment => {
        comment.replies = [];
        map[comment.id] = comment;

        if (comment.parent_id) {
            map[comment.parent_id].replies.push(comment);
        } else {
            roots.push(comment);
        }
    });

    return roots;
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
