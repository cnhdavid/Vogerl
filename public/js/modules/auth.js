export function checkToken() {
    const token = localStorage.getItem('token');
    return token ? JSON.parse(atob(token.split('.')[1])) : null;
  }
  
  export function logout() {
    localStorage.removeItem('token');
    window.location.href = 'dashboard.html';
  }
  export async function getUserId(username) {
    try {
        const response = await fetch(`http://localhost:3000/api/users/${username}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user ID');
        }
        const data = await response.json();
        return data.userId;
    } catch (error) {
        console.error('Error fetching user ID:', error);
        return null; // Or handle the error as needed
    }
}
export function getUserIdFromToken(token) {
  if (!token) {
      return null;
  }
  try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
          atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
      );
      const decodedToken = JSON.parse(jsonPayload);
      return decodedToken.username;
  } catch (error) {
      console.error('Error decoding token:', error);
      return null;
  }
}


  