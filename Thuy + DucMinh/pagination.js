document.addEventListener("DOMContentLoaded", function () {
    const pagination = document.querySelector(".pagination");
    let totalPages = 68;
    let currentPage = 1;

    function updatePagination() {
        pagination.innerHTML = ""; // Xóa nội dung cũ

        // Nút Previous
        let prev = document.createElement("button");
        prev.classList.add("prev");
        prev.innerHTML = "← Previous";
        prev.disabled = currentPage === 1;
        prev.onclick = () => changePage(currentPage - 1);
        pagination.appendChild(prev);

        // Thêm các số trang
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
                let page = document.createElement("button");
                page.innerText = i;
                page.classList.add("page");
                if (i === currentPage) page.classList.add("active");
                page.onclick = () => changePage(i);
                pagination.appendChild(page);
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                let dots = document.createElement("span");
                dots.innerText = "...";
                dots.classList.add("dots");
                pagination.appendChild(dots);
            }
        }

        // Nút Next
        let next = document.createElement("button");
        next.classList.add("next");
        next.innerHTML = "Next →";
        next.disabled = currentPage === totalPages;
        next.onclick = () => changePage(currentPage + 1);
        pagination.appendChild(next);
    }

    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            updatePagination();
        }
    }

    // Khởi tạo pagination ban đầu
    updatePagination();
});