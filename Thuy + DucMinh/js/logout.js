document.addEventListener('DOMContentLoaded', () => {
  const logoutLink = document.querySelector('li a#logout-link');

  if (!logoutLink) {
    console.warn('Logout link (#logout-link) not found in the DOM. Ensure the element exists.');
    return;
  }

  logoutLink.addEventListener('click', async (event) => {
    event.preventDefault();

    console.log('Logout clicked, initiating fetch...');

    try {
      const token = getCookie('token');
      if (!token) {
        console.warn('No token found in cookies, proceeding with client-side cleanup.');
      }

      const response = await fetch('http://localhost:3000/api/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      console.log('Logout response:', data);

      if (response.ok && data.success) {
        document.cookie = 'token=; Max-Age=0; path=/; HttpOnly';
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        console.log('Client-side token and storage cleared.');

        await getCurrentUser(); // Refresh user state
        alert(data.message);
        window.location.href = 'http://127.0.0.1:5500/index.html';
      } else {
        console.error('Logout failed:', data.message);
        alert('Đăng xuất thất bại: ' + (data.message || 'Không rõ lỗi'));
      }
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      alert('Đăng xuất thất bại do lỗi hệ thống: ' + error.message);
    }
  });

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
});