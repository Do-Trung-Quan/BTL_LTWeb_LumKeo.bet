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

// Helper: Fetch articles with token expiration handling
async function fetchArticles(endpoint) {
    const token = getCookie("token");
    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token ? token.trim() : ''}`,
        'Content-Type': 'application/json'
    };

    try {
        const res = await fetch(endpoint, {
            headers,
            credentials: 'include'
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.warn('API Error for', endpoint, ':', errorText);
            if (res.status === 401) {
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
            throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        const data = await res.json();
        console.log('API Response for', endpoint, ':', data);

        // Handle different response formats
        if (endpoint.includes('/api/articles/most-viewed')) {
            return Array.isArray(data) ? data : data.articles || [];
        } else {
            return Array.isArray(data) ? data : [{ mostViewedArticle: data.articles || [] }];
        }
    } catch (error) {
        console.error('Fetch Articles Error for', endpoint, ':', error);
        throw error;
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

        if (!data) {
            console.log(`No data returned for ${containerSelector}, possibly due to logout`);
            container.querySelector('.news-container').innerHTML = '<p>Không thể tải bài viết.</p>';
            return;
        }

        // Handle nested structure for categories/leagues, flat array for "Tin nóng"
        let articles = [];
        if (apiEndpoint.includes('/api/articles/most-viewed')) {
            articles = data;
        } else {
            // Flatten and filter by expected category/league ID
            const allArticles = data.flatMap(item => item.mostViewedArticle || []);
            console.log(`All articles for ${containerSelector}:`, allArticles);
            articles = expectedId
                ? allArticles.filter(article => {
                    const matches = article.CategoryID?._id === expectedId;
                    console.log(`Article CategoryID: ${article.CategoryID?._id}, Expected: ${expectedId}, Matches: ${matches}`);
                    return matches;
                })
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

        // Clear existing content
        if (mainNewsContainer) mainNewsContainer.remove();
        sideNewsContainer.innerHTML = '';
        if (botNewsContainer) botNewsContainer.innerHTML = '';

        // Populate main news (first article)
        if (articles.length > 0) {
            const mainNewsLink = createNewsItem(articles[0], true);
            container.querySelector('.news-container').prepend(mainNewsLink);
        }

        // Populate side news (next 3 articles)
        const sideArticles = articles.slice(1, Math.min(4, articles.length));
        sideArticles.forEach(article => {
            const newsItem = createNewsItem(article);
            sideNewsContainer.appendChild(newsItem);
        });

        // Populate bot news (next 4 articles) if available
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

// Initialize dynamic content loading
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await getCurrentUser();
        if (!user || !user.id) {
            window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
            return;
        }

        // Hotnews sections
        await populateSection('.Hotnews-general', 'http://localhost:3000/api/articles/most-viewed/?limit=4', 'hotnews'); // Tin nóng
        await populateSection('.Hotnews-BDVN', 'http://localhost:3000/api/categories/most-viewed-articles?id=6803c9a78b0d39ca1395c4ee&limit=4', 'hotnews', '6803c9a78b0d39ca1395c4ee'); // Bóng đá Việt Nam
        await populateSection('.Hotnews-BDTG', 'http://localhost:3000/api/categories/most-viewed-articles?id=6803a1679445444c4dc1c61d&limit=4', 'hotnews', '6803a1679445444c4dc1c61d'); // Bóng đá thế giới

        // League sections
        await populateSection('.League-EPL .League', 'http://localhost:3000/api/leagues/most-viewed-articles?id=6819a52d3332d1810bdeacd3&limit=8', 'league', '6819a52d3332d1810bdeacd3'); // Premier League
        await populateSection('.League-LLG .League', 'http://localhost:3000/api/leagues/most-viewed-articles?id=6817095e8fb809bc70ddb167&limit=8', 'league', '6817095e8fb809bc70ddb167'); // La Liga
        await populateSection('.League-SerieA .League', 'http://localhost:3000/api/leagues/most-viewed-articles?id=6819a4ec3332d1810bdeac4b&limit=8', 'league', '6819a4ec3332d1810bdeac4b'); // Serie A
        await populateSection('.League-Bundes .League', 'http://localhost:3000/api/leagues/most-viewed-articles?id=6804be9c510d143012ff5363&limit=8', 'league', '6804be9c510d143012ff5363'); // Bundesliga
        await populateSection('.League-L1 .League', 'http://localhost:3000/api/leagues/most-viewed-articles?id=6819a4813332d1810bdeac0e&limit=8', 'league', '6819a4813332d1810bdeac0e'); // Ligue 1
        await populateSection('.League-VL .League', 'http://localhost:3000/api/leagues/most-viewed-articles?id=6804becf510d143012ff5368&limit=8', 'league', '6804becf510d143012ff5368'); // V.League 1
    } catch (error) {
        console.error('Initialization error:', error.message);
        if (!getCookie("token")) {
            window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
        }
    }
});