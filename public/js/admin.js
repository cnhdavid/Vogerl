import { checkToken, logout, getRoleFromToken } from './modules/auth.js';
import { fetchAndDisplayPosts, searchPosts } from './modules/posts.js';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (getRoleFromToken(token) !== 'admin') {
        logout();
    }
    
    fetchAndDisplayPosts()
    
})