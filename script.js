document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 0. 完美版 CSV 解析工具 (支援模糊對應與多重標題過濾)
    // ==========================================
    function parseCSV(csvText) {
        csvText = csvText.replace(/^\uFEFF/, '').trim();
        if (!csvText) return [];

        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let inQuote = false;

        for (let i = 0; i < csvText.length; i++) {
            let char = csvText[i];
            let nextChar = csvText[i + 1];
            if (char === '"') {
                if (inQuote && nextChar === '"') {
                    currentCell += '"'; i++; 
                } else { inQuote = !inQuote; }
            } else if (char === ',' && !inQuote) {
                currentRow.push(currentCell); currentCell = '';
            } else if ((char === '\r' || char === '\n') && !inQuote) {
                if (char === '\r' && nextChar === '\n') { i++; }
                currentRow.push(currentCell); rows.push(currentRow);
                currentRow = []; currentCell = '';
            } else { currentCell += char; }
        }
        if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell); rows.push(currentRow);
        }

        // --- 尋找標頭列 ---
        let headerLineIdx = -1;
        let headers = [];
        for (let i = 0; i < Math.min(rows.length, 15); i++) {
            const row = rows[i].map(h => h.trim().toLowerCase());
            // 只要標列中包含這些關鍵字之一，就認定為標頭列
            if (row.some(h => h.includes('name') || h.includes('title') || h.includes('姓名') || h.includes('職務'))) {
                headerLineIdx = i;
                headers = row;
                break; 
            }
        }

        const data = [];
        for (let i = headerLineIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.join('').trim() === '') continue;

            const obj = {};
            // 將原始 header 與 row 進行對應
            headers.forEach((h, index) => {
                const val = row[index] ? row[index].trim() : '';
                obj[h] = val;
            });

            // 💡 智慧對應：使用 includes 檢查標頭關鍵字
            const findVal = (keywords) => {
                const targetKey = Object.keys(obj).find(k => keywords.some(key => k.includes(key)));
                return targetKey ? obj[targetKey] : '';
            };

            const finalObj = {
                title: findVal(['title', '標題', '名稱']),
                date: findVal(['date', '日期']),
                author: findVal(['author', '發布者', '單位']),
                number: findVal(['number', '字號']),
                content: findVal(['content', '內文', '內容']),
                tags: findVal(['tags', '標籤']),
                link: findVal(['link', 'url', '網址', '連結', '更多資訊']),
                version: findVal(['version', '版本']),
                category: findVal(['category', '類別', '組別']),
                name: findVal(['name', '姓名']),
                role: findVal(['role', '職稱', '職務']),
                image: findVal(['image', '照片', '圖片', '相片']),
                email: findVal(['email', '信箱', '郵件'])
            };

            // 防呆：如果資料內容剛好等於英文標頭(如 name)，則略過
            if (finalObj.name === 'name' || finalObj.title === 'title' || (!finalObj.name && !finalObj.title)) continue;

            data.push(finalObj);
        }
        return data;
    }

    const SHEET_BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSE8Ds0bstbH-kJi4meUcfsJzg32Tvh_RoHXNrgHiPHu3OGY1eqt0LUs0302YzKKCrhjUPUDoOTYkrA/pub';

    // ==========================================
    // 1. 手機版選單切換
    // ==========================================
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = hamburger.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-xmark');
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
        const closeButton = document.querySelector('.close-button');

        const ANNOUNCEMENTS_URL = SHEET_BASE_URL + '?gid=0&single=true&output=csv&t=' + Date.now(); 

        fetch(ANNOUNCEMENTS_URL).then(res => res.text()).then(csv => {
            const allAnnouncements = parseCSV(csv).map(item => {
                item.tags = item.tags ? item.tags.split(/,|，|、/).map(t => t.trim()).filter(t => t) : [];
                return item;
            });
            loadingSpinner.style.display = 'none';
            if (allAnnouncements.length > 0) {
                renderAnnouncements(allAnnouncements, 1);
            } else {
                announcementsList.innerHTML = '<p style="text-align:center;">目前沒有公告。</p>';
            }
        });

        function renderAnnouncements(data, page) {
            announcementsList.innerHTML = '';
            const perPage = 6;
            const items = data.slice((page-1)*perPage, page*perPage);
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'ann-item';
                let tagsHtml = item.tags.map(t => `<span style="background:#eee; padding:2px 8px; border-radius:10px; font-size:0.8rem; margin-right:5px;">${t}</span>`).join('');
                div.innerHTML = `
                    <div class="ann-title">${item.title}</div>
                    <div class="ann-meta">
                        <span class="ann-date"><i class="fa-regular fa-calendar-check"></i> ${item.date}</span>
                        <span class="ann-author">｜ ${item.author}</span>
                        ${item.number ? `<span>｜ ${item.number}</span>` : ''}
                    </div>
                    <div class="ann-tags-wrapper">${tagsHtml}</div>
                `;
                div.addEventListener('click', () => {
                    document.getElementById('modal-title').textContent = item.title;
                    document.getElementById('modal-date').textContent = `${item.date} | ${item.author}`;
                    document.getElementById('modal-body').innerHTML = item.content.replace(/\n/g, '<br>');
                    modal.style.display = 'flex';
                });
                announcementsList.appendChild(div);
            });
        }
        if(closeButton) closeButton.onclick = () => modal.style.display = 'none';
    }

    // ==========================================
    // 3. 檔案專區操作
    // ==========================================
    const filesList = document.getElementById('files-list');
    if (filesList) {
        const FILES_URL = SHEET_BASE_URL + '?gid=406984821&single=true&output=csv&t=' + Date.now();
        fetch(FILES_URL).then(res => res.text()).then(csv => {
            const allFiles = parseCSV(csv);
            document.getElementById('loading-spinner').style.display = 'none';
            allFiles.forEach(item => {
                const div = document.createElement('div');
                div.className = 'file-item';
                div.innerHTML = `
                    <div class="file-icon-box"><i class="fa-solid fa-file"></i></div>
                    <div class="file-content">
                        <div class="file-title">${item.title} ${item.version ? `(${item.version})` : ''}</div>
                        <div class="file-tags">${item.tags ? item.tags.split(',').map(t => `<span class="tag-badge">${t}</span>`).join('') : ''}</div>
                    </div>
                `;
                div.onclick = () => item.link ? window.open(item.link, '_blank') : alert('暫無連結');
                filesList.appendChild(div);
            });
        });
    }

    // ==========================================
    // 4. 幹部介紹 (修正分類過濾邏輯)
    // ==========================================
    const teamMainList = document.getElementById('team-main-list');
    const teamAdminList = document.getElementById('team-admin-list');

    if (teamMainList && teamAdminList) {
        const TEAM_URL = SHEET_BASE_URL + '?gid=683145411&single=true&output=csv&t=' + Date.now(); 
        document.getElementById('loading-spinner').style.display = 'block';

        fetch(TEAM_URL).then(res => res.text()).then(csv => {
            const data = parseCSV(csv);
            document.getElementById('loading-spinner').style.display = 'none';

            // 使用 includes 確保即使 category 標頭很長也能抓到
            const mainTeam = data.filter(m => m.category && m.category.toLowerCase().includes('main'));
            const adminTeam = data.filter(m => m.category && m.category.toLowerCase().includes('admin'));

            renderTeamCards(mainTeam, teamMainList);
            renderTeamCards(adminTeam, teamAdminList);
        }).catch(err => {
            console.error(err);
            document.getElementById('loading-spinner').style.display = 'none';
        });

        function renderTeamCards(members, container) {
            container.innerHTML = members.length ? '' : '<p style="grid-column: 1/-1; text-align: center; color: #666;">目前尚無資料</p>';
            members.forEach(member => {
                const div = document.createElement('div');
                div.className = 'card team-card';
                const imageHtml = member.image 
                    ? `<img src="${member.image}" alt="${member.name}" class="profile-img" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">`
                    : `<div class="profile-placeholder"></div>`;

                div.innerHTML = `
                    <div class="profile-box">${imageHtml}</div>
                    <h3>${member.name}</h3>
                    <p class="team-role">${member.role}</p>
                    ${member.email ? `<div class="team-contact"><a href="mailto:${member.email}"><i class="fa-solid fa-envelope"></i> Email</a></div>` : ''}
                    ${member.link ? `<a href="${member.link}" class="team-more-btn" target="_blank">更多資訊 <i class="fa-solid fa-arrow-right"></i></a>` : ''}
                `;
                container.appendChild(div);
            });
        }
    }
});