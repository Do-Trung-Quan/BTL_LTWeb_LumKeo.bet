const API_BASE_URL = "http://localhost:3000";

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

// Lấy thông tin người dùng hiện tại
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
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            console.warn('Invalid ID format, treating as unauthenticated');
            return null;
        }

        const validationRes = await fetch(`${API_BASE_URL}/api/validate-token`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

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
            const res = await fetch(`${API_BASE_URL}/api/users/${id}?_t=${Date.now()}`, {
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

// Hàm tiện ích: Gửi request API
async function fetchApi(endpoint, method = 'GET', body = null) {
    const token = getCookie("token");
    const headers = {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token.trim()}` : '',
        'Content-Type': 'application/json'
    };

    try {
        const res = await fetch(endpoint, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.warn(`API Error for ${endpoint}:`, errorText);
            throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        return await res.json();
    } catch (error) {
        console.error(`Fetch API Error for ${endpoint}:`, error);
        throw error;
    }
}

// Hàm tiện ích: Format thời gian thông báo
function formatTimeAgo(timestamp) {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMs = now - notificationTime;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInSeconds / 3600);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return `${diffInDays} ngày trước`;
}

// Lấy số lượng thông báo chưa đọc
async function fetchUnreadCount(receiverId) {
    try {
        const data = await fetchApi(`${API_BASE_URL}/api/notifications/${receiverId}/unread-count/`);
        return data.data.unreadCount || 0;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
}

// Cập nhật số lượng thông báo chưa đọc trên UI
async function updateUnreadCount(receiverId) {
    const countElement = document.getElementById('notification-count');
    if (!countElement) return;

    const count = await fetchUnreadCount(receiverId);
    countElement.textContent = count;
    countElement.style.display = count > 0 ? 'inline-block' : 'none';
}

// Lấy danh sách thông báo
async function fetchNotifications(receiverId) {
    try {
        const data = await fetchApi(`${API_BASE_URL}/api/notifications/${receiverId}/`);
        return data.data.notifications || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

// Đánh dấu một thông báo đã đọc
async function markNotificationAsRead(notificationId, receiverId) {
    try {
        await fetchApi(`${API_BASE_URL}/api/notifications/${notificationId}/read/`, 'PUT');
        await updateNotifications(receiverId); // Cập nhật lại danh sách
        await updateUnreadCount(receiverId); // Cập nhật số lượng chưa đọc
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Đánh dấu tất cả thông báo đã đọc
async function markAllNotificationsAsRead(receiverId) {
    try {
        await fetchApi(`${API_BASE_URL}/api/notifications/${receiverId}/read-all/`, 'PUT');
        await updateNotifications(receiverId); // Cập nhật lại danh sách
        await updateUnreadCount(receiverId); // Cập nhật số lượng chưa đọc
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

// Xóa thông báo
async function deleteNotification(notificationId, receiverId) {
    try {
        await fetchApi(`${API_BASE_URL}/api/notifications/${notificationId}/`, 'DELETE');
        await updateNotifications(receiverId); // Cập nhật lại danh sách
        await updateUnreadCount(receiverId); // Cập nhật số lượng chưa đọc
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// Hiển thị danh sách thông báo trên UI
async function updateNotifications(receiverId) {
    const notificationList = document.getElementById('notification-list');
    if (!notificationList) return;

    const notifications = await fetchNotifications(receiverId);
    notificationList.innerHTML = '';

    if (notifications.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'Không có thông báo mới';
        notificationList.appendChild(emptyItem);
        return;
    }

    notifications.forEach(notification => {
        const li = document.createElement('li');
        li.className = notification.is_read ? 'read' : 'unread';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'notification-content';
        contentDiv.innerHTML = `
            <span class="notification-message">${notification.content}</span>
            <small class="notification-time">${formatTimeAgo(notification.created_at)}</small>
        `;

        // Nút đánh dấu đã đọc (nếu chưa đọc)
        if (!notification.is_read) {
            const readBtn = document.createElement('button');
            readBtn.className = 'mark-read-btn';
            readBtn.innerHTML = '<i class="fas fa-check"></i>';
            readBtn.title = 'Đánh dấu đã đọc';
            readBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                markNotificationAsRead(notification._id, receiverId);
            });
            contentDiv.appendChild(readBtn);
        }

        // Nút xóa thông báo
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Xóa thông báo';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNotification(notification._id, receiverId);
        });
        contentDiv.appendChild(deleteBtn);

        li.appendChild(contentDiv);
        notificationList.appendChild(li);
    });
}

// Xử lý sự kiện click để hiển thị/ẩn dropdown thông báo
function setupNotificationDropdown(user, receiverId) {
    const notificationButton = document.querySelector('.notification-button');
    const notificationMenu = document.getElementById('notification-menu');

    if (!notificationButton || !notificationMenu) {
        console.error('Notification button or menu not found');
        return;
    }

    notificationButton.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!user || !user.id) {
            alert('Bạn phải đăng nhập để xem thông báo.');
            return;
        }

        const isVisible = notificationMenu.style.display === 'block';
        notificationMenu.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            await updateNotifications(receiverId);
        }
    });

    // Ẩn dropdown khi click bên ngoài
    document.addEventListener('click', (e) => {
        if (!notificationButton.contains(e.target) && !notificationMenu.contains(e.target)) {
            notificationMenu.style.display = 'none';
        }
    });
}

// Xử lý sự kiện "Đánh dấu tất cả đã đọc"
function setupMarkAllRead(receiverId) {
    const markAllReadLink = document.getElementById('mark-all-read');
    if (!markAllReadLink) return;

    markAllReadLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await markAllNotificationsAsRead(receiverId);
    });
}

// Khởi tạo
async function initNotifications() {
    const user = await getCurrentUser();
    const notificationList = document.getElementById('notification-list');
    const notificationMenu = document.getElementById('notification-menu');

    if (!notificationList || !notificationMenu) {
        console.error('Notification elements not found');
        return;
    }

    if (!user || !user.id) {
        // Không hiển thị gì nếu chưa đăng nhập
        setupNotificationDropdown(user, null);
        return;
    }

    const receiverId = user.id;
    await updateUnreadCount(receiverId);
    setupNotificationDropdown(user, receiverId);
    setupMarkAllRead(receiverId);
}

// Chạy khi DOM loaded
document.addEventListener('DOMContentLoaded', initNotifications);