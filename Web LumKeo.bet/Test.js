document.addEventListener("DOMContentLoaded", function () {
  const newsItems = document.querySelectorAll(".news-item");

  newsItems.forEach(item => {
      item.addEventListener("mouseenter", () => {
          item.style.borderColor = "#ff00ff";
      });

      item.addEventListener("mouseleave", () => {
          item.style.borderColor = "#00f5ff";
      });
  });
});
