document.addEventListener('DOMContentLoaded', () => {
    fetchStandings();
});

// Hàm chuẩn hóa tên đội bóng (giảm thiểu vì đã chuẩn hóa trong HTML)
function normalizeTeamName(name) {
    const teamMap = {
        // Có thể để trống nếu tất cả tên đã khớp
        // Thêm ánh xạ nếu cần trong tương lai
    };
    return teamMap[name] || name;
}

// Hàm lấy bảng xếp hạng từ server
async function fetchStandings() {
    try {
        const response = await fetch('http://localhost:3000/standings');
        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status} - ${response.statusText}`);
        }
        const standings = await response.json();
        updateStandings(standings);
    } catch (error) {
        console.error('Lỗi khi lấy bảng xếp hạng:', error);
        const table = document.querySelector('.ranking table');
        const errorRow = document.createElement('tr');
        errorRow.innerHTML = '<td colspan="5" style="text-align: center; color: red;">Không thể tải bảng xếp hạng. Vui lòng thử lại sau.</td>';
        table.appendChild(errorRow);
    }
}

// Hàm cập nhật bảng xếp hạng trên giao diện, bao gồm logo
function updateStandings(standings) {
    const rows = document.querySelectorAll('.boc');

    rows.forEach(row => {
        const teamName = row.getAttribute('data-team');
        const teamData = standings.find(team => normalizeTeamName(team.name) === teamName);

        if (teamData) {
            // Cập nhật số trận, hiệu số, và điểm
            row.querySelector('.matches').textContent = teamData.matches;
            row.querySelector('.goal-difference').textContent = teamData.goalDifference > 0 ? `+${teamData.goalDifference}` : teamData.goalDifference;
            row.querySelector('.points').textContent = teamData.points;

            // Thêm hoặc cập nhật logo
            const logoCell = row.querySelector('.team-logo');
            let logoImg = logoCell.querySelector('img');
            if (!logoImg && teamData.logo) {
                logoImg = document.createElement('img');
                logoImg.alt = teamName;
                logoCell.insertBefore(logoImg, logoCell.firstChild);
            }
            if (teamData.logo) {
                logoImg.src = teamData.logo;
                logoImg.style.width = '20px';
                logoImg.style.marginRight = '5px';
            } else {
                if (logoImg) logoImg.remove();
                console.warn(`Không tìm thấy logo cho đội: ${teamName}`);
            }
        } else {
            console.warn(`Không tìm thấy dữ liệu cho đội: ${teamName}`);
        }
    });
}