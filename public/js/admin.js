import { checkToken, logout, getRoleFromToken } from './modules/auth.js';
import { fetchAndDisplayPosts, searchPosts } from './modules/posts.js';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (getRoleFromToken(token) !== 'admin') {
        logout();
    }
    
    fetchAndDisplayPosts()
    document.getElementById("cancelDelete").addEventListener("click", () => {
        document.getElementById("confirmationModal").classList.remove("is-active");
    })
    document.getElementById("confirmDelete").addEventListener("click", () => {
        document.getElementById("confirmationModal").classList.remove("is-active");
    })
    document.getElementById("modalClose").addEventListener("click", () => {
        document.getElementById("confirmationModal").classList.remove("is-active");
    })
})