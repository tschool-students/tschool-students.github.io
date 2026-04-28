document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 0. 完美版 CSV 解析工具 (支援儲存格內換行)
    // ==========================================
    function parseCSV(csvText) {
        // 移除 BOM 與前後空白
        csvText = csvText.replace(/^\uFEFF/, '').trim();
        if (!csvText) return [];

        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let inQuote = false;

        // 逐字元解析，完美處理儲存格內的換行
        for (let i = 0; i < csvText.length; i++) {
            let char = csvText[i];
            let nextChar = csvText[i + 1];

            if (char === '"') {
                if (inQuote && nextChar === '"') {
                    // 處理跳脫的雙引號 ("")
                    currentCell += '"';
                    i++; 
                } else {
                    inQuote = !inQuote;
                }
            } else if (char === ',' && !inQuote) {
                currentRow.push(currentCell);
                currentCell = '';
            } else if ((char === '\r' || char === '\n') && !inQuote) {
                // 處理 Windows (\r\n) 或 Linux (\n) 的換行
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
        
        // 推入最後一個字元與最後一列
        if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell);
            rows.push(currentRow);
        }

        // --- 自動尋找真正的「標頭列」 ---
        let headerLineIdx = -1;
        let headers = [];
        
        for (let i = 0; i < Math.min(rows.length, 15); i++) {
            const rowStr = rows[i].join('').trim();
            if (!rowStr) continue;

            const row = rows[i].map(h => h.trim().toLowerCase());
            
            if (row.includes('title') || row.includes('id') || row.includes('date') || 
                row.includes('標題') || row.includes('公告標題') || row.includes('姓名')) {
                headerLineIdx = i;
                headers = row;
                if (row.includes('title')) break; 
            }
        }

        if (headerLineIdx === -1) {
            for(let i=0; i < rows.length; i++) {
                if(rows[i].join('').trim()) {
                    headerLineIdx = i;
                    headers = rows[i].map(h => h.trim().toLowerCase());
                    break;
                }
            }
        }

        const data = [];
        
        for (let i = headerLineIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.join('').trim() === '') continue;

            const obj = {};
            headers.forEach((header, index) => {
                if (header) {
                    obj[header] = row[index] ? row[index].trim() : '';
                }
            });

            obj.title = obj.title || obj['公告標題'] || obj['標題'] || obj['名稱'] || '';
            obj.date = obj.date || obj['日期'] || obj['發布日期'] || '';
            obj.author = obj.author || obj['發布者'] || obj['作者'] || obj['單位'] || '';
            obj.number = obj.number || obj['公告字號'] || obj['字號'] || obj['公文號'] || '';
            obj.content = obj.content || obj['公告內文'] || obj['內容'] || obj['說明'] || '';
            obj.tags = obj.tags || obj['標籤'] || obj['分類'] || '';
            
            obj.link = obj.link || obj.url || obj['連結'] || obj['網址'] || '';
            obj.version = obj.version || obj['版本'] || obj['版號'] || '';
            
            obj.category = obj.category || obj['類別'] || obj['組別'] || '';
            obj.name = obj.name || obj['姓名'] || obj['幹部姓名'] || obj.title || '';
            obj.role = obj.role || obj['職稱'] || obj['職位'] || '';
            obj.image = obj.image || obj['照片'] || obj['圖片'] || '';
            obj.email = obj.email || obj['信箱'] || obj['電子郵件'] || '';

            if (!obj.title && !obj.name) continue;

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
            // 將內容中 HTML 的換行正確轉成 <br>
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