// Đợi cho toàn bộ nội dung của trang được tải xong trước khi thực thi script
document.addEventListener("DOMContentLoaded", function () {
    // Lấy ô input tìm kiếm
    const searchBox = document.querySelector(".search-box");
    // Lấy tất cả các hàng (tr) trong phần thân của bảng
    const tableRows = document.querySelectorAll("#table-body tr");

    // Lắng nghe sự kiện khi người dùng nhập vào ô tìm kiếm
    searchBox.addEventListener("input", function () {
        // Lấy nội dung người dùng nhập vào, loại bỏ khoảng trắng thừa và chuyển thành chữ thường
        let keyword = searchBox.value.trim().toLowerCase();

        // Lặp qua từng hàng trong bảng để kiểm tra tiêu đề
        tableRows.forEach(row => {
            // Lấy ô tiêu đề trong hàng (giả sử tiêu đề nằm ở cột đầu tiên - cột 1)
            let titleCell = row.querySelector("td:nth-child(1)"); // Cột tiêu đề
            if (titleCell) {
                // Lấy nội dung văn bản trong ô tiêu đề, loại bỏ khoảng trắng thừa và chuyển thành chữ thường
                let titleText = titleCell.textContent.trim().toLowerCase();
                // Kiểm tra xem tiêu đề có chứa từ khóa tìm kiếm không
                // Nếu có thì hiển thị hàng, nếu không thì ẩn hàng đó đi
                row.style.display = titleText.includes(keyword) ? "table-row" : "none";
            }
        });
    });
});
