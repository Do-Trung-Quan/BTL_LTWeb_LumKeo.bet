// Hiển thị form Đăng nhập
function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const verifyEmailForm = document.getElementById('verify-email-form');
    const resetForm = document.getElementById('password-reset-form');

    // Ẩn các form khác trước
    verifyEmailForm.classList.remove('show');
    resetForm.classList.remove('show');
    
    setTimeout(() => {
        verifyEmailForm.style.display = 'none';
        resetForm.style.display = 'none';
        loginForm.style.display = 'block';
        loginForm.classList.remove('hide');
    }, 500);
}

// Hiển thị form Xác minh Email
function showVerifyEmailForm() {
    const loginForm = document.getElementById('login-form');
    const verifyEmailForm = document.getElementById('verify-email-form');
    const resetForm = document.getElementById('password-reset-form');
    
    // Ẩn các form khác trước
    loginForm.classList.add('hide');
    resetForm.classList.remove('show');
    
    setTimeout(() => {
        loginForm.style.display = 'none';
        resetForm.style.display = 'none';
        verifyEmailForm.style.display = 'block';
        setTimeout(() => {
            verifyEmailForm.classList.add('show');
        }, 10);
    }, 500);
}

// Hiển thị form Reset mật khẩu
function showResetForm() {
    const loginForm = document.getElementById('login-form');
    const verifyEmailForm = document.getElementById('verify-email-form');
    const resetForm = document.getElementById('password-reset-form');
    
    // Ẩn các form khác trước
    loginForm.classList.add('hide');
    verifyEmailForm.classList.remove('show');
    
    setTimeout(() => {
        loginForm.style.display = 'none';
        verifyEmailForm.style.display = 'none';
        resetForm.style.display = 'block';
        setTimeout(() => {
            resetForm.classList.add('show');
        }, 10);
    }, 500);
}

// Đăng nhập — Gọi API
document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
        return;
    }

    try {
        console.log('Data being sent:', { username, password });
        const response = await fetch('http://localhost:3000/api/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        console.log('Phản hồi từ backend:', data);

        if (response.ok) {
            document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; secure`;
            window.location.href = '../index.html';
        } else {
            alert(data.message || 'Sai tài khoản hoặc mật khẩu');
        }
    } catch (error) {
        alert(`Lỗi kết nối: ${error.message}`);
    }
});

// Verify email and send OTP
document.getElementById('verify-email-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('verify-email').value.trim();

    if (!email) {
        alert('Vui lòng nhập email!');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/send-otp/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            sessionStorage.setItem('resetEmail', email);
            sessionStorage.setItem('otp', data.otp);
            alert('OTP đã được gửi đến email của bạn!');
            showResetForm();
        } else {
            alert(data.message || 'Email không hợp lệ hoặc không tìm thấy tài khoản.');
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
    const otp = document.getElementById('otp').value.trim();

    if (!username || !newPassword || !confirmPassword || !otp) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp.');
        return;
    }

    const storedOtp = sessionStorage.getItem('otp');
    if (otp !== storedOtp) {
        alert('Mã OTP không chính xác!');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/reset-password/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, newPassword })
        });

        const contentType = response.headers.get('content-type');
        let data = {};

        if (response.status === 204) {
            data = { message: 'No content returned from server' };
        } else if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(`Unexpected response format: ${text}`);
        }

        if (response.ok) {
            alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
            showLoginForm();
            document.getElementById('password-reset-form').reset();
            sessionStorage.removeItem('resetEmail');
            sessionStorage.removeItem('otp');
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

// Initialize with login form visible
document.addEventListener('DOMContentLoaded', showLoginForm);