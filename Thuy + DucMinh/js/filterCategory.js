// Lọc bảng theo thể loại được chọn
function filterTableByCategory(category) {
    document.querySelectorAll("#table-body tr").forEach(row => {
        let categoryValue = row.children[2]?.textContent.trim();
        row.style.display = category === "Tất cả" || categoryValue === category ? "table-row" : "none";
    });
}

// Xử lý sự kiện click vào các mục trong dropdown
document.querySelectorAll("#theLoai-menu li a").forEach(link => {
    link.addEventListener("click", function (event) {
        event.preventDefault(); // Ngăn chặn chuyển hướng trang

        let selectedCategory = this.dataset.category;
        filterTableByCategory(selectedCategory);

        // Ẩn dropdown sau khi chọn
        document.getElementById("theLoai-menu").style.display = "none";
    });
});

// Hiển thị lại tất cả bài báo
function resetTable() {
    document.querySelectorAll("#table-body tr").forEach(row => {
        row.style.display = "table-row";
    });
}

// Hiển thị dropdown khi click vào nút "THỂ LOẠI"
document.querySelector(".custom-button").addEventListener("click", function (event) {
    let dropdown = document.getElementById("theLoai-menu");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    event.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài
});

// Ẩn dropdown khi click ra ngoài
document.addEventListener("click", function (event) {
    let dropdown = document.getElementById("theLoai-menu");
    if (!event.target.closest(".dropdown_two")) {
        dropdown.style.display = "none";
    }
});
