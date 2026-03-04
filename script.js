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

        const BASE_URL = 'https://script.google.com/macros/s/AKfycbzXb6SsfxLVm6ny59fDYMq7VbLEJPdh7USHz0yUTKTyoLExiHh3B5tA75vW8sArMoA/exec'; 
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
        const BASE_URL = 'https://script.google.com/macros/s/AKfycbzXb6SsfxLVm6ny59fDYMq7VbLEJPdh7USHz0yUTKTyoLExiHh3B5tA75vW8sArMoA/exec'; 
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
    // 4. 幹部介紹系統 (含快取與自動更新)
    // ==========================================
    const teamMainContainer = document.getElementById('team-main-container');
    const teamAdminContainer = document.getElementById('team-admin-container');

    // 只有在幹部頁面才執行
    if (teamMainContainer && teamAdminContainer) {
        const teamLoading = document.getElementById('team-loading');
        const sectionMain = document.getElementById('section-main');
        const sectionAdmin = document.getElementById('section-admin');

        const BASE_URL = 'https://script.google.com/macros/s/AKfycbzXb6SsfxLVm6ny59fDYMq7VbLEJPdh7USHz0yUTKTyoLExiHh3B5tA75vW8sArMoA/exec';
        const TEAM_URL = BASE_URL + '?sheet=team';
        const STORAGE_KEY = 'tschool_team_data_v1'; // 快取鍵名 (若資料結構大改，可改 v2 強制刷新)

        // 核心函式：渲染幹部卡片
        function renderTeam(data) {
            // 清空容器
            teamMainContainer.innerHTML = '';
            teamAdminContainer.innerHTML = '';
            
            let hasMain = false;
            let hasAdmin = false;

            data.forEach(member => {
                // 產生卡片 HTML
                const card = document.createElement('div');
                card.classList.add('card', 'team-card');

                // 處理圖片 (若無圖片則使用 UI Avatars 生成預設圖)
                const imgSrc = member.image ? member.image : `https://ui-avatars.com/api/?name=${member.name}&background=random&size=150`;

                // 處理 Email 按鈕 (若無則不顯示)
                const emailHtml = member.email ? `
                    <div class="team-contact">
                        <a href="mailto:${member.email}" target="_blank">
                            <i class="fa-solid fa-envelope"></i> 聯絡信箱
                        </a>
                    </div>` : '<div style="margin-bottom:20px;"></div>';

                // 處理更多資訊按鈕 (若無連結則顯示為純文字或隱藏)
                const linkHtml = member.link ? `
                    <a href="${member.link}" class="team-more-btn" target="_blank">
                        更多資訊 <i class="fa-solid fa-arrow-right"></i>
                    </a>` : `<span class="team-more-btn" style="opacity:0.5; cursor:default;">更多資訊</span>`;

                card.innerHTML = `
                    <div class="profile-box">
                        <img src="${imgSrc}" alt="${member.name}" class="profile-img">
                    </div>
                    <h3>${member.name}</h3>
                    <p class="team-role">${member.role}</p>
                    ${emailHtml}
                    ${linkHtml}
                `;

                // 依據 category 分類放入對應容器
                if (member.category === 'main') {
                    teamMainContainer.appendChild(card);
                    hasMain = true;
                } else {
                    teamAdminContainer.appendChild(card);
                    hasAdmin = true;
                }
            });

            // 控制區塊顯示 (如果有資料才顯示該區塊標題)
            sectionMain.style.display = hasMain ? 'block' : 'none';
            sectionAdmin.style.display = hasAdmin ? 'block' : 'none';
        }

        // 初始化流程
        function initTeam() {
            // 1. 嘗試讀取快取
            const cachedData = localStorage.getItem(STORAGE_KEY);
            let isCached = false;

            if (cachedData) {
                try {
                    const parsedData = JSON.parse(cachedData);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        console.log('Loading team from cache...');
                        renderTeam(parsedData);
                        isCached = true;
                    }
                } catch (e) {
                    console.error('Cache parse error', e);
                    localStorage.removeItem(STORAGE_KEY);
                }
            }

            // 如果沒快取，顯示 Loading
            if (!isCached) {
                teamLoading.style.display = 'block';
            }

            // 2. 背景抓取新資料 (Stale-while-revalidate 策略)
            fetch(TEAM_URL)
                .then(response => response.json())
                .then(newData => {
                    teamLoading.style.display = 'none'; // 隱藏 Loading

                    // 3. 比對資料是否變更
                    // 這裡使用 JSON 字串簡單比對，若資料量大建議用 deep equal，但此處足夠
                    if (cachedData !== JSON.stringify(newData)) {
                        console.log('Data updated from server, refreshing UI...');
                        
                        // 更新快取
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
                        
                        // 重新渲染畫面
                        renderTeam(newData);
                    } else {
                        console.log('Data is up to date.');
                    }
                })
                .catch(error => {
                    console.error('Fetch team error:', error);
                    teamLoading.style.display = 'none';
                    if (!isCached) {
                        // 如果沒快取又抓失敗，顯示錯誤訊息
                        teamMainContainer.innerHTML = '<p>載入失敗，請檢查網路。</p>';
                    }
                });
        }

        // 啟動
        initTeam();
    }
});