document.addEventListener("DOMContentLoaded", function () {
    const searchBox = document.querySelector(".search-box");
    const tableRows = document.querySelectorAll("#table-body tr");
    const tableHeader = document.querySelector("#table-head tr"); // Giữ header luôn hiển thị

    searchBox.addEventListener("input", function () {
        let keyword = searchBox.value.trim().toLowerCase();

        tableRows.forEach(row => {
            // Lấy ô ID và ô tác giả
            let idCell = row.querySelector("td:nth-child(1)");
            let authorCell = row.querySelector("td:nth-child(2)");

            if (idCell && authorCell) {
                let idText = idCell.textContent.trim().toLowerCase();
                let authorText = authorCell.textContent.trim().toLowerCase();

                // Kiểm tra nếu từ khóa tìm kiếm xuất hiện trong ID hoặc tên tác giả
                row.style.display = idText.includes(keyword) || authorText.includes(keyword) ? "table-row" : "none";
            }
        });

        // Đảm bảo header luôn hiển thị
        if (tableHeader) {
            tableHeader.style.display = "table-row";
        }
    });
});
