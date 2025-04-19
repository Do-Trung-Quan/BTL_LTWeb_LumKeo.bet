function showResetForm() {
    const loginForm = document.getElementById('login-form');
    const resetForm = document.getElementById('password-reset-form');
    
    loginForm.classList.add('hide');
    resetForm.style.display = 'block';
    setTimeout(() => {
        resetForm.classList.add('show');
    }, 10);
}

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
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
        return;
    }

    try {
        console.log('Data being sent:', { username, password });
        const response = await fetch('http://localhost:3000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        console.log('Phản hồi từ backend:', data); // Log để kiểm tra

        if (response.ok) {
            localStorage.setItem('token', data.token);

            // Kiểm tra role trước khi vào switch
            if (!data.role) {
                alert('Không nhận được quyền truy cập từ server.');
                return;
            }

            // Chuyển role về chữ thường để đảm bảo khớp với case
            const role = data.role.toLowerCase();

            switch (role) {
                case 'admin':
                    window.location.href = '../Thuy + DucMinh/ADMIN_QLBB.html';
                    break;
                case 'author':
                    window.location.href = '../Thuy + DucMinh/AUTHOR_QLBV.html';
                    break;
                case 'user':
                    window.location.href = '../Thuy + DucMinh/USER_BBDL.html';
                    break;
                default:
                    alert('Không xác định được quyền truy cập: ' + role);
            }
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
        const response = await fetch('http://localhost:3000/api/users/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, newPassword, confirmPassword })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Đặt lại mật khẩu thành công!');
            showLoginForm();
        } else {
            alert(data.message || 'Đặt lại mật khẩu thất bại.');
        }
    } catch (error) {
        alert(`Lỗi kết nối: ${error.message}`);
    }
});

// Toggle Password
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
