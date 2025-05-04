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
        // Preserve all fields, ensure _id and name are present
        const normalizedLeagues = leagues.map(league => ({
            _id: league._id || league.id,
            name: league.name || 'Unknown League',
            type: league.type || 'League',
            parentCategory: league.parentCategory || null,
            slug: league.slug || '',
            logo_url: league.logo_url || ''
        }));
        console.log('Normalized leagues:', normalizedLeagues);
        window.leagues = normalizedLeagues; // Assign to window.leagues
        return normalizedLeagues;
    } catch (error) {
        console.error('Error fetching leagues:', error);
        window.leagues = [];
        return [];
    }
}

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

// Fetch articles by published state
async function fetchArticles(publishedState, token) {
    try {
        const res = await fetch(`http://localhost:3000/api/articles/published/${publishedState}/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const articles = await res.json();
        return Array.isArray(articles) ? articles : articles.articles || [];
    } catch (error) {
        console.error(`Error fetching ${publishedState} articles:`, error);
        return [];
    }
}

// Populate table with articles
function populateTable(articles, tableBodyId, isPublished) {
    const tableBody = document.getElementById(tableBodyId);
    tableBody.innerHTML = ''; // Clear existing rows

    articles.forEach(article => {
        console.log('Article data:', article);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${article.title}</td>
            <td><img src="${article.thumbnail}" alt="Ảnh bài báo"></td>
            <td>${article.CategoryID?.name}</td>
            <td>${article.published_date ? new Date(article.published_date).toLocaleDateString('vi-VN') : 'Chờ duyệt'}</td>
            <td>
                ${isPublished ? 
                    `<a href="../Quang/baichitiet/html/baichitiet.html?articleId=${article._id}">
                        <i class="fa-regular fa-eye"></i>
                    </a>` : 
                    `<i class="fa-regular fa-eye view-btn" data-article-id="${article._id}"></i>`}
                ${!isPublished ? 
                    `<i class="fa-solid fa-check approve-btn" data-article-id="${article._id}"></i>` : ''}
                <i class="fa-solid fa-trash-can delete-btn" data-article-id="${article._id}"></i>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listeners for actions
    if (!isPublished) {
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const articleId = button.getAttribute('data-article-id'); // Use button directly to avoid e.target issues
                console.log('Clicked articleId:', articleId); // Debug the articleId
                if (!articleId || typeof articleId !== 'string') {
                    console.error('Invalid articleId:', articleId);
                    alert('Không thể mở bài báo: ID không hợp lệ!');
                    return;
                }
                await openModal(articleId);
            });
        });

        document.querySelectorAll('.approve-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const articleId = e.target.getAttribute('data-article-id');
                try {
                    const token = getCookie('token');
                    const res = await fetch(`http://localhost:3000/api/articles/${articleId}/publish/`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    });
                    if (res.ok) {
                        alert('Bài báo đã được duyệt thành công!');
                        initializeTables(); // Refresh both tables
                    } else {
                        const errorText = await res.text();
                        alert(`Lỗi: ${errorText}`);
                    }
                } catch (error) {
                    console.error('Error approving article:', error);
                    alert('Lỗi khi duyệt bài báo!');
                }
            });
        });
    }

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const articleId = e.target.getAttribute('data-article-id');
            if (confirm(`Bạn có chắc chắn muốn xóa bài báo với ID: ${articleId}?`)) {
                try {
                    const token = getCookie('token');
                    const res = await fetch(`http://localhost:3000/api/articles/${articleId}/`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    });
                    if (res.ok) {
                        alert('Bài báo đã được xóa thành công!');
                        initializeTables(); // Refresh both tables
                    } else {
                        const errorText = await res.text();
                        alert(`Lỗi: ${errorText}`);
                    }
                } catch (error) {
                    console.error('Error deleting article:', error);
                    alert('Lỗi khi xóa bài báo!');
                }
            }
        });
    });
}

// Open modal with article details (view-only)
async function openModal(articleId) {
    const modal = document.getElementById('article-modal');
    const token = getCookie('token');

    try {
        const res = await fetch(`http://localhost:3000/api/articles/${articleId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const article = await res.json();
        console.log('Fetched article:', article);

        document.getElementById('modal-breadcrumb-link').textContent = 'Trang chủ';
        document.getElementById('modal-breadcrumb-link').href = '#';
        document.getElementById('modal-breadcrumb-category').textContent = article.CategoryID?.name;
        document.getElementById('modal-breadcrumb-category').href = '#';
        document.getElementById('modal-title').textContent = article.title || 'N/A';
        document.getElementById('modal-summary').textContent = article.summary;
        document.getElementById('modal-image').src = article.thumbnail;
        document.getElementById('modal-content').textContent = article.content;
        document.getElementById('modal-author-signature').textContent = `Tác giả: ${article.UserID?.username}`;
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching article details:', error);
        alert('Lỗi khi tải chi tiết bài báo!');
    }

    document.getElementById('close-modal').onclick = () => {
        modal.style.display = 'none';
    };
}

// Initialize tables
async function initializeTables() {
    const token = getCookie('token');
    const publishedArticles = await fetchArticles('published', token);
    const unpublishedArticles = await fetchArticles('unpublished', token);

    populateTable(publishedArticles, 'published-body', true);
    populateTable(unpublishedArticles, 'unpublished-body', false);
}

// Toggle between tables
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const user = await getCurrentUser();
        if (!user || !user.id) {
            alert("Vui lòng đăng nhập để quản lý bài viết!");
            window.location.href = "../../Hi-Tech/Login.html";
            return;
        }
        window.currentAuthorId = user.id;
        window.currentUser = user;
        updateAdminInfo(user);

        await fetchCategories();
        await fetchLeagues();

        const publishedBtn = document.getElementById('published-btn');
        const unpublishedBtn = document.getElementById('unpublished-btn');
        const publishedTable = document.getElementById('published-table');
        const unpublishedTable = document.getElementById('unpublished-table');

        publishedBtn.addEventListener('click', () => {
            publishedBtn.classList.add('active_btn');
            unpublishedBtn.classList.remove('active_btn');
            publishedTable.style.display = 'block';
            unpublishedTable.style.display = 'none';
        });

        unpublishedBtn.addEventListener('click', () => {
            unpublishedBtn.classList.add('active_btn');
            publishedBtn.classList.remove('active_btn');
            unpublishedTable.style.display = 'block';
            publishedTable.style.display = 'none';
        });

        initializeTables();
    } catch (error) {
        console.error("Lỗi khi tải thông tin tác giả:", error);
        window.location.href = "../../Hi-Tech/Login.html";
    }
});