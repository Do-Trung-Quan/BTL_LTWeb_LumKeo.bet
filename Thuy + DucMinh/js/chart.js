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
    profilePic.src = user.avatar || 'img/default-avatar.png';
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
                        // Token expired, trigger logout via logout.js
                        const logoutLink = document.querySelector('li a#logout-link');
                        if (logoutLink) {
                            console.log('Token expired, triggering logout...');
                            logoutLink.click(); // Simulate click to trigger logout.js logic
                            return null; // Exit function to prevent further execution
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

// Đảm bảo Chart.js đã được tải trước khi chạy mã
if (typeof Chart === 'undefined') {
    console.error('Chart.js chưa được tải. Vui lòng kiểm tra lại.');
} else {
    // Gắn sự kiện click cho các card
    document.querySelectorAll('.stats-cards .card').forEach(card => {
        card.addEventListener('click', async function () {
            const type = this.dataset.type;
            await showChart(type);
        });
    });

    let myChart = null;

    async function showChart(type) {
        const ctx = document.getElementById('myChart');
        const container = document.getElementById('chart-container');
        const title = document.getElementById('chart-title');

        if (!ctx || !container || !title) {
            console.error('Không tìm thấy canvas, container hoặc title. Vui lòng kiểm tra HTML.');
            return;
        }

        if (myChart) {
            myChart.destroy();
        }

        const token = getCookie("token");
        const headers = {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token.trim()}`
        };

        let labels = [];
        let data = [];
        let chartTitle = '';

        try {
            switch (type) {
                case 'baibao':
                    const newArticles = await fetch('http://localhost:3000/api/articles/stats/new/', { headers });
                    if (newArticles.ok) {
                        const result = await newArticles.json();
                        labels = result.dailyStats.map(stat => {
                            const date = new Date(stat.date);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                        });
                        data = result.dailyStats.map(stat => stat.count);
                        chartTitle = 'Số bài báo mới trong 15 ngày';
                    } else {
                        console.warn('API error for new articles:', await newArticles.text());
                        labels = Array(15).fill('Không có dữ liệu');
                        data = Array(15).fill(0);
                        chartTitle = 'Số bài báo mới trong 15 ngày (Không có dữ liệu)';
                    }
                    break;
                case 'nguoidung':
                    const newUsers = await fetch('http://localhost:3000/api/statistics/new-users/', { headers });
                    if (newUsers.ok) {
                        const result = await newUsers.json();
                        labels = result.dailyStats.map(stat => {
                            const date = new Date(stat.date);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                        });
                        data = result.dailyStats.map(stat => stat.count);
                        chartTitle = 'Số người dùng mới trong 15 ngày';
                    } else {
                        console.warn('API error for new users:', await newUsers.text());
                        labels = Array(15).fill('Không có dữ liệu');
                        data = Array(15).fill(0);
                        chartTitle = 'Số người dùng mới trong 15 ngày (Không có dữ liệu)';
                    }
                    break;
                case 'tacgia':
                    const newAuthors = await fetch('http://localhost:3000/api/statistics/new-authors/', { headers });
                    if (newAuthors.ok) {
                        const result = await newAuthors.json();
                        labels = result.dailyStats.map(stat => {
                            const date = new Date(stat.date);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                        });
                        data = result.dailyStats.map(stat => stat.count);
                        chartTitle = 'Số tác giả mới trong 15 ngày';
                    } else {
                        console.warn('API error for new authors:', await newAuthors.text());
                        labels = Array(15).fill('Không có dữ liệu');
                        data = Array(15).fill(0);
                        chartTitle = 'Số tác giả mới trong 15 ngày (Không có dữ liệu)';
                    }
                    break;
                case 'binhluan':
                    const commentsStats = await fetch('http://localhost:3000/api/comments/statistics/all/', { headers });
                    if (commentsStats.ok) {
                        const result = await commentsStats.json();
                        labels = result.newCommentsLast15Days.dailyStats.map(stat => {
                            const date = new Date(stat.date);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                        });
                        data = result.newCommentsLast15Days.dailyStats.map(stat => stat.count);
                        chartTitle = 'Số bình luận mới trong 15 ngày';
                    } else {
                        console.warn('API error for comments:', await commentsStats.text());
                        labels = Array(15).fill('Không có dữ liệu');
                        data = Array(15).fill(0);
                        chartTitle = 'Số bình luận mới trong 15 ngày (Không có dữ liệu)';
                    }
                    break;
                default:
                    console.warn(`Loại biểu đồ "${type}" không hợp lệ.`);
                    title.innerText = 'Biểu đồ không khả dụng';
                    container.style.display = 'block';
                    return;
            }

            title.innerText = chartTitle;

            myChart = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Số lượng',
                        data: data,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 1,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        title: {
                            display: true,
                            text: chartTitle
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Ngày'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Số lượng'
                            }
                        }
                    }
                }
            });

            if (container.style.display !== 'block') {
                container.style.display = 'block';
            }
        } catch (error) {
            console.error('Error in showChart:', error);
            title.innerText = 'Lỗi khi tải biểu đồ';
            container.style.display = 'block';
        }
    }

    async function initializeDashboard() {
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
            updateAdminInfo(user); // Assuming updateAdminInfo is defined

            const token = getCookie("token");
            const headers = {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token.trim()}`
            };

            const totalArticles = await fetch('http://localhost:3000/api/articles/stats/total/', { headers });
            const totalUsers = await fetch('http://localhost:3000/api/statistics/all-users/', { headers });
            const totalAuthors = await fetch('http://localhost:3000/api/statistics/all-authors/', { headers });
            const commentsStats = await fetch('http://localhost:3000/api/comments/statistics/all/', { headers });

            if (totalArticles.ok && totalUsers.ok && totalAuthors.ok && commentsStats.ok) {
                const articlesData = await totalArticles.json();
                const usersData = await totalUsers.json();
                const authorsData = await totalAuthors.json();
                const commentsData = await commentsStats.json();

                document.getElementById('total-articles').textContent = articlesData.total || 0;
                document.getElementById('total-users').textContent = usersData.count || 0;
                document.getElementById('total-authors').textContent = authorsData.count || 0;
                document.getElementById('total-comments').textContent = commentsData.totalComments || 0;
            } else {
                console.warn('One or more API calls failed during initialization:');
                if (!totalArticles.ok) console.warn('Articles:', await totalArticles.text());
                if (!totalUsers.ok) console.warn('Users:', await totalUsers.text());
                if (!totalAuthors.ok) console.warn('Authors:', await totalAuthors.text());
                if (!commentsStats.ok) console.warn('Comments:', await commentsStats.text());
                document.getElementById('total-articles').textContent = 0;
                document.getElementById('total-users').textContent = 0;
                document.getElementById('total-authors').textContent = 0;
                document.getElementById('total-comments').textContent = 0;
            }
            showChart('baibao'); // Mặc định hiển thị biểu đồ bài báo mới
        } catch (error) {
            console.error('Initialization error:', error);
            if (!getCookie("token")) {
                window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
            }
            alert('Lỗi khi khởi tạo dashboard: ' + error.message);
        }
    }

    initializeDashboard();
}