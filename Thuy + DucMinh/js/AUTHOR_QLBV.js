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

function updateAdminInfo(user) {
    document.getElementById('user-name').textContent = user.username || 'Unknown';
    document.getElementById('user-role').textContent = user.role.toUpperCase() || 'Unknown';
    const profilePic = document.getElementById('profile-pic-upper');
    profilePic.src = user.avatar;
    profilePic.alt = `${user.username}'s Avatar`;
}

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
        // Preserve all fields, ensure _id and name are present
        const normalizedLeagues = leagues.map(league => ({
            _id: league._id || league.id,
            name: league.name || 'Unknown League',
            type: league.type || 'League',
            parentCategory: league.parentCategory || null,
            slug: league.slug || '',
            logo_url: league.logo_url || ''
        }));
        console.log('Normalized leagues:', normalizedLeagues);
        window.leagues = normalizedLeagues; // Assign to window.leagues
        return normalizedLeagues;
    } catch (error) {
        console.error('Error fetching leagues:', error);
        window.leagues = [];
        return [];
    }
}

function populateCategoryDropdown(selectElement, categories, selectedCategoryId) {
    selectElement.innerHTML = '<option value="" disabled selected>Chọn thể loại</option>';
    const categoryArray = Array.isArray(categories) ? categories : [];
    if (categoryArray.length === 0) {
        console.warn('No categories available to populate dropdown');
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Không có thể loại';
        selectElement.appendChild(option);
        return;
    }
    categoryArray.forEach(category => {
        const option = document.createElement('option');
        option.value = category._id;
        option.textContent = category.name;
        if (category._id === selectedCategoryId) option.selected = true;
        selectElement.appendChild(option);
    });
}

function populateLeagueDropdown(selectElement, leagues, selectedLeagueId) {
    selectElement.innerHTML = '<option value="" disabled selected>Chọn giải đấu</option>';
    const leagueArray = Array.isArray(leagues) ? leagues : [];
    console.log('Populating league dropdown with:', leagueArray, 'Selected ID:', selectedLeagueId);
    if (leagueArray.length === 0) {
        console.warn('No leagues available to populate dropdown');
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Không có giải đấu';
        selectElement.appendChild(option);
        return;
    }
    leagueArray.forEach(league => {
        const option = document.createElement('option');
        option.value = league._id;
        option.textContent = league.name;
        if (String(league._id) === String(selectedLeagueId)) option.selected = true;
        selectElement.appendChild(option);
    });
}

function toggleLeagueSelect(modalType = 'add') {
    const categorySelect = document.getElementById(`${modalType}-category`);
    const leagueContainer = document.getElementById(`${modalType}-league-container`);
    const leagueSelect = document.getElementById(`${modalType}-league`);
    const selectedCategoryId = categorySelect.value;
    const categories = window.categories || [];
    const selectedCategory = categories.find(cat => cat._id === selectedCategoryId);

    if (selectedCategory && selectedCategory.name === 'Giải đấu') {
        leagueContainer.style.display = 'block';
        populateLeagueDropdown(leagueSelect, window.leagues, '');
    } else {
        leagueContainer.style.display = 'none';
        leagueSelect.value = '';
        leagueSelect.innerHTML = '<option value="" disabled selected>Chọn giải đấu</option>';
    }
}

function openAddModal() {
    document.getElementById('add-content-form').reset();
    const addCategorySelect = document.getElementById('add-category');
    populateCategoryDropdown(addCategorySelect, window.categories || []);
    toggleLeagueSelect('add');
    document.getElementById('addModal').style.display = 'block';

    // Add event listener for category change
    addCategorySelect.removeEventListener('change', handleCategoryChange); // Prevent duplicate listeners
    addCategorySelect.addEventListener('change', handleCategoryChange);
}

