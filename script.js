document.addEventListener('DOMContentLoaded', () => {
    const announcementsList = document.getElementById('announcements-list');
    const modal = document.getElementById('announcement-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDate = document.getElementById('modal-date');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');

    // --- 【修改處】 ---
    // 在檔案名稱後面加上一個獨特的時間戳參數，來防止快取
    const cacheBustingURL = `announcements.json?v=${new Date().getTime()}`;

    // 從 JSON 檔案獲取公告資料
    fetch(cacheBustingURL) // <--- 使用新的網址
        .then(response => {
            // 檢查伺服器回應是否正常
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // 清空舊的公告，以防萬一
            announcementsList.innerHTML = ''; 
            
            data.forEach(announcement => {
                const item = document.createElement('div');
                item.classList.add('announcement-item');
                item.innerHTML = `
                    <h4>${announcement.title}</h4>
                    <p>發布日期：${announcement.date} | 發布單位：${announcement.author}</p>
                `;
                item.addEventListener('click', () => openModal(announcement));
                announcementsList.appendChild(item);
            });
        })
        .catch(error => {
            console.error('抓取公告時發生錯誤:', error);
            announcementsList.innerHTML = '<p style="color: red;">公告載入失敗，請稍後再試。</p>';
        });

    // 開啟內嵌視窗
    function openModal(announcement) {
        modalTitle.textContent = announcement.title;
        modalDate.textContent = `發布日期：${announcement.date} | 發布單位：${announcement.author}`;
        modalBody.innerHTML = announcement.content.replace(/\n/g, '<br>'); // 將換行符號轉換為 <br>
        modal.style.display = 'block';
    }

    // 關閉內嵌視窗
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // 點擊視窗外部關閉
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
});