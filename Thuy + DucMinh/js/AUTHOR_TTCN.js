function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
}

async function getCurrentUser() {
    try {
        const token = getCookie("token");
        console.log('Token:', token);
        if (!token) {
            throw new Error("Không tìm thấy token, vui lòng đăng nhập!");
        }

        const payload = decodeJwt(token);
        if (!payload) {
            throw new Error("Token không hợp lệ!");
        }

        const { id, username, role, avatar } = payload;
        console.log('User ID:', id);
        console.log('User Name from Token:', username);
        console.log('User Role from Token:', role);
        console.log('User Avatar from Token:', avatar);
        console.log('Full Payload:', payload);

        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            throw new Error("ID không hợp lệ, phải là ObjectId MongoDB!");
        }

        let userData = { id, username, role, avatar };
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/users/${id}/?_t=${Date.now()}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token.trim()}`,
                    'Cache-Control': 'no-cache'
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.warn('API Error Response:', errorText);
                if (res.status === 403) {
                    console.warn('Permission denied for /api/users/:id/, using token data');
                    return userData;
                } else if (res.status === 401) {
                    try {
                        const errorData = JSON.parse(errorText);
                        console.log('Parsed Error Data:', errorData);
                        if (errorData.error === "jwt expired") {
                            console.log('Token confirmed expired, triggering logout...');
                            const logoutLink = document.querySelector('li a#logout-link');
                            if (logoutLink) {
                                logoutLink.click();
                                return null;
                            } else {
                                console.error('Logout link not found, redirecting to login manually');
                                window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
                                return null;
                            }
                        } else {
                            console.warn('401 error not due to expiration, treating as API issue:', errorData.error || errorText);
                            throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
                        }
                    } catch (parseError) {
                        console.error('Failed to parse 401 error response:', parseError);
                        throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
                    }
                } else {
                    throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
                }
            }

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Response is not JSON');
            }

            const data = await res.json();
            console.log('API Response:', data);
            const user = data.user || data;
            userData = {
                id,
                username: user.username || username,
                role: user.role || role,
                avatar: user.avatar || avatar
            };
        } catch (apiError) {
            console.warn('Falling back to token data due to API error:', apiError.message);
            return userData;
        }

        console.log('Final User Data:', userData);
        return userData;
    } catch (error) {
        console.error('getCurrentUser Error:', error.message, error.stack);
        throw error;
    }
}

// Make functions globally accessible for logout.js
window.getCookie = getCookie;
window.setCookie = setCookie;
window.decodeJwt = decodeJwt;
window.getCurrentUser = getCurrentUser;
window.API_BASE_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", function () {
    const userNameDisplay = document.getElementById("user-name");
    const userRoleDisplay = document.getElementById("user-role");
    const profilePic = document.getElementById("profile-pic-upper");
    const profilePicInput = document.getElementById("profile-pic-input");
    const avatarImg = document.querySelector(".upload_complete img");
    const btnSelectAva = document.getElementById("btn_select_ava");
    const btnSaveAva = document.getElementById("btn_save_ava");
    const passOld = document.getElementById("pass_old");
    const passNew = document.getElementById("pass_new");
    const btnChangePassword = document.getElementById("btn_change_password");
    const txtFullname = document.getElementById("txtFullname");
    const btnSaveFullname = document.getElementById("btn_save_fullname");
    const togglePasswordButtons = document.querySelectorAll(".toggle-password");

    function updateAdminInfo(user) {
        userNameDisplay.textContent = user.username || 'Unknown';
        userRoleDisplay.textContent = user.role ? user.role.toUpperCase() : 'Unknown';
        profilePic.src = user.avatar || 'img/defaultAvatar.jpg';
        profilePic.alt = `${user.username || 'User'}'s Avatar`;
        avatarImg.src = user.avatar || 'img/defaultAvatar.jpg';
        avatarImg.alt = `${user.username || 'User'}'s Avatar`;
        txtFullname.value = user.username || "";
        btnSaveFullname.disabled = true;
        btnChangePassword.disabled = true;
    }

    async function updateAvatar(file, userId, token) {
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const res = await fetch(`${window.API_BASE_URL}/api/users/${userId}/avatar/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.trim()}`
                },
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Không thể cập nhật avatar');
            }

            const data = await res.json();
            console.log('Avatar updated response:', data);
            console.log('New Token after avatar update:', data.token);
            return data;
        } catch (error) {
            console.error('Error updating avatar:', error);
            throw error;
        }
    }

    async function updatePassword(oldPassword, newPassword, userId, token) {
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/users/${userId}/password/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Không thể cập nhật mật khẩu');
            }

            const data = await res.json();
            console.log('Password updated response:', data);
            console.log('New Token after password update:', data.token);
            return data;
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    }

    async function updateUsername(newUsername, userId, token) {
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/users/${userId}/username/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: newUsername })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Không thể cập nhật tên đăng nhập');
            }

            const data = await res.json();
            console.log('Username updated response:', data);
            console.log('New Token after username update:', data.token);
            return data;
        } catch (error) {
            console.error('Error updating username:', error);
            throw error;
        }
    }

    let currentUser = null;
    async function initialize() {
        try {
            const token = getCookie("token");
            if (!token) {
                window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
                return;
            }

            currentUser = await getCurrentUser();
            if (!currentUser) return;

            updateAdminInfo(currentUser);
        } catch (error) {
            console.error('Initialize error:', error.message);
            if (!getCookie("token")) {
                window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
            } else {
                userNameDisplay.textContent = 'Lỗi tải dữ liệu';
                userRoleDisplay.textContent = 'Unknown';
            }
        }
    }

    initialize();

    btnSelectAva.addEventListener("click", function () {
        profilePicInput.click();
    });

    profilePicInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                avatarImg.src = e.target.result;
                profilePic.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    btnSaveAva.addEventListener("click", async function () {
        try {
            const token = getCookie("token");
            if (!token || !currentUser) {
                alert('Vui lòng đăng nhập lại!');
                return;
            }

            const file = profilePicInput.files[0];
            if (!file) {
                alert('Vui lòng chọn một ảnh trước khi lưu!');
                return;
            }

            const response = await updateAvatar(file, currentUser.id, token);
            if (response.token) {
                setCookie("token", response.token, 1);
            }
            alert('Cập nhật avatar thành công! Trang sẽ tải lại để hiển thị thay đổi.');
            setTimeout(() => {
                location.reload();
            }, 1000);
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    });

    togglePasswordButtons.forEach(button => {
        button.addEventListener("click", function () {
            const input = button.previousElementSibling;
            if (input.type === "password") {
                input.type = "text";
                button.textContent = "Ẩn";
            } else {
                input.type = "password";
                button.textContent = "Hiện";
            }
        });
    });

    function updateChangePasswordButtonState() {
        const oldPassword = passOld.value.trim();
        const newPassword = passNew.value.trim();
        btnChangePassword.disabled = !oldPassword || !newPassword || newPassword.length < 6;
    }

    passOld.addEventListener("input", updateChangePasswordButtonState);
    passNew.addEventListener("input", updateChangePasswordButtonState);

    btnChangePassword.addEventListener("click", async function () {
        try {
            const token = getCookie("token");
            if (!token || !currentUser) {
                alert('Vui lòng đăng nhập lại!');
                return;
            }

            const oldPassword = passOld.value.trim();
            const newPassword = passNew.value.trim();

            if (!oldPassword || !newPassword) {
                alert('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới!');
                return;
            }

            if (newPassword.length < 6) {
                alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
                return;
            }

            const response = await updatePassword(oldPassword, newPassword, currentUser.id, token);
            if (response.token) {
                setCookie("token", response.token, 1);
            }
            alert('Đổi mật khẩu thành công!');
            passOld.value = '';
            passNew.value = '';
            btnChangePassword.disabled = true;
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    });

    txtFullname.addEventListener("input", function () {
        btnSaveFullname.disabled = txtFullname.value.trim() === userNameDisplay.textContent.trim();
    });

    btnSaveFullname.addEventListener("click", async function () {
        try {
            const token = getCookie("token");
            if (!token || !currentUser) {
                alert('Vui lòng đăng nhập lại!');
                return;
            }

            const newUsername = txtFullname.value.trim();
            if (!newUsername) {
                alert('Vui lòng nhập tên đăng nhập!');
                return;
            }

            const response = await updateUsername(newUsername, currentUser.id, token);
            if (response.token) {
                setCookie("token", response.token, 1);
            }
            alert('Cập nhật tên đăng nhập thành công! Trang sẽ tải lại để hiển thị thay đổi.');
            setTimeout(() => {
                location.reload();
            }, 1000);
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    });
});