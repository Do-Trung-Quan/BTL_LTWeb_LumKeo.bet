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

async function fetchPublishedArticleCount(authorId, token) {
    try {
        const res = await fetch(`http://localhost:3000/api/articles/published-count/${authorId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        if (!res.ok) {
            console.error(`API Error for author ${authorId}: Status ${res.status}`);
            return 0;
        }
        const data = await res.json();
        return data.count || 0;
    } catch (error) {
        console.error(`Error fetching published article count for author ${authorId}:`, error);
        return 0;
    }
}

// Fetch and populate authors
async function fetchAuthors(token) {
    try {
        const res = await fetch('http://localhost:3000/api/authors/', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const authors = await res.json();
        const authorData = Array.isArray(authors) ? authors : authors.authors || [];

        if (!authorData.length) {
            console.log('No authors found');
            return;
        }

        const tableBody = document.querySelector('#table-body tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        for (const author of authorData) {
            console.log('Author data:', author);

            // Fetch published article count dynamically
            const articleCount = await fetchPublishedArticleCount(author._id || author.id, token);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${author._id || 'N/A'}</td>
                <td>${author.username || 'N/A'}</td>
                <td>${articleCount}</td>
                <td>${new Date(author.created_at || Date.now()).toLocaleDateString('vi-VN') || 'N/A'}</td>
                <td><i class="fa-solid fa-trash-can delete-btn" data-author-id="${author._id || author.id}"></i></td>
            `;
            tableBody.appendChild(row);
        }

        // Add delete functionality
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const authorId = e.target.getAttribute('data-author-id');
                if (confirm(`Bạn có chắc chắn muốn xóa tác giả với ID: ${authorId}?`)) {
                    try {
                        const res = await fetch(`http://localhost:3000/api/users/${authorId}/`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json',
                            },
                        });
                        if (res.ok) {
                            alert('Tác giả đã được xóa thành công!');
                            fetchAuthors(token); // Refresh the table
                        } else {
                            const errorText = await res.text();
                            alert(`Lỗi: ${errorText}`);
                        }
                    } catch (error) {
                        console.error('Error deleting author:', error);
                        alert('Lỗi khi xóa tác giả!');
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error fetching authors:', error);
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
        updateAdminInfo(user); // Assuming updateAdminInfo is defined
        const token = getCookie('token');
        await fetchAuthors(token);
    } catch (error) {
        console.error('User initialization error:', error.message);
        if (!getCookie("token")) {
            window.location.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
        }
    }
});c