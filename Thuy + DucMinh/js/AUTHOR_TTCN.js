// document.addEventListener("DOMContentLoaded", function () {
//     // 📌 Thay đổi ảnh đại diện
//     const profilePic = document.getElementById("profile_pic");
//     const profilePicInput = document.getElementById("profile_pic_input");
//     const avatarInput = document.getElementById("avaInput");
//     const btnSelectAva = document.getElementById("btn_select_ava");
//     const btnSaveAva = document.getElementById("btn_save_ava");
//     const imgUpload = document.querySelector(".img_upload img");

//     // Khi chọn ảnh mới
//     profilePicInput.addEventListener("change", function () {
//         const file = this.files[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onload = function (e) {
//                 profilePic.src = e.target.result; // Cập nhật ảnh ở header
//                 imgUpload.src = e.target.result; // Cập nhật ảnh trong form
//                 avatarInput.value = e.target.result; // Cập nhật giá trị ẩn
//             };
//             reader.readAsDataURL(file);
//         }
//     });

//     // Nút "Chọn lại ảnh"
//     btnSelectAva.addEventListener("click", () => {
//         profilePicInput.click();
//     });

//     // Nút "Lưu thay đổi" (có thể gửi lên server)
//     btnSaveAva.addEventListener("click", () => {
//         const avatarData = avatarInput.value;
//         if (avatarData) {
//             // Gửi ảnh đại diện lên server để lưu
//             fetch('/api/users/update-avatar', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ avatar: avatarData }),
//             })
//             .then(response => response.json())
//             .then(data => {
//                 if (data.success) {
//                     alert("Ảnh đại diện đã được cập nhật!");
//                 } else {
//                     alert("Có lỗi xảy ra khi cập nhật ảnh đại diện.");
//                 }
//             })
//             .catch(error => {
//                 console.error('Error updating avatar:', error);
//                 alert("Có lỗi xảy ra.");
//             });
//         }
//     });

//     // 📌 Hiện/Ẩn mật khẩu
//     const togglePasswordBtns = document.querySelectorAll(".toggle-password");

//     togglePasswordBtns.forEach((btn) => {
//         btn.addEventListener("click", function () {
//             const inputField = this.previousElementSibling; // Lấy ô input kế trước
//             if (inputField.type === "password") {
//                 inputField.type = "text";
//                 this.textContent = "Ẩn"; // Đổi chữ thành "Ẩn"
//             } else {
//                 inputField.type = "password";
//                 this.textContent = "Hiện"; // Đổi chữ lại thành "Hiện"
//             }
//         });
//     });

//     // 📌 Lưu thay đổi mật khẩu
//     const btnChangePassword = document.getElementById("btn_change_password");
//     const passOld = document.getElementById("pass_old");
//     const passNew = document.getElementById("pass_new");

//     // Kiểm tra khi nhập mật khẩu để bật/tắt nút "Lưu thay đổi mật khẩu"
//     passOld.addEventListener("input", function () {
//         btnChangePassword.disabled = passOld.value.trim() === "" || passNew.value.trim() === "";
//     });
    
//     passNew.addEventListener("input", function () {
//         btnChangePassword.disabled = passOld.value.trim() === "" || passNew.value.trim() === "";
//     });

//     btnChangePassword.addEventListener("click", () => {
//         const oldPassword = passOld.value.trim();
//         const newPassword = passNew.value.trim();
        
//         if (oldPassword && newPassword) {
//             // Gửi mật khẩu mới lên server để thay đổi
//             fetch('/api/users/reset-password', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     oldPassword: oldPassword,
//                     newPassword: newPassword
//                 }),
//             })
//             .then(response => response.json())
//             .then(data => {
//                 if (data.success) {
//                     alert("Mật khẩu đã được thay đổi!");
//                 } else {
//                     alert("Có lỗi xảy ra khi thay đổi mật khẩu.");
//                 }
//             })
//             .catch(error => {
//                 console.error('Error changing password:', error);
//                 alert("Có lỗi xảy ra.");
//             });
//         }
//     });

//     // 📌 Lưu thông tin họ tên
//     const fullnameInput = document.getElementById("txtFullname");
//     const saveButton = document.getElementById("btn_save_fullname");
//     const personalInfoName = document.querySelector(".user_detail h2");

//     // Kiểm tra khi nhập liệu để bật/tắt nút "Lưu"
//     fullnameInput.addEventListener("input", function () {
//         saveButton.disabled = fullnameInput.value.trim() === "";
//     });

//     // Lưu thông tin họ tên vào backend
//     saveButton.addEventListener("click", function () {
//         const fullname = fullnameInput.value.trim();
//         if (fullname) {
//             // Gửi tên người dùng mới lên server để lưu
//             fetch('/api/users/update-fullname', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ fullname: fullname }),
//             })
//             .then(response => response.json())
//             .then(data => {
//                 if (data.success) {
//                     personalInfoName.textContent = fullname; // Cập nhật tên trên thanh personal_info
//                     alert("Họ tên đã được cập nhật!");
//                 } else {
//                     alert("Có lỗi xảy ra khi cập nhật họ tên.");
//                 }
//             })
//             .catch(error => {
//                 console.error('Error updating fullname:', error);
//                 alert("Có lỗi xảy ra.");
//             });
//         }
//     });

//     // 📌 Lấy thông tin người dùng từ API
//     fetch('/api/user')
//     .then(response => response.json())
//     .then(data => {
//         // Cập nhật tên người dùng vào phần tử <h2> có id="username"
//         document.getElementById('username').textContent = data.username;

//         // Cập nhật User ID vào phần tử <p> có id="userID"
//         document.getElementById('userID').textContent = `USER ID: ${data.userID}`;

//         // Cập nhật thêm các thông tin khác nếu có từ API
//         document.getElementById('email').textContent = `Email: ${data.email}`;
//         document.getElementById('phone').textContent = `Phone: ${data.phone}`;

//         // Cập nhật ảnh đại diện nếu có từ API
//         if (data.avatar) {
//             profilePic.src = data.avatar;
//             imgUpload.src = data.avatar;
//             avatarInput.value = data.avatar; // Lưu giá trị ẩn nếu cần gửi đi
//         }
//     })
//     .catch(error => {
//         console.error('Error fetching user data:', error);
//         // Trong trường hợp có lỗi, bạn có thể hiển thị thông báo lỗi
//         document.getElementById('username').textContent = 'Error loading user data';
//         document.getElementById('userID').textContent = '';
//     });
// });
