document.addEventListener("DOMContentLoaded", function () {
    // Lấy ô input tìm kiếm
    const searchBox = document.querySelector(".search-box");

    // Kiểm tra xem searchBox có tồn tại không
    if (!searchBox) {
        console.error('Search box not found! Selector: .search-box');
        return;
    }

    console.log('Search box initialized:', searchBox);

    // Function to determine the currently visible table body
    function getCurrentTableBody() {
        const publishedTable = document.getElementById('published-table');
        const unpublishedTable = document.getElementById('unpublished-table');
        const singleTableBody = document.getElementById('table-body');
        
        if (publishedTable && publishedTable.style.display !== 'none') {
            return document.getElementById('published-body');
        } else if (unpublishedTable && unpublishedTable.style.display !== 'none') {
            return document.getElementById('unpublished-body');
        } else if (singleTableBody) {
            return singleTableBody; // Fallback to table-body if it exists
        }
        return null; // Fallback if no table body is found
    }

    // Lắng nghe sự kiện khi người dùng nhập vào ô tìm kiếm
    searchBox.addEventListener("input", function () {
        // Lấy nội dung người dùng nhập vào, loại bỏ khoảng trắng thừa và chuyển thành chữ thường
        let keyword = searchBox.value.trim().toLowerCase();
        console.log('Search keyword:', keyword);

        // Lấy tất cả các hàng (tr) trong phần thân của bảng tại thời điểm tìm kiếm
        const tableBody = getCurrentTableBody();
        if (!tableBody) {
            console.warn('No visible table body found to search');
            return;
        }

        const tableRows = tableBody.querySelectorAll("tr");
        if (!tableRows.length) {
            console.warn('No rows found in the current table body to filter');
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
            // Reapply category filter if active
            const dropdownButton = document.querySelector(".custom-button");
            if (dropdownButton) {
                const selectedCategory = dropdownButton.childNodes[0].nodeValue.trim();
                if (selectedCategory !== 'Tất cả') {
                    filterTableByCategory(selectedCategory);
                }
            }
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

        // Reapply category filter after search
        const dropdownButton = document.querySelector(".custom-button");
        if (dropdownButton) {
            const selectedCategory = dropdownButton.childNodes[0].nodeValue.trim();
            if (selectedCategory !== 'Tất cả') {
                filterTableByCategory(selectedCategory);
            }
        }
    });
});