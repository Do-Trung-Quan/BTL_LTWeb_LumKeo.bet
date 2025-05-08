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

    // Prevent form submission from reloading the page
    document.querySelector(".search-bar").addEventListener("submit", function (event) {
        event.preventDefault();
    });

    // Show dropdown when typing
    searchInput.addEventListener("input", async function () {
        const query = searchInput.value.trim();
        dropdownSearchbar.innerHTML = "";
        console.log("Query:", query);
    
        if (query.length === 0) {
            dropdownSearchbar.style.display = "none";
            console.log("Dropdown hidden: Empty query");
            return;
        }
    
        try {
            const res = await fetch("http://localhost:3000/api/articles/title", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ title: query })
            });
            

            console.log("API response status:", res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
    
            const articles = await res.json();
            // const articles = response;
            console.log("Articles:", articles);
    
            if (!Array.isArray(articles)) {
                console.error("Articles is not an array:", articles);
                dropdownSearchbar.style.display = "none";
                console.log("Dropdown hidden: Not an array");
                return;
            }
    
            if (articles.length === 0) {
                dropdownSearchbar.style.display = "none";
                console.log("Dropdown hidden: No articles");
                return;
            }
    
            articles.forEach(article => {
                const newsItem = document.createElement("div");
                newsItem.classList.add("news-search-item");
                newsItem.setAttribute("data-url",  `/Quang/baichitiet/html/baichitiet.html?slug=${article.slug}`);
    
                const publishedAt = new Date(article.updated_at);
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
                    <img src="${article.thumbnail || '/pics/News/default.png'}" alt="Ảnh bài viết" class="news-search-img">
                    <div class="news-search-content">
                        <div class="news-search-title">${article.title}</div>
                        <div class="news-search-source">${article.UserID?.username || 'Tác giả'} - ${timeDisplay}</div>
                    </div>
                `;
                newsItem.addEventListener("click", function () {
                    window.location.href = newsItem.getAttribute("data-url");
                });
                dropdownSearchbar.appendChild(newsItem);
            });
    
            dropdownSearchbar.style.display = "block";
            console.log("Dropdown shown: Articles found");
        } catch (error) {
            console.error("Lỗi khi tìm kiếm bài báo:", error);
            dropdownSearchbar.style.display = "none";
            console.log("Dropdown hidden: Error occurred");
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener("click", function (e) {
        if (!searchInput.contains(e.target) && !dropdownSearchbar.contains(e.target)) {
            dropdownSearchbar.style.display = "none";
        }
    });
});