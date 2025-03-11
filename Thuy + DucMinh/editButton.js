document.querySelectorAll(".editIcon").forEach(icon => {
    icon.addEventListener("click", function() {
        let url = this.dataset.url; // Lấy URL từ data-url
        window.open(url, "_blank");
    });
});
