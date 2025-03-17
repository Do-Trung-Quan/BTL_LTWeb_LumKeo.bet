// 📌 Đợi đến khi toàn bộ nội dung HTML được tải xong mới thực thi JavaScript
document.addEventListener("DOMContentLoaded", function () {
    // 🏷️ Lấy các phần tử trong DOM (cấu trúc HTML)
    const uploadBtn = document.getElementById("uploadBtn"); // Nút bấm để tải lên ảnh
    const avaPic = document.getElementById("avaPic"); // Ô chọn tệp ảnh
    const avatar = document.querySelector(".avatar"); // Ảnh đại diện chính trong trang
    const profileAvatar = document.querySelector(".Personal_Info .right img"); // Ảnh đại diện trong thông tin cá nhân

    // 🎯 Ảnh mặc định khi chưa có ảnh nào được tải lên
    const defaultImage = avatar.src;

    // 🔄 Kiểm tra localStorage để tải ảnh đã lưu trước đó
    const savedImage = localStorage.getItem("profilePic"); // Lấy đường dẫn ảnh đã lưu từ localStorage
    if (savedImage) {
        avatar.src = savedImage; // Hiển thị ảnh đã lưu cho avatar chính
        profileAvatar.src = savedImage; // Hiển thị ảnh đã lưu trong phần thông tin cá nhân
    }

    // 🎯 Khi nhấn nút "Upload", tự động kích hoạt input file để chọn ảnh
    uploadBtn.addEventListener("click", function () {
        avaPic.click(); // Giả lập thao tác nhấn vào input file
    });

    // 📤 Xử lý khi người dùng chọn ảnh mới từ máy tính
    avaPic.addEventListener("change", function (event) {
        const file = event.target.files[0]; // Lấy file ảnh mà người dùng chọn
        if (file) {
            const reader = new FileReader(); // Tạo một FileReader để đọc dữ liệu ảnh

            // 📌 Khi đọc xong file ảnh, thực hiện các bước sau
            reader.onload = function (e) {
                const imageSrc = e.target.result; // Lấy dữ liệu hình ảnh đã đọc

                // 🖼️ Cập nhật ảnh đại diện trong giao diện
                avatar.src = imageSrc;
                profileAvatar.src = imageSrc;

                // 💾 Lưu ảnh vào localStorage để không bị mất khi tải lại trang
                localStorage.setItem("profilePic", imageSrc);
            };

            // 🛠️ Đọc file ảnh dưới dạng Data URL để có thể lưu vào localStorage
            reader.readAsDataURL(file);
        }
    });
});
