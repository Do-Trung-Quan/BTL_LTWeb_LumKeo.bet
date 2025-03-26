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

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const accounts = {
        'admin': { password: '123', redirect: '../Thuy + DucMinh/ADMIN_QLBB.html' },
        'author': { password: '123', redirect: '../Thuy + DucMinh/AUTHOR_QLBV.html' },
        'user': { password: '123', redirect: '../Thuy + DucMinh/USER_BBDL.html' }
    };

    if (accounts[username] && accounts[username].password === password) {
        window.location.href = accounts[username].redirect;
    } else {
        alert('Sai tài khoản hoặc mật khẩu');
    }
});

