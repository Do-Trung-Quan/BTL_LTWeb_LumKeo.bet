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
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
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
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function fetchCategories() {
    try {
        const res = await fetch('http://localhost:3000/api/categories/', { headers: { 'Accept': 'application/json' } });
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
        const res = await fetch('http://localhost:3000/api/leagues/', { headers: { 'Accept': 'application/json' } });
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

function updateAdminInfo(user) {
    document.getElementById('user-name').textContent = user.username || 'Unknown';
    document.getElementById('user-role').textContent = user.role ? user.role.toUpperCase() : 'Unknown';
    const profilePic = document.getElementById('profile-pic-upper');
    profilePic.src = user.avatar || 'img/defaultAvatar.jpg';
    profilePic.alt = `${user.username || 'User'}'s Avatar`;
}

async function getCurrentUser() {
    try {
        const token = getCookie('token');
        console.log('Token:', token);
        if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập!');
        const payload = decodeJwt(token);
        if (!payload) throw new Error('Token không hợp lệ!');
        const { id, username, role, avatar } = payload;
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) throw new Error('ID không hợp lệ!');
        let userData = { id, username, role, avatar };
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/users/${id}/?_t=${Date.now()}`, {
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token.trim()}` }
            });
            if (!res.ok) {
                const errorText = await res.text();
                if (res.status === 403) return userData;
                if (res.status === 401) {
                    const errorData = JSON.parse(errorText);
                    if (errorData.error === 'jwt expired') {
                        const logoutLink = document.querySelector('li a#logout-link');
                        if (logoutLink) logoutLink.click();
                        else window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
                        return null;
                    }
                    throw new Error(errorText);
                }
            }
            const data = await res.json();
            const user = data.user || data;
            userData = { id, username: user.username || username, role: user.role || role, avatar: user.avatar || avatar };
        } catch (apiError) {
            console.warn('Falling back to token data:', apiError);
        }
        return userData;
    } catch (error) {
        console.error('getCurrentUser Error:', error);
        throw error;
    }
}

function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

