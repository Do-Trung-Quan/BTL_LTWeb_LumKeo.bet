// Helper: Get cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Helper: Decode JWT
function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
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
        if (!token) {
            console.log('No token found, user is unauthenticated');
            return null;
        }

        const payload = decodeJwt(token);
        if (!payload) {
            console.log('Invalid token, treating as unauthenticated');
            return null;
        }

        const { id, username, role, avatar } = payload;
        console.log('User ID:', id);
        console.log('User Name:', username);
        console.log('User Role:', role);
        console.log('Full Payload:', payload);

        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            console.warn('Invalid ID format, treating as unauthenticated');
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
                    console.warn('Permission or token issue, falling back to token data or unauthenticated');
                    return userData.id ? userData : null;
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

// Helper: Format time ago
function timeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
}

// Helper: Fetch articles (allow unauthenticated access for public endpoints)
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
                    return []; // Return empty array for public content
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

        if (endpoint.includes('/api/articles/most-viewed')) {
            return data.mostViewedArticle || [];
        } else {
            return Array.isArray(data) ? data : [{ mostViewedArticle: data.mostViewedArticle || [] }];
        }
    } catch (error) {
        console.error('Fetch Articles Error for', endpoint, ':', error);
        return [];
    }
}

// Helper: Create a news item element
function createNewsItem(article, isMain = false) {
    const element = document.createElement('a');
    element.href = `./Quang/baichitiet/html/baichitiet.html?slug=${article.slug || 'default-slug'}`;
    element.className = isMain ? 'main-news' : 'news-item';

    const thumbnail = article.thumbnail || 'default-image.jpg';
    const title = article.title || 'No Title';
    const category = article.CategoryID?.name || 'Unknown';
    const author = article.UserID?.username || 'Tác giả';
    const updatedAt = article.updated_at || new Date().toISOString();

    if (isMain) {
        element.innerHTML = `
            <img src="${thumbnail}" alt="${title}">
            <div class="main-overlay"></div>
            <div class="news-info">
                <span class="category">${category}</span>
                <h3>${title}</h3>
                <p>${author} - ${timeAgo(updatedAt)}</p>
            </div>
        `;
    } else {
        element.innerHTML = `
            <img src="${thumbnail}" alt="${title}">
            <div class="news-text">
                <span class="category">${category}</span>
                <p>${title}</p>
                <small>${author} - ${timeAgo(updatedAt)}</small>
            </div>
        `;
    }

    return element;
}

// Populate a section (Hotnews or League)
async function populateSection(containerSelector, apiEndpoint, sectionType, expectedId = null) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.error(`Container not found for selector: ${containerSelector}`);
        return;
    }

    try {
        const data = await fetchArticles(apiEndpoint);

        if (!data || data.length === 0) {
            console.log(`No data returned for ${containerSelector}`, data);
            container.querySelector('.news-container').innerHTML = '<p>Không thể tải bài viết.</p>';
            return;
        }

        let articles = [];
        if (apiEndpoint.includes('/api/articles/most-viewed')) {
            articles = data;
        } else {
            const allArticles = data.flatMap(item => item.mostViewedArticle || []);
            console.log(`All articles for ${containerSelector}:`, allArticles);
            articles = expectedId
                ? allArticles.filter(article => article.CategoryID?._id === expectedId)
                : allArticles;
            console.log(`Filtered articles for ${containerSelector} with expectedId ${expectedId}:`, articles);
        }

        if (articles.length === 0) {
            console.log(`No articles found for ${containerSelector} after filtering`);
            container.querySelector('.news-container').innerHTML = '<p>Không có bài viết nào.</p>';
            return;
        }

        const mainNewsContainer = container.querySelector('.main-news');
        const sideNewsContainer = container.querySelector('.side-news');
        const botNewsContainer = container.querySelector('.bot-news');

        if (!sideNewsContainer || !container.querySelector('.news-container')) {
            console.error(`Missing .side-news or .news-container in ${containerSelector}`);
            container.innerHTML = '<p>Lỗi cấu trúc HTML.</p>';
            return;
        }

        if (mainNewsContainer) mainNewsContainer.remove();
        sideNewsContainer.innerHTML = '';
        if (botNewsContainer) botNewsContainer.innerHTML = '';

        if (articles.length > 0) {
            const mainNewsLink = createNewsItem(articles[0], true);
            container.querySelector('.news-container').prepend(mainNewsLink);
        }

        const sideArticles = articles.slice(1, Math.min(4, articles.length));
        sideArticles.forEach(article => {
            const newsItem = createNewsItem(article);
            sideNewsContainer.appendChild(newsItem);
        });

        if (sectionType === 'league' && botNewsContainer) {
            const botArticles = articles.slice(4, Math.min(8, articles.length));
            botArticles.forEach(article => {
                const newsItem = createNewsItem(article);
                botNewsContainer.appendChild(newsItem);
            });
            if (articles.length < 5) {
                console.warn(`Not enough articles (${articles.length}) for .bot-news in ${containerSelector}`);
            }
        }
    } catch (error) {
        console.error(`Error populating ${containerSelector}:`, error);
        container.querySelector('.news-container').innerHTML = '<p>Lỗi khi tải bài viết: ' + error.message + '</p>';
        if (botNewsContainer) botNewsContainer.innerHTML = '<p>Lỗi khi tải bài viết.</p>';
    }
}

