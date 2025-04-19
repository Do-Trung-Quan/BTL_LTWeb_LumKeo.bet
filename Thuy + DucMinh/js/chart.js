// Đảm bảo Chart.js đã được tải trước khi chạy mã
if (typeof Chart === 'undefined') {
    console.error('Chart.js chưa được tải. Vui lòng kiểm tra lại.');
} else {
    // Gắn sự kiện click cho các card
    document.querySelectorAll('.stats-cards .card').forEach(card => {
        card.addEventListener('click', function () {
            const type = this.dataset.type;
            showChart(type);
        });
    });

    let myChart = null;

    function showChart(type) {
        // Kiểm tra phần tử canvas, container và title có tồn tại không
        const ctx = document.getElementById('myChart');
        const container = document.getElementById('chart-container');
        const title = document.getElementById('chart-title');

        if (!ctx || !container || !title) {
            console.error('Không tìm thấy canvas, container hoặc title. Vui lòng kiểm tra HTML.');
            return;
        }

        // Xóa biểu đồ cũ nếu có
        if (myChart) {
            myChart.destroy();
        }

        // Dữ liệu mặc định
        let labels = [];
        let data = [];
        let chartTitle = '';

        // Xử lý dữ liệu theo type
        switch (type) {
            case 'baibao':
                labels = ['T1', 'T2', 'T3', 'T4', 'T5'];
                data = [12, 19, 3, 5, 2];
                chartTitle = 'Thống kê số bài báo theo tháng';
                break;
            case 'nguoidung':
                labels = ['T1', 'T2', 'T3', 'T4', 'T5'];
                data = [20, 25, 22, 21, 28];
                chartTitle = 'Thống kê số người dùng mới';
                break;
            case 'tacgia':
                labels = ['T1', 'T2', 'T3', 'T4', 'T5'];
                data = [2, 4, 3, 5, 6];
                chartTitle = 'Số tác giả mới mỗi tháng';
                break;
            case 'binhluan':
                labels = ['T1', 'T2', 'T3', 'T4', 'T5'];
                data = [100, 200, 180, 250, 300];
                chartTitle = 'Lượt bình luận theo tháng';
                break;
            default:
                console.warn(`Loại biểu đồ "${type}" không hợp lệ.`);
                title.innerText = 'Biểu đồ không khả dụng';
                container.style.display = 'block';
                return;
        }

        // Cập nhật tiêu đề
        title.innerText = chartTitle;

        // Tạo biểu đồ mới
        myChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số lượng',
                    data: data,
                    fill: true,
                    borderColor: '#0099ff',
                    backgroundColor: 'rgba(0,153,255,0.1)',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Tháng'
                        }
                    },
                    y: {
                        title: {
                            display: true
                        },
                        beginAtZero: true
                    }
                }
            }
        });

        // Hiển thị container nếu chưa hiển thị
        if (container.style.display !== 'block') {
            container.style.display = 'block';
        }
    }

    // Gọi showChart với case 'baibao' mặc định khi trang tải
    showChart('baibao');
}