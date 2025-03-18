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

// Khởi tạo accounts từ localStorage hoặc dùng giá trị mặc định
let accounts = JSON.parse(localStorage.getItem('accounts')) || {
    'admin': { password: '123', redirect: '../Thuy + DucMinh/ADMIN_QLBB.html' },
    'author': { password: '123', redirect: '../Thuy + DucMinh/AUTHOR_QLBV.html' },
    'user': { password: '123', redirect: '../Thuy + DucMinh/USER_BBDL.html' }
};

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (accounts[username] && accounts[username].password === password) {
        window.location.href = accounts[username].redirect;
    } else {
        alert('Sai tài khoản hoặc mật khẩu');
    }
});

document.getElementById('password-reset-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('reset-username').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!accounts[username]) {
        alert('Tài khoản không tồn tại');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp');
        return;
    }

    accounts[username].password = newPassword;
    // Lưu accounts vào localStorage
    localStorage.setItem('accounts', JSON.stringify(accounts));
    alert('Đổi mật khẩu thành công');
    showLoginForm();
});

// Add password toggle functionality
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


