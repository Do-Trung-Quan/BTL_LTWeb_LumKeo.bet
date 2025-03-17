document.addEventListener("DOMContentLoaded", function () {
    // Lấy modal và nút đóng modal
    const modal = document.getElementById("editModal");
    const closeModal = document.querySelector(".modal .close");

    // Xử lý khi click vào icon chỉnh sửa
    document.querySelectorAll(".editIcon").forEach(icon => {
        icon.addEventListener("click", function () {
            modal.style.display = "flex"; // Hiện modal khi click
        });
    });

    // Đóng modal khi click vào nút "X"
    closeModal.addEventListener("click", function () {
        modal.style.display = "none";
    });

    // Đóng modal khi click ra ngoài nội dung modal
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Xử lý khi nhấn nút "Hủy"
    document.querySelector(".cancel").addEventListener("click", function () {
        modal.style.display = "none";
    });
});