function handleCategoryChange() {
    toggleLeagueSelect('add');
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const user = await getCurrentUser();
        if (!user || !user.id) {
            // Redirect to login without alert if no user or invalid user
            window.location.href = "../../Hi-Tech/Login.html";
            return;
        }

        window.currentAuthorId = user.id;
        window.currentUser = user;
        updateAdminInfo(user);

        window.categories = await fetchCategories();
        window.leagues = await fetchLeagues();
        console.log('Stored categories:', window.categories);
        console.log('Stored leagues:', window.leagues);

        const addCategorySelect = document.getElementById('add-category');
        populateCategoryDropdown(addCategorySelect, window.categories);
        const addLeagueSelect = document.getElementById('add-league');
        populateLeagueDropdown(addLeagueSelect, window.leagues);
        fetchNews();
    } catch (error) {
        console.error('DOMContentLoaded error:', error.message);
        // Redirect already handled in getCurrentUser for token expiration
        if (!getCookie("token")) {
            window.location.href = "../../Hi-Tech/Login.html";
        }
    }
});

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
                            throw new Error('Logout link not found, cannot handle token expiration');
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
            console.log('API Response:', data);
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

async function openEditModal(button) {
    const row = button.closest('tr');
    const postId = row.dataset.id;
    try {
        const token = getCookie('token');
        if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập!');

        const res = await fetch(`http://localhost:3000/api/articles/${postId}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token.trim()}`
            }
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Không thể lấy dữ liệu bài viết! Status: ${res.status} - ${errorText}`);
        }

        const article = await res.json();
        console.log('Article data:', article);

        document.getElementById('edit-content-form').dataset.postId = postId;
        document.getElementById('edit-content-name').value = article.title || '';
        document.getElementById('edit-slug').value = article.slug || '';
        document.getElementById('edit-summary').value = article.summary || '';
        document.getElementById('edit-content').value = article.content || '';

        const categorySelect = document.getElementById('edit-category');
        const leagueSelect = document.getElementById('edit-league');
        const leagueContainer = document.getElementById('edit-league-container');

        const categoryId = article.CategoryID?._id || article.CategoryID;
        console.log('Processing CategoryID:', categoryId);

        if (!categoryId) {
            console.warn(`No CategoryID for article ${postId}`);
            alert('Bài viết không có thể loại. Vui lòng chọn thể loại.');
            populateCategoryDropdown(categorySelect, window.categories, '');
            leagueContainer.style.display = 'none';
            leagueSelect.value = '';
            leagueSelect.innerHTML = '<option value="" disabled selected>Chọn giải đấu</option>';
        } else {
            const selectedLeague = window.leagues.find(league => String(league._id) === String(categoryId));
            if (selectedLeague) {
                const giaiDauCategory = window.categories.find(cat => cat.name === 'Giải đấu');
                if (giaiDauCategory) {
                    populateCategoryDropdown(categorySelect, window.categories, giaiDauCategory._id);
                    leagueContainer.style.display = 'block';
                    populateLeagueDropdown(leagueSelect, window.leagues, categoryId);
                    console.log('Pre-selected league:', { leagueId: categoryId, leagueName: selectedLeague.name });
                } else {
                    console.warn('Giải đấu category not found in window.categories:', window.categories);
                    alert('Không tìm thấy thể loại Giải đấu. Vui lòng chọn lại thể loại.');
                    populateCategoryDropdown(categorySelect, window.categories, '');
                    leagueContainer.style.display = 'none';
                    leagueSelect.value = '';
                    leagueSelect.innerHTML = '<option value="" disabled selected>Chọn giải đấu</option>';
                }
            } else {
                const category = window.categories.find(cat => String(cat._id) === String(categoryId));
                if (category) {
                    populateCategoryDropdown(categorySelect, window.categories, categoryId);
                    leagueContainer.style.display = 'none';
                    leagueSelect.value = '';
                    leagueSelect.innerHTML = '<option value="" disabled selected>Chọn giải đấu</option>';
                } else {
                    console.warn(`Invalid CategoryID for article ${postId}: ${categoryId}`);
                    alert('Bài viết có thể loại không hợp lệ. Vui lòng chọn lại thể loại.');
                    populateCategoryDropdown(categorySelect, window.categories, '');
                    leagueContainer.style.display = 'none';
                    leagueSelect.value = '';
                    leagueSelect.innerHTML = '<option value="" disabled selected>Chọn giải đấu</option>';
                }
            }
        }

        console.log('Edit league dropdown after population:', Array.from(leagueSelect.options).map(opt => ({ value: opt.value, text: opt.text, selected: opt.selected })));

        document.getElementById('editModal').style.display = 'block';
    } catch (error) {
        console.error('Error opening edit modal:', error);
        alert('Lỗi: ' + error.message);
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('edit-content-form').reset();
    delete document.getElementById('edit-content-form').dataset.postId;
    const leagueSelect = document.getElementById('edit-league');
    leagueSelect.value = '';
    leagueSelect.innerHTML = '<option value="" disabled selected>Chọn giải đấu</option>';
    document.getElementById('edit-league-container').style.display = 'none';
}

async function saveEdit() {
    try {
        const token = getCookie('token');
        if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập!');

        const postId = document.getElementById('edit-content-form').dataset.postId;
        const title = document.getElementById('edit-content-name').value;
        const slug = document.getElementById('edit-slug').value;
        const summary = document.getElementById('edit-summary').value;
        const content = document.getElementById('edit-content').value;
        const categorySelect = document.getElementById('edit-category');
        const leagueSelect = document.getElementById('edit-league');
        const fileInput = document.getElementById('edit-logo');

        if (!title || !slug || !summary || !content || !categorySelect.value) {
            throw new Error('Vui lòng điền đầy đủ các trường bắt buộc!');
        }

        let categoryId = categorySelect.value;
        const selectedCategory = window.categories.find(cat => String(cat._id) === String(categoryId));

        console.log('Category select value:', categorySelect.value);
        console.log('League select value:', leagueSelect.value);
        console.log('Available leagues:', window.leagues);
        console.log('Edit league dropdown options:', Array.from(leagueSelect.options).map(opt => ({ value: opt.value, text: opt.text, selected: opt.selected })));

        const GIAI_DAU_CATEGORY_ID = '6803a14d9445444c4dc1c619';

        if (!selectedCategory) {
            console.error('No category found for ID:', categoryId, 'Available categories:', window.categories);
            throw new Error('Thể loại không hợp lệ!');
        }

        if (String(selectedCategory._id) === GIAI_DAU_CATEGORY_ID && leagueSelect.value) {
            const selectedLeague = window.leagues.find(league => String(league._id) === String(leagueSelect.value));
            if (!selectedLeague) {
                console.error('No league found for ID:', leagueSelect.value, 'Available leagues:', window.leagues);
                throw new Error('Giải đấu không hợp lệ: Không tìm thấy giải đấu!');
            }
            categoryId = selectedLeague._id;
            console.log('Selected league:', selectedLeague);
        } else {
            console.log('Selected category:', selectedCategory);
        }

        console.log('Updating article:', { postId, categoryId, title });

        let res;
        if (fileInput.files[0]) {
            // Use FormData if there's a file
            const formData = new FormData();
            formData.append('title', title);
            formData.append('slug', slug);
            formData.append('summary', summary);
            formData.append('content', content);
            formData.append('CategoryID', categoryId);
            formData.append('thumbnails', fileInput.files[0]);

            res = await fetch(`http://localhost:3000/api/articles/${postId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.trim()}`
                },
                body: formData
            });
        } else {
            // Use JSON payload if no file
            const updateData = {
                title,
                slug,
                summary,
                content,
                CategoryID: categoryId
            };

            res = await fetch(`http://localhost:3000/api/articles/${postId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
        }

        if (!res.ok) {
            const errorData = await res.json();
            console.error('API Error:', errorData);
            throw new Error(`HTTP error! Status: ${res.status} - ${errorData.message || 'Unknown error'}`);
        }

        const updatedArticle = await res.json();
        console.log('API Response - Updated article:', updatedArticle.article);

        alert('Cập nhật bài viết thành công!');
        closeEditModal();
        fetchNews();
    } catch (error) {
        console.error('Error saving edit:', error);
        alert('Lỗi: ' + error.message);
    }
}

function openAddModal() {
    document.getElementById('add-content-form').reset();
    const addCategorySelect = document.getElementById('add-category');
    populateCategoryDropdown(addCategorySelect, window.categories || []);
    toggleLeagueSelect('add');
    document.getElementById('addModal').style.display = 'block';
}

function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('add-content-form').reset();
}

async function addNewPost() {
    try {
        const token = getCookie('token');
        if (!token) throw new Error('Không tìm thấy token, vui lòng đăng nhập!');

        const title = document.getElementById('add-content-name').value;
        const slug = document.getElementById('add-slug').value;
        const summary = document.getElementById('add-summary').value;
        const content = document.getElementById('add-content').value;
        const categorySelect = document.getElementById('add-category');
        const leagueSelect = document.getElementById('add-league');
        const fileInput = document.getElementById('add-logo');
        const formData = new FormData();

        if (!title || !slug || !summary || !content || !categorySelect.value) {
            throw new Error('Vui lòng điền đầy đủ các trường bắt buộc!');
        }

        let categoryId = categorySelect.value;
        const selectedCategory = window.categories.find(cat => String(cat._id) === String(categoryId));

        console.log('Category select value:', categorySelect.value);
        console.log('League select value:', leagueSelect.value);
        console.log('Available leagues:', window.leagues);

        if (selectedCategory?.name === 'Giải đấu' && leagueSelect.value) {
            const selectedLeague = window.leagues.find(league => String(league._id) === String(leagueSelect.value));
            if (!selectedLeague) {
                console.error('No league found for ID:', leagueSelect.value, 'Available leagues:', window.leagues);
                throw new Error('Giải đấu không hợp lệ: Không tìm thấy giải đấu!');
            }
            if (!selectedLeague.parentCategory || String(selectedLeague.parentCategory._id) !== '6803a14d9445444c4dc1c619') {
                console.error('Invalid parentCategory for league:', selectedLeague);
                throw new Error('Giải đấu không hợp lệ: parentCategory không hợp lệ!');
            }
            categoryId = selectedLeague._id;
            console.log('Selected league:', selectedLeague);
        } else if (!selectedCategory) {
            console.error('No category found for ID:', categoryId, 'Available categories:', window.categories);
            throw new Error('Thể loại không hợp lệ!');
        } else {
            console.log('Selected category:', selectedCategory);
        }

        console.log('Saving article:', { categoryId, title });

        formData.append('title', title);
        formData.append('slug', slug);
        formData.append('summary', summary);
        formData.append('content', content);
        formData.append('CategoryID', categoryId);
        if (fileInput.files[0]) formData.append('thumbnails', fileInput.files[0]);

        const res = await fetch('http://localhost:3000/api/articles/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token.trim()}`
            },
            body: formData
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('API Error:', errorText);
            throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
        }

        alert('Thêm bài viết thành công!');
        closeAddModal();
        fetchNews();
    } catch (error) {
        console.error('Error adding post:', error);
        alert('Lỗi: ' + error.message);
    }
}