async function fetchBookmarks(userId, token, page = 1, limit = 6, category = 'Tất cả', keyword = '') {
    try {
        const queryParams = new URLSearchParams({ page, limit });
        if (category !== 'Tất cả') queryParams.append('category', category);
        if (keyword) queryParams.append('keyword', keyword);

        const res = await fetch(`${window.API_BASE_URL}/api/bookmarks/user/${userId}/?${queryParams.toString()}`, {
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Fetch bookmarks failed:', errorText);
            throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
        }
        const data = await res.json();
        console.log('Bookmarks API Response:', data);
        return {
            bookmarks: Array.isArray(data.data?.bookmarks) ? data.data.bookmarks : [],
            total: data.data?.pagination?.total || 0,
            page: data.data?.pagination?.page || page,
            limit: data.data?.pagination?.limit || limit
        };
    } catch (error) {
        console.error('fetchBookmarks Error:', error);
        return { bookmarks: [], total: 0, page: 1, limit: 6 };
    }
}

async function deleteBookmark(bookmarkId, token) {
    try {
        const res = await fetch(`${window.API_BASE_URL}/api/bookmarks/${bookmarkId}/`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token.trim()}` }
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json().then(data => data).catch(() => ({ success: true }));
    } catch (error) {
        console.error('deleteBookmark Error:', error);
        throw error;
    }
}

function populateTable(bookmarks, tableBodyId, currentPage, category, keyword) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {
        console.error(`Table body not found for ID: ${tableBodyId}`);
        return;
    }
    tableBody.innerHTML = '';

    if (!Array.isArray(bookmarks)) {
        console.error('Invalid bookmarks array:', bookmarks);
        tableBody.innerHTML = '<tr><td colspan="5">Lỗi: Dữ liệu không hợp lệ.</td></tr>';
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
            <td><img src="${bookmark.ArticleID?.thumbnail || 'img/defaultThumbnail.jpg'}" alt="Ảnh bài báo" style="max-width: 100px;"></td>
            <td>${bookmark.ArticleID?.CategoryID?.name || 'N/A'}</td>
            <td>${formatDate(bookmark.created_at)}</td>
            <td>
                <a href="../Quang/baichitiet/html/baichitiet.html?slug=${bookmark.ArticleID?.slug}">
                    <i class="fa-regular fa-eye"></i>
                </a>
                <i></i>
                <i class="fa-solid fa-trash-can delete-btn" data-bookmark-id="${bookmark._id || ''}"></i>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const bookmarkId = e.target.getAttribute('data-bookmark-id');
            if (bookmarkId && confirm('Bạn có chắc chắn muốn xóa bài báo này khỏi danh sách đã lưu?')) {
                try {
                    const token = getCookie('token');
                    if (!token) throw new Error('Không tìm thấy token!');
                    await deleteBookmark(bookmarkId, token);
                    alert('Xóa bookmark thành công!');
                    // Reset to page 1 after deletion to ensure correct pagination
                    const params = new URLSearchParams(window.location.search);
                    params.set('page', '1');
                    window.history.pushState({}, '', `?${params.toString()}`);
                    initializeTables(1, category, keyword);
                } catch (error) {
                    alert('Lỗi: ' + error.message);
                }
            }
        });
    });
}

let bookmarksPagination;

function resetPagination(total, page) {
    bookmarksPagination = new Pagination('.pagination', total, 6, (newPage) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', newPage);
        window.history.pushState({}, '', `?${params.toString()}`);
        const updatedParams = new URLSearchParams(window.location.search);
        const category = updatedParams.get('category') || 'Tất cả';
        const keyword = updatedParams.get('keyword') || '';
        initializeTables(newPage, category, keyword);
    });
    bookmarksPagination.setPage(page);
}

async function initializeTables(page = 1, category = 'Tất cả', keyword = '') {
    const token = getCookie('token');
    const searchBox = document.querySelector('.search-box');
    if (searchBox && searchBox.value.trim() === '' && keyword !== '') {
        keyword = '';
    }

    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get('category') || category;
    const urlKeyword = params.get('keyword') || keyword;

    const bookmarksData = await fetchBookmarks(window.currentUser.id, token, page, 6, urlCategory, urlKeyword);
    console.log('Bookmarks data:', bookmarksData);
    console.log('Current filters - category:', urlCategory, 'keyword:', urlKeyword);

    populateTable(bookmarksData.bookmarks, 'table-body', page, urlCategory, urlKeyword);

    resetPagination(bookmarksData.total, page);
}

async function populateTheLoaiDropdown(categories, leagues) {
    const theLoaiMenu = document.getElementById('theLoai-menu');
    if (!theLoaiMenu) {
        console.error('TheLoai menu element not found');
        return;
    }

    try {
        theLoaiMenu.innerHTML = '<li><a href="#" data-category="">Đang tải...</a></li>';

        theLoaiMenu.innerHTML = '<li><a href="#" data-category="Tất cả">Tất cả</a></li>';

        const categoryItems = categories
            .filter(cat => cat.type === 'Category' && cat.name !== 'Giải đấu')
            .map(category => `<li><a href="#" data-category="${category.name}" data-type="category" data-id="${category._id}">${category.name}</a></li>`)
            .join('');

        const leagueItems = leagues
            .filter(league => league.type === 'League')
            .map(league => {
                const logo = league.logo_url ? `<img src="${league.logo_url}" alt="${league.name}" style="width: 20px; margin-right: 5px;">` : '';
                return `<li><a href="#" data-category="${league.name}" data-type="league" data-id="${league._id}">${logo}${league.name}</a></li>`;
            })
            .join('');

        theLoaiMenu.innerHTML += categoryItems + leagueItems;

        theLoaiMenu.querySelectorAll('a').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const selectedCategory = e.target.getAttribute('data-category');
                const params = new URLSearchParams(window.location.search);
                params.set('page', '1');
                params.set('category', selectedCategory);
                const keyword = params.get('keyword') || '';
                window.history.pushState({}, '', `?${params.toString()}`);
                initializeTables(1, selectedCategory, keyword);
            });
        });

        console.log('TheLoai dropdown populated successfully');
    } catch (error) {
        console.error('Error populating TheLoai dropdown:', error);
        theLoaiMenu.innerHTML = '<li><a href="#" data-category="Tất cả">Tất cả</a></li>' +
                                '<li><a href="#" data-category="">Không có thể loại</a></li>';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await getCurrentUser();
        if (!user || !user.id) {
            window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
            return;
        }

        window.currentUser = user;
        updateAdminInfo(user);

        const categories = await fetchCategories();
        const leagues = await fetchLeagues();
        await populateTheLoaiDropdown(categories, leagues);

        const params = new URLSearchParams(window.location.search);
        const page = parseInt(params.get('page')) || 1;
        const category = params.get('category') || 'Tất cả';
        const keyword = params.get('keyword') || '';

        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.value = keyword;
            const debouncedFetch = debounce(async (kw) => {
                const params = new URLSearchParams(window.location.search);
                params.set('page', '1');
                if (kw) params.set('keyword', kw);
                else params.delete('keyword');
                const selectedCategory = params.get('category') || 'Tất cả';
                window.history.pushState({}, '', `?${params.toString()}`);
                await initializeTables(1, selectedCategory, kw);
            }, 300);

            searchBox.addEventListener('input', (e) => {
                const keyword = e.target.value.trim();
                debouncedFetch(keyword);
            });

            searchBox.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const keyword = e.target.value.trim();
                    debouncedFetch(keyword);
                }
            });
        }

        initializeTables(page, category, keyword);
    } catch (error) {
        console.error('Initialization error:', error);
        if (!getCookie('token')) {
            window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
        } else {
            document.getElementById('user-name').textContent = 'Lỗi';
            document.getElementById('user-role').textContent = 'Unknown';
            document.getElementById('table-body').innerHTML = '<tr><td colspan="5">Lỗi tải dữ liệu.</td></tr>';
        }
    }
});

window.getCookie = getCookie;
window.decodeJwt = decodeJwt;
window.getCurrentUser = getCurrentUser;
window.formatDate = formatDate;
window.fetchBookmarks = fetchBookmarks;
window.deleteBookmark = deleteBookmark;
window.API_BASE_URL = 'http://localhost:3000';