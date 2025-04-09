document.addEventListener("DOMContentLoaded", function () {
    // 📌 Thay đổi ảnh đại diện
    const profilePic = document.getElementById("profile_pic");
    const profilePicInput = document.getElementById("profile_pic_input");
    const avatarInput = document.getElementById("avaInput");
    const btnSelectAva = document.getElementById("btn_select_ava");
    const btnSaveAva = document.getElementById("btn_save_ava");
    const imgUpload = document.querySelector(".img_upload img");

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
        const avatarData = avatarInput.value;
        if (avatarData) {
            localStorage.setItem("savedAvatar", avatarData); // Lưu vào localStorage (nếu cần)
            alert("Ảnh đại diện đã được cập nhật!");
        }
    });
    
    // Load thông tin đã lưu khi trang tải lại
    // const savedAvatar = localStorage.getItem("savedAvatar");
    // if (savedAvatar) {
    //     profilePic.src = savedAvatar;       // Cập nhật ảnh ở header
    //     imgUpload.src = savedAvatar;        // Cập nhật ảnh trong form
    //     avatarInput.value = savedAvatar;    // Cập nhật giá trị ẩn (nếu cần gửi đi)
    // }

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
    const passOld = document.getElementById("pass_old");
    const passNew = document.getElementById("pass_new");

    // Kiểm tra khi nhập mật khẩu để bật/tắt nút "Lưu thay đổi mật khẩu"
    passOld.addEventListener("input", function () {
        btnChangePassword.disabled = passOld.value.trim() === "" || passNew.value.trim() === "";
    });
    
    passNew.addEventListener("input", function () {
        btnChangePassword.disabled = passOld.value.trim() === "" || passNew.value.trim() === "";
    });

    btnChangePassword.addEventListener("click", () => {
        alert("Mật khẩu đã được cập nhật!");
        // Bạn có thể gửi dữ liệu này lên server ở đây
    });

    // 📌 Lưu thông tin họ tên
    const fullnameInput = document.getElementById("txtFullname");
    const saveButton = document.getElementById("btn_save_fullname");
    const personalInfoName = document.querySelector(".user_detail h2");

    // Kiểm tra khi nhập liệu để bật/tắt nút "Lưu"
    fullnameInput.addEventListener("input", function () {
        saveButton.disabled = fullnameInput.value.trim() === "";
    });

    // Lưu thông tin họ tên vào localStorage
    saveButton.addEventListener("click", function () {
        const fullname = fullnameInput.value.trim();
        if (fullname) {
            localStorage.setItem("savedFullname", fullname);
            personalInfoName.textContent = fullname; // Cập nhật tên trên thanh personal_info
            alert("Đã lưu họ tên thành công!");
        }
    });

    // Load thông tin đã lưu khi trang tải lại
    // const savedFullname = localStorage.getItem("savedFullname");
    // if (savedFullname) {
    //     fullnameInput.value = savedFullname;
    //     personalInfoName.textContent = savedFullname; // Cập nhật tên khi trang tải lại
    //     saveButton.disabled = false;
    // }
});
