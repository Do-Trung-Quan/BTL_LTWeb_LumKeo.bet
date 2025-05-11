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
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
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

// Mapping of league slugs to actual page filenames
const leaguePageMap = {
    'v-league': 'giaidau-vleague',
    'ligue-1': 'giaidau-l1',
    'bundesliga': 'giaidau-bundes',
    'serie-a': 'giaidau-seria',
    'la-liga': 'giaidau-LaLiga',
    'premier-league': 'giaidau-EPL'
};

// Fetch leagues and populate the table
async function fetchLeagues(token, keyword = '') {
    try {
        const queryParams = new URLSearchParams();
        if (keyword && keyword.trim() !== '') {
            queryParams.append('keyword', keyword.trim());
        }
        const url = `http://localhost:3000/api/leagues/?${queryParams.toString()}`;
        const resLeagues = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        if (!resLeagues.ok) {
            throw new Error(`HTTP error! Status: ${resLeagues.status}`);
        }

        const leagues = await resLeagues.json();
        const leagueData = Array.isArray(leagues) ? leagues : leagues.leagues || [];

        if (!leagueData.length) {
            console.log('No leagues found');
            return;
        }

        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = ''; // Clear existing rows

        for (const league of leagueData) {
            console.log('League data:', league);

            let articleCount = 0;
            try {
                console.log(`Fetching totalArticles for categoryId: ${league._id}, Token: ${token}`);
                const resCount = await fetch(`http://localhost:3000/api/articles/category/${league._id}/?limit=1000`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                });
                if (!resCount.ok) {
                    console.error(`API Error for ${league._id}: Status ${resCount.status}`);
                    const errorText = await resCount.text();
                    console.error('Error Response:', errorText);
                } else {
                    const countData = await resCount.json();
                    console.log('Article count response:', countData);
                    articleCount = countData.data?.totalArticles || 0;
                    console.log(`Total Articles for ${league.name}: ${articleCount}`);
                }
            } catch (error) {
                console.error(`Error fetching totalArticles for league ${league.name}:`, error);
            }

            const slug = league.slug;
            const pageFileName = leaguePageMap[slug];

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${league.name}</td>
                <td><img src="${league.logo_url}" alt="${league.name}" style="width: 50px;"></td>
                <td>${articleCount}</td>
                <td>${league.season_time}</td>
                <td>
                    <a href="http://127.0.0.1:5500/Quang/giaidau/html/${pageFileName}.html" data-display-href="http://127.0.0.1:5500/Quang/giaidau/html/giaidau-${slug}.html">
                        <i class="fa-regular fa-eye"></i>
                    </a>
                </td>
            `;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error fetching leagues:', error);
    }
}

// Initialize the page
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

        const token = getCookie('token');
        await fetchLeagues(token);

        // Add search functionality
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            const debouncedFetch = debounce(async (keyword) => {
                await fetchLeagues(token, keyword);
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
    } catch (error) {
        console.error('User initialization error:', error.message);
        if (!getCookie("token")) {
            window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
        }
    }
});

// Debounce function to limit API calls during typing
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}