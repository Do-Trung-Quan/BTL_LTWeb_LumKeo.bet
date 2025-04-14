async function fetchNews() {
    try {
        const res = await fetch('http://localhost:3000/api/news');
        if (!res.ok) throw new Error("Lỗi khi tải dữ liệu");

        const newsList = await res.json();
        const tableBody = document.getElementById("table-body");
        tableBody.innerHTML = ""; // Clear table

        newsList.forEach(news => {
            const row = document.createElement("tr");
            row.dataset.id = news._id;

            row.innerHTML = `
                <td>${news.title}</td>
                <td><img src="${news.image_url}" alt="Thumbnail" width="60" height="60"></td>
                <td>${news.category_name || news.category_id}</td>
                <td>${formatDateDisplay(news.published_at)}</td>
                <td>
                    <button onclick="openEditModal(this)">Sửa</button>
                    <button onclick="deletePost(this)">Xoá</button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Fetch lỗi:", error);
        alert("Không thể tải dữ liệu từ máy chủ.");
    }
}

// Helper: Hiển thị ngày dạng DD/MM/YYYY
function formatDateDisplay(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN");
}

function openEditModal(postId) {
    // Gọi API để lấy dữ liệu bài viết cần sửa
    fetch(`${API_URL}/${postId}`)
        .then(response => response.json())
        .then(post => {
            document.getElementById('edit-content-name').value = post.title;
            document.getElementById('edit-category').value = post.category;
            document.getElementById('edit-date').value = post.date;
            document.getElementById('edit-content-name').dataset.postId = post.id; // Lưu ID bài viết
        })
        .catch(error => console.error('Error fetching post data for edit:', error));
    document.getElementById('editModal').style.display = 'block'; // Mở modal chỉnh sửa
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
}

// Save changes back to the table
async function saveEdit() {
    let modal = document.getElementById("editModal");
    let title = document.getElementById("edit-content-name").value.trim();
    let category = document.getElementById("edit-category").value.trim();
    let date = document.getElementById("edit-date").value;
    let fileInput = document.getElementById("edit-logo");

    let imageSrc = fileInput.files.length > 0 ? fileInput.files[0].name : fileInput.dataset.currentImage;
    let formattedDate = date ? new Date(date).toISOString() : null;

    let row = document.querySelector(".editing");
    let postId = row.dataset.id;  // bạn cần thêm: `<tr data-id="news_id">` khi load table.

    let updatedPost = {
        title: title,
        category_id: category,
        image_url: `./uploads/${imageSrc}`,
        published_at: formattedDate
    };

    try {
        let res = await fetch(`http://localhost:3000/api/news/${postId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPost)
        });

        if (res.ok) {
            alert("Cập nhật bài viết thành công!");
            closeEditModal();
            location.reload();  // Load lại bảng.
        } else {
            let err = await res.json();
            alert("Lỗi khi cập nhật bài viết: " + err.message);
        }
    } catch (error) {
        alert("Lỗi mạng: " + error);
    }
    closeEditModal();
}

// Click outside to close modal
window.onclick = function(event) {
    let modal = document.getElementById("editModal");
    if (event.target === modal) {
        closeEditModal();
    }
};





// Open modal
function openAddModal() {
    document.getElementById("addModal").style.display = "flex"; // Show modal
}

// Close modal
function closeAddModal() {
    document.getElementById("addModal").style.display = "none"; // Hide modal
}

// Close modal when clicking outside
window.onclick = function(event) {
    let modal = document.getElementById("addModal");
    if (event.target === modal) {
        closeAddModal();
    }
};

// Function to add a new post to the table
async function addNewPost() {
    let title = document.getElementById("add-content-name").value;
    let category = document.getElementById("add-category").value;
    let date = document.getElementById("add-date").value;
    let fileInput = document.getElementById("add-logo");

    let imageSrc = fileInput.files.length > 0 ? fileInput.files[0].name : "default.png";
    let formattedDate = date ? new Date(date).toISOString() : null;

    let newPost = {
        title: title,
        category_id: category,  // cần map ID từ tên nếu có.
        image_url: `./uploads/${imageSrc}`,
        published_at: formattedDate
    };

    try {
        let res = await fetch('http://localhost:3000/api/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPost)
        });

        if (res.ok) {
            alert("Thêm bài viết thành công!");
            closeAddModal();
            location.reload();  // Load lại bảng.
        } else {
            let err = await res.json();
            alert("Lỗi khi thêm bài viết: " + err.message);
        }
    } catch (error) {
        alert("Lỗi mạng: " + error);
    }
    closeAddModal(); // Close modal after adding
}

// Function to delete a post
async function deletePost(button) {
    let row = button.closest("tr");
    let postId = row.dataset.id;

    if (confirm("Bạn có chắc chắn muốn xoá bài viết này?")) {
        try {
            let res = await fetch(`http://localhost:3000/api/news/${postId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert("Xoá thành công!");
                row.remove();
            } else {
                let err = await res.json();
                alert("Lỗi khi xoá bài viết: " + err.message);
            }
        } catch (error) {
            alert("Lỗi mạng: " + error);
        }
    }
}

let newRow = table.insertRow();
newRow.dataset.id = news._id; 
