document.addEventListener("DOMContentLoaded", function () {
    // Lấy tất cả các icon thùng rác có class "fa-trash-can"
    document.querySelectorAll(".fa-trash-can").forEach(icon => {
        
        // Thêm sự kiện click cho từng icon thùng rác
        icon.addEventListener("click", function () {
            
            // Hiển thị hộp thoại xác nhận trước khi xóa
            if (confirm("Bạn có chắc chắn muốn xóa không?")) {
                
                // Tìm phần tử <tr> gần nhất chứa icon (hàng của bảng)
                let row = this.closest("tr");

                // Xóa hàng khỏi bảng nếu tồn tại
                row.remove();
            }
        });
    });
});
