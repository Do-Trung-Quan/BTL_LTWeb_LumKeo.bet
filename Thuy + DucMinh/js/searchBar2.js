document.addEventListener("DOMContentLoaded", function () {
    // Lấy phần tử ô tìm kiếm
    const searchBox = document.querySelector(".search-box");

    // Lấy tất cả các hàng trong bảng (tbody)
    const tableRows = document.querySelectorAll("#table-body tr");

    // Lắng nghe sự kiện khi người dùng nhập vào ô tìm kiếm
    searchBox.addEventListener("input", function () {
        // Lấy từ khóa tìm kiếm, loại bỏ khoảng trắng đầu/cuối và chuyển về chữ thường
        let keyword = searchBox.value.trim().toLowerCase();

        // Duyệt qua từng hàng trong bảng
        tableRows.forEach(row => {
            // Lấy nội dung của cột 1 (tiêu đề bài viết) và cột 2 (tên tác giả/người dùng)
            let idCell = row.querySelector("td:nth-child(1)");
            let authorCell = row.querySelector("td:nth-child(2)");
        
            // Kiểm tra nếu ô tồn tại, lấy nội dung và chuyển thành chữ thường
            let idText = idCell ? idCell.textContent.trim().toLowerCase() : "";
            let authorText = authorCell ? authorCell.textContent.trim().toLowerCase() : "";
        
            // Nếu keyword rỗng, hiển thị tất cả hàng; nếu không, kiểm tra keyword có xuất hiện trong 1 trong 2 cột hay không
            row.style.display = keyword === "" || idText.includes(keyword.toLowerCase()) || authorText.includes(keyword.toLowerCase()) 
                ? "table-row" 
                : "none";
        });
    });
});
