const searchIcon = document.getElementById("search-icon");
const searchHeader = document.querySelector(".search-header");

// Khi bấm vào icon tìm kiếm -> Mở thanh search
searchIcon.addEventListener("click", (event) => {
    searchHeader.classList.add("active");
    event.stopPropagation(); // Ngăn chặn sự kiện lan ra body
});

// Khi bấm vào bất cứ đâu ngoài search-header -> Đóng thanh search
document.addEventListener("click", (event) => {
    if (!searchHeader.contains(event.target) && !searchIcon.contains(event.target)) {
        searchHeader.classList.remove("active");
    }
});
