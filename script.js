document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. 手機版選單切換 (Mobile Toggle) - 所有頁面通用
    // ==========================================
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
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

    // ==========================================
    // 2. 公告系統邏輯 (包含 Modal)
    // ==========================================
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
                
                let tagsHtml = '';
                if (Array.isArray(item.tags) && item.tags.length > 0) {
                    item.tags.forEach(tag => {
                        if(tag) tagsHtml += `<span style="background:#eee; padding:2px 8px; border-radius:10px; font-size:0.8rem; margin-right:5px;">${tag}</span>`;
                    });
                }

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

        // --- Modal 操作區塊 (僅用於公告) ---
        function openModal(announcement) {
            modalTitle.textContent = announcement.title;
            modalDate.textContent = `日期：${announcement.date} | 單位：${announcement.author} | 字號：${announcement.number || '無'}`;
            
            let content = announcement.content || "";
            let formattedContent = content.replace(/\r\n|\n|\r/g, '<br>');
            
            modalBody.innerHTML = formattedContent;
            modal.style.display = 'flex'; 
            document.body.style.overflow = 'hidden'; 
        }

        function closeModal() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; 
        }

        if(closeButton) {
            closeButton.addEventListener('click', closeModal);
        }

        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (modal.style.display === 'flex') {
                    closeModal();
                }
            }
        });
    } // <--- 修正：這裡結束公告的 if 區塊

    // ==========================================
    // 3. 檔案專區操作 (獨立於公告邏輯之外)
    // ==========================================
    const filesList = document.getElementById('files-list');
    
    if (filesList) {
        const loadingSpinner = document.getElementById('loading-spinner');
        const paginationControls = document.getElementById('pagination-controls');

        // 設定 API 網址，指定讀取 sheet=files
        const BASE_URL = 'https://script.google.com/macros/s/AKfycbyftBXv8Jg6RXMQOeDZMhnaU1gvFoj1bofrbLmaHbnPh90-0tY5SGrf5Naa2CXq2g0k/exec'; 
        const FILES_URL = BASE_URL + '?sheet=files';

        let allFiles = [];
        let currentPage = 1;
        const filesPerPage = 8; // 每頁顯示 8 個檔案

        // 顯示 Loading
        loadingSpinner.style.display = 'block';

        fetch(FILES_URL)
            .then(response => {
                if (!response.ok) throw new Error('Network error');
                return response.json();
            })
            .then(data => {
                allFiles = data;
                loadingSpinner.style.display = 'none';

                if (allFiles.length > 0) {
                    displayFiles(currentPage);
                    setupFilePagination();
                } else {
                    filesList.innerHTML = '<p style="text-align:center; padding:20px;">目前沒有任何檔案。</p>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                loadingSpinner.style.display = 'none';
                filesList.innerHTML = '<p style="color: red; text-align:center;">檔案列表載入失敗，請稍後再試。</p>';
            });

        function displayFiles(page) {
            filesList.innerHTML = '';
            currentPage = page;

            const startIndex = (page - 1) * filesPerPage;
            const endIndex = startIndex + filesPerPage;
            const paginatedItems = allFiles.slice(startIndex, endIndex);

            paginatedItems.forEach(item => {
                const div = document.createElement('div');
                div.classList.add('file-item');

                let tagsHtml = '';
                if (Array.isArray(item.tags) && item.tags.length > 0) {
                    item.tags.forEach(tag => {
                        if(tag) tagsHtml += `<span class="tag-badge">${tag}</span>`;
                    });
                }

                const versionHtml = item.version ? `<span class="file-version">${item.version}</span>` : '';

                div.innerHTML = `
                    <div class="file-icon-box">
                        <i class="fa-solid fa-file"></i>
                    </div>
                    <div class="file-content">
                        <div class="file-title">
                            ${item.title}
                            ${versionHtml}
                        </div>
                        <!--
                        <div class="file-meta">
                            <span><i class="fa-regular fa-calendar"></i> ${item.date}</span>
                            <span><i class="fa-solid fa-user-pen"></i> ${item.author}</span>
                        </div>
                        -->
                        <div class="file-tags">${tagsHtml}</div>
                    </div>
                `;

                // 點擊直接開啟連結
                div.addEventListener('click', () => {
                    if (item.link) {
                        window.open(item.link, '_blank');
                    } else if (item.url) {
                        // 兼容 url 欄位
                        window.open(item.url, '_blank');
                    } else {
                        alert('此檔案暫無連結');
                    }
                });

                filesList.appendChild(div);
            });
        }

        function setupFilePagination() {
            paginationControls.innerHTML = '';
            const pageCount = Math.ceil(allFiles.length / filesPerPage);
            if(pageCount <= 1) return;

            for (let i = 1; i <= pageCount; i++) {
                const btn = document.createElement('button');
                btn.innerText = i;
                btn.classList.add('page-btn');
                if (i === currentPage) btn.classList.add('active');

                btn.addEventListener('click', () => {
                    displayFiles(i);
                    document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
                });
                paginationControls.appendChild(btn);
            }
        }
    }
    // ==========================================
    // 4. 幹部介紹自動讀取邏輯
    // ==========================================
    const teamMainList = document.getElementById('team-main-list');
    const teamAdminList = document.getElementById('team-admin-list');

    if (teamMainList && teamAdminList) {
        const loadingSpinnerTeam = document.getElementById('loading-spinner');
        
        // 指定抓取 sheet=team 的資料
        const BASE_URL = 'https://script.google.com/macros/s/AKfycbyftBXv8Jg6RXMQOeDZMhnaU1gvFoj1bofrbLmaHbnPh90-0tY5SGrf5Naa2CXq2g0k/exec'; 
        const TEAM_URL = BASE_URL + '?sheet=team'; 

        // 顯示 Loading
        if(loadingSpinnerTeam) loadingSpinnerTeam.style.display = 'block';

        fetch(TEAM_URL)
            .then(response => {
                if (!response.ok) throw new Error('Network error');
                return response.json();
            })
            .then(data => {
                if(loadingSpinnerTeam) loadingSpinnerTeam.style.display = 'none';

                // 將資料依據 category (main 或 admin) 進行分類
                const mainTeam = data.filter(member => member.category === 'main');
                const adminTeam = data.filter(member => member.category === 'admin');

                // 呼叫渲染函數
                renderTeamCards(mainTeam, teamMainList);
                renderTeamCards(adminTeam, teamAdminList);
            })
            .catch(error => {
                console.error('Error:', error);
                if(loadingSpinnerTeam) loadingSpinnerTeam.style.display = 'none';
                teamMainList.innerHTML = '<p style="color: red; grid-column: 1/-1;">幹部資料載入失敗，請稍後再試。</p>';
            });

        // 建立卡片的共用函數
        function renderTeamCards(members, container) {
            container.innerHTML = ''; // 清空預設內容

            if (members.length === 0) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">目前尚無資料</p>';
                return;
            }

            members.forEach(member => {
                const div = document.createElement('div');
                div.classList.add('card', 'team-card');

                // 處理照片 (若無提供連結，則顯示 FontAwesome 預設人像)
                const imageHtml = member.image 
                    ? `<img src="${member.image}" alt="${member.name}照片" class="profile-img">`
                    : `<div style="width: 120px; height: 120px; border-radius: 50%; background: #f0f0f0; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: #bbb;"><i class="fa-solid fa-user fa-3x"></i></div>`;

                // 處理 Email (若為空字串則不顯示)
                const emailHtml = member.email 
                    ? `<div class="team-contact"><a href="mailto:${member.email}" target="_blank"><i class="fa-solid fa-envelope"></i> ${member.email}</a></div>` 
                    : '';

                // 處理更多資訊 (若為空字串則不顯示)
                const linkHtml = member.link 
                    ? `<a href="${member.link}" class="team-more-btn" target="_blank">更多資訊 <i class="fa-solid fa-arrow-right"></i></a>` 
                    : '';

                div.innerHTML = `
                    <div class="profile-box">
                        ${imageHtml}
                    </div>
                    <h3>${member.name || '空缺'}</h3>
                    <p class="team-role">${member.role || ''}</p>
                    ${emailHtml}
                    ${linkHtml}
                `;

                container.appendChild(div);
            });
        }
    }
});