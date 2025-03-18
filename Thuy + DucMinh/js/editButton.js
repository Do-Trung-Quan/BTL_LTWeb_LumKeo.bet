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