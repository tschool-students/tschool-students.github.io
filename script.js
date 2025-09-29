document.addEventListener('DOMContentLoaded', () => {
    const announcementsList = document.getElementById('announcements-list');
    const modal = document.getElementById('announcement-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDate = document.getElementById('modal-date');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');

    // --- 【新增】分頁功能變數 ---
    const paginationControls = document.getElementById('pagination-controls');
    let allAnnouncements = []; // 用來儲存所有抓取到的公告
    let currentPage = 1; // 當前頁碼，預設為第一頁
    const announcementsPerPage = 10; // 每頁顯示 10 則公告

    const cacheBustingURL = `announcements.json?v=${new Date().getTime()}`;

    fetch(cacheBustingURL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            allAnnouncements = data; // 儲存所有公告
            if (allAnnouncements.length > 0) {
                displayAnnouncements(currentPage); // 顯示第一頁的公告
                setupPagination(); // 設定分頁控制項
            } else {
                announcementsList.innerHTML = '<p>目前沒有任何公告。</p>';
            }
        })
        .catch(error => {
            console.error('抓取公告時發生錯誤:', error);
            announcementsList.innerHTML = '<p style="color: red;">公告載入失敗，請稍後再試。</p>';
        });
        
    // --- 【新增】顯示指定頁面公告的函式 ---
    function displayAnnouncements(page) {
        announcementsList.innerHTML = ''; // 清空當前的列表
        currentPage = page; // 更新當前頁碼

        // 計算當前頁面應該顯示的公告範圍
        const startIndex = (page - 1) * announcementsPerPage;
        const endIndex = startIndex + announcementsPerPage;
        const paginatedAnnouncements = allAnnouncements.slice(startIndex, endIndex);

        // 顯示該頁的公告
        paginatedAnnouncements.forEach(announcement => {
            const item = document.createElement('div');
            item.classList.add('announcement-item');
            item.innerHTML = `
                <h4>${announcement.title}</h4>
                <p>公告日期：${announcement.date} | 公告單位：${announcement.author}｜公告字號：${announcement.number}</p>
            `;
            item.addEventListener('click', () => openModal(announcement));
            announcementsList.appendChild(item);
        });
    }

    // --- 【新增】設定分頁控制項的函式 ---
    function setupPagination() {
        paginationControls.innerHTML = ''; // 清空分頁控制項
        const pageCount = Math.ceil(allAnnouncements.length / announcementsPerPage);

        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement('button');
            btn.innerText = i;
            btn.classList.add('pagination-btn');

            if (i === currentPage) {
                btn.classList.add('active'); // 將當前頁碼的按鈕設為 active
            }

            btn.addEventListener('click', () => {
                displayAnnouncements(i); // 點擊時顯示對應頁面的公告
                // 更新按鈕的 active 狀態
                const currentActive = document.querySelector('.pagination-btn.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                btn.classList.add('active');
            });
            paginationControls.appendChild(btn);
        }
    }


    // 開啟內嵌視窗
    function openModal(announcement) {
        modalTitle.textContent = announcement.title;
        modalDate.textContent = `公告日期：${announcement.date} | 公告單位：${announcement.author}｜公告字號：${announcement.number}`;
        modalBody.innerHTML = announcement.content.replace(/\n/g, '<br>');
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