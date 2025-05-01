async function populateTheLoaiDropdown(categories, leagues) {
    const theLoaiMenu = document.getElementById('theLoai-menu');
    if (!theLoaiMenu) {
        console.error('TheLoai menu element not found');
        return;
    }

    try {
        // Show loading state
        theLoaiMenu.innerHTML = '<li><a href="#" data-category="">Đang tải...</a></li>';

        // Add the "Tất cả" option
        theLoaiMenu.innerHTML = '<li><a href="#" data-category="Tất cả">Tất cả</a></li>';

        // Add all categories (type: 'Category'), excluding "Giải đấu"
        const categoryItems = categories
            .filter(cat => cat.type === 'Category' && cat.name !== 'Giải đấu')
            .map(category => {
                return `<li><a href="#" data-category="${category.name}" data-type="category" data-id="${category._id}">${category.name}</a></li>`;
            })
            .join('');

        // Add all leagues (type: 'League') without filtering
        const leagueItems = leagues
            .filter(league => league.type === 'League')
            .map(league => {
                const logo = league.logo_url ? `<img src="${league.logo_url}" alt="${league.name}" style="width: 20px; margin-right: 5px;">` : '';
                return `<li><a href="#" data-category="${league.name}" data-type="league" data-id="${league._id}">${logo}${league.name}</a></li>`;
            })
            .join('');

        // Append all items to the menu
        theLoaiMenu.innerHTML += categoryItems + leagueItems;

        console.log('TheLoai dropdown populated successfully');
    } catch (error) {
        console.error('Error populating TheLoai dropdown:', error);
        theLoaiMenu.innerHTML = '<li><a href="#" data-category="Tất cả">Tất cả</a></li>' +
                                '<li><a href="#" data-category="">Không có thể loại</a></li>';
    }
}

function filterTableByCategory(category) {
    const rows = document.querySelectorAll("#table-body tr");
    if (!rows.length) {
        console.warn('No rows found in #table-body to filter');
        return;
    }

    // If "Tất cả" is selected, show all rows
    if (category === "Tất cả") {
        rows.forEach(row => {
            row.style.display = "table-row";
        });
        return;
    }

    const selectedCategory = category.toLowerCase().trim();

    rows.forEach(row => {
        // Assuming "Thể loại" is the third column (index 2)
        const categoryValue = row.children[2]?.textContent.trim().toLowerCase();
        if (!categoryValue) {
            console.warn('Category value not found in row:', row);
            row.style.display = "none";
            return;
        }

        row.style.display = categoryValue === selectedCategory ? "table-row" : "none";
    });
}

function resetTable() {
    const rows = document.querySelectorAll("#table-body tr");
    rows.forEach(row => {
        row.style.display = "table-row";
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Step 1: Fetch categories and leagues
        const categories = await fetchCategories();
        const leagues = await fetchLeagues();
        console.log('Stored categories:', categories);
        console.log('Stored leagues:', leagues);

        // Step 2: Populate the "Thể Loại" dropdown
        await populateTheLoaiDropdown(categories, leagues);

        // Step 3: Set up event listeners for the dropdown
        const theLoaiMenuItems = document.querySelectorAll("#theLoai-menu li a");
        const dropdownButton = document.querySelector(".custom-button");
        const dropdownMenu = document.getElementById("theLoai-menu");

        // Hiển thị dropdown khi click vào nút "THỂ LOẠI"
        if (dropdownButton && dropdownMenu) {
            dropdownButton.addEventListener("click", function (event) {
                dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
                event.stopPropagation();
            });
        }

        // Xử lý sự kiện click vào các mục trong dropdown
        theLoaiMenuItems.forEach(link => {
            link.addEventListener("click", function (event) {
                event.preventDefault();

                let selectedCategory = this.dataset.category;
                filterTableByCategory(selectedCategory);

                // Cập nhật văn bản của nút "THỂ LOẠI"
                if (dropdownButton) {
                    dropdownButton.childNodes[0].nodeValue = selectedCategory + ' ';
                }

                // Ẩn dropdown sau khi chọn
                if (dropdownMenu) {
                    dropdownMenu.style.display = "none";
                }
            });
        });

        // Ẩn dropdown khi click ra ngoài
        document.addEventListener("click", function (event) {
            if (dropdownMenu && !event.target.closest(".dropdown_two")) {
                dropdownMenu.style.display = "none";
            }
        });
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Lỗi: ' + error.message);
    }
});