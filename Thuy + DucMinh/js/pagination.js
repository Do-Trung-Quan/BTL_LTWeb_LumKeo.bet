document.addEventListener("DOMContentLoaded", function () {
    const rowsPerPage = 7; // Số bài báo hiển thị trên mỗi trang
    let currentPage = 1; // Trang hiện tại
    let newsRows = Array.from(document.querySelectorAll("tbody tr")); // Lấy tất cả các dòng tin tức trong bảng

    const totalPages = Math.ceil(newsRows.length / rowsPerPage); // Tính tổng số trang dựa trên số bài báo
    const paginationContainer = document.querySelector(".pagination"); // Lấy phần tử chứa phân trang
    const prevButton = paginationContainer.querySelector(".prev"); // Lấy nút "Previous"
    const nextButton = paginationContainer.querySelector(".next"); // Lấy nút "Next"

    /**
     * 🏷️ Tạo lại phần phân trang dựa vào trang hiện tại
     */
    function renderPagination() {
        // Xóa nội dung phân trang cũ và thêm nút "Previous"
        paginationContainer.innerHTML = `
            <button class="prev" ${currentPage === 1 ? "disabled" : ""}>← Previous</button>
        `;

        // Duyệt qua từng số trang để hiển thị
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
                paginationContainer.innerHTML += `
                    <button class="page ${i === currentPage ? "active" : ""}">${i}</button>
                `;
            } else if ((i === currentPage - 2 || i === currentPage + 2) && totalPages > 5) {
                // Thêm dấu "..." để rút gọn phân trang nếu số trang lớn
                paginationContainer.innerHTML += `<span class="dots">...</span>`;
            }
        }

        // Thêm nút "Next"
        paginationContainer.innerHTML += `
            <button class="next" ${currentPage === totalPages ? "disabled" : ""}>Next →</button>
        `;

        // Cập nhật sự kiện cho các nút phân trang
        addEventListeners();
        // Cập nhật bảng tin tức hiển thị theo trang hiện tại
        renderTable();
    }

    /**
     * 📋 Cập nhật hiển thị dữ liệu trong bảng dựa vào trang hiện tại
     */
    function renderTable() {
        // Duyệt qua tất cả các dòng tin tức
        newsRows.forEach((row, index) => {
            // Chỉ hiển thị dòng tin tức trong phạm vi của trang hiện tại
            row.style.display =
                index >= (currentPage - 1) * rowsPerPage && index < currentPage * rowsPerPage
                    ? "table-row"
                    : "none";
        });

        // Nếu trang hiện tại không có tin tức, hiển thị thông báo
        const tableBody = document.querySelector("tbody");
        if (tableBody.querySelectorAll("tr[style='display: table-row;']").length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Không có tin tức nào.</td></tr>`;
        }
    }

    /**
     * 🎯 Thêm sự kiện click cho các nút phân trang
     */
    function addEventListeners() {
        // Bắt sự kiện khi bấm vào số trang
        paginationContainer.querySelectorAll(".page").forEach((btn) => {
            btn.addEventListener("click", function () {
                currentPage = parseInt(this.innerText); // Lấy số trang từ nội dung nút
                renderPagination(); // Cập nhật lại phân trang và bảng tin tức
            });
        });

        // Bắt sự kiện khi bấm vào nút "Previous"
        paginationContainer.querySelector(".prev").addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--; // Giảm số trang hiện tại
                renderPagination();
            }
        });

        // Bắt sự kiện khi bấm vào nút "Next"
        paginationContainer.querySelector(".next").addEventListener("click", function () {
            if (currentPage < totalPages) {
                currentPage++; // Tăng số trang hiện tại
                renderPagination();
            }
        });
    }

    // Gọi hàm để hiển thị phân trang ban đầu
    renderPagination();
});
