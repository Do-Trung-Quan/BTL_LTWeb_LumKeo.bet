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

// Debounce function to limit API calls during typing
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

async function fetchArticles(publishedState, token, page = 1, limit = 6, category = 'Tất cả', keyword = '') {
    try {
        const queryParams = new URLSearchParams({ page, limit });
        if (category && category !== 'Tất cả') {
            queryParams.append('category', category);
        }
        if (keyword) {
            queryParams.append('keyword', keyword);
        }

        const res = await fetch(`http://localhost:3000/api/articles/published/${publishedState}/?${queryParams.toString()}`, {
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

function populateTable(articles, tableBodyId, isPublished, currentPage, category, keyword) {
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
                        initializeTables(currentPage, category, keyword); // Refresh with current filters
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
                        initializeTables(currentPage, category, keyword); // Refresh with current filters
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
        // Fetch article by ID
        const res = await fetch(`http://localhost:3000/api/articles/${articleId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const article = await res.json();

        // Populate breadcrumb and basic info
        document.getElementById('modal-breadcrumb-link').textContent = 'Trang chủ';
        document.getElementById('modal-breadcrumb-link').href = '#';
        document.getElementById('modal-breadcrumb-category').textContent = article.CategoryID?.name || 'N/A';
        document.getElementById('modal-breadcrumb-category').href = '#';
        document.getElementById('modal-title').textContent = article.title || 'N/A';
        document.getElementById('modal-summary').textContent = article.summary || 'N/A';
        document.getElementById('modal-author-signature').textContent = `Tác giả: ${article.UserID?.username || 'N/A'}`;

        // Split content into sections using both \r\n\r\n and \n\n
        const sections = article.content?.split(/(\r\n\r\n|\n\n)/).filter(section => section.trim().length > 0);
        const contentContainer = document.getElementById('modal-content');
        contentContainer.innerHTML = '';

        if (sections && sections.length > 2) {
            // First two sections
            for (let index = 0; index < 2; index++) {
                const section = sections[index];
                const sectionElement = document.createElement('div');
                sectionElement.className = 'dynamic-section';

                const lines = section.split(/(\r\n|\n)/).filter(line => line.trim().length > 0);
                if (lines.length > 1 && lines[0].length < 100) {
                    const heading = document.createElement('h3');
                    heading.textContent = lines[0];
                    sectionElement.appendChild(heading);

                    lines.slice(1).forEach(line => {
                        if (line.trim()) {
                            const para = document.createElement('p');
                            para.textContent = line;
                            sectionElement.appendChild(para);
                        }
                    });
                } else {
                    lines.forEach(line => {
                        if (line.trim()) {
                            const para = document.createElement('p');
                            para.textContent = line;
                            sectionElement.appendChild(para);
                        }
                    });
                }

                contentContainer.appendChild(sectionElement);
            }

            // Insert thumbnail after the second section (single instance)
            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.className = 'article-thumbnail';
            const thumbnailImg = document.createElement('img');
            thumbnailImg.src = article.thumbnail || '../image/img-sidebar/main-pic.png';
            thumbnailImg.alt = 'Article Thumbnail';
            thumbnailImg.style.maxWidth = '100%';
            thumbnailContainer.appendChild(thumbnailImg);
            contentContainer.appendChild(thumbnailContainer);

            // Hide default image container to avoid duplication
            const imgContainer = document.querySelector('.modal-content .img-container');
            if (imgContainer) imgContainer.style.display = 'none';

            // Remaining sections
            for (let index = 2; index < sections.length; index++) {
                const section = sections[index];
                const sectionElement = document.createElement('div');
                sectionElement.className = 'dynamic-section';

                const lines = section.split(/(\r\n|\n)/).filter(line => line.trim().length > 0);
                if (lines.length > 1 && lines[0].length < 100) {
                    const heading = document.createElement('h3');
                    heading.textContent = lines[0];
                    sectionElement.appendChild(heading);

                    lines.slice(1).forEach(line => {
                        if (line.trim()) {
                            const para = document.createElement('p');
                            para.textContent = line;
                            sectionElement.appendChild(para);
                        }
                    });
                } else {
                    lines.forEach(line => {
                        if (line.trim()) {
                            const para = document.createElement('p');
                            para.textContent = line;
                            sectionElement.appendChild(para);
                        }
                    });
                }

                contentContainer.appendChild(sectionElement);
            }
        } else {
            // Original logic for 2 or fewer sections
            if (sections) {
                sections.forEach((section, index) => {
                    const sectionElement = document.createElement('div');
                    sectionElement.className = 'dynamic-section';

                    const lines = section.split(/(\r\n|\n)/).filter(line => line.trim().length > 0);
                    if (lines.length > 1 && lines[0].length < 100) {
                        const heading = document.createElement('h3');
                        heading.textContent = lines[0];
                        sectionElement.appendChild(heading);

                        lines.slice(1).forEach(line => {
                            if (line.trim()) {
                                const para = document.createElement('p');
                                para.textContent = line;
                                sectionElement.appendChild(para);
                            }
                        });
                    } else {
                        lines.forEach(line => {
                            if (line.trim()) {
                                const para = document.createElement('p');
                                para.textContent = line;
                                sectionElement.appendChild(para);
                            }
                        });
                    }

                    contentContainer.appendChild(sectionElement);
                    if (index === 0) {
                        const imgContainer = document.querySelector('.modal-content .img-container');
                        if (imgContainer) imgContainer.style.display = 'block';
                    }
                });
            } else {
                const para = document.createElement('p');
                para.textContent = 'N/A';
                contentContainer.appendChild(para);
            }

            // Update main image for 2 or fewer sections
            const modalImage = document.getElementById('modal-image');
            if (modalImage) {
                modalImage.src = article.thumbnail || '../image/img-sidebar/main-pic.png';
                modalImage.alt = article.title || 'Hình ảnh bài viết';
            }
        }
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

// Function to reset pagination when filters change
function resetPagination(totalPublished, totalUnpublished, page) {
    publishedPagination = new Pagination('#published-table .pagination', totalPublished, 6, (newPage) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', newPage);
        window.history.pushState({}, '', `?${params.toString()}`);
        const updatedParams = new URLSearchParams(window.location.search);
        const category = updatedParams.get('category') || 'Tất cả';
        const keyword = updatedParams.get('keyword') || '';
        initializeTables(newPage, category, keyword);
    });
    publishedPagination.setPage(page);

    unpublishedPagination = new Pagination('#unpublished-table .pagination', totalUnpublished, 6, (newPage) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', newPage);
        window.history.pushState({}, '', `?${params.toString()}`);
        const updatedParams = new URLSearchParams(window.location.search);
        const category = updatedParams.get('category') || 'Tất cả';
        const keyword = updatedParams.get('keyword') || '';
        initializeTables(newPage, category, keyword);
    });
    unpublishedPagination.setPage(page);
}

async function initializeTables(page = 1, category = 'Tất cả', keyword = '') {
    const token = getCookie('token');
    const searchBox = document.querySelector('.search-box');
    if (searchBox && searchBox.value.trim() === '' && keyword !== '') {
        keyword = ''; // Reset keyword if search box is empty
    }

    // Always use the latest category and keyword from URL if available
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get('category') || category;
    const urlKeyword = params.get('keyword') || keyword;

    const publishedData = await fetchArticles('published', token, page, 6, urlCategory, urlKeyword);
    const unpublishedData = await fetchArticles('unpublished', token, page, 6, urlCategory, urlKeyword);

    console.log('Published data:', publishedData);
    console.log('Unpublished data:', unpublishedData);
    console.log('Pagination constructor available:', typeof Pagination !== 'undefined');
    console.log('Current filters - category:', urlCategory, 'keyword:', urlKeyword);

    populateTable(publishedData.articles, 'published-body', true, page, urlCategory, urlKeyword);
    populateTable(unpublishedData.articles, 'unpublished-body', false, page, urlCategory, urlKeyword);

    // Reset pagination to ensure the callback uses the latest filters
    resetPagination(publishedData.total, unpublishedData.total, page);
}

async function populateTheLoaiDropdown(categories, leagues) {
    const theLoaiMenu = document.getElementById('theLoai-menu');
    if (!theLoaiMenu) {
        console.error('TheLoai menu element not found');
        return;
    }

    try {
        // Show loading state
        theLoaiMenu.innerHTML = '<li><a href="#" data-category="">Đang tải...</a></li>';

        // Add the "Tất cả" option
        theLoaiMenu.innerHTML = '<li><a href="#" data-category="Tất cả">Tất cả</a></li>';

        // Add all categories (type: 'Category'), excluding "Giải đấu"
        const categoryItems = categories
            .filter(cat => cat.type === 'Category' && cat.name !== 'Giải đấu')
            .map(category => {
                return `<li><a href="#" data-category="${category.name}" data-type="category" data-id="${category._id}">${category.name}</a></li>`;
            })
            .join('');

        // Add all leagues (type: 'League') without filtering
        const leagueItems = leagues
            .filter(league => league.type === 'League')
            .map(league => {
                const logo = league.logo_url ? `<img src="${league.logo_url}" alt="${league.name}" style="width: 20px; margin-right: 5px;">` : '';
                return `<li><a href="#" data-category="${league.name}" data-type="league" data-id="${league._id}">${logo}${league.name}</a></li>`;
            })
            .join('');

        // Append all items to the menu
        theLoaiMenu.innerHTML += categoryItems + leagueItems;

        // Add event listeners to dropdown items
        theLoaiMenu.querySelectorAll('a').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const selectedCategory = e.target.getAttribute('data-category');
                const params = new URLSearchParams(window.location.search);
                params.set('page', '1'); // Reset to page 1 on new filter
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

        const categories = await fetchCategories();
        const leagues = await fetchLeagues();
        await populateTheLoaiDropdown(categories, leagues);

        const params = new URLSearchParams(window.location.search);
        const page = parseInt(params.get('page')) || 1;
        const category = params.get('category') || 'Tất cả';
        const keyword = params.get('keyword') || '';

        // Update search box with keyword from URL
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.value = keyword;
        }

        const publishedBtn = document.getElementById('published-btn');
        const unpublishedBtn = document.getElementById('unpublished-btn');
        const publishedTable = document.getElementById('published-table');
        const unpublishedTable = document.getElementById('unpublished-table');

        publishedBtn.addEventListener('click', () => {
            publishedBtn.classList.add('active_btn');
            unpublishedBtn.classList.remove('active_btn');
            publishedTable.style.display = 'block';
            unpublishedTable.style.display = 'none';
            const params = new URLSearchParams(window.location.search);
            const page = parseInt(params.get('page')) || 1;
            const category = params.get('category') || 'Tất cả';
            const keyword = params.get('keyword') || '';
            initializeTables(page, category, keyword);
        });

        unpublishedBtn.addEventListener('click', () => {
            unpublishedBtn.classList.add('active_btn');
            publishedBtn.classList.remove('active_btn');
            unpublishedTable.style.display = 'block';
            publishedTable.style.display = 'none';
            const params = new URLSearchParams(window.location.search);
            const page = parseInt(params.get('page')) || 1;
            const category = params.get('category') || 'Tất cả';
            const keyword = params.get('keyword') || '';
            initializeTables(page, category, keyword);
        });

        // Add search functionality
        if (searchBox) {
            const debouncedFetch = debounce(async (keyword) => {
                const params = new URLSearchParams(window.location.search);
                params.set('page', '1'); // Reset to page 1 on new search
                if (keyword) {
                    params.set('keyword', keyword);
                } else {
                    params.delete('keyword');
                }
                const selectedCategory = params.get('category') || 'Tất cả';
                window.history.pushState({}, '', `?${params.toString()}`);
                await initializeTables(1, selectedCategory, keyword);
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
        console.error('User initialization error:', error.message);
        if (!getCookie("token")) {
            window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
        }
    }
});