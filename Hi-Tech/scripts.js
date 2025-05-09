{/* <script src="https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.min.js"></script> */}

// Hiển thị form Reset mật khẩu
function showResetForm() {
    const loginForm = document.getElementById('login-form');
    const resetForm = document.getElementById('password-reset-form');
    
    loginForm.classList.add('hide');
    resetForm.style.display = 'block';
    setTimeout(() => {
        resetForm.classList.add('show');
    }, 10);
}

// Hiển thị form Đăng nhập
function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const resetForm = document.getElementById('password-reset-form');
    
    resetForm.classList.remove('show');
    loginForm.classList.remove('hide');
    
    setTimeout(() => {
        resetForm.style.display = 'none';
    }, 500);
}

// Đăng nhập — Gọi API
document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();  // Ngừng gửi form theo cách mặc định

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
        return;
    }

    try {
        console.log('Data being sent:', { username, password });
        const response = await fetch('http://localhost:3000/api/login/', {
            method: 'POST',  // Gửi dữ liệu qua POST request
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })  // Gửi dữ liệu trong body của request
        });

        const data = await response.json();
        console.log('Phản hồi từ backend:', data); // Log để kiểm tra

        if (response.ok) {
            // Lưu token vào cookie, hết hạn sau 7 ngày
            document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; secure`;

            // Redirect to index.html regardless of role
            window.location.href = '../index.html';
        } else {
            alert(data.message || 'Sai tài khoản hoặc mật khẩu');
        }
    } catch (error) {
        alert(`Lỗi kết nối: ${error.message}`);
    }
});

// Reset mật khẩu — Gọi API
document.getElementById('password-reset-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('reset-username').value.trim();
    const newPassword = document.getElementById('new-password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();

    if (newPassword !== confirmPassword) {
        return alert('Mật khẩu xác nhận không khớp.');
    }

    try {
        const response = await fetch('http://localhost:3000/api/reset-password/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, newPassword })
        });

        // Check if the response has a body before trying to parse JSON
        const contentType = response.headers.get('content-type');
        let data = {};

        if (response.status === 204) {
            // 204 No Content: No body to parse
            data = { message: 'No content returned from server' };
        } else if (contentType && contentType.includes('application/json')) {
            // Only parse as JSON if the Content-Type is application/json
            data = await response.json();
        } else {
            // If not JSON, treat the response as text
            const text = await response.text();
            throw new Error(`Unexpected response format: ${text}`);
        }

        if (response.ok) {
            alert('Đặt lại mật khẩu thành công!');
            showLoginForm();
        } else {
            alert(data.message || 'Đặt lại mật khẩu thất bại.');
        }
    } catch (error) {
        console.error('Reset Password Error:', error);
        alert(`Lỗi kết nối: ${error.message}`);
    }
});

// Toggle Password Visibility
document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function() {
        const input = this.previousElementSibling;
        if (input.type === 'password') {
            input.type = 'text';
            this.classList.remove('fa-eye-slash');
            this.classList.add('fa-eye');
        } else {
            input.type = 'password';
            this.classList.remove('fa-eye');
            this.classList.add('fa-eye-slash');
        }
    });
});