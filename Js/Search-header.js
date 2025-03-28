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
      { title: "Antony cùng đồng đội thắng ngược Real Madrid", source: "Tác giả", time: "9 giờ trước", image:"/pics/News/A-MainNews.png", url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Loạt ngôi sao đội tuyển Việt Nam sắp đối đầu Man Utd?", source: "Kinh Đô", time: "38 phút trước", image:"/pics/News/A-SideNews1.png", url: "/Quang/baichitiet/html/baichitiet.html" },
      { title: "Pep tuyên bố về Man City, diễn biến bất ngờ tương lai De Bruyne.", source: "Báo Hà Tĩnh", time: "1 giờ trước", image:"/pics/News/A-SideNews2.png",  url: "/Quang/baichitiet/html/baichitiet.html" },
      { title: "MU đề xuất đổi Hojlund kèm tiền mặt để lấy tiền đạo của Napoli", source: "Hànộimới", time: "1 giờ trước" , image:"/pics/News/A-SideNews3.png",  url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Ngày buồn của thủ môn Bùi Tiến Dũng", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/B-MainNews.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "'Vượt khó' thắng SHB Đà Nẵng 3-2, Hà Nội FC vươn lên nhì bảng V-League", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/B-SideNews1.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Cầu thủ Việt kiều Hà Lan được triệu tập vào đội tuyển U17 quốc gia.", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/B-SideNews2.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "CLB Đà Nẵng suýt tạo bất ngờ trên sân Hàng Đẫy", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/B-SideNews3.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "MU 1-1 Fulham: Bruno tỏa sáng", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/C-MainNews.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Barca đòi lại ngôi đầu La Liga", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/C-SideNews1.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "MU chọn được HLV cực ấn tượng thay Ruben Amorim", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/C-SideNews2.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Estevao vượt mặt Neymar", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/C-SideNews3.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Man United bất ngờ dẫn đầu Ngoại hạng Anh, Ruben Amorim tìm ra công thức chiến thắng", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/EPL-MainNews.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Tháng 3 kỳ lạ cho chặng đua 'nước rút' của Ngoại hạng Anh", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/EPL-SideNews1.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Phong độ ấn tượng của Mohamed Salah có thể nâng giá trị bản hợp đồng mới với Liverpool", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/EPL-BotNews1.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Leicester City đối mặt với nguy cơ xuống hạng", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/EPL-BotNews2.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Thủ môn tung đòn như kungfu, sao Ngoại Hạng Anh khâu 25 mũi.", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/EPL-BotNews3.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Lịch thi đấu vòng 28 giải ngoại hạng Anh", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/EPL-BotNews4.png" , url: "/Quang/baichitiet/html/baichitiet.html"},
      { title: "Barca hoãn trận đấu vì bác sĩ đột tử", source: "SAOstar", time: "1 giờ trước", image:"/pics/News/LLG-MainNews.jpg" , url: "/Quang/baichitiet/html/baichitiet.html"},
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

