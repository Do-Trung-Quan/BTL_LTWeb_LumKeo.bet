document.addEventListener("DOMContentLoaded", function () {
    const API_BASE_URL = "http://localhost:3000";

    // Elements
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

    // Helper: Get cookie value
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    // Helper: Set cookie value
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    // Helper: Decode JWT token with Unicode support
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

    // Update user info display
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

    // Fetch current user data
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
                const res = await fetch(`${API_BASE_URL}/api/users/${id}/?_t=${Date.now()}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token.trim()}`,
                        'Cache-Control': 'no-cache'
                    }
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.warn('API Error:', errorText);
                    if (res.status === 403) {
                        console.warn('Permission denied for /api/users/:id/, using token data');
                        return userData;
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
                console.warn('Falling back to token data due to API error:', apiError);
                return userData;
            }

            console.log('Final User Data:', userData);
            return userData;
        } catch (error) {
            console.error('getCurrentUser Error:', error);
            throw error;
        }
    }

    // Update avatar
    async function updateAvatar(file, userId, token) {
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const res = await fetch(`${API_BASE_URL}/api/users/${userId}/avatar/`, {
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

    // Update password
    async function updatePassword(oldPassword, newPassword, userId, token) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${userId}/password/`, {
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

    // Update username
    async function updateUsername(newUsername, userId, token) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${userId}/username/`, {
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

    // Initialize: Fetch and display user data
    let currentUser = null;
    async function initialize() {
        try {
            const token = getCookie("token");
            if (!token) {
                alert('Vui lòng đăng nhập để xem thông tin cá nhân!');
                userNameDisplay.textContent = 'Chưa đăng nhập';
                userRoleDisplay.textContent = 'Unknown';
                return;
            }

            currentUser = await getCurrentUser();
            updateAdminInfo(currentUser);
        } catch (error) {
            alert('Lỗi: ' + error.message);
            userNameDisplay.textContent = 'Lỗi tải dữ liệu';
            userRoleDisplay.textContent = 'Unknown';
        }
    }

    initialize();

    // Avatar upload: Trigger file input on "Chọn lại ảnh"
    btnSelectAva.addEventListener("click", function () {
        profilePicInput.click();
    });

    // Avatar upload: Preview selected image
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

    // Avatar upload: Save new avatar
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
            // Update the token in the cookie if a new one is provided
            if (response.token) {
                setCookie("token", response.token, 1); // Store for 1 day
            }
            alert('Cập nhật avatar thành công! Trang sẽ tải lại để hiển thị thay đổi.');
            setTimeout(() => {
                location.reload();
            }, 1000); // Delay to allow the user to see the alert
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    });

    // Password toggle functionality
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

    // Enable/disable "Đổi mật khẩu" button based on input
    function updateChangePasswordButtonState() {
        const oldPassword = passOld.value.trim();
        const newPassword = passNew.value.trim();
        btnChangePassword.disabled = !oldPassword || !newPassword || newPassword.length < 6;
    }

    passOld.addEventListener("input", updateChangePasswordButtonState);
    passNew.addEventListener("input", updateChangePasswordButtonState);

    // Password update
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
            // Update the token in the cookie if a new one is provided
            if (response.token) {
                setCookie("token", response.token, 1); // Store for 1 day
            }
            alert('Đổi mật khẩu thành công!');
            passOld.value = '';
            passNew.value = '';
            btnChangePassword.disabled = true;
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    });

    // Username update: Enable save button on input change
    txtFullname.addEventListener("input", function () {
        btnSaveFullname.disabled = txtFullname.value.trim() === userNameDisplay.textContent.trim();
    });

    // Username update: Save new username
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
            // Update the token in the cookie if a new one is provided
            if (response.token) {
                setCookie("token", response.token, 1); // Store for 1 day
            }
            alert('Cập nhật tên đăng nhập thành công! Trang sẽ tải lại để hiển thị thay đổi.');
            setTimeout(() => {
                location.reload();
            }, 1000); // Delay to allow the user to see the alert
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    });
});