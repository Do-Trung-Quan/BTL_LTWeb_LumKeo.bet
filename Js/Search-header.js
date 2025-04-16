// Search-header section
document.addEventListener("DOMContentLoaded", function () {
    const searchButton = document.querySelector(".search-button");
    const searchHeader = document.querySelector(".search-header");
    const overlay = document.querySelector(".dark-overlay");

    searchButton.addEventListener("click", function () {
        searchHeader.classList.add("active");
        overlay.classList.add("active");
    });

    overlay.addEventListener("click", function () {
        searchHeader.classList.remove("active");
        overlay.classList.remove("active");
    });
});

// Dropdown searchbar section
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-text");
    const dropdownSearchbar = document.getElementById("dropdown-searchbar");

    // Chặn form submit gây reload trang
    document.querySelector(".search-bar").addEventListener("submit", function (event) {
        event.preventDefault();
    });

    // Hiển thị dropdown khi nhập liệu
    searchInput.addEventListener("input", async function () {
        const query = searchInput.value.trim().toLowerCase();
        dropdownSearchbar.innerHTML = "";

        if (query.length === 0) {
            dropdownSearchbar.style.display = "none";
            return;
        }

        try {
            // Gọi API để lấy danh sách bài báo
            const res = await fetch(`http://localhost:3000/api/news?title=${encodeURIComponent(query)}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const newsList = await res.json();
            const filteredNews = newsList.news || newsList;

            if (filteredNews.length === 0) {
                dropdownSearchbar.style.display = "none";
                return;
            }

            filteredNews.forEach(news => {
                const newsItem = document.createElement("div");
                newsItem.classList.add("news-search-item");
                newsItem.setAttribute("data-url", `/Quang/baichitiet/html/baichitiet.html?id=${news._id}`);

                // Tính thời gian đăng bài
                const publishedAt = new Date(news.published_at);
                const now = new Date();
                const diffInMs = now - publishedAt;
                const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                let timeDisplay;
                if (diffInMinutes < 60) {
                    timeDisplay = `${diffInMinutes} phút trước`;
                } else if (diffInMinutes < 1440) {
                    timeDisplay = `${Math.floor(diffInMinutes / 60)} giờ trước`;
                } else {
                    timeDisplay = `${Math.floor(diffInMinutes / 1440)} ngày trước`;
                }

                newsItem.innerHTML = `
                    <img src="${news.image_url || '/pics/News/default.png'}" alt="Ảnh bài viết" class="news-search-img">
                    <div class="news-search-content">
                        <div class="news-search-title">${news.title}</div>
                        <div class="news-search-source">${news.author_id?.username || 'Tác giả'} - ${timeDisplay}</div>
                    </div>
                `;
                newsItem.addEventListener("click", function () {
                    window.location.href = newsItem.getAttribute("data-url");
                });
                dropdownSearchbar.appendChild(newsItem);
            });

            dropdownSearchbar.style.display = "block";
        } catch (error) {
            console.error("Lỗi khi tìm kiếm bài báo:", error);
            dropdownSearchbar.style.display = "none";
        }
    });

    // Ẩn dropdown khi click ra ngoài
    document.addEventListener("click", function (e) {
        if (!searchInput.contains(e.target) && !dropdownSearchbar.contains(e.target)) {
            dropdownSearchbar.style.display = "none";
        }
    });
});