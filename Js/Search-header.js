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
