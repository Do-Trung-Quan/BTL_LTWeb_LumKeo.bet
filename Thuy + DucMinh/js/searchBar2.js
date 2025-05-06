document.addEventListener("DOMContentLoaded", function () {
    // Lấy ô input tìm kiếm
    const searchBox = document.querySelector(".search-box");

    // Kiểm tra xem searchBox có tồn tại không
    if (!searchBox) {
        console.error('Search box not found! Selector: .search-box');
        return;
    }

    console.log('Search box initialized:', searchBox);

    // Lắng nghe sự kiện khi người dùng nhập vào ô tìm kiếm
    searchBox.addEventListener("input", function () {
        // Lấy nội dung người dùng nhập vào, loại bỏ khoảng trắng thừa và chuyển thành chữ thường
        let keyword = searchBox.value.trim().toLowerCase();
        console.log('Search keyword:', keyword);

        // Lấy tất cả các hàng (tr) trong phần thân (<tbody>) của bảng
        const tableBody = document.querySelector("#table-body tbody");
        if (!tableBody) {
            console.warn('Table body not found in #table-body');
            return;
        }
        const tableRows = tableBody.querySelectorAll("tr");
        if (!tableRows.length) {
            console.warn('No rows found in #table-body tbody to filter');
            return;
        }

        console.log('Number of rows to filter:', tableRows.length);

        // Reset visibility của tất cả các hàng trước khi lọc
        tableRows.forEach(row => {
            row.style.display = 'table-row';
        });

        // Nếu không có từ khóa, hiển thị tất cả hàng
        if (!keyword) {
            console.log('No keyword entered - showing all rows');
            return;
        }

        // Lặp qua từng hàng trong bảng để kiểm tra ID và username
        tableRows.forEach(row => {
            let idCell = row.querySelector("td:nth-child(1)");
            let usernameCell = row.querySelector("td:nth-child(2)");

            if (idCell && usernameCell) {
                let idText = idCell.textContent.trim().toLowerCase();
                let usernameText = usernameCell.textContent.trim().toLowerCase();
                let matches = idText.includes(keyword) || usernameText.includes(keyword);
                console.log(`Row ID: "${idText}", Username: "${usernameText}", Keyword: "${keyword}", Matches: ${matches}`);
                row.style.display = matches ? "table-row" : "none";
            } else {
                console.warn('ID or username cell not found in row:', row);
                row.style.display = 'none'; // Ẩn hàng nếu không có ô cần thiết
            }
        });
    });
});