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
        profilePic.src = user.avatar;
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

    // Fetch bookmarks for the user
    async function fetchBookmarks(userId, token) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookmarks/user/${userId}/`, {
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
            console.log('Bookmarks API Response:', data);
            return Array.isArray(data.data) ? data.data : [];
        } catch (error) {
            console.error('fetchBookmarks Error:', error);
            return [];
        }
    }

    // Delete a bookmark
    async function deleteBookmark(bookmarkId, token) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookmarks/${bookmarkId}/`, {
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
                console.log('Delete Bookmark Response:', data);
                return data; // Optionally return the response data if needed
            }

            return { success: true }; // If no JSON response, assume success
        } catch (error) {
            console.error('deleteBookmark Error:', error);
            throw error;
        }
    }

    // Populate the table with bookmarks
    function populateBookmarksTable(bookmarks) {
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = ''; // Clear the placeholder

        if (!Array.isArray(bookmarks)) {
            console.error('populateBookmarksTable Error: bookmarks is not an array:', bookmarks);
            tableBody.innerHTML = '<tr><td colspan="5">Lỗi: Dữ liệu bookmark không hợp lệ.</td></tr>';
            return;
        }

        if (bookmarks.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">Không có bài báo nào được lưu.</td></tr>';
            return;
        }

        bookmarks.forEach(bookmark => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bookmark.ArticleID?.title || 'N/A'}</td>
                <td><img src="${bookmark.ArticleID?.thumbnail}" alt="Ảnh bài báo" style="max-width: 100px;"></td>
                <td>${bookmark.ArticleID?.CategoryID?.name || 'N/A'}</td>
                <td>${formatDate(bookmark.ArticleID?.created_at)}</td>
                <td>
                    <a href="../Quang/baichitiet/html/baichitiet.html?articleId=${bookmark.ArticleID?._id || ''}">
                        <i class="fa-regular fa-eye"></i>
                    </a>
                    <i></i>
                    <i class="fa-solid fa-trash-can" data-bookmark-id="${bookmark._id || ''}"></i>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.fa-trash-can').forEach(button => {
            button.addEventListener('click', async (event) => {
                const bookmarkId = event.target.getAttribute('data-bookmark-id');
                if (bookmarkId && confirm('Bạn có chắc chắn muốn xóa bài báo này khỏi danh sách đã lưu?')) {
                    try {
                        const token = getCookie("token");
                        if (!token) {
                            throw new Error("Không tìm thấy token, vui lòng đăng nhập lại!");
                        }
                        await deleteBookmark(bookmarkId, token);
                        alert('Xóa bookmark thành công!');
                        event.target.closest('tr').remove();
                    } catch (error) {
                        alert('Lỗi khi xóa bài báo: ' + error.message);
                    }
                }
            });
        });
    }

    // Initialize: Fetch user data and bookmarks
    async function initialize() {
        try {
            const token = getCookie("token");
            if (!token) {
                alert('Vui lòng đăng nhập để xem thông tin cá nhân!');
                document.getElementById('user-name').textContent = 'Chưa đăng nhập';
                document.getElementById('user-role').textContent = 'Unknown';
                document.getElementById('table-body').innerHTML = '<tr><td colspan="5">Vui lòng đăng nhập để xem danh sách bài báo đã lưu.</td></tr>';
                return;
            }

            // Fetch user data
            const user = await getCurrentUser();
            updateAdminInfo(user);

            // Fetch and display bookmarks
            const bookmarks = await fetchBookmarks(user.id, token);
            console.log('Bookmarks before passing to populateBookmarksTable:', bookmarks);
            populateBookmarksTable(bookmarks);
        } catch (error) {
            alert('Lỗi: ' + error.message);
            document.getElementById('user-name').textContent = 'Lỗi tải dữ liệu';
            document.getElementById('user-role').textContent = 'Unknown';
            document.getElementById('table-body').innerHTML = '<tr><td colspan="5">Lỗi tải dữ liệu bài báo.</td></tr>';
        }
    }

    initialize();
});