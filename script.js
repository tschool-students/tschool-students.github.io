document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 0. 增強版 CSV 解析工具 (具備智慧對應與除錯功能)
    // ==========================================
    function parseCSV(csvText) {
        // 移除可能存在的 BOM 字元 (Byte Order Mark) 與多餘空白
        csvText = csvText.replace(/^\uFEFF/, '').trim();
        const lines = csvText.split(/\r\n|\n|\r/);
        if (lines.length < 1) return [];
        
        function parseRow(row) {
            let cols = [];
            let cur = '';
            let inQuote = false;
            for (let i = 0; i < row.length; i++) {
                let char = row[i];
                if (char === '"') {
                    if (inQuote && row[i + 1] === '"') {
                        cur += '"';
                        i++; // skip escaped quote
                    } else {
                        inQuote = !inQuote; // toggle quote
                    }
                } else if (char === ',' && !inQuote) {
                    cols.push(cur);
                    cur = '';
                } else {
                    cur += char;
                }
            }
            cols.push(cur);
            return cols;
        }

        // 找到第一行標題列 (略過可能的空行)
        let headerLineIdx = 0;
        while (headerLineIdx < lines.length && !lines[headerLineIdx].trim()) {
            headerLineIdx++;
        }
        if (headerLineIdx >= lines.length) return [];

        // 轉換所有標題為小寫並清除空白，確保高容錯率
        const headers = parseRow(lines[headerLineIdx]).map(h => h.trim().toLowerCase());
        const data = [];
        
        for (let i = headerLineIdx + 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // 略過空行
            const row = parseRow(lines[i]);
            const obj = {};
            
            headers.forEach((header, index) => {
                if (header) {
                    obj[header] = row[index] ? row[index].trim() : '';
                }
            });

            // 💡 智慧備援對應：允許您的 Google Sheet 自由使用中文標題
            obj.title = obj.title || obj['標題'] || obj['名稱'] || obj['檔案名稱'] || '';
            obj.date = obj.date || obj['日期'] || obj['發布日期'] || '';
            obj.author = obj.author || obj['作者'] || obj['單位'] || obj['發布者'] || obj['發佈單位'] || '';
            obj.number = obj.number || obj['字號'] || obj['公文號'] || obj['發文字號'] || '';
            obj.content = obj.content || obj['內容'] || obj['公告內容'] || obj['說明'] || '';
            obj.tags = obj.tags || obj['標籤'] || obj['分類'] || '';
            
            obj.link = obj.link || obj.url || obj['連結'] || obj['網址'] || obj['檔案連結'] || '';
            obj.version = obj.version || obj['版本'] || obj['版號'] || '';
            
            obj.category = obj.category || obj['類別'] || obj['組別'] || obj['群組'] || '';
            obj.name = obj.name || obj['姓名'] || obj['幹部姓名'] || obj.title || '';
            obj.role = obj.role || obj['職稱'] || obj['職位'] || obj['角色'] || '';
            obj.image = obj.image || obj['照片'] || obj['圖片'] || obj['大頭照'] || '';
            obj.email = obj.email || obj['信箱'] || obj['電子郵件'] || obj['聯絡信箱'] || '';

            data.push(obj);
        }
        return data;
    }

    // 發布的 Google Sheet URL Base
    const SHEET_BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSE8Ds0bstbH-kJi4meUcfsJzg32Tvh_RoHXNrgHiPHu3OGY1eqt0LUs0302YzKKCrhjUPUDoOTYkrA/pub';


    // ==========================================
    // 1. 手機版選單切換 (Mobile Toggle)
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
    // 2. 公告系統邏輯
    // ==========================================
    const announcementsList = document.getElementById('announcements-list');
    
    if (announcementsList) {
        const loadingSpinner = document.getElementById('loading-spinner');
        const paginationControls = document.getElementById('pagination-controls');
        
        const modal = document.getElementById('announcement-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalDate = document.getElementById('modal-date');
        const modalBody = document.getElementById('modal-body');
        const closeButton = document.querySelector('.close-button');

        // 指定讀取公告表單 (gid=0)，加入參數防快取機制
        const ANNOUNCEMENTS_URL = SHEET_BASE_URL + '?gid=0&single=true&output=csv&t=' + Date.now(); 

        let allAnnouncements = [];
        let currentPage = 1;
        const announcementsPerPage = 6;

        loadingSpinner.style.display = 'block';

        fetch(ANNOUNCEMENTS_URL)
            .then(response => {
                if (!response.ok) throw new Error('Network error');
                return response.text();
            })
            .then(csv => {
                let parsedData = parseCSV(csv);
                
                parsedData = parsedData.map(item => {
                    if (item.tags && typeof item.tags === 'string') {
                        // 支援半形逗號、全形逗號、頓號來做為標籤分隔
                        item.tags = item.tags.split(/,|，|、/).map(t => t.trim()).filter(t => t);
                    } else if (!item.tags) {
                        item.tags = [];
                    }
                    return item;
                });
                
                allAnnouncements = parsedData;
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

        if(closeButton) closeButton.addEventListener('click', closeModal);

        window.addEventListener('click', (event) => {
            if (event.target == modal) closeModal();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display === 'flex') {
                closeModal();
            }
        });
    }

    // ==========================================
    // 3. 檔案專區操作
    // ==========================================
    const filesList = document.getElementById('files-list');
    
    if (filesList) {
        const loadingSpinner = document.getElementById('loading-spinner');
        const paginationControls = document.getElementById('pagination-controls');

        // 指定讀取檔案表單 (gid=406984821)
        const FILES_URL = SHEET_BASE_URL + '?gid=406984821&single=true&output=csv&t=' + Date.now();

        let allFiles = [];
        let currentPage = 1;
        const filesPerPage = 8; 

        loadingSpinner.style.display = 'block';

        fetch(FILES_URL)
            .then(response => {
                if (!response.ok) throw new Error('Network error');
                return response.text();
            })
            .then(csv => {
                let parsedData = parseCSV(csv);
                
                parsedData = parsedData.map(item => {
                    if (item.tags && typeof item.tags === 'string') {
                        item.tags = item.tags.split(/,|，|、/).map(t => t.trim()).filter(t => t);
                    } else if (!item.tags) {
                        item.tags = [];
                    }
                    return item;
                });
                
                allFiles = parsedData;
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
                        <div class="file-tags">${tagsHtml}</div>
                    </div>
                `;

                div.addEventListener('click', () => {
                    if (item.link) {
                        window.open(item.link, '_blank');
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
        
        // 指定讀取團隊表單 (gid=683145411)
        const TEAM_URL = SHEET_BASE_URL + '?gid=683145411&single=true&output=csv&t=' + Date.now(); 

        if(loadingSpinnerTeam) loadingSpinnerTeam.style.display = 'block';

        fetch(TEAM_URL)
            .then(response => {
                if (!response.ok) throw new Error('Network error');
                return response.text();
            })
            .then(csv => {
                const data = parseCSV(csv);
                if(loadingSpinnerTeam) loadingSpinnerTeam.style.display = 'none';

                const mainTeam = data.filter(member => member.category === 'main');
                const adminTeam = data.filter(member => member.category === 'admin');

                renderTeamCards(mainTeam, teamMainList);
                renderTeamCards(adminTeam, teamAdminList);
            })
            .catch(error => {
                console.error('Error:', error);
                if(loadingSpinnerTeam) loadingSpinnerTeam.style.display = 'none';
                teamMainList.innerHTML = '<p style="color: red; grid-column: 1/-1;">幹部資料載入失敗，請稍後再試。</p>';
            });

        function renderTeamCards(members, container) {
            container.innerHTML = ''; 

            if (members.length === 0) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">目前尚無資料</p>';
                return;
            }

            members.forEach(member => {
                const div = document.createElement('div');
                div.classList.add('card', 'team-card');

                const imageHtml = member.image 
                    ? `<img src="${member.image}" alt="${member.name}照片" class="profile-img">`
                    : `<div style="width: 120px; height: 120px; border-radius: 50%; background: #f0f0f0; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: #bbb;"><i class="fa-solid fa-user fa-3x"></i></div>`;

                const emailHtml = member.email 
                    ? `<div class="team-contact"><a href="mailto:${member.email}" target="_blank"><i class="fa-solid fa-envelope"></i> ${member.email}</a></div>` 
                    : '';

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