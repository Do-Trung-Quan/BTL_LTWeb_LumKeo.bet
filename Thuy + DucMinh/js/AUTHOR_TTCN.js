document.addEventListener("DOMContentLoaded", function () {
    // 📌 Thay đổi ảnh đại diện
    const profilePic = document.getElementById("profile_pic");
    const profilePicInput = document.getElementById("profile_pic_input");
    const avatarInput = document.getElementById("avaInput");
    const btnSelectAva = document.getElementById("btn_select_ava");
    const btnSaveAva = document.getElementById("btn_save_ava");
    const imgUpload = document.querySelector(".img_upload img");

    // Khi nhấn vào avatar, mở chọn file
    profilePic.addEventListener("click", () => {
        profilePicInput.click();
    });

    // Khi chọn ảnh mới
    profilePicInput.addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                profilePic.src = e.target.result; // Cập nhật ảnh ở header
                imgUpload.src = e.target.result; // Cập nhật ảnh trong form
                avatarInput.value = e.target.result; // Cập nhật giá trị ẩn
            };
            reader.readAsDataURL(file);
        }
    });

    // Nút "Chọn lại ảnh"
    btnSelectAva.addEventListener("click", () => {
        profilePicInput.click();
    });

    // Nút "Lưu thay đổi" (có thể gửi lên server)
    btnSaveAva.addEventListener("click", () => {
        alert("Ảnh đại diện đã được cập nhật!");
    });

    // 📌 Hiện/Ẩn mật khẩu
    const togglePasswordBtns = document.querySelectorAll(".toggle-password");

    togglePasswordBtns.forEach((btn) => {
        btn.addEventListener("click", function () {
            const inputField = this.previousElementSibling; // Lấy ô input kế trước
            if (inputField.type === "password") {
                inputField.type = "text";
                this.textContent = "Ẩn"; // Đổi chữ thành "Ẩn"
            } else {
                inputField.type = "password";
                this.textContent = "Hiện"; // Đổi chữ lại thành "Hiện"
            }
        });
    });

    // 📌 Lưu thay đổi mật khẩu
    const btnChangePassword = document.getElementById("btn_change_password");

    btnChangePassword.addEventListener("click", () => {
        const passOld = document.getElementById("pass_old").value;
        const passNew = document.getElementById("pass_new").value;

        if (passOld === "" || passNew === "") {
            alert("Vui lòng nhập đầy đủ mật khẩu!");
        } else {
            alert("Mật khẩu đã được cập nhật!");
            // Bạn có thể gửi dữ liệu này lên server ở đây
        }
    });
});
