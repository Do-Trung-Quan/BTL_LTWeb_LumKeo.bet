document.addEventListener("DOMContentLoaded", function () {
    const API_BASE_URL = "http://localhost:3000";

    // Helper: Get cookie value
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
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

    // Helper: Format date from ISO string (e.g., "2025-04-20T10:07:58.676Z" to "20/04/2025")
    function formatDate(isoDate) {
        if (!isoDate) return 'N/A';
        const date = new Date(isoDate);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }); // Outputs "20/04/2025"
    }

    // Update user info display
    function updateAdminInfo(user) {
        document.getElementById('user-name').textContent = user.username || 'Unknown';
        document.getElementById('user-role').textContent = user.role ? user.role.toUpperCase() : 'Unknown';
        const profilePic = document.getElementById('profile-pic-upper');
        profilePic.src = user.avatar || 'img/defaultAvatar.jpg'; // Fallback to default image
        profilePic.alt = `${user.username || 'User'}'s Avatar`;
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
            console.log('User Avatar:', avatar);
            console.log('Full Payload:', payload);

            if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
                throw new Error("ID không hợp lệ, phải là ObjectId MongoDB!");
            }

            let userData = { id, username, role, avatar };
            try {
                const res = await fetch(`${API_BASE_URL}/api/users/${id}/?_t=${Date.now()}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token.trim()}`
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
                console.log('User API Response:', data);
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

    // Fetch viewed articles for the user
    async function fetchViewedArticles(userId, token) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/articles/viewed/${userId}/`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token.trim()}`
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
            }

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Response is not JSON');
            }

            const data = await res.json();
            console.log('Viewed Articles API Response:', data);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('fetchViewedArticles Error:', error);
            return [];
        }
    }

    // Delete a view history record
    async function deleteViewHistory(historyId, token) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/articles/viewed/${historyId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token.trim()}`
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
            }

            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await res.json();
                console.log('Delete View History Response:', data);
                return data;
            }

            return { success: true };
        } catch (error) {
            console.error('deleteViewHistory Error:', error);
            throw error;
        }
    }

    // Populate the table with viewed articles
    function populateViewedArticlesTable(viewedArticles) {
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = ''; // Clear the placeholder

        if (!Array.isArray(viewedArticles)) {
            console.error('populateViewedArticlesTable Error: viewedArticles is not an array:', viewedArticles);
            tableBody.innerHTML = '<tr><td colspan="5">Lỗi: Dữ liệu lịch sử xem không hợp lệ.</td></tr>';
            return;
        }

        if (viewedArticles.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">Không có bài báo nào đã xem.</td></tr>';
            return;
        }

        viewedArticles.forEach(history => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${history.ArticleID?.title}</td>
                <td><img src="${history.ArticleID?.thumbnail}" alt="Ảnh bài báo" style="max-width: 100px;"></td>
                <td>${history.ArticleID?.CategoryID?.name}</td>
                <td>${formatDate(history.ArticleID?.created_at)}</td>
                <td>
                    <a href="../Quang/baichitiet/html/baichitiet.html?articleId=${history.ArticleID?._id || ''}">
                        <i class="fa-regular fa-eye"></i>
                    </a>
                    <i></i>
                    <i class="fa-solid fa-trash-can" data-history-id="${history._id || ''}"></i>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.fa-trash-can').forEach(button => {
            button.addEventListener('click', async (event) => {
                const historyId = event.target.getAttribute('data-history-id');
                if (historyId && confirm('Bạn có chắc chắn muốn xóa bài báo này khỏi lịch sử xem?')) {
                    try {
                        const token = getCookie("token");
                        if (!token) {
                            throw new Error("Không tìm thấy token, vui lòng đăng nhập lại!");
                        }
                        await deleteViewHistory(historyId, token);
                        alert('Xóa lịch sử xem thành công!');
                        event.target.closest('tr').remove();
                    } catch (error) {
                        alert('Lỗi khi xóa lịch sử xem: ' + error.message);
                    }
                }
            });
        });
    }

    // Initialize: Fetch user data and viewed articles
    async function initialize() {
        try {
            const token = getCookie("token");
            if (!token) {
                alert('Vui lòng đăng nhập để xem thông tin cá nhân!');
                document.getElementById('user-name').textContent = 'Chưa đăng nhập';
                document.getElementById('user-role').textContent = 'Unknown';
                document.getElementById('table-body').innerHTML = '<tr><td colspan="5">Vui lòng đăng nhập để xem lịch sử bài báo đã xem.</td></tr>';
                return;
            }

            // Fetch user data
            const user = await getCurrentUser();
            updateAdminInfo(user);

            // Fetch and display viewed articles
            const viewedArticles = await fetchViewedArticles(user.id, token);
            console.log('Viewed Articles before passing to populateViewedArticlesTable:', viewedArticles);
            populateViewedArticlesTable(viewedArticles);
        } catch (error) {
            alert('Lỗi: ' + error.message);
            document.getElementById('user-name').textContent = 'Lỗi tải dữ liệu';
            document.getElementById('user-role').textContent = 'Unknown';
            document.getElementById('table-body').innerHTML = '<tr><td colspan="5">Lỗi tải dữ liệu lịch sử xem.</td></tr>';
        }
    }

    initialize();
});