document.addEventListener('DOMContentLoaded', () => {
    // 1. 手機版選單切換 (Mobile Toggle) - 所有頁面通用
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            // 切換 icon
            const icon = hamburger.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // 2. 公告系統邏輯 - 僅在首頁執行
    const announcementsList = document.getElementById('announcements-list');
    
    // 只有當頁面上有 announcements-list 時才執行抓取邏輯
    if (announcementsList) {
        const loadingSpinner = document.getElementById('loading-spinner');
        const paginationControls = document.getElementById('pagination-controls');
        
        // Modal 元素
        const modal = document.getElementById('announcement-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalDate = document.getElementById('modal-date');
        const modalBody = document.getElementById('modal-body');
        const closeButton = document.querySelector('.close-button');

        const BASE_URL = 'https://script.google.com/macros/s/AKfycbyftBXv8Jg6RXMQOeDZMhnaU1gvFoj1bofrbLmaHbnPh90-0tY5SGrf5Naa2CXq2g0k/exec'; 
        const ANNOUNCEMENTS_URL = BASE_URL + '?sheet=announcements'; 

        let allAnnouncements = [];
        let currentPage = 1;
        const announcementsPerPage = 6;

        // 顯示 Loading
        loadingSpinner.style.display = 'block';

        fetch(ANNOUNCEMENTS_URL)
            .then(response => {
                if (!response.ok) throw new Error('Network error');
                return response.json();
            })
            .then(data => {
                allAnnouncements = data;
                loadingSpinner.style.display = 'none';

                if (allAnnouncements.length > 0) {
                    displayAnnouncements(currentPage);
                    setupPagination();
                } else {
                    announcementsList.innerHTML = '<p style="text-align:center; padding:20px;">目前沒有公告。</p>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                loadingSpinner.style.display = 'none';
                announcementsList.innerHTML = '<p style="color: red; text-align:center;">公告載入失敗，請稍後再試。</p>';
            });

        function displayAnnouncements(page) {
            announcementsList.innerHTML = '';
            currentPage = page;

            const startIndex = (page - 1) * announcementsPerPage;
            const endIndex = startIndex + announcementsPerPage;
            const paginatedItems = allAnnouncements.slice(startIndex, endIndex);

            paginatedItems.forEach(item => {
                const div = document.createElement('div');
                div.classList.add('ann-item');
                
                // 標籤處理 (如果有)
                let tagsHtml = '';
                if (Array.isArray(item.tags) && item.tags.length > 0) {
                    item.tags.forEach(tag => {
                        if(tag) tagsHtml += `<span style="background:#eee; padding:2px 8px; border-radius:10px; font-size:0.8rem; margin-right:5px;">${tag}</span>`;
                    });
                }

                // 字號處理 (如果有字號則顯示)
                const serialNumber = item.number ? `<span class="ann-serial">｜ ${item.number}</span>` : '';

                div.innerHTML = `
                    <div class="ann-title">${item.title}</div>
                    <div class="ann-meta">
                        <span class="ann-date"><i class="fa-regular fa-calendar-check"></i> ${item.date}</span>
                        <span class="ann-author">｜ ${item.author}</span>
                        ${serialNumber}
                    </div>
                    <div class="ann-tags-wrapper">${tagsHtml}</div>
                `;
                div.addEventListener('click', () => openModal(item));
                announcementsList.appendChild(div);
            });
        }

        function setupPagination() {
            paginationControls.innerHTML = '';
            const pageCount = Math.ceil(allAnnouncements.length / announcementsPerPage);
            if(pageCount <= 1) return;

            for (let i = 1; i <= pageCount; i++) {
                const btn = document.createElement('button');
                btn.innerText = i;
                btn.classList.add('page-btn');
                if (i === currentPage) btn.classList.add('active');

                btn.addEventListener('click', () => {
                    displayAnnouncements(i);
                    document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById('announcements').scrollIntoView({ behavior: 'smooth' });
                });
                paginationControls.appendChild(btn);
            }
        }

        // ... 前面的程式碼 ...

    // --- Modal 操作區塊 ---

    // 開啟內嵌視窗
    function openModal(announcement) {
        modalTitle.textContent = announcement.title;
        modalDate.textContent = `日期：${announcement.date} | 單位：${announcement.author} | 字號：${announcement.number || '無'}`;
        
        let content = announcement.content || "";
        // 替換換行符號
        let formattedContent = content.replace(/\r\n|\n|\r/g, '<br>');
        
        

        modalBody.innerHTML = formattedContent;
        
        // 【關鍵修改 1】改用 flex 以配合 CSS 的置中效果
        modal.style.display = 'flex'; 
        document.body.style.overflow = 'hidden'; // 禁止背景滾動
    }

    // 關閉視窗函式
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // 恢復背景滾動
    }

    // 點擊 X 按鈕關閉
    if(closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    // 點擊視窗外部關閉
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    // 【關鍵修改 2】新增 ESC 鍵關閉功能
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            // 檢查 Modal 是否開啟中
            if (modal.style.display === 'flex') {
                closeModal();
            }
        }
    });

    // ... 結尾 ...
    }
});