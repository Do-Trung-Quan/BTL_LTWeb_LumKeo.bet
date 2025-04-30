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

        // Lấy tất cả các hàng (tr) trong phần thân của bảng tại thời điểm tìm kiếm
        const tableRows = document.querySelectorAll("#table-body tr");
        if (!tableRows.length) {
            console.warn('No rows found in #table-body to filter');
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

        // Lặp qua từng hàng trong bảng để kiểm tra tiêu đề
        tableRows.forEach(row => {
            let titleCell = row.querySelector("td:nth-child(1)");
            if (titleCell) {
                let titleText = titleCell.textContent.trim().toLowerCase();
                let matches = titleText.includes(keyword);
                console.log(`Row title: "${titleText}", Keyword: "${keyword}", Matches: ${matches}`);
                row.style.display = matches ? "table-row" : "none";
            } else {
                console.warn('Title cell not found in row:', row);
                row.style.display = 'none'; // Ẩn hàng nếu không có ô tiêu đề
            }
        });
    });
});