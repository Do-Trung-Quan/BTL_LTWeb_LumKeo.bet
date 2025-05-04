// Function to get cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Helper: Decode JWT token
function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function(c) {
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

// Update admin info in the UI
function updateAdminInfo(user) {
    document.getElementById('user-name').textContent = user.username || 'Unknown';
    document.getElementById('user-role').textContent = user.role.toUpperCase() || 'Unknown';
    const profilePic = document.getElementById('profile-pic-upper');
    profilePic.src = user.avatar;
    profilePic.alt = `${user.username}'s Avatar`;
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
        console.log('User Name:', username);
        console.log('User Role:', role);
        console.log('Full Payload:', payload);

        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            throw new Error("ID không hợp lệ, phải là ObjectId MongoDB!");
        }

        let userData = { id, username, role, avatar };
        try {
            const res = await fetch(`http://localhost:3000/api/users/${id}?_t=${Date.now()}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token.trim()}`
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.warn('API Error:', errorText);
                if (res.status === 403) {
                    console.warn('Permission denied for /api/users/:id, using token data');
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
            const user = data.user || data;
            userData = {
                id,
                username: user.username !== undefined ? user.username : username,
                role: user.role !== undefined ? user.role : role,
                avatar: user.avatar !== undefined ? user.avatar : avatar
            };
        } catch (apiError) {
            console.warn('Falling back to token data due to API error:', apiError);
            return userData;
        }

        return userData;
    } catch (error) {
        console.error('getCurrentUser Error:', error);
        throw error;
    }
}

// Fetch and populate users
async function fetchUsers(token) {
    try {
        const res = await fetch('http://localhost:3000/api/users/', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const users = await res.json();
        const userData = Array.isArray(users) ? users : users.users || [];

        if (!userData.length) {
            console.log('No users found');
            return;
        }

        const tableBody = document.querySelector('#table-body tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        for (const user of userData) {
            console.log('User data:', user);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user._id || 'N/A'}</td>
                <td>${user.username || 'N/A'}</td>
                <td>${new Date(user.created_at || Date.now()).toLocaleDateString('vi-VN') || 'N/A'}</td>
                <td><i class="fa-solid fa-trash-can delete-btn" data-user-id="${user._id}"></i></td>
            `;
            tableBody.appendChild(row);
        }

        // Add delete functionality
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = e.target.getAttribute('data-user-id');
                if (confirm(`Bạn có chắc chắn muốn xóa người dùng với ID: ${userId}?`)) {
                    try {
                        const res = await fetch(`http://localhost:3000/api/users/${userId}/`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json',
                            },
                        });
                        if (res.ok) {
                            alert('Người dùng đã được xóa thành công!');
                            fetchUsers(token); // Refresh the table
                        } else {
                            const errorText = await res.text();
                            alert(`Lỗi: ${errorText}`);
                        }
                    } catch (error) {
                        console.error('Error deleting user:', error);
                        alert('Lỗi khi xóa người dùng!');
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const user = await getCurrentUser();
        if (!user || !user.id) {
            window.location.href = "../../Hi-Tech/Login.html";
            return;
        }

        if (user.role.toLowerCase() !== 'admin') {
            window.location.href = "../../Hi-Tech/Login.html";
            return;
        }

        window.currentAuthorId = user.id;
        window.currentUser = user;
        updateAdminInfo(user);

        const token = getCookie('token');
        await fetchUsers(token);
    } catch (error) {
        console.error("Lỗi khi tải thông tin người dùng:", error);
        window.location.href = "../../Hi-Tech/Login.html";
    }
});