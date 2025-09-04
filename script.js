document.addEventListener('DOMContentLoaded', () => {
    const announcementsList = document.getElementById('announcements-list');
    const modal = document.getElementById('announcement-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDate = document.getElementById('modal-date');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');

    const cacheBustingURL = `announcements.json?v=${new Date().getTime()}`;

    fetch(cacheBustingURL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            announcementsList.innerHTML = ''; 
            
            data.forEach(announcement => {
                const item = document.createElement('div');
                item.classList.add('announcement-item');
                item.innerHTML = `
                    <h4>${announcement.title}</h4>
                    <p><b>公告日期：</b>${announcement.date} | <b>公告單位：</b>${announcement.author}｜<b>公告字號：</b>${announcement.number}</p>
                `;
                item.addEventListener('click', () => openModal(announcement));
                announcementsList.appendChild(item);
            });
        })
        .catch(error => {
            console.error('抓取公告時發生錯誤:', error);
            announcementsList.innerHTML = '<p style="color: red;">公告載入失敗，請稍後再試。</p>';
        });

    function openModal(announcement) {
        modalTitle.textContent = announcement.title;
        modalDate.textContent = `公告日期：${announcement.date} | 公告單位：${announcement.author}｜公告字號：${announcement.number}`;
        modalBody.innerHTML = announcement.content.replace(/\n/g, '<br>');
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    closeButton.addEventListener('click', closeModal);
    
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    // ✅ 只有視窗開啟時，才允許 Esc 關閉
    document.addEventListener('keydown', (event) => {
        if ((event.key === "Escape" || event.key === "Esc") && modal.style.display === 'block') {
            closeModal();
        }
    });
});
