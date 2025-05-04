document.addEventListener('DOMContentLoaded', () => {
  const logoutLink = document.querySelector('li a#logout-link');

  if (logoutLink) {
    logoutLink.addEventListener('click', async (event) => {
      event.preventDefault(); // Prevent default navigation

      console.log('Logout clicked, initiating fetch...');

      try {
        const response = await fetch('http://localhost:3000/api/logout/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getCookie('token')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Include cookies in the request
        });

        const data = await response.json();
        console.log('Logout response:', data);

        if (response.ok && data.success) {
          alert(data.message);
          // Use an absolute URL to ensure correct redirection
          window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
        } else {
          alert('Đăng xuất thất bại: ' + (data.message || 'Không rõ lỗi'));
        }
      } catch (error) {
        console.error('Lỗi khi đăng xuất:', error);
        alert('Đăng xuất thất bại do lỗi hệ thống: ' + error.message);
      }
    });
  }

  // Helper function to get cookie
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
});