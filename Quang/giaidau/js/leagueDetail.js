let currentPage = 1;
let totalArticles = 0;
let categoryId = null;
let pagination = null;

// Hàm tiện ích: Lấy cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Hàm tiện ích: Đặt cookie
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Hàm tiện ích: Giải mã JWT
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

// Fetch current user data (non-blocking for public content)
async function getCurrentUser() {
    try {
        const token = getCookie("token");
        console.log('getCurrentUser - Token from cookie:', token);

        if (!token) {
            console.log('No token found, user is unauthenticated');
            return null;
        }

        const payload = decodeJwt(token);
        console.log('getCurrentUser - Decoded payload:', payload);

        if (!payload) {
            console.log('Invalid token, treating as unauthenticated');
            return null;
        }

        const { id, username, role, avatar } = payload;
        console.log('Token payload:', { id, username, role, avatar });

        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            console.warn('Invalid ID format, treating as unauthenticated');
            return null;
        }

        const validationRes = await fetch('http://localhost:3000/api/validate-token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        console.log('getCurrentUser - Validation response status:', validationRes.status);

        if (!validationRes.ok) {
            const errorText = await validationRes.json();
            console.warn('Token validation failed:', errorText);
            if (validationRes.status === 401 || validationRes.status === 403) {
                console.log('Token blacklisted or invalid, treating as unauthenticated');
                if (errorText.message === 'jwt expired') {
                    console.log('Token expired, clearing cookie but not redirecting');
                    setCookie("token", "", -1);
                }
                return null;
            }
            throw new Error(`Token validation error: ${JSON.stringify(errorText)}`);
        }

        const validationData = await validationRes.json();
        if (!validationData.success) {
            console.log('Server rejected token, treating as unauthenticated');
            return null;
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
                if (res.status === 403 || res.status === 401) {
                    console.warn('Permission or token issue, treating as unauthenticated');
                    if (errorText.includes('jwt expired')) {
                        console.log('Token expired, clearing cookie but not redirecting');
                        setCookie("token", "", -1);
                    }
                    return null;
                }
                throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
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
            return userData.id ? userData : null;
        }

        return userData;
    } catch (error) {
        console.error('getCurrentUser Error:', error);
        return null;
    }
}

// Hàm tiện ích: Lấy leagueId từ slug trong query parameter
function getLeagueIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    const leagueMap = {
        "premier-league": "6819a52d3332d1810bdeacd3",
        "la-liga": "6817095e8fb809bc70ddb167",
        "serie-a": "6819a4ec3332d1810bdeac4b",
        "bundesliga": "6804be9c510d143012ff5363",
        "ligue-1": "6819a4813332d1810bdeac0e",
        "v-league": "6804becf510d143012ff5368"
    };
    const leagueId = leagueMap[slug];
    if (!leagueId) {
        console.error(`Không tìm thấy leagueId cho slug: ${slug}`);
        return null;
    }
    return leagueId;
}

// Hàm tiện ích: Format thời gian bài viết
function formatTimeAgo(timestamp) {
    const now = new Date();
    const articleTime = new Date(timestamp);
    const diffInMs = now - articleTime;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInSeconds / 3600);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return `${diffInDays} ngày trước`;
}

// Set user icon behavior based on authentication
async function setUserIconBehavior() {
    const userIcons = document.querySelectorAll('.account-button');
    if (userIcons.length === 0) {
        console.error('No user icons (account-button) found');
        return;
    }

    let user = null;
    try {
        user = await getCurrentUser();
    } catch (error) {
        console.error('Error fetching current user:', error.message);
    }

    userIcons.forEach((userIcon, index) => {
        // Kiểm tra xem userIcon có phải là DOM Node hợp lệ
        if (!(userIcon instanceof HTMLElement)) {
            console.error(`Invalid DOM element for account-button at index ${index}:`, userIcon);
            return;
        }

        // Xóa sự kiện click cũ (nếu có) để tránh gán lặp
        userIcon.replaceWith(userIcon.cloneNode(true));
        const newUserIcon = document.querySelectorAll('.account-button')[index];

        if (!user) {
            newUserIcon.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
            newUserIcon.addEventListener('click', (e) => {
                e.preventDefault(); // Ngăn hành vi mặc định của thẻ <a>
                console.log('Redirecting to login page');
                window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
            });
        } else {
            let redirectPage;
            switch (user.role?.toLowerCase()) {
                case 'admin':
                    redirectPage = '../../../Thuy + DucMinh/ADMIN_QLBB.html';
                    break;
                case 'author':
                    redirectPage = '../../../Thuy + DucMinh/AUTHOR_QLBV.html';
                    break;
                case 'user':
                    redirectPage = '../../../Thuy + DucMinh/USER_BBDL.html';
                    break;
                default:
                    redirectPage = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
                    console.warn('Unknown role:', user.role);
            }
            newUserIcon.href = redirectPage;
            newUserIcon.addEventListener('click', (e) => {
                e.preventDefault(); // Ngăn hành vi mặc định của thẻ <a>
                console.log(`Redirecting to ${redirectPage} for role: ${user.role}`);
                window.location.href = redirectPage;
            });
        }
        console.log(`Click event listener added to account-button at index ${index}:`, newUserIcon);
    });
}

// Hàm tiện ích: Fetch articles (allow unauthenticated access for public endpoints)
async function fetchArticles(endpoint) {
    const token = getCookie("token");
    const headers = {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token.trim()}` : ''
    };

    try {
        const res = await fetch(endpoint, { headers, credentials: 'include' });

        if (!res.ok) {
            const errorText = await res.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText || '{}');
            } catch (e) {
                errorData = { error: errorText };
            }
            console.warn('API Error for', endpoint, ':', errorData);
            if (res.status === 401 && errorData.error === "jwt expired") {
                console.log('Token expired, clearing cookie but not redirecting');
                setCookie("token", "", -1);
                return [];
            }
            throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        const data = await res.json();
        console.log('API Response for', endpoint, ':', data);
        return data || [];
    } catch (error) {
        console.error('Fetch Articles Error for', endpoint, ':', error);
        return [];
    }
}

// Hàm tiện ích: Tạo phần tử tin tức
function createNewsItem(article, isMain = false) {
    const element = document.createElement('a');
    element.href = `../../baichitiet/html/baichitiet.html?slug=${article.slug}`;
    element.className = isMain ? 'main-news' : 'news-item-top';

    const thumbnail = article.thumbnail || (isMain ? "../image/content-img/tinnoibat1.png" : "../image/content-img/Bayern thua trận đầu tại Bundesliga.png");
    const title = article.title;
    const category = article.CategoryID?.name || article.category || 'Danh mục';
    const author = article.UserID?.username || 'Tác giả';
    const updatedAt = article.updated_at || article.createdAt;

    if (isMain) {
        element.innerHTML = `
            <img src="${thumbnail}" alt="${title}">
            <div class="main-overlay"></div>
            <div class="news-info">
                <span class="category">${category}</span>
                <h3>${title}</h3>
                <p>${author} - ${formatTimeAgo(updatedAt)}</p>
            </div>
        `;
    } else {
        element.innerHTML = `
            <a href="../../baichitiet/html/baichitiet.html?slug=${article.slug}">
                <img src="${thumbnail}" alt="${title}">
                <div class="news-text">
                    <span class="category">${category}</span>
                    <p>${title}</p>
                    <small>${author} - ${formatTimeAgo(updatedAt)}</small>
                </div>
            </a>
        `;
    }

    return element;
}

// Gọi API và hiển thị Hotnews (4 bài nổi bật)
async function fetchHotnews() {
    try {
        const container = document.querySelector('.Hotnews-general');
        if (!container) {
            throw new Error("Không tìm thấy container .Hotnews-general");
        }

        const data = await fetchArticles(`${API_BASE_URL}/api/leagues/most-viewed-articles?limit=4`);
        console.log('Hotnews response:', data);
        const articles = data.find(item => item.league._id === leagueId)?.mostViewedArticle || [];

        const newsContainer = container.querySelector('.news-container');
        if (!newsContainer) {
            throw new Error("Không tìm thấy .news-container trong .Hotnews-general");
        }

        const mainNewsContainer = container.querySelector('#main-news');
        const sideNewsContainer = container.querySelector('#side-news');
        if (!mainNewsContainer || !sideNewsContainer) {
            throw new Error("Không tìm thấy #main-news hoặc #side-news trong .Hotnews-general");
        }

        mainNewsContainer.innerHTML = '';
        sideNewsContainer.innerHTML = '';

        if (articles.length === 0) {
            newsContainer.innerHTML = '<p>Không có bài viết nổi bật</p>';
            return;
        }

        // Bài chính (main-news)
        if (articles.length > 0) {
            const mainNewsLink = createNewsItem(articles[0], true);
            mainNewsContainer.appendChild(mainNewsLink);
        }

        // 3 bài phụ (side-news)
        const sideArticles = articles.slice(1, Math.min(4, articles.length));
        sideArticles.forEach(article => {
            const newsItem = createNewsItem(article);
            sideNewsContainer.appendChild(newsItem);
        });
    } catch (error) {
        console.error("Lỗi khi lấy Hotnews:", error.message);
        const newsContainer = document.querySelector('.Hotnews-general .news-container');
        if (newsContainer) {
            newsContainer.innerHTML = '<p>Lỗi khi tải bài viết: ' + error.message + '</p>';
        }
    }
}

// Gọi API và hiển thị News Bottom (phân trang, 6 bài/trang)
async function fetchNewsBottom(page = 1) {
    try {
        if (!leagueId) throw new Error("leagueId không hợp lệ");
        const res = await fetch(`${API_BASE_URL}/api/articles/category/${leagueId}?page=${page}&limit=10`);
        if (!res.ok) throw new Error("Không thể lấy bài viết theo danh mục");
        const data = await res.json();
        console.log('News Bottom response:', data);
        const articles = data.data.articles || [];
        totalArticles = data.data.totalArticles || 0;

        const newsListContainer = document.getElementById("news-list1");
        if (!newsListContainer) {
            throw new Error("Không tìm thấy news-list1 container");
        }

        newsListContainer.innerHTML = "";

        if (articles.length > 0) {
            articles.forEach(article => {
                const newsItem = document.createElement("div");
                newsItem.classList.add("news-item");
                newsItem.innerHTML = `
                    <a href="../../baichitiet/html/baichitiet.html?slug=${article.slug}">
                        <img src="${article.thumbnail || "../image/content-img/Kane giúp Bayern vững đỉnh bảng Bundesliga.png"}" alt="News Image">
                        <div class="news-content">
                            <h3>${article.CategoryID?.name || article.category || 'Danh mục'}</h3>
                            <p>${article.title}</p>
                            <small>${article.UserID?.username || 'Tác giả'} - ${formatTimeAgo(article.updated_at || article.createdAt)}</small>
                        </div>
                    </a>
                `;
                newsListContainer.appendChild(newsItem);
            });
        } else {
            newsListContainer.innerHTML = "<p>Không có bài viết trong danh mục này</p>";
        }

        // Cập nhật phân trang
        if (pagination) {
            pagination.updateTotalItems(totalArticles);
            pagination.setPage(page);
        }
    } catch (error) {
        console.error("Lỗi khi lấy News Bottom:", error.message);
        const newsListContainer = document.getElementById("news-list1");
        if (newsListContainer) {
            newsListContainer.innerHTML = "<p>Không tải được bài viết</p>";
        }
    }
}

// Hàm xử lý thay đổi trang
function handlePageChange(page) {
    currentPage = page;
    fetchNewsBottom(page);
}

// Helper: Truncate text to 3 lines
function truncateTextToThreeLines(element) {
    const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
    const maxHeight = lineHeight * 3; // Giới hạn chiều cao cho 3 dòng

    if (element.scrollHeight > maxHeight) {
        let text = element.textContent;
        while (element.scrollHeight > maxHeight && text.length > 0) {
            text = text.slice(0, -1); // Xóa ký tự cuối cùng
            element.textContent = text + '...'; // Thêm "..." vào cuối
        }
    }
}

// Hàm khởi tạo
async function init() {
    leagueId = getLeagueIdFromUrl();
    if (!leagueId) {
        console.error("Không thể khởi tạo: leagueId không hợp lệ");
        return;
    }
    await setUserIconBehavior();
    await fetchHotnews();
    await fetchNewsBottom(currentPage);

    // Khởi tạo phân trang
    const paginationContainer = document.querySelector('.pagination');
    if (paginationContainer) {
        pagination = new Pagination('.pagination', totalArticles, 10, handlePageChange);
    }

    document.querySelectorAll('.news-text p, .news-info h3, .news-content p, .tincanh-vanban p').forEach(titleElement => {
        truncateTextToThreeLines(titleElement);
    });
}

// Khởi chạy khi DOM loaded
document.addEventListener("DOMContentLoaded", init);