export function checkToken() {
    const token = localStorage.getItem('token');
    return token ? JSON.parse(atob(token.split('.')[1])) : null;
  }
  
  export function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
  export function getUserIdFromToken(token) {
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      return decodedToken ? decodedToken.userId : null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }