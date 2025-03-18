// Function to open the modal (updated for "THÊM BÀI VIẾT")
function openModal(action, id = null, category = "") {
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");

    modal.style.display = "block";

    if (action === "add") {
        modalTitle.textContent = "Thêm bài viết mới"; // Add new post title
        modalBody.innerHTML = `
            <label for="post-title">Tiêu đề:</label>
            <input type="text" id="post-title" placeholder="Nhập tiêu đề">

            <label for="post-category">Thể loại:</label>
            <input type="text" id="post-category" placeholder="Nhập thể loại">

            <label for="post-date">Ngày đăng:</label>
            <input type="date" id="post-date">

            <button onclick="saveNewPost()">Lưu</button>
        `;
    } else if (action === "view") {
        modalTitle.textContent = `Viewing Item ID${id}`;
        modalBody.innerHTML = `<p>Category: ${category}</p>`;
    } else if (action === "edit") {
        modalTitle.textContent = `Editing Item ID${id}`;
        modalBody.innerHTML = `
            <input type="text" value="${category}" id="edit-input">
            <button onclick="saveEdit(${id})">Save</button>
        `;
    } else if (action === "delete") {
        modalTitle.textContent = `Delete Item ID${id}?`;
        modalBody.innerHTML = `<p>Are you sure you want to delete this item?</p>
                               <button onclick="confirmDelete(${id})">Yes, Delete</button>`;
    }
}

// Function to save the new post (dummy function for now)
function saveNewPost() {
    const title = document.getElementById("post-title").value;
    const category = document.getElementById("post-category").value;
    const date = document.getElementById("post-date").value;

    console.log(`New Post Added - Title: ${title}, Category: ${category}, Date: ${date}`);
    closeModal();
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById("modal");
    if (event.target === modal) {
        closeModal();
    }
};

// Function to close the modal
function closeModal() {
    document.getElementById("modal").style.display = "none";
}
function openModal() {
    let modal = document.getElementById("editModal");
    modal.style.display = "flex"; // Show modal
}

function closeModal() {
    let modal = document.getElementById("editModal");
    modal.style.display = "none"; // Hide modal
}

// Close when clicking outside the modal
window.onclick = function(event) {
    let modal = document.getElementById("editModal");
    if (event.target === modal) {
        closeModal();
    }
};



