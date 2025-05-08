async function fetchCategories() {
    try {
        const res = await fetch('http://localhost:3000/api/categories/', {
            headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Fetch categories error:', errorText);
            throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
        }
        const data = await res.json();
        console.log('Categories API response:', data);
        return Array.isArray(data.categories) ? data.categories : [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

async function fetchLeagues() {
    try {
        const res = await fetch('http://localhost:3000/api/leagues/', {
            headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Fetch leagues error:', errorText);
            throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
        }
        const data = await res.json();
        console.log('Leagues API response:', data);
        const leagues = Array.isArray(data) ? data : Array.isArray(data.leagues) ? data.leagues : [];
        const normalizedLeagues = leagues.map(league => ({
            _id: league._id || league.id,
            name: league.name || 'Unknown League',
            type: league.type || 'League',
            parentCategory: league.parentCategory || null,
            slug: league.slug || '',
            logo_url: league.logo_url || ''
        }));
        console.log('Normalized leagues:', normalizedLeagues);
        window.leagues = normalizedLeagues;
        return normalizedLeagues;
    } catch (error) {
        console.error('Error fetching leagues:', error);
        window.leagues = [];
        return [];
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
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

function formatDate(isoDate) {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
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
        console.log('User Name:', username);
        console.log('User Role:', role);
        console.log('User Avatar:', avatar);
        console.log('Full Payload:', payload);

        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            throw new Error("ID không hợp lệ, phải là ObjectId MongoDB!");
        }

        let userData = { id, username, role, avatar };
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/users/${id}/?_t=${Date.now()}`, {
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
                } else if (res.status === 401) {
                    const errorData = JSON.parse(errorText);
                    if (errorData.error === "jwt expired") {
                        const logoutLink = document.querySelector('li a#logout-link');
                        if (logoutLink) {
                            console.log('Token expired, triggering logout...');
                            logoutLink.click();
                            return null;
                        } else {
                            console.error('Logout link not found, redirecting to login manually');
                            window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
                            return null;
                        }
                    } else {
                        throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
                    }
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

async function fetchViewedArticles(userId, token, page = 1, limit = 6) {
    try {
        const res = await fetch(`${window.API_BASE_URL}/api/articles/viewed/${userId}/?page=${page}&limit=${limit}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token.trim()}`
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Fetch viewed articles failed:', errorText);
            throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        const data = await res.json();
        console.log('Viewed Articles API Response:', data);
        return {
            viewedArticles: Array.isArray(data.data.viewedArticles) ? data.data.viewedArticles : [],
            pagination: data.data.pagination || { total: 0, page: 1, limit: 6, totalPages: 1 }
        };
    } catch (error) {
        console.error('fetchViewedArticles Error:', error);
        return { viewedArticles: [], pagination: { total: 0, page: 1, limit: 6, totalPages: 1 } };
    }
}

async function deleteViewHistory(historyId, token) {
    try {
        const res = await fetch(`${window.API_BASE_URL}/api/articles/viewed/${historyId}`, {
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

// Make functions globally accessible for logout.js
window.getCookie = getCookie;
window.decodeJwt = decodeJwt;
window.getCurrentUser = getCurrentUser;
window.formatDate = formatDate;
window.fetchViewedArticles = fetchViewedArticles;
window.deleteViewHistory = deleteViewHistory;
window.API_BASE_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", function () {
    function updateAdminInfo(user) {
        document.getElementById('user-name').textContent = user.username || 'Unknown';
        document.getElementById('user-role').textContent = user.role ? user.role.toUpperCase() : 'Unknown';
        const profilePic = document.getElementById('profile-pic-upper');
        profilePic.src = user.avatar || 'img/defaultAvatar.jpg';
        profilePic.alt = `${user.username || 'User'}'s Avatar`;
    }

    function populateViewedArticlesTable(viewedArticles) {
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = '';

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
                <td>${history.ArticleID?.title || 'N/A'}</td>
                <td><img src="${history.ArticleID?.thumbnail || 'img/defaultThumbnail.jpg'}" alt="Ảnh bài báo" style="max-width: 100px;"></td>
                <td>${history.ArticleID?.CategoryID?.name || 'N/A'}</td>
                <td>${formatDate(history.viewed_at)}</td>
                <td>
                    <a href="Quang/baichitiet/html/baichitiet.html?slug=${history.ArticleID?.slug || ''}">
                        <i class="fa-regular fa-eye"></i>
                    </a>
                    <i></i>
                    <i class="fa-solid fa-trash-can" data-history-id="${history._id || ''}"></i>
                </td>
            `;
            tableBody.appendChild(row);
        });

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
                        const userId = (await getCurrentUser())?.id;
                        if (userId && token) {
                            const { pagination } = await fetchViewedArticles(userId, token, 1);
                            paginationInstance.updateTotalItems(pagination.total);
                            loadPage(userId, token, 1);
                        }
                    } catch (error) {
                        alert('Lỗi khi xóa lịch sử xem: ' + error.message);
                    }
                }
            });
        });
    }

    async function loadPage(userId, token, page = 1) {
        try {
            const { viewedArticles, pagination } = await fetchViewedArticles(userId, token, page);
            populateViewedArticlesTable(viewedArticles);
            if (paginationInstance) {
                paginationInstance.setPage(page);
                paginationInstance.updateTotalItems(pagination.total);
            }
        } catch (error) {
            console.error('loadPage Error:', error);
            const tableBody = document.getElementById('table-body');
            tableBody.innerHTML = '<tr><td colspan="5">Lỗi tải dữ liệu bài báo đã xem.</td></tr>';
        }
    }

    async function initialize() {
        try {
            const token = getCookie("token");
            if (!token) {
                window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
                return;
            }

            const user = await getCurrentUser();
            if (!user) return;

            updateAdminInfo(user);
            const { viewedArticles, pagination } = await fetchViewedArticles(user.id, token, 1);
            populateViewedArticlesTable(viewedArticles);

            // Initialize Pagination with class selector
            const paginationInstance = new Pagination('.pagination', pagination.total, pagination.limit, (page) => {
                loadPage(user.id, token, page);
            });
            window.paginationInstance = paginationInstance;
        } catch (error) {
            console.error('Initialize error:', error.message);
            if (!getCookie("token")) {
                window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
            } else {
                document.getElementById('user-name').textContent = 'Lỗi tải dữ liệu';
                document.getElementById('user-role').textContent = 'Unknown';
                document.getElementById('table-body').innerHTML = '<tr><td colspan="5">Lỗi tải dữ liệu người dùng.</td></tr>';
            }
        }
    }

    initialize();
});