async function fetchNews() {
    try {
        const token = getCookie("token");
        console.log('Token for fetchNews:', token);
        if (!token) {
            throw new Error("Không tìm thấy token, vui lòng đăng nhập!");
        }

        const authorId = window.currentAuthorId;
        console.log('Author ID for fetchNews:', authorId);
        if (!authorId) {
            throw new Error("Không tìm thấy userID, vui lòng đăng nhập!");
        }

        const res = await fetch(`http://localhost:3000/api/articles/author/${authorId}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token.trim()}`
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('API Error:', errorText);
            throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        const data = await res.json();
        console.log('API Response:', data);
        populateTable(data);
    } catch (error) {
        console.error('fetchNews Error:', error);
        alert("Lỗi mạng: " + error.message);
    }
}

function populateTable(news) {
    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";

    console.log('Stored categories:', window.categories);
    console.log('Stored leagues:', window.leagues);

    news.forEach(item => {
        const row = document.createElement("tr");
        row.dataset.id = item._id;

        console.log('Article:', {
            id: item._id,
            CategoryID: item.CategoryID,
            league_id: item.league_id
        });

        const categoryId = item.CategoryID?._id || item.CategoryID;
        let displayName = 'N/A';

        if (!categoryId) {
            console.warn(`Invalid CategoryID for article ${item._id}: ${categoryId}`);
        } else {
            const league = window.leagues.find(league => String(league._id) === String(categoryId));
            if (league && league.type === 'League') {
                displayName = league.name;
                console.log(`Found league for article ${item._id}:`, league);
            } else {
                const category = window.categories.find(cat => String(cat._id) === String(categoryId));
                if (category) {
                    displayName = category.name;
                    console.log(`Found category for article ${item._id}:`, category);
                } else {
                    console.warn(`No category or league found for article ${item._id}, CategoryID: ${categoryId}`);
                }
            }
        }

        row.innerHTML = `
            <td>${item.title || 'N/A'}</td>
            <td><img src="${item.thumbnail || ''}" alt="News Image" width="50" onerror="this.src='img/placeholder.jpg'"></td>
            <td>${displayName}</td>
            <td>${item.is_published && item.published_date ? new Date(item.published_date).toLocaleDateString('vi-VN') : 'Chờ duyệt'}</td>
            <td>
                ${item.is_published ? 
                    `<a href="../Quang/baichitiet/html/baichitiet.html?articleId=${item._id}">
                        <i class="fa-regular fa-eye"></i>
                    </a>` : 
                    `<i class="fa-regular fa-eye view-btn" data-article-id="${item._id}"></i>`}
                <button onclick="openEditModal(this); this.closest('tr').classList.add('editing')">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="deleteNews('${item._id}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Add event listeners for unpublished articles
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const articleId = button.getAttribute('data-article-id'); // Use button directly to avoid e.target issues
            console.log('Clicked articleId:', articleId); // Debug the articleId
            if (!articleId || typeof articleId !== 'string') {
                console.error('Invalid articleId:', articleId);
                alert('Không thể mở bài báo: ID không hợp lệ!');
                return;
            }
            await openModal(articleId);
        });
    });
}

// Open modal with article details (view-only)
async function openModal(articleId) {
    const modal = document.getElementById('article-modal');
    const token = getCookie('token');

    try {
        const res = await fetch(`http://localhost:3000/api/articles/${articleId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const article = await res.json();
        console.log('Fetched article:', article);

        document.getElementById('modal-breadcrumb-link').textContent = 'Trang chủ';
        document.getElementById('modal-breadcrumb-link').href = '#';
        document.getElementById('modal-breadcrumb-category').textContent = article.CategoryID?.name;
        document.getElementById('modal-breadcrumb-category').href = '#';
        document.getElementById('modal-title').textContent = article.title || 'N/A';
        document.getElementById('modal-summary').textContent = article.summary;
        document.getElementById('modal-image').src = article.thumbnail;
        document.getElementById('modal-content').textContent = article.content;
        document.getElementById('modal-author-signature').textContent = `Tác giả: ${article.UserID?.username}`;
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching article details:', error);
        alert('Lỗi khi tải chi tiết bài báo!');
    }

    document.getElementById('close-modal').onclick = () => {
        modal.style.display = 'none';
    };
}

async function deleteNews(postId) {
    const confirmDelete = confirm("Bạn có chắc muốn xóa bài viết này?");
    if (!confirmDelete) return;

    try {
        const token = getCookie("token");
        console.log('Token for deleteNews:', token);
        if (!token) {
            throw new Error("Không tìm thấy token, vui lòng đăng nhập!");
        }

        const res = await fetch(`http://localhost:3000/api/articles/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token.trim()}`
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('API Error:', errorText);
            throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
        }

        alert("Xóa bài viết thành công!");
        fetchNews();
    } catch (error) {
        console.error("Lỗi khi xóa bài viết:", error);
        alert("Lỗi: " + error.message);
    }
}
