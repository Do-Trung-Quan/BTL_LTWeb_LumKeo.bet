//search-header section
document.addEventListener("DOMContentLoaded", function () {
  const searchButton = document.querySelector(".search-button"); // Use querySelector for class
  const searchHeader = document.querySelector(".search-header");
  const overlay = document.querySelector(".dark-overlay"); // Fix selector name

  searchButton.addEventListener("click", function () {
      searchHeader.classList.add("active");
      overlay.classList.add("active");
  });

  overlay.addEventListener("click", function () {
      searchHeader.classList.remove("active");
      overlay.classList.remove("active");
  });
});

//dropdown searchbar section
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-text");
  const dropdownSearchbar = document.getElementById("dropdown-searchbar");

  const newsList = [
      { title: "Tháng 3 kỳ lạ cho chặng đua 'nước rút' của Ngoại hạng Anh", source: "Tác giả", time: "9 giờ trước", image:"/pics/News/A-MainNews.png", url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Tuyển Việt Nam đứng trước thách thức lớn từ 'cơn bão' chấn thương", source: "Kinh Đô", time: "38 phút trước", image:"/pics/News/A-MainNews.png", url: "/Quang/baichitiet/html/baichitiet.html" },
      { title: "U22 Việt Nam lộ diện đội hình chính dự giải Trung Quốc", source: "Báo Hà Tĩnh", time: "1 giờ trước", image:"/pics/News/A-MainNews.png",  url: "/Quang/baichitiet/html/baichitiet.html" },
      { title: "Đội tuyển U22 Việt Nam lên đường tham dự giải U22 quốc tế CFA Team China 2025", source: "Hànộimới", time: "1 giờ trước" , image:"/pics/News/A-MainNews.png",  url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Tiền đạo Supachok trở lại Thái Lan sau lùm xùm", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/A-MainNews.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Tiền đạo Supachok trở lại Thái Lan sau lùm xùm", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/A-MainNews.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Tiền đạo Supachok trở lại Thái Lan sau lùm xùm", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/A-MainNews.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Tiền đạo Supachok trở lại Thái Lan sau lùm xùm", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/A-MainNews.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Tiền đạo Supachok trở lại Thái Lan sau lùm xùm", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/A-MainNews.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Tiền đạo Supachok trở lại Thái Lan sau lùm xùm", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/A-MainNews.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
  ];

  // Chặn form submit gây reload trang
  document.querySelector(".search-bar").addEventListener("submit", function (event) {
      event.preventDefault();
  });

  // Hiển thị dropdown khi nhập liệu
  searchInput.addEventListener("input", function () {
      const query = searchInput.value.trim().toLowerCase();
      dropdownSearchbar.innerHTML = "";

      if (query.length === 0) {
          dropdownSearchbar.style.display = "none";
          return;
      }

      const filteredNews = newsList.filter(news => news.title.toLowerCase().includes(query));

      if (filteredNews.length === 0) {
          dropdownSearchbar.style.display = "none";
          return;
      }

      filteredNews.forEach(news => {
          const newsItem = document.createElement("div");
          newsItem.classList.add("news-search-item");
          newsItem.setAttribute("data-url", news.url); // Gán URL vào data-url

          newsItem.innerHTML = `
            <img src="${news.image}" alt="Ảnh bài viết" class="news-search-img">
            <div class="news-search-content">
              <div class="news-search-title">${news.title}</div>
              <div class="news-search-source">${news.source} - ${news.time}</div>
            </div>
            `;
          newsItem.addEventListener("click", function () {
              window.location.href = news.url;
          });
          dropdownSearchbar.appendChild(newsItem);
      });

      dropdownSearchbar.style.display = "block";
  });

  // Ẩn dropdown khi click ra ngoài
  document.addEventListener("click", function (e) {
      if (!searchInput.contains(e.target) && !dropdownSearchbar.contains(e.target)) {
          dropdownSearchbar.style.display = "none";
      }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".news-search-item").forEach(item => {
      item.addEventListener("click", function () {
          let url = this.getAttribute("data-url");
          if (url) {
              window.location.href = url; // Chuyển hướng đến bài viết
          }
      });
  });
});