// Set user icon behavior based on authentication
function setUserIconBehavior(user) {
    const userIcon = document.querySelector('.account-button');
    if (!userIcon) {
        console.error('User icon (account-button) not found');
        return;
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
                redirectPage = '../Thuy + DucMinh/ADMIN_QLBB.html';
                break;
            case 'author':
                redirectPage = '../Thuy + DucMinh/AUTHOR_QLBV.html';
                break;
            case 'user':
                redirectPage = '../Thuy + DucMinh/USER_BBDL.html';
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

// Initialize dynamic content loading
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await getCurrentUser();

        // Set user icon behavior
        setUserIconBehavior(user);

        // Hotnews sections (fetch without requiring login)
        await populateSection('.Hotnews-general', 'http://localhost:3000/api/articles/most-viewed/?limit=4', 'hotnews');
        await populateSection('.Hotnews-BDVN', 'http://localhost:3000/api/categories/most-viewed-articles?id=6803c9a78b0d39ca1395c4ee&limit=4', 'hotnews', '6803c9a78b0d39ca1395c4ee');
        await populateSection('.Hotnews-BDTG', 'http://localhost:3000/api/categories/most-viewed-articles?id=6803a1679445444c4dc1c61d&limit=4', 'hotnews', '6803a1679445444c4dc1c61d');

        // League sections
        await populateSection('.League-EPL .League', 'http://localhost:3000/api/leagues/most-viewed-articles?id=6819a52d3332d1810bdeacd3&limit=8', 'league', '6819a52d3332d1810bdeacd3');
        await populateSection('.League-LLG .League', 'http://localhost:3000/api/leagues/most-viewed-articles?id=6817095e8fb809bc70ddb167&limit=8', 'league', '6817095e8fb809bc70ddb167');
        await populateSection('.League-SerieA .League', 'http://localhost:3000/api/leagues/most-viewed-articles?id=6819a4ec3332d1810bdeac4b&limit=8', 'league', '6819a4ec3332d1810bdeac4b');
        await populateSection('.League-Bundes .League', 'http://localhost:3000/api/leagues/most-viewed-articles?id=6804be9c510d143012ff5363&limit=8', 'league', '6804be9c510d143012ff5363');
        await populateSection('.League-L1 .League', 'http://localhost:3000/api/leagues/most-viewed-articles?id=6819a4813332d1810bdeac0e&limit=8', 'league', '6819a4813332d1810bdeac0e');
        await populateSection('.League-VL .League', 'http://localhost:3000/api/leagues/most-viewed-articles?id=6804becf510d143012ff5368&limit=8', 'league', '6804becf510d143012ff5368');
    } catch (error) {
        console.error('Initialization error:', error.message);
    }
});