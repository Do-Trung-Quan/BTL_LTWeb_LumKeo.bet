document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Lấy thông tin user đang đăng nhập
        const user = await getCurrentUser();
        if (!user || !user._id) {
            alert("Vui lòng đăng nhập để quản lý bài viết!");
            window.location.href = "../../Hi-Tech/Login.html";
            return;
        }
        // Lưu author_id toàn cục
        window.currentAuthorId = user._id;

        // Load dữ liệu
        fetchNews(); // Load news của author
    } catch (error) {
        console.error("Lỗi khi tải thông tin người dùng:", error);
        alert("Lỗi: " + error.message);
        window.location.href = "../../Hi-Tech/Login.html";
    }
});

// Lấy thông tin user đang đăng nhập
async function getCurrentUser() {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("Không tìm thấy token, vui lòng đăng nhập!");
    }

    const res = await fetch('http://localhost:3000/api/users/me', {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
    }

    return await res.json();
}


// ------------------------ TABLE -----------------------------

function resetTable() {
    document.querySelectorAll("#table-body tr").forEach(row => {
        row.style.display = "table-row";
    });
}

async function fetchNews() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3000/api/news?author_id=${window.currentAuthorId}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        const data = await res.json();
        populateTable(data.news || data);
    } catch (error) {
        console.error("Lỗi khi tải danh sách bài viết:", error);
        alert("Lỗi mạng: " + error.message);
    }
}

function populateTable(news) {
    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";
    news.forEach(item => {
        const row = document.createElement("tr");
        row.dataset.id = item._id;
        row.innerHTML = `
            <td>${item.title}</td>
            <td><img src="${item.image_url}" alt="News Image" width="50"></td>
            <td>
                ${item.league_id?.name || item.category_id?.name || item.category_id || 'N/A'}
            </td>
            <td>
                ${item.published_at ? new Date(item.published_at).toLocaleDateString('vi-VN') : 'Chờ duyệt'}
            </td>
            <td>
                <button onclick="openEditModal(this); this.closest('tr').classList.add('editing')">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <i class="fa-solid fa-trash-can"></i>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ------------------------ EDIT MODAL -----------------------------

async function openEditModal(button) {
    const row = button.closest("tr");
    const postId = row.dataset.id;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3000/api/news/${postId}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Không thể tải bài viết');
        const item = await res.json();

        document.getElementById("edit-content-name").value = item.title;
        document.getElementById("edit-logo").dataset.currentImage = item.image_url || '';

        const categoriesRes = await fetch('http://localhost:3000/api/categories', {
            headers: { 'Accept': 'application/json' }
        });
        if (!categoriesRes.ok) throw new Error('Không thể tải danh mục');
        const categories = await categoriesRes.json();

        const categorySelect = document.getElementById("edit-category");
        categorySelect.innerHTML = categories.map(cat => `<option value="${cat._id}">${cat.name}</option>`).join("");
        categorySelect.value = item.category_id?._id || item.category_id;

        const leagueContainer = document.getElementById("edit-league-container");
        leagueContainer.innerHTML = "";
        const tournamentCategory = categories.find(cat => cat.name === "Giải đấu");

        if (tournamentCategory && (item.category_id?._id === tournamentCategory._id || item.category_id === tournamentCategory._id)) {
            const leaguesRes = await fetch('http://localhost:3000/api/leagues', {
                headers: { 'Accept': 'application/json' }
            });
            if (!leaguesRes.ok) throw new Error('Không thể tải giải đấu');
            const leagues = await leaguesRes.json();
            const filteredLeagues = leagues.filter(league => league.category_id._id === tournamentCategory._id);

            if (filteredLeagues.length > 0) {
                const leagueSelect = document.createElement("select");
                leagueSelect.id = "edit-league";
                leagueSelect.innerHTML = `<option value="">Chọn giải đấu (không bắt buộc)</option>` +
                    filteredLeagues.map(league => `<option value="${league._id}">${league.name}</option>`).join("");
                leagueSelect.value = item.league_id?._id || item.league_id || "";
                leagueContainer.appendChild(document.createElement("label")).textContent = "Chọn giải đấu:";
                leagueContainer.appendChild(leagueSelect);
            }
        }

        categorySelect.addEventListener('change', async () => {
            leagueContainer.innerHTML = "";
            if (categorySelect.value === tournamentCategory._id) {
                const leaguesRes = await fetch('http://localhost:3000/api/leagues');
                const leagues = await leaguesRes.json();
                const filteredLeagues = leagues.filter(league => league.category_id._id === tournamentCategory._id);
                if (filteredLeagues.length > 0) {
                    const leagueSelect = document.createElement("select");
                    leagueSelect.id = "edit-league";
                    leagueSelect.innerHTML = `<option value="">Chọn giải đấu (không bắt buộc)</option>` +
                        filteredLeagues.map(league => `<option value="${league._id}">${league.name}</option>`).join("");
                    leagueContainer.appendChild(document.createElement("label")).textContent = "Chọn giải đấu:";
                    leagueContainer.appendChild(leagueSelect);
                }
            }
        });

        document.getElementById("editModal").style.display = "block";
        row.classList.add("editing");
    } catch (error) {
        console.error("Lỗi khi tải bài viết:", error);
        alert("Lỗi: " + error.message);
    }
}

async function saveEdit() {
    const title = document.getElementById("edit-content-name").value.trim();
    const category_id = document.getElementById("edit-category").value;
    const league_id = document.getElementById("edit-league")?.value || null;
    const fileInput = document.getElementById("edit-logo");

    if (!title) {
        alert("Vui lòng nhập tiêu đề!");
        return;
    }
    if (!category_id) {
        alert("Vui lòng chọn danh mục!");
        return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("slug", generateSlug(title));
    formData.append("content", "Nội dung mặc định");
    formData.append("summary", "Tóm tắt mặc định");
    formData.append("category_id", category_id);
    if (league_id) formData.append("league_id", league_id);
    if (fileInput.files.length > 0) {
        formData.append("image", fileInput.files[0]);
    } else if (document.getElementById("edit-logo").dataset.currentImage) {
        formData.append("image_url", document.getElementById("edit-logo").dataset.currentImage);
    }

    const row = document.querySelector(".editing");
    const postId = row.dataset.id;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3000/api/news/${postId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Lỗi khi cập nhật bài viết");
        }

        alert("Cập nhật bài viết thành công!");
        closeEditModal();
        fetchNews();
    } catch (error) {
        console.error("Lỗi khi cập nhật:", error);
        alert("Lỗi: " + error.message);
    }
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
    const activeRow = document.querySelector(".editing");
    if (activeRow) activeRow.classList.remove("editing");
}

// ------------------------ ADD MODAL -----------------------------
// Mở modal
function openAddModal() {
    const modal = document.getElementById('addModal');
    modal.style.display = 'block';
    loadCategories(); // Tải danh sách thể loại khi mở modal
}

// Đóng modal
function closeAddModal() {
    const modal = document.getElementById('addModal');
    modal.style.display = 'none';
    document.getElementById('add-content-form').reset(); // Reset form
    document.getElementById('add-league-container').style.display = 'none'; // Ẩn giải đấu
}

// Tải danh sách thể loại từ API
async function loadCategories() {
    try {
        const res = await fetch('http://localhost:3000/api/categories');
        if (!res.ok) throw new Error('Không thể tải danh sách thể loại');
        const categories = await res.json();
        
        const categorySelect = document.getElementById('add-category');
        categorySelect.innerHTML = '<option value="" disabled selected>Chọn thể loại</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Lỗi khi tải thể loại:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Tải danh sách giải đấu từ API
async function loadLeagues() {
    try {
        const res = await fetch('http://localhost:3000/api/leagues');
        if (!res.ok) throw new Error('Không thể tải danh sách giải đấu');
        const leagues = await res.json();
        
        const leagueSelect = document.getElementById('add-league');
        leagueSelect.innerHTML = '<option value="" disabled selected>Chọn giải đấu</option>';
        leagues.forEach(league => {
            const option = document.createElement('option');
            option.value = league._id;
            option.textContent = league.name;
            leagueSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Lỗi khi tải giải đấu:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Hiển thị/ẩn trường "Chọn giải đấu" dựa trên category
async function toggleLeagueSelect() {
    const categorySelect = document.getElementById('add-category');
    const leagueContainer = document.getElementById('add-league-container');
    const selectedCategoryId = categorySelect.value;

    if (!selectedCategoryId) {
        leagueContainer.style.display = 'none';
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/api/categories/${selectedCategoryId}`);
        if (!res.ok) throw new Error('Không thể lấy thông tin thể loại');
        const category = await res.json();

        if (category.name === 'Giải đấu') {
            leagueContainer.style.display = 'block';
            loadLeagues(); // Tải danh sách giải đấu
        } else {
            leagueContainer.style.display = 'none';
            document.getElementById('add-league').value = ''; // Reset giá trị giải đấu
        }
    } catch (error) {
        console.error('Lỗi khi kiểm tra thể loại:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Cập nhật addNewPost
async function addNewPost() {
    const title = document.getElementById('add-content-name').value;
    const slug = document.getElementById('add-slug').value; // Lấy slug từ input
    const summary = document.getElementById('add-summary').value;
    const content = document.getElementById('add-content').value;
    const category_id = document.getElementById('add-category').value;
    const league_id = document.getElementById('add-league').value || null;
    const imageFile = document.getElementById('add-logo').files[0];
    const author_id = window.currentAuthorId;

    console.log('Dữ liệu gửi đi:', {
        title,
        slug,
        summary,
        content,
        category_id,
        league_id,
        author_id,
        imageFile: imageFile ? imageFile.name : null
    });

    if (!title || !slug || !summary || !content || !category_id || !author_id) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('slug', slug);
    formData.append('summary', summary);
    formData.append('content', content);
    formData.append('category_id', category_id);
    formData.append('league_id', league_id);
    formData.append('author_id', author_id);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const res = await fetch('http://localhost:3000/api/news', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`HTTP error! Status: ${res.status} - ${errorData.message}`);
        }

        const data = await res.json();
        alert('Thêm bài viết thành công!');
        closeAddModal();
        fetchNews();
    } catch (error) {
        console.error('Lỗi khi thêm bài viết:', error);
        alert('Lỗi: ' + error.message);
    }
}

// ------------------------ DELETE -----------------------------

async function deletePost(button) {
    const row = button.closest("tr");
    const postId = row.dataset.id;

    if (confirm("Bạn có chắc chắn muốn xoá bài viết này?")) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/api/news/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Lỗi khi xoá bài viết");
            }

            alert("Xoá thành công!");
            row.remove();
        } catch (error) {
            console.error("Lỗi khi xoá:", error);
            alert("Lỗi: " + error.message);
        }
    }
}

// ------------------------ CLICK OUTSIDE (Đóng Modal) -----------------------------

window.addEventListener("click", function (event) {
    const editModal = document.getElementById("editModal");
    const addModal = document.getElementById("addModal");

    if (event.target === editModal) closeEditModal();
    if (event.target === addModal) closeAddModal();
});