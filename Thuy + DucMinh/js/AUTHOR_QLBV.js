// Function to get unique values from the third column ("Thể loại")
function populateCategoryDropdown() {
    const categories = new Set(); // Using a Set to store unique values

    document.querySelectorAll("#table-body tr").forEach(row => {
        let categoryValue = row.children[2].textContent.trim(); // Get value from 3rd column
        categories.add(categoryValue);
    });

    const dropdown = document.getElementById("theloai-menu");
    dropdown.innerHTML = ""; // Clear old values

    // Add "Clear All" option
    let clearOption = document.createElement("a");
    clearOption.href = "#";
    clearOption.textContent = "Clear All";
    clearOption.style.fontWeight = "bold";
    clearOption.style.color = "red";
    clearOption.addEventListener("click", () => displayPage(1));
    dropdown.appendChild(clearOption);
    
    // Add category options
    categories.forEach(category => {
        let option = document.createElement("a");
        option.href = "#";
        option.textContent = category;
        option.addEventListener("click", () => filterTableByCategory(category));
        dropdown.appendChild(option);
    });
}

// Function to filter table rows by category
function filterTableByCategory(category) {
    document.querySelectorAll("#table-body tr").forEach(row => {
        let categoryValue = row.children[2].textContent.trim();
        row.style.display = categoryValue === category ? "table-row" : "none";
    });
}

// Function to reset table and show all rows
function resetTable() {
    document.querySelectorAll("#table-body tr").forEach(row => {
        row.style.display = "table-row";
    });
}

// Toggle dropdown menu for "Thể loại" button
document.getElementById("theloai-btn").addEventListener("click", function (event) {
    event.stopPropagation();
    let dropdown = document.getElementById("theloai-menu");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    populateCategoryDropdown(); // Update dropdown when opening
});

// Close dropdown when clicking outside
document.addEventListener("click", function () {
    document.getElementById("theloai-menu").style.display = "none";
});



//modal

// Function to open the modal (updated for "THÊM BÀI VIẾT")
// Open edit modal and populate it with existing data from the row
function openEditModal(button) {
    let row = button.closest("tr"); // Get the table row
    let title = row.cells[0].textContent.trim(); 
    let imageSrc = row.cells[1].querySelector("img").src;
    let category = row.cells[2].textContent.trim();
    let date = row.cells[3].textContent.trim();

    // Populate modal fields
    document.getElementById("edit-content-name").value = title;
    document.getElementById("edit-category").value = category;
    document.getElementById("edit-logo").dataset.currentImage = imageSrc; // Store current image path
    document.getElementById("edit-date").value = formatDateForInput(date); // Set date

    document.getElementById("editModal").style.display = "flex"; // Show modal
    row.classList.add("editing"); // Mark row as editing
}

// Format date from "DD/MM/YYYY" to "YYYY-MM-DD" for input field
function formatDateForInput(dateString) {
    let parts = dateString.split("/");
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : "";
}

// Save changes back to the table
function saveEdit() {
    let modal = document.getElementById("editModal");
    let title = document.getElementById("edit-content-name").value.trim();
    let category = document.getElementById("edit-category").value.trim();
    let date = document.getElementById("edit-date").value; // Get new date
    let fileInput = document.getElementById("edit-logo");
    let imageSrc = fileInput.files.length > 0 ? URL.createObjectURL(fileInput.files[0]) : fileInput.dataset.currentImage;

    // Convert date from "YYYY-MM-DD" to "DD/MM/YYYY"
    let formattedDate = date ? date.split("-").reverse().join("/") : "";

    // Find the active row and update it
    let row = document.querySelector(".editing"); 
    if (row) {
        row.cells[0].textContent = title;
        row.cells[1].querySelector("img").src = imageSrc;
        row.cells[2].textContent = category;
        row.cells[3].textContent = formattedDate; // Update the date
    }

    closeEditModal();
}

// Close modal
function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
    let activeRow = document.querySelector(".editing");
    if (activeRow) activeRow.classList.remove("editing"); // Remove editing class
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
function addNewPost() {
    let title = document.getElementById("add-content-name").value;
    let category = document.getElementById("add-category").value;
    let date = document.getElementById("add-date").value;
    let fileInput = document.getElementById("add-logo");
    
    // Convert date format from "YYYY-MM-DD" to "DD/MM/YYYY"
    let formattedDate = date.split("-").reverse().join("/");

    // Default image if none is uploaded
    let imageSrc = fileInput.files.length > 0 ? URL.createObjectURL(fileInput.files[0]) : "img/default.png";

    // Create a new row
    let table = document.getElementById("postTable").querySelector("tbody");
    let newRow = table.insertRow();

    newRow.innerHTML = `
        <td>${title}</td>
        <td><img src="${imageSrc}" alt="${category}" style="width: 100px; height: auto;"></td>
        <td>${category}</td>
        <td>${formattedDate}</td>
        <td>
            <a href="../Quang/baichitiet/html/baichitiet.html" class="icon-btn">
                <i class="fa-regular fa-eye"></i>
            </a>
            <button onclick="openEditModal(this); this.closest('tr').classList.add('editing')">
                <i class="fa-solid fa-pen"></i>
            </button>
            <i class="fa-solid fa-trash-can" onclick="deletePost(this)"></i>
        </td>
    `;

    closeAddModal(); // Close modal after adding
}

// Function to delete a post
function deletePost(button) {
    let row = button.closest("tr");
    row.remove();
}
