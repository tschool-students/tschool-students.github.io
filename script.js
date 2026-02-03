document.addEventListener('DOMContentLoaded', () => {
    const announcementsList = document.getElementById('announcements-list');
    const loadingSpinner = document.getElementById('loading-spinner');
    const modal = document.getElementById('announcement-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDate = document.getElementById('modal-date');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');
    const paginationControls = document.getElementById('pagination-controls');

    // ==========================================
    // 請將下方的網址替換為您的 Apps Script 網頁應用程式網址
    // ==========================================
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyftBXv8Jg6RXMQOeDZMhnaU1gvFoj1bofrbLmaHbnPh90-0tY5SGrf5Naa2CXq2g0k/exec'; 
    // 例如: 'https://script.google.com/macros/s/AKfycbx.../exec'

    let allAnnouncements = []; // 用來儲存所有抓取到的公告
    let currentPage = 1; // 當前頁碼，預設為第一頁
    const announcementsPerPage = 10; // 每頁顯示 10 則公告

    // 顯示 Loading
    loadingSpinner.style.display = 'block';
    announcementsList.style.display = 'none';

    fetch(GOOGLE_SCRIPT_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            allAnnouncements = data; // 儲存所有公告
            
            // 隱藏 Loading
            loadingSpinner.style.display = 'none';
            announcementsList.style.display = 'block';

            if (allAnnouncements.length > 0) {
                displayAnnouncements(currentPage); // 顯示第一頁的公告
                setupPagination(); // 設定分頁控制項
            } else {
                announcementsList.innerHTML = '<p>目前沒有任何公告。</p>';
            }
        })
        .catch(error => {
            console.error('抓取公告時發生錯誤:', error);
            loadingSpinner.style.display = 'none';
            announcementsList.style.display = 'block';
            announcementsList.innerHTML = '<p style="color: red; text-align:center;">公告載入失敗，請檢查網路或稍後再試。</p>';
        });
        
    // --- 顯示指定頁面公告的函式 ---
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
            
            // 處理 Tags 顯示 (如果有)
            let tagsHtml = '';
            if (Array.isArray(announcement.tags) && announcement.tags.length > 0) {
                tagsHtml = '<div class="tags-container">';
                announcement.tags.forEach(tag => {
                    if(tag) tagsHtml += `<span class="tag">${tag}</span>`;
                });
                tagsHtml += '</div>';
            }

            item.innerHTML = `
                <h4>${announcement.title}</h4>
                <p>公告日期：${announcement.date} | 公告單位：${announcement.author}｜公告字號：${announcement.number}</p>
                ${tagsHtml}
            `;
            item.addEventListener('click', () => openModal(announcement));
            announcementsList.appendChild(item);
        });
    }

    // --- 設定分頁控制項的函式 ---
    function setupPagination() {
        paginationControls.innerHTML = ''; // 清空分頁控制項
        const pageCount = Math.ceil(allAnnouncements.length / announcementsPerPage);
        
        // 只有一頁時不顯示分頁
        if(pageCount <= 1) return;

        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement('button');
            btn.innerText = i;
            btn.classList.add('pagination-btn');

            if (i === currentPage) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                displayAnnouncements(i);
                // 更新按鈕的 active 狀態
                const currentActive = document.querySelector('.pagination-btn.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                btn.classList.add('active');
                // 點擊換頁後回到公告頂部
                document.querySelector('.announcements').scrollIntoView({behavior: 'smooth'});
            });
            paginationControls.appendChild(btn);
        }
    }


    // 開啟內嵌視窗
    function openModal(announcement) {
        modalTitle.textContent = announcement.title;
        modalDate.textContent = `公告日期：${announcement.date} | 公告單位：${announcement.author}｜公告字號：${announcement.number}`;
        
        // 取得內容，若無內容則給空字串
        let content = announcement.content || "";
        
        // 【關鍵修改】使用正規表達式將所有的 \n, \r\n, \r 都替換成 <br>
        // 這樣無論您在 Google Sheet 是用 Alt+Enter 換行，或是複製貼上的文字，都能正常顯示
        let formattedContent = content.replace(/\r\n|\n|\r/g, '<br>');

        // 將轉換後的內容放入視窗中
        modalBody.innerHTML = formattedContent;
        
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