document.addEventListener('DOMContentLoaded', () => {
    const announcementsList = document.getElementById('announcements-list');
    const modal = document.getElementById('announcement-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDate = document.getElementById('modal-date');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');

    // 從 JSON 檔案獲取公告資料
    fetch('announcements.json')
        .then(response => response.json())
        .then(data => {
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
        .catch(error => console.error('Error fetching announcements:', error));

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