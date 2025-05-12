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
                    setCookie("token", "", -1);
                    window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
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

// Hàm tiện ích: Lấy categoryId từ slug trong query parameter
function getCategoryIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    const categoryMap = {
        "bong-da-viet-nam": "6803c9a78b0d39ca1395c4ee",
        "bong-da-the-gioi": "6803a1679445444c4dc1c61d"
    };
    const categoryId = categoryMap[slug];
    if (!categoryId) {
        console.error(`Không tìm thấy categoryId cho slug: ${slug}`);
        return null;
    }
    return categoryId;
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
    const userIcon = document.querySelector('.account-button');
    if (!userIcon) {
        console.error('User icon (account-button) not found');
        return;
    }

    let user = null;
    try {
        user = await getCurrentUser();
    } catch (error) {
        console.error('Error fetching current user:', error.message);
    }

    if (!user) {
        userIcon.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
        userIcon.addEventListener('click', (e) => {
            console.log('Redirecting to login page');
        });
    } else {
        let redirectPage;
        switch (user.role.toLowerCase()) {
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
        userIcon.href = redirectPage;
        userIcon.addEventListener('click', (e) => {
            console.log(`Redirecting to ${redirectPage} for role: ${user.role}`);
        });
    }
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
            console.warn('API Error for', endpoint, ':', errorText);
            if (res.status === 401) {
                const errorData = JSON.parse(errorText);
                if (errorData.error === "jwt expired") {
                    console.log('Token expired, will handle logout if needed');
                    return [];
                }
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

        const data = await fetchArticles(`${API_BASE_URL}/api/categories/most-viewed-articles?limit=4`);
        console.log('Hotnews response:', data);
        const articles = data.find(item => item.category._id === categoryId)?.mostViewedArticle || [];

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
        if (!categoryId) throw new Error("categoryId không hợp lệ");
        const res = await fetch(`${API_BASE_URL}/api/articles/category/${categoryId}?page=${page}&limit=10`);
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

// Gọi API và hiển thị Tin Khác (các bài viết từ danh mục khác)
async function fetchTinKhac() {
    try {
        if (!categoryId) throw new Error("categoryId không hợp lệ");

        const tinKhacContainer = document.querySelector(".tincanh");
        const tinKhacSection = tinKhacContainer?.querySelector(".tincanh-phanloai:nth-child(1)");
        if (!tinKhacSection) {
            throw new Error("Không tìm thấy tincanh-phanloai (Tin Khác)");
        }

        const otherArticlesContainer = document.getElementById("other-articles");
        if (!otherArticlesContainer) {
            throw new Error("Không tìm thấy other-articles container");
        }

        otherArticlesContainer.innerHTML = "";

        const res = await fetch(`${API_BASE_URL}/api/articles?limit=0`);
        if (!res.ok) throw new Error("Không thể lấy bài viết Tin Khác");
        const data = await res.json();
        console.log('Tin Khác - API response:', data);

        const articles = data.data?.articles || data.articles || [];
        const filteredArticles = articles.filter(item => {
            const articleCategoryId = item.CategoryID?._id || item.categoryId;
            return articleCategoryId && articleCategoryId !== categoryId;
        });

        const selectedArticles = filteredArticles.slice(0, 3);

        if (selectedArticles.length > 0) {
            selectedArticles.forEach(article => {
                const tinKhacItem = document.createElement("a");
                tinKhacItem.classList.add("tincanh-hieuung");
                tinKhacItem.href = `../../baichitiet/html/baichitiet.html?slug=${article.slug}`;
                tinKhacItem.innerHTML = `
                    <div class="tincanh-content">
                        <img src="${article.thumbnail || "../image/content-img/HLV bị cấm 9 tháng vì gây hấn trọng tài ở Ligue 1.png"}" alt="">
                        <div class="tincanh-vanban">
                            <h3>${article.CategoryID?.name || article.category || 'Danh mục'}</h3>
                            <p>${article.title}</p>
                            <small>${article.UserID?.username || 'Tác giả'} - ${formatTimeAgo(article.updated_at || article.createdAt)}</small>
                        </div>
                    </div>
                `;
                otherArticlesContainer.appendChild(tinKhacItem);
            });
        } else {
            const noArticlesMessage = document.createElement("p");
            noArticlesMessage.textContent = "Không có bài viết khác thuộc danh mục khác";
            otherArticlesContainer.appendChild(noArticlesMessage);
        }

        let br = otherArticlesContainer.nextElementSibling;
        if (!br || br.tagName !== 'BR') {
            br = document.createElement("br");
            otherArticlesContainer.insertAdjacentElement("afterend", br);
        }
    } catch (error) {
        console.error("Lỗi khi lấy Tin Khác:", error.message);
        const otherArticlesContainer = document.getElementById("other-articles");
        if (otherArticlesContainer) {
            otherArticlesContainer.innerHTML = "<p>Không tải được tin khác</p>";
        }
    }
}

// Gọi API và hiển thị Có Thể Bạn Quan Tâm (các bài viết cùng danh mục)
async function fetchCoTheBanQuanTam() {
    try {
        if (!categoryId) throw new Error("categoryId không hợp lệ");

        const relatedArticlesContainer = document.getElementById("related-articles");
        if (!relatedArticlesContainer) {
            throw new Error("Không tìm thấy related-articles container");
        }

        relatedArticlesContainer.innerHTML = "";

        const res = await fetch(`${API_BASE_URL}/api/articles/category/${categoryId}?limit=3`);
        if (!res.ok) throw new Error("Không thể lấy bài viết Có Thể Bạn Quan Tâm");
        const data = await res.json();
        console.log('Có Thể Bạn Quan Tâm - API response:', data);

        const articles = data.data?.articles || data.articles || [];

        if (articles.length > 0) {
            articles.forEach(article => {
                const quanTamItem = document.createElement("a");
                quanTamItem.classList.add("tincanh-hieuung");
                quanTamItem.setAttribute("data-section", "coTheBanQuanTam");
                quanTamItem.href = `../../baichitiet/html/baichitiet.html?slug=${article.slug}`;
                quanTamItem.innerHTML = `
                    <div class="tincanh-content">
                        <img src="${article.thumbnail || "../image/content-img/Antony được xóa thẻ đỏ, sẵn sàng đấu Real.png"}" alt="">
                        <div class="tincanh-vanban">
                            <h3>${article.CategoryID?.name || article.category || 'Danh mục'}</h3>
                            <p>${article.title}</p>
                            <small>${article.UserID?.username || 'Tác giả'} - ${formatTimeAgo(article.updated_at || article.createdAt)}</small>
                        </div>
                    </div>
                `;
                relatedArticlesContainer.appendChild(quanTamItem);
            });
        } else {
            const noArticlesMessage = document.createElement("p");
            noArticlesMessage.textContent = "Không có bài viết liên quan";
            relatedArticlesContainer.appendChild(noArticlesMessage);
        }
    } catch (error) {
        console.error("Lỗi khi lấy Có Thể Bạn Quan Tâm:", error.message);
        const relatedArticlesContainer = document.getElementById("related-articles");
        if (relatedArticlesContainer) {
            relatedArticlesContainer.innerHTML = "<p>Không tải được tin liên quan</p>";
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
    categoryId = getCategoryIdFromUrl();
    if (!categoryId) {
        console.error("Không thể khởi tạo: categoryId không hợp lệ");
        return;
    }
    await setUserIconBehavior();
    await fetchHotnews();
    await fetchNewsBottom(currentPage);
    await fetchTinKhac();
    await fetchCoTheBanQuanTam();

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