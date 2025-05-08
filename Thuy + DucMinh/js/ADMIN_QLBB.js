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

function updateAdminInfo(user) {
    document.getElementById('user-name').textContent = user.username || 'Unknown';
    document.getElementById('user-role').textContent = user.role.toUpperCase() || 'Unknown';
    const profilePic = document.getElementById('profile-pic-upper');
    profilePic.src = user.avatar;
    profilePic.alt = `${user.username}'s Avatar`;
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

async function fetchArticles(publishedState, token, page = 1, limit = 6) {
    try {
        const res = await fetch(`http://localhost:3000/api/articles/published/${publishedState}/?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Fetch articles error (${publishedState}):`, errorText);
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();
        console.log(`API response for ${publishedState} articles:`, data);
        return {
            articles: Array.isArray(data.data?.articles) ? data.data.articles : [],
            total: data.data?.pagination?.total || 0,
            page: data.data?.pagination?.page || page,
            limit: data.data?.pagination?.limit || limit
        };
    } catch (error) {
        console.error(`Error fetching ${publishedState} articles:`, error);
        return { articles: [], total: 0, page: 1, limit: 6 };
    }
}

function populateTable(articles, tableBodyId, isPublished, currentPage) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {
        console.error(`Table body not found for ID: ${tableBodyId}`);
        return;
    }
    tableBody.innerHTML = ''; // Clear existing rows

    if (articles.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">Không có bài báo nào.</td></tr>';
        return;
    }

    articles.forEach(article => {
        console.log('Article data:', article);
        const generatedUrl = `http://127.0.0.1:5500/Quang/baichitiet/html/baichitiet.html?slug=${article.slug}`;
        console.log('Generated URL for article:', generatedUrl);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${article.title || 'N/A'}</td>
            <td><img src="${article.thumbnail || ''}" alt="Ảnh bài báo" style="max-width: 100px;"></td>
            <td>${article.CategoryID?.name || 'N/A'}</td>
            <td>${article.published_date ? new Date(article.published_date).toLocaleDateString('vi-VN') : 'Chờ duyệt'}</td>
            <td>
                ${isPublished ? 
                    `<a href="${generatedUrl}">
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
                const articleId = button.getAttribute('data-article-id');
                console.log('Clicked articleId:', articleId);
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
                        initializeTables(currentPage); // Refresh with current page
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
                        initializeTables(currentPage); // Refresh with current page
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

async function openModal(articleId) {
    const modal = document.getElementById('article-modal');
    const token = getCookie('token');

    try {
        // Fetch article ID by slug (if needed in future, but here we use ID directly)
        const slugToIdResponse = await fetch(`http://localhost:3000/api/articles/slug-to-id/${articleId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (!slugToIdResponse.ok) {
            console.warn('Slug to ID fetch failed, falling back to ID fetch:', await slugToIdResponse.text());
        } else {
            const slugData = await slugToIdResponse.json();
            articleId = slugData.articleId || articleId; // Use ID from slug if valid
        }

        // Fetch article by ID
        const res = await fetch(`http://localhost:3000/api/articles/${articleId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const article = await res.json();
        const slug = article.slug;
        if (slug) {
            window.location.href = `http://127.0.0.1:5500/Quang/baichitiet/html/baichitiet.html?slug=${slug}`;
            return;
        }

        // Fallback to display modal with article data if slug is unavailable
        document.getElementById('modal-breadcrumb-link').textContent = 'Trang chủ';
        document.getElementById('modal-breadcrumb-link').href = '#';
        document.getElementById('modal-breadcrumb-category').textContent = article.CategoryID?.name || 'N/A';
        document.getElementById('modal-breadcrumb-category').href = '#';
        document.getElementById('modal-title').textContent = article.title || 'N/A';
        document.getElementById('modal-summary').textContent = article.summary || 'N/A';
        document.getElementById('modal-image').src = article.thumbnail || '';
        document.getElementById('modal-content').textContent = article.content || 'N/A';
        document.getElementById('modal-author-signature').textContent = `Tác giả: ${article.UserID?.username || 'N/A'}`;
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching article details:', error);
        alert('Lỗi khi tải chi tiết bài báo!');
    }

    document.getElementById('close-modal').onclick = () => {
        modal.style.display = 'none';
    };
}

let publishedPagination, unpublishedPagination;

async function initializeTables(page = 1) {
    const token = getCookie('token');
    const publishedData = await fetchArticles('published', token, page, 6);
    const unpublishedData = await fetchArticles('unpublished', token, page, 6);

    console.log('Published data:', publishedData);
    console.log('Unpublished data:', unpublishedData);
    console.log('Pagination constructor available:', typeof Pagination !== 'undefined');

    populateTable(publishedData.articles, 'published-body', true, page);
    populateTable(unpublishedData.articles, 'unpublished-body', false, page);

    // Initialize or update pagination for published articles
    if (!publishedPagination) {
        publishedPagination = new Pagination('#published-table .pagination', publishedData.total, 6, (newPage) => {
            initializeTables(newPage);
        });
        console.log('Initialized publishedPagination:', publishedPagination);
    } else {
        publishedPagination.updateTotalItems(publishedData.total);
        publishedPagination.setPage(page);
        console.log('Updated publishedPagination:', publishedPagination);
    }

    // Initialize or update pagination for unpublished articles
    if (!unpublishedPagination) {
        unpublishedPagination = new Pagination('#unpublished-table .pagination', unpublishedData.total, 6, (newPage) => {
            initializeTables(newPage);
        });
        console.log('Initialized unpublishedPagination:', unpublishedPagination);
    } else {
        unpublishedPagination.updateTotalItems(unpublishedData.total);
        unpublishedPagination.setPage(page);
        console.log('Updated unpublishedPagination:', unpublishedPagination);
    }
}

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

        window.currentUserId = user.id;
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
            initializeTables(1); // Reset to first page
        });

        unpublishedBtn.addEventListener('click', () => {
            unpublishedBtn.classList.add('active_btn');
            publishedBtn.classList.remove('active_btn');
            unpublishedTable.style.display = 'block';
            publishedTable.style.display = 'none';
            initializeTables(1); // Reset to first page
        });

        initializeTables(1);
    } catch (error) {
        console.error('User initialization error:', error.message);
        if (!getCookie("token")) {
            window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
        }
    }
});