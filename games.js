function renderStatsContent() {
            const statsContent = DOMElements.statsModal.content;

            const partnerMessages = messages.filter(msg =>
                msg.sender !== 'user' && msg.sender !== null &&
                msg.text &&
                msg.type !== 'system'
            );
            
            const myMessages = messages.filter(msg =>
                msg.sender === 'user' &&
                msg.text &&
                msg.type !== 'system'
            );

            if (partnerMessages.length === 0 && myMessages.length === 0) {
                statsContent.innerHTML = `
                    <div class="stats-empty-state">
                        <div class="stats-empty-icon"><i class="fas fa-chart-pie"></i></div>
                        <h3>暫無資料</h3>
                        <p>多聊幾句再來看看吧...</p>
                    </div>`;
                return;
            }

            const getTopReplies = (msgs) => {
                const countMap = {};
                msgs.forEach(msg => {
                    const text = msg.text.trim();
                    if (text) {
                        countMap[text] = (countMap[text] || 0) + 1;
                    }
                });
                return Object.entries(countMap)
                    .map(([text, count]) => ({ text, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5); 
            };

            const partnerTop = getTopReplies(partnerMessages);
            const myTop = getTopReplies(myMessages);

            const generateRankHTML = (list) => {
                if (list.length === 0) return '<div style="text-align:center;color:var(--text-secondary);font-size:12px;padding:10px;">暫無資料</div>';
                const maxVal = list[0].count;
                return list.map((item, index) => {
                    const percent = (item.count / maxVal) * 100;
                    return `
                    <div class="rank-item">
                        <div class="rank-progress-bg" style="width: ${percent}%; opacity: 0.1; background-color: var(--text-primary);"></div>
                        <div class="rank-info">
                            <div class="rank-number">#${index + 1}</div>
                            <div class="rank-text" title="${item.text}">${item.text}</div>
                            <div class="rank-count">${item.count}次</div>
                        </div>
                    </div>`;
                }).join('');
            };

            const allMsgs = messages.filter(m => m.timestamp);
            const firstMsg = allMsgs.length > 0 ? allMsgs[0] : { timestamp: new Date() };
            const lastMsg = allMsgs.length > 0 ? allMsgs[allMsgs.length - 1] : { timestamp: new Date() };

            const formatDate = (dateObj) => {
                return new Date(dateObj).toLocaleDateString('zh-CN', {
                    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                });
            };

            statsContent.innerHTML = `
                <div class="stats-dashboard">
                    <div class="stats-overview-grid">
                        <div class="overview-item overview-large">
                            <div class="overview-value">${messages.length}</div>
                            <div class="overview-label">總訊息數</div>
                        </div>
                        <div class="overview-row-two">
                            <div class="overview-item">
                                <div class="overview-value">${myMessages.length}</div>
                                <div class="overview-label">我傳送的</div>
                            </div>
                            <div class="overview-item">
                                <div class="overview-value">${partnerMessages.length}</div>
                                <div class="overview-label">對方傳送的</div>
                            </div>
                        </div>
                        <div class="overview-row-dates">
                            <div class="overview-item overview-date">
                                <div class="overview-date-icon"><i class="fas fa-seedling"></i></div>
                                <div>
                                    <div class="overview-date-label">初次相遇</div>
                                    <div class="overview-date-value">${formatDate(firstMsg.timestamp)}</div>
                                </div>
                            </div>
                            <div class="overview-item overview-date">
                                <div class="overview-date-icon"><i class="fas fa-heart"></i></div>
                                <div>
                                    <div class="overview-date-label">最近聯絡</div>
                                    <div class="overview-date-value">${formatDate(lastMsg.timestamp)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="stats-card">
                        <div style="display:flex; gap:8px; margin-bottom:12px;">
                            <button id="stats-toggle-partner" class="stats-toggle-btn active" onclick="switchStatsView('partner')">
                                <i class="fas fa-user-circle"></i> 對方
                            </button>
                            <button id="stats-toggle-me" class="stats-toggle-btn" onclick="switchStatsView('me')">
                                <i class="fas fa-user"></i> 我方
                            </button>
                        </div>
                        <div class="stats-card-title" id="stats-rank-title">
                            <i class="fas fa-user-circle"></i> 對方高頻詞 TOP 5
                        </div>
                        <div class="stats-rank-list" id="stats-rank-list">
                            ${generateRankHTML(partnerTop)}
                        </div>
                    </div>
                </div>
            `;

            statsContent._partnerHTML = generateRankHTML(partnerTop);
            statsContent._myHTML = generateRankHTML(myTop);
        }

        window.switchStatsView = function(who) {
            const statsContent = DOMElements.statsModal.content;
            const partnerBtn = document.getElementById('stats-toggle-partner');
            const meBtn = document.getElementById('stats-toggle-me');
            const title = document.getElementById('stats-rank-title');
            const list = document.getElementById('stats-rank-list');
            if (!partnerBtn || !meBtn || !list) return;

            if (who === 'partner') {
                partnerBtn.classList.add('active');
                meBtn.classList.remove('active');
                title.innerHTML = '<i class="fas fa-user-circle"></i> 對方高頻詞 TOP 5';
                list.innerHTML = statsContent._partnerHTML || '<div style="text-align:center;color:var(--text-secondary);font-size:12px;padding:10px;">暫無資料</div>';
            } else {
                meBtn.classList.add('active');
                partnerBtn.classList.remove('active');
                title.innerHTML = '<i class="fas fa-user"></i> 我方高頻詞 TOP 5';
                list.innerHTML = statsContent._myHTML || '<div style="text-align:center;color:var(--text-secondary);font-size:12px;padding:10px;">暫無資料</div>';
            }
        };
        function renderSessionList() {
            const listContainer = DOMElements.sessionModal.list;
            if (sessionList.length === 0) {
                listContainer.innerHTML = '<div class="stats-empty" style="padding: 20px 0;"><p>還沒有會話</p></div>';
                return;
            }
            listContainer.innerHTML = sessionList.map(session => `
            <div class="session-item ${session.id === SESSION_ID ? 'active': ''}" data-id="${session.id}">
            <div class="session-info">
            <div class="session-name">${session.name}</div>
            <div class="session-meta">建立於 ${new Date(session.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="session-actions">
            <button class="session-action-btn rename" title="重新命名"><i class="fas fa-pen"></i></button>
            <button class="session-action-btn delete" title="刪除"><i class="fas fa-trash"></i></button>
            </div>
            </div>
            `).join('');
        }


async function generateFortune() {
    const today = new Date();
    const todayKey = today.toDateString(); 
    const start = new Date(today.getFullYear(), 0, 1);
    const diff = today - start + (start.getTimezoneOffset() - today.getTimezoneOffset()) * 60000;
    const weekNum = Math.floor(diff / (1000 * 60 * 60 * 24) / 7);
    const weekKey = today.getFullYear() + '-W' + weekNum;

    const storageKey = `${APP_PREFIX}weekly_fortune`;
    let fortuneData = null;

    try {
        const savedData = await localforage.getItem(storageKey);
        if (savedData && savedData.week === weekKey) {
            fortuneData = savedData;
        }
    } catch (e) { console.warn("讀取運勢失敗", e); }

const majorCards = CONSTANTS.TAROT_CARDS;
    if (!fortuneData) {
        const randomIndex = Math.floor(Math.random() * majorCards.length);
        const isUpright = Math.random() > 0.5;
        
        const fixedStars = isUpright ? (Math.floor(Math.random() * 2) + 4) : (Math.floor(Math.random() * 2) + 3);

        fortuneData = {
            week: weekKey,
            cardIndex: randomIndex,
            isUpright: isUpright,
            stars: fixedStars 
        };
        await localforage.setItem(storageKey, fortuneData);
    }

    renderFortunePanel(fortuneData, majorCards, todayKey);
}

function renderFortunePanel(weeklyData, majorCards, todayKey) {
    const content = document.getElementById('fortune-content');
    if (!content) return;

    content.innerHTML = `
        <div class="fortune-sub-tabs" style="display:flex;gap:8px;margin-bottom:14px;">
            <button id="fsub-weekly" class="modal-btn modal-btn-primary" style="flex:1;font-size:12px;padding:7px 0;" onclick="showFortuneSub('weekly')"><i class="fas fa-calendar-week"></i> 每週主牌</button>
            <button id="fsub-daily" class="modal-btn modal-btn-secondary" style="flex:1;font-size:12px;padding:7px 0;" onclick="showFortuneSub('daily')"><i class="fas fa-sun"></i> 每日運勢</button>
        </div>
        <div id="fortune-sub-weekly"></div>
        <div id="fortune-sub-daily" style="display:none;"></div>
    `;

    renderWeeklyFortune(weeklyData, majorCards);
    renderDailyFortune(todayKey);

    showModal(document.getElementById('fortune-lenormand-modal'));
}

window.showFortuneSub = function(tab) {
    const weeklyEl = document.getElementById('fortune-sub-weekly');
    const dailyEl = document.getElementById('fortune-sub-daily');
    const weeklyBtn = document.getElementById('fsub-weekly');
    const dailyBtn = document.getElementById('fsub-daily');
    if (tab === 'weekly') {
        if (weeklyEl) weeklyEl.style.display = '';
        if (dailyEl) dailyEl.style.display = 'none';
        if (weeklyBtn) weeklyBtn.className = 'modal-btn modal-btn-primary';
        if (dailyBtn) dailyBtn.className = 'modal-btn modal-btn-secondary';
        weeklyBtn.style.flex = dailyBtn.style.flex = '1';
        weeklyBtn.style.fontSize = dailyBtn.style.fontSize = '12px';
        weeklyBtn.style.padding = dailyBtn.style.padding = '7px 0';
    } else {
        if (weeklyEl) weeklyEl.style.display = 'none';
        if (dailyEl) dailyEl.style.display = '';
        if (weeklyBtn) weeklyBtn.className = 'modal-btn modal-btn-secondary';
        if (dailyBtn) dailyBtn.className = 'modal-btn modal-btn-primary';
        weeklyBtn.style.flex = dailyBtn.style.flex = '1';
        weeklyBtn.style.fontSize = dailyBtn.style.fontSize = '12px';
        weeklyBtn.style.padding = dailyBtn.style.padding = '7px 0';
    }
};

function renderWeeklyFortune(data, majorCards) {
    const el = document.getElementById('fortune-sub-weekly');
    if (!el) return;

    const card = majorCards[data.cardIndex];
    const isUpright = data.isUpright;
    const starCount = data.stars || 3;

    let starsHtml = Array(5).fill(0).map((_, i) => 
        `<i class="fas fa-star" style="color: ${i < starCount ? 'var(--accent-color)' : 'var(--border-color)'}; font-size: 12px; margin: 0 2px;"></i>`
    ).join('');

    el.innerHTML = `
        <div style="text-align:center; margin-bottom:15px; color:var(--text-secondary); font-size:12px; letter-spacing: 1px;">
            <i class="fas fa-sparkles" style="color:var(--accent-color);"></i> 憑直覺點選翻開你的每週主牌
        </div>
        
        <div class="tarot-container-3d" onclick="this.classList.toggle('flipped');">
            <div class="tarot-card-inner">
                <div class="tarot-face tarot-front">
                    <div class="tarot-pattern"><i class="fas fa-star-and-crescent"></i></div>
                </div>
                <div class="tarot-face tarot-back" style="background: linear-gradient(135deg, var(--secondary-bg), rgba(var(--accent-color-rgb), 0.05)); border: 2px solid rgba(var(--accent-color-rgb), 0.3); padding: 14px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow-y: auto;">
                    <div class="tarot-visual ${isUpright ? '' : 'reversed'}" style="height:80px; flex-shrink:0;">
                        <i class="fas ${card.icon} tarot-icon-vector" style="font-size:42px; color: var(--accent-color);"></i>
                    </div>
                    <div style="text-align:center; width:100%;">
                        <div class="tarot-card-name" style="font-size:18px; font-weight: 700; margin-bottom:3px;">${card.name}</div>
                        <div style="font-size:10px; color:var(--text-secondary); margin-bottom:6px;">${isUpright ? '正位' : '逆位'}</div>
                        <div style="font-size:12px; color: var(--accent-color); font-weight:600; margin-bottom:6px;">「${card.keyword}」</div>
                        <div style="margin-bottom:8px;">${starsHtml}</div>
                        <div style="font-size:11px; color:var(--text-secondary); line-height:1.6; text-align:left;">${card.meaning}</div>
                    </div>
                </div>
            </div>
        </div>

    `;
}

async function renderDailyFortune(todayKey) {
    const el = document.getElementById('fortune-sub-daily');
    if (!el) return;

    const storageKey = `${APP_PREFIX}daily_fortune_3`;
    let dailyData = null;

    try {
        const saved = await localforage.getItem(storageKey);
        if (saved && saved.day === todayKey) {
            dailyData = saved;
        }
    } catch(e) {}

    if (!dailyData) {
        const deck = [...ALL_78_TAROT_CARDS];
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        const drawn = deck.slice(0, 3).map(card => ({
            name: card.name,
            type: card.type || 'major',
            keyword: card.keyword,
            upright: card.upright || card.meaning,
            reversed: card.reversed || card.meaning,
            icon: card.icon || 'fa-star',
            img: card.img || null,
            isUpright: Math.random() > 0.5
        }));
        dailyData = { day: todayKey, cards: drawn };
        try { await localforage.setItem(storageKey, dailyData); } catch(e) {}
    }

    const positionLabels = ['過去 · 根源', '現在 · 核心', '未來 · 啟示'];
    const positionColors = ['rgba(var(--accent-color-rgb),0.6)', 'var(--accent-color)', 'rgba(var(--accent-color-rgb),0.8)'];

    el.innerHTML = `
        <div style="text-align:center; margin-bottom:14px; color:var(--text-secondary); font-size:12px; letter-spacing:1px;">
            <i class="fas fa-moon" style="color:var(--accent-color);"></i> ${new Date().toLocaleDateString('zh-CN', {month:'long',day:'numeric'})} · 三牌展開
        </div>
        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:16px;">
            ${dailyData.cards.map((card, i) => `
                <div style="flex:1;min-width:90px;max-width:130px;text-align:center;">
                    <div style="font-size:10px;color:${positionColors[i]};margin-bottom:6px;font-weight:600;letter-spacing:0.5px;">${positionLabels[i]}</div>
                    <div class="tarot-container-3d tarot-responsive" style="cursor:pointer;margin-bottom:8px;" onclick="this.classList.toggle('flipped'); document.getElementById('daily-interp-${i}').style.display = this.classList.contains('flipped') ? 'block' : 'none';">
                        <div class="tarot-card-inner">
                            <div class="tarot-face tarot-front"><div class="tarot-pattern" style="font-size:18px;"><i class="fas fa-star-and-crescent"></i></div></div>
                            <div class="tarot-face tarot-back" style="background:linear-gradient(135deg,var(--secondary-bg),rgba(var(--accent-color-rgb),0.07));border:1.5px solid rgba(var(--accent-color-rgb),0.3);padding:0;overflow:hidden;">
                                <div class="tarot-visual ${card.isUpright ? '' : 'reversed'}" style="height:100%;width:100%;margin:0;padding:0;">
                                    ${card.img ? `<img src="${card.img}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div style="display:none;height:100%;align-items:center;justify-content:center;"><i class="fas ${card.icon}" style="font-size:28px;color:var(--accent-color);"></i></div>` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;"><i class="fas ${card.icon}" style="font-size:28px;color:var(--accent-color);"></i></div>`}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="daily-interp-${i}" style="display:none;text-align:left;margin-top:6px;padding:8px 10px;background:rgba(var(--accent-color-rgb),0.06);border-radius:10px;border:1px solid rgba(var(--accent-color-rgb),0.15);">
                        <div style="font-size:11px;font-weight:700;color:var(--accent-color);margin-bottom:4px;">${card.keyword}</div>
                        <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">${card.isUpright ? (card.upright || card.meaning || '') : (card.reversed || card.meaning || '')}</div>
                    </div>
                </div>
            `).join('')}
        </div>
      <div style="margin-bottom:10px;">
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px;font-weight:500;">✍️ 今日解讀</div>
            <textarea id="daily-fortune-notes" placeholder="寫下你對今日牌陣的感悟..." style="width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid var(--border-color);border-radius:10px;background:var(--primary-bg);color:var(--text-primary);font-size:12px;font-family:var(--font-family);resize:vertical;min-height:72px;outline:none;transition:border 0.18s;line-height:1.6;" onfocus="this.style.borderColor='var(--accent-color)'" onblur="this.style.borderColor='var(--border-color)'">${(function(){try{return localStorage.getItem('dailyFortuneNotes_'+todayKey)||''}catch(e){return ''}}())}</textarea>
            <div style="display:flex;justify-content:flex-end;margin-top:4px;">
                <button onclick="(function(){var t=document.getElementById('daily-fortune-notes');try{localStorage.setItem('dailyFortuneNotes_'+'${todayKey}',t.value);}catch(e){}this.textContent='已儲存 ✓';var self=this;setTimeout(function(){self.textContent='儲存';},1500);}).call(this)" style="font-size:11px;padding:4px 12px;border:1.5px solid var(--accent-color);border-radius:8px;background:transparent;color:var(--accent-color);cursor:pointer;font-family:var(--font-family);">儲存</button>
            </div>
        </div>
        <div style="font-size:11px;color:var(--text-secondary);text-align:center;padding:8px;background:rgba(var(--accent-color-rgb),0.05);border-radius:8px;">
            <i class="fas fa-sync-alt" style="color:var(--accent-color);margin-right:4px;"></i>每日零時自動更新 · 點選牌背翻開檢視解讀
        </div>
    `;
}

let lenormandSystem = 36;
let lenormandCount = 1;

const LENORMAND_CARDS_40 = [
    { num: 1, name: "騎士", icon: "🏇", keyword: "訊息·速度", meaning: "快速到來的訊息，行動迅速，使者，短途旅行。" },
    { num: 2, name: "四葉草", icon: "🍀", keyword: "幸運·機遇", meaning: "小幸運，偶然的好運，短暫的喜悅，樂觀面對生活。" },
    { num: 3, name: "帆船", icon: "⛵", keyword: "旅行·方向", meaning: "旅行，冒險，追尋目標，人生的航向。" },
    { num: 4, name: "房屋", icon: "🏠", keyword: "家庭·安穩", meaning: "家，穩定，安全感，家庭關係，房產。" },
    { num: 5, name: "大樹", icon: "🌳", keyword: "健康·根基", meaning: "健康，生命力，成長，根基，長久穩固。" },
    { num: 6, name: "烏雲", icon: "☁️", keyword: "困惑·障礙", meaning: "困惑，不確定，暫時的陰霾，需要耐心等待。" },
    { num: 7, name: "蛇", icon: "🐍", keyword: "誘惑·迂迴", meaning: "競爭者，誘惑，迂迴的道路，複雜的女性。" },
    { num: 8, name: "棺材", icon: "⚰️", keyword: "結束·轉變", meaning: "結束，轉變，某事告一段落，低落期，疾病。" },
    { num: 9, name: "花束", icon: "💐", keyword: "禮物·喜悅", meaning: "禮物，驚喜，喜悅，美好的關係，感激之情。" },
    { num: 10, name: "鐮刀", icon: "🌾", keyword: "決斷·收割", meaning: "突然的決定，危險，收割，結束，手術。" },
    { num: 11, name: "鞭子", icon: "⚡", keyword: "爭執·激情", meaning: "爭論，衝突，重複，激情，體育運動。" },
    { num: 12, name: "鳥兒", icon: "🐦", keyword: "對話·焦慮", meaning: "對話，流言，訊息，焦慮，一對情侶。" },
    { num: 13, name: "孩童", icon: "🧒", keyword: "新開始·純真", meaning: "新的開始，純真，孩子，小事，新鮮感。" },
    { num: 14, name: "狐狸", icon: "🦊", keyword: "狡猾·工作", meaning: "狡猾，策略，工作，謹防欺騙，自我保護。" },
    { num: 15, name: "熊", icon: "🐻", keyword: "力量·權威", meaning: "強大的力量，老闆，財務，母性，保護者。" },
    { num: 16, name: "星星", icon: "⭐", keyword: "希望·指引", meaning: "希望，夢想，靈感，指引，清晰，美好未來。" },
    { num: 17, name: "鸛鳥", icon: "🕊️", keyword: "變化·移動", meaning: "變化，移動，適應，新的生活階段，遷徙。" },
    { num: 18, name: "狗", icon: "🐕", keyword: "友誼·忠誠", meaning: "忠誠的朋友，友誼，可靠，支援，寵物。" },
    { num: 19, name: "高塔", icon: "🏰", keyword: "孤獨·機構", meaning: "孤獨，邊界，機構，官方，距離，自我保護。" },
    { num: 20, name: "花園", icon: "🌺", keyword: "社交·公眾", meaning: "社交場合，公眾，聚會，開放的空間。" },
    { num: 21, name: "山丘", icon: "⛰️", keyword: "障礙·挑戰", meaning: "障礙，挑戰，延遲，競爭，需要攀越的困難。" },
    { num: 22, name: "十字路口", icon: "🛤️", keyword: "選擇·方向", meaning: "選擇，岔路，可能性，多條道路，決策時刻。" },
    { num: 23, name: "老鼠", icon: "🐀", keyword: "損耗·壓力", meaning: "損失，壓力，焦慮，偷走，逐漸減少，擔憂。" },
    { num: 24, name: "心", icon: "❤️", keyword: "愛情·感情", meaning: "愛，感情，關懷，真心，情感的核心。" },
    { num: 25, name: "指環", icon: "💍", keyword: "承諾·契約", meaning: "承諾，契約，婚姻，合作，迴圈往復。" },
    { num: 26, name: "書", icon: "📚", keyword: "秘密·知識", meaning: "秘密，知識，學習，隱藏的資訊，需要深入瞭解。" },
    { num: 27, name: "信件", icon: "✉️", keyword: "溝通·檔案", meaning: "通訊，檔案，資訊，書面合同，重要的訊息。" },
    { num: 28, name: "男士", icon: "👨", keyword: "男性·當事人", meaning: "主要男性人物，男性提問者或重要男性。" },
    { num: 29, name: "女士", icon: "👩", keyword: "女性·當事人", meaning: "主要女性人物，女性提問者或重要女性。" },
    { num: 30, name: "百合", icon: "🌸", keyword: "純潔·平靜", meaning: "純潔，平靜，和諧，成熟的感情，高尚的品格。" },
    { num: 31, name: "太陽", icon: "☀️", keyword: "成功·活力", meaning: "成功，活力，快樂，溫暖，光明，積極能量。" },
    { num: 32, name: "月亮", icon: "🌙", keyword: "榮譽·直覺", meaning: "榮譽，名聲，直覺，情感波動，創造力，夢境。" },
    { num: 33, name: "鑰匙", icon: "🔑", keyword: "答案·解鎖", meaning: "答案，解決方案，重要發現，開啟新的可能。" },
    { num: 34, name: "魚", icon: "🐟", keyword: "財富·流動", meaning: "財富，生意，流動，豐盛，商業活動，資源。" },
    { num: 35, name: "錨", icon: "⚓", keyword: "穩定·堅持", meaning: "穩定，堅持，目標，長期，踏實，工作。" },
    { num: 36, name: "十字架", icon: "✝️", keyword: "命運·擔當", meaning: "命運，責任，痛苦，信仰，接受，精神使命。" },
    { num: 37, name: "靈體", icon: "💭", keyword: "高我·感受", meaning: "直覺，感受，覺察，因果規律，靈魂伴侶，。" },
    { num: 38, name: "香爐", icon: "⚖️", keyword: "清除·歸零", meaning: "清除，淨化，消散，瀰漫，清淨之地，氛圍感。" },
    { num: 39, name: "床", icon: "🛏", keyword: "舒適·休息", meaning: "睡覺，迴避，躺平，舒適，臥室，性關係。" },
    { num: 40, name: "市場", icon: "🏪", keyword: "交易·工作", meaning: "工作，交易，維護，運營，勢均力敵，出去遊玩。" }
];

function getLenormandCards() {
    return LENORMAND_CARDS_40.slice(0, lenormandSystem);
}

function setLenormandSystem(n) {
    lenormandSystem = n;
}

function setLenormandCount(n) {
    lenormandCount = n;
    document.querySelectorAll('.lenormand-num-btn').forEach(btn => {
        const numEl = btn.querySelector('.leno-btn-num');
        btn.classList.toggle('active', numEl && parseInt(numEl.textContent) === n);
    });
    updateLenoNumDesc(n);
}

function updateLenoNumDesc(n) {
    const desc = document.getElementById('leno-num-desc');
    if (!desc) return;
    if (n === 1) desc.textContent = '單張牌 · 直達答案';
    else if (n === 3) desc.textContent = '三張牌 · 洞察全域性';
}

function switchFLTab(tab) {
    document.querySelectorAll('.fl-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.fl-panel').forEach(panel => panel.classList.remove('fl-panel-active'));
    const activeTab = document.getElementById('fl-tab-' + tab);
    const activePanel = document.getElementById('fl-panel-' + tab);
    if (activeTab) activeTab.classList.add('active');
    if (activePanel) activePanel.classList.add('fl-panel-active');
}

function openLenormandModal() {
    resetLenormand();
    switchFLTab('lenormand');
    showModal(document.getElementById('fortune-lenormand-modal'));
}

function resetLenormand() {
    const setup = document.getElementById('lenormand-setup');
    const result = document.getElementById('lenormand-result');
    const resetBtn = document.getElementById('lenormand-reset-btn');
    const qInput = document.getElementById('lenormand-question');
    if (setup) setup.style.display = '';
    if (result) result.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'none';
    if (qInput) qInput.value = '';
    lenormandSystem = 40;
    lenormandCount = 1;
    document.querySelectorAll('.lenormand-num-btn').forEach(btn => {
        const num = btn.querySelector('.leno-btn-num');
        btn.classList.toggle('active', num && num.textContent.trim() === '1');
    });
    updateLenoNumDesc(1);
}

function startLenormandDraw() {
    const cards = getLenormandCards();
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const drawn = shuffled.slice(0, lenormandCount);
    const question = document.getElementById('lenormand-question').value.trim();

    let cardsHTML = drawn.map((card, i) => `
        <div class="lenormand-card-item" style="animation-delay:${i * 0.1}s;">
            <span class="lenormand-card-icon">${card.icon}</span>
            <div class="lenormand-card-name">${card.name}</div>
            <div class="lenormand-card-num">No.${card.num}</div>
            <div class="lenormand-card-keyword">「${card.keyword}」</div>
            <div class="lenormand-card-meaning">${card.meaning}</div>
        </div>
    `).join('');

    let synthesisHTML = '';
    if (drawn.length > 1) {
        const keywords = drawn.map(c => c.keyword.split('·')[0]).join('、');
        const energies = drawn.map(c => c.name).join(' + ');
        const m0 = drawn[0].meaning.split('，')[0];
        const m2 = drawn.length >= 3 ? drawn[2].meaning.split('，')[0] : '';
        const n0 = drawn[0].name, n1 = drawn[1].name, n2 = drawn.length >= 3 ? drawn[2].name : '';
        
        const templates3 = [
            `「${n0}」的能量如同${m0}的底色，與「${n1}」相互呼應；「${n2}」則帶來${m2}的質感。三張牌的能量流動，共同編織出一段關於${keywords}的故事。`,
            `星盤之上，「${n0}」、「${n1}」、「${n2}」三張牌依次展開——各自攜帶的能量在此匯聚，悄悄低語。${keywords}，是此刻需要關注的核心能量。`,
            `「${n0}」與「${n1}」、「${n2}」共同呈現：${m0}的力量與${m2}的方向在這裡交織，等待你邁出那一步。願三張牌的能量，成為你此刻的指引。`,
            `三張牌共同呈現了一段旅程：「${n0}」、「${n1}」、「${n2}」依次展開，${keywords}的主題貫穿其中，指引著前行的方向。`,
            `宇宙借${energies}的能量，向你傳遞資訊：${m0}的力量與${m2}的可能性已悄然開啟，請相信這段旅程有其深意。`
        ];
        const templates2 = [
            `「${n0}」與「${n1}」的能量相遇，${keywords}的主題在此交匯。${m0}的力量遇見了新的可能，共同描繪出當下局勢的面貌。`,
            `兩張牌攜手而來：「${n0}」帶著${m0}的底色，「${n1}」帶來新的視角。它們共同指向一個關於${keywords}的答案，等待你細細品味。`,
            `${energies}——兩種能量在你的問題上留下印記。${m0}與對方的能量相互作用，當前局面因此充滿了${keywords}的質感。靜下心來，答案已在其中。`,
            `牌與牌之間總有呼應。「${n0}」和「${n1}」的組合，像是宇宙特意為你排列的密碼，${keywords}便是解讀這段緣分的鑰匙。`
        ];
        
        const templates = drawn.length === 3 ? templates3 : templates2;
        const chosenText = templates[Math.floor(Math.random() * templates.length)];
        
        synthesisHTML = `
        <div class="lenormand-synthesis">
            <div class="lenormand-synthesis-title">✦ 綜合解讀</div>
            ${chosenText}
        </div>`;
    }

    const questionDisplay = question ? `<div class="lenormand-question-show">「${question}」</div>` : '';

    document.getElementById('lenormand-result').innerHTML = `
        ${questionDisplay}
        <div style="text-align:center; font-size:12px; color:var(--text-secondary); margin-bottom:12px;">
            <i class="fas fa-moon"></i> 雷諾曼輕聲說 · 愛能克服遠距離
        </div>
        <div class="lenormand-cards-row">${cardsHTML}</div>
        ${synthesisHTML}
    `;

    document.getElementById('lenormand-setup').style.display = 'none';
    document.getElementById('lenormand-result').style.display = '';
    document.getElementById('lenormand-reset-btn').style.display = '';

    const lCards = drawn.map(c => ({ name: c.name, keyword: c.keyword, position: '', isReversed: false, meaning: c.meaning }));
    saveDiviHistory({ type: `雷諾曼${lenormandCount === 1 ? '單張' : '三張'}`, question, cards: lCards });
}

const ALL_78_TAROT_CARDS = [
    { name: "愚人", num: "0", type: "major", eng: "The Fool", keyword: "流浪", upright: "全新的開始、冒險精神、天真無邪、活在當下、無限可能、信任直覺、大膽嘗試、不受約束", reversed: "愚蠢的決定、魯莽行事、逃避責任、猶豫不決、缺乏方向感、錯失良機、不切實際", img: "https://i.postimg.cc/hGv9scYL/96e54bea7c980b53d1f2904d6de1139b.jpg" },
    { name: "魔術師", num: "I", type: "major", eng: "The Magician", keyword: "創造", upright: "創造力爆發、技能嫻熟、意志力強大、化腐朽為神奇、行動力強、專注目標、資源整合、自信滿滿", reversed: "欺騙手段、操縱他人、能力未充分發揮、意圖不純、缺乏自信、拖延行動、濫用天賦", img: "https://i.postimg.cc/156PgF5Q/bb1a94f3f1b8beaae766b320d766ff7b.jpg" },
    { name: "女祭司", num: "II", type: "major", eng: "The High Priestess", keyword: "智慧", upright: "直覺敏銳、潛意識覺醒、神秘力量、內在智慧、靜待時機、傾聽內心、保持沉默、精神覺醒", reversed: "秘密暴露、壓抑直覺、資訊隱藏、非理性判斷、抗拒內在聲音、表面化、情感封閉", img: "https://i.postimg.cc/Vs2mLg1z/522ea5704ba75a6b17a2bd1ad94c7843.jpg" },
    { name: "女帝", num: "III", type: "major", eng: "The Empress", keyword: "豐收", upright: "豐饒富足、母性光輝、自然力量、感官享受、創造力旺盛、孕育新生、藝術靈感、愛與關懷", reversed: "過度依賴、創意阻塞、過分保護、忽視自我需求、創造力枯竭、情感空虛、放縱", img: "https://i.postimg.cc/FFwNspmX/94c11c30f386c5f3b307fb73e931e0ff.jpg" },
    { name: "皇帝", num: "IV", type: "major", eng: "The Emperor", keyword: "支配", upright: "權威力量、結構秩序、控制能力、穩定可靠、父親形象、領導才能、理性決策、建立規則", reversed: "專橫跋扈、剛愎自用、濫用權力、缺乏彈性、控制慾過強、優柔寡斷、失去威信", img: "https://i.postimg.cc/c1P04hWj/acc86a61cbac497830cc9b5e3f5eedbf.jpg" },
    { name: "教皇", num: "V", type: "major", eng: "The Hierophant", keyword: "援助", upright: "傳統價值、信仰力量、教導他人、精神指引、遵循制度、尋求導師、群體歸屬、儀式感", reversed: "叛逆傳統、個人信仰覺醒、突破規範、獨立思想、質疑權威、脫離束縛、尋找新路", img: "https://i.postimg.cc/L4G26DSb/45bd1da5e8e05458ac85deba2dcf1b4c.jpg" },
    { name: "戀人", num: "VI", type: "major", eng: "The Lovers", keyword: "結合", upright: "真愛降臨、和諧關係、價值觀選擇、靈魂伴侶、情感連線、吸引力強烈、重要抉擇、平衡", reversed: "關係失衡、誤判對方、價值觀衝突、分離危機、猶豫不決、情感考驗、選擇困難", img: "https://i.postimg.cc/tR8pCkbv/c8e193de2db78acd8d6b0f4b94ceb9eb.jpg" },
    { name: "戰車", num: "VII", type: "major", eng: "The Chariot", keyword: "勝利", upright: "意志力堅定、勝利在望、決心強大、自我掌控、勇往直前、克服障礙、明確目標、自信", reversed: "失去控制、方向迷失、挫敗感強、固執己見、內在衝突、停滯不前、缺乏自律", img: "https://i.postimg.cc/XNt47LW2/9952b0b90e242125af82412d43a3ddfc.jpg" },
    { name: "力量", num: "VIII", type: "major", eng: "Strength", keyword: "意志", upright: "勇氣可嘉、耐心等待、內在力量、溫柔堅定、同理心強、情緒管理、化解衝突、自信", reversed: "自我懷疑、軟弱無力、壓抑內在力量、失去信心、恐懼支配、情緒失控、退縮", img: "https://i.postimg.cc/SQHkNd4G/bbf5a7098702778a0d3f96a7f8ff356e.jpg" },
    { name: "隱士", num: "IX", type: "major", eng: "The Hermit", keyword: "探索", upright: "內省深思、孤獨旅程、尋求真理、內在指引、智慧積累、自我探索、獨處需要、導師", reversed: "孤立無援、拒絕幫助、過度孤獨、逃避現實、與社會脫節、封閉自我、不願成長", img: "https://i.postimg.cc/2j1CDJst/28e4666f91395d530d5e2e754edf723d.jpg" },
    { name: "命運之輪", num: "X", type: "major", eng: "Wheel of Fortune", keyword: "輪迴", upright: "命運轉折、迴圈往復、好運降臨、因果報應、機遇來臨、順勢而為、變化將至、意外", reversed: "逆境來襲、抗拒改變、惡性迴圈、運氣不佳、錯失良機、無法掌控、命運捉弄", img: "https://i.postimg.cc/59XfVGhk/794c115c0d699838ca5be1775e93ad20.jpg" },
    { name: "正義", num: "XI", type: "major", eng: "Justice", keyword: "均衡", upright: "公正裁決、真相大白、因果報應、法律事務、誠實守信、平衡判斷、責任承擔、公平", reversed: "不公正待遇、逃避責任、不誠實行為、法律糾紛、失衡狀態、偏見歧視、後果", img: "https://i.postimg.cc/v84GsjJX/1be9b7793332da671dd8843bc13134a4.jpg" },
    { name: "倒吊人", num: "XII", type: "major", eng: "The Hanged Man", keyword: "奉獻", upright: "犧牲精神、新視角看問題、等待時機、放下執念、頓悟時刻、換位思考、暫停", reversed: "拖延症、無謂犧牲、停滯不前、抗拒改變、無法放手、固執己見、錯失頓悟", img: "https://i.postimg.cc/XNrnbhRg/55b46df567a1b9a4c4e6d3e8c90f8114.jpg" },
    { name: "死神", num: "XIII", type: "major", eng: "Death", keyword: "結束", upright: "結束與開始、轉變來臨、重生機會、放手過去、蛻變成長、不可抗拒的變化、新生", reversed: "抗拒改變、無法放手、腐朽停滯、恐懼新生、固執不變、拒絕結束、拖延", img: "https://i.postimg.cc/G34bCNWk/f9f117b116ed89070375ff8b2b8f2906.jpg" },
    { name: "節制", num: "XIV", type: "major", eng: "Temperance", keyword: "淨化", upright: "平衡之道、適度原則、耐心等待、調和矛盾、中庸智慧、情緒管理、調和", reversed: "失衡狀態、過度放縱、缺乏耐心、極端行為、矛盾激化、無法調和、衝動", img: "https://i.postimg.cc/HWrTgKqX/f6bba5a04896b1eafd85e4b414e5e7fe.jpg" },
    { name: "惡魔", num: "XV", type: "major", eng: "The Devil", keyword: "誘惑", upright: "束縛關係、物質主義、慾望誘惑、沉迷享樂、陰暗面顯現、執著成癮、被困", reversed: "解脫束縛、重獲自由、自我覺醒、放下執念、擺脫控制、認清真相、解放", img: "https://i.postimg.cc/ZYWJSgG9/0193aa497922eb37bdef24da7e82fc5c.jpg" },
    { name: "高塔", num: "XVI", type: "major", eng: "The Tower", keyword: "毀滅", upright: "突變降臨、混亂局面、啟示覺醒、破壞重建、真相大白、意外打擊、崩塌", reversed: "延遲變化、避免災難、內在崩潰、抗拒真相、恐懼改變、壓抑爆發、緩慢", img: "https://i.postimg.cc/RCWvB8kW/b3aa6bb2075c9333cd2fe88ffe6b8845.jpg" },
    { name: "星星", num: "XVII", type: "major", eng: "The Star", keyword: "希望", upright: "希望之光、靈感湧現、平靜安寧、治癒能量、信念堅定、心靈指引、樂觀", reversed: "絕望情緒、失去信仰、悲觀消極、靈感枯竭、信心動搖、迷茫無助、失望", img: "https://i.postimg.cc/fWVMNFGy/efc1373d89e1fb57fd39ba46809a5d6e.jpg" },
    { name: "月亮", num: "XVIII", type: "major", eng: "The Moon", keyword: "不安", upright: "幻覺迷惑、恐懼心理、焦慮情緒、潛意識浮現、不確定性、夢境啟示、直覺", reversed: "恐懼消散、真相浮現、走出迷惘、看清現實、克服焦慮、方向明確、穩定", img: "https://i.postimg.cc/PfCdjcg5/f91356263746aaf0574a4074b5c75a71.jpg" },
    { name: "太陽", num: "XIX", type: "major", eng: "The Sun", keyword: "生命", upright: "快樂洋溢、成功在望、活力充沛、清晰明朗、正能量滿滿、積極向上、成就", reversed: "悲觀情緒、自我懷疑、短暫挫折、快樂受阻、缺乏自信、陰霾籠罩、暫時", img: "https://i.postimg.cc/NF3JqL3t/cc7920c1085e317299e6022f7c11418f.jpg" },
    { name: "審判", num: "XX", type: "major", eng: "Judgement", keyword: "復活", upright: "復活重生、覺醒時刻、號召來臨、重要決定、自我評價、因果報應、召喚", reversed: "自我懷疑、拒絕接受審判、過去糾纏、逃避責任、後悔自責、無法覺醒", img: "https://i.postimg.cc/ZnG7t01X/2af3b253975f72db648372f5f67b19c8.jpg" },
    { name: "世界", num: "XXI", type: "major", eng: "The World", keyword: "達成", upright: "完成圓滿、整合統一、成就達成、世界在腳下、旅途終點、成功實現、圓滿", reversed: "未完成事項、拖延症、缺乏完結感、停滯不前、未能整合、遺憾殘留", img: "https://i.postimg.cc/tJKSQ7LD/7f69519939b241e131dbd58d7bb8b648.jpg" },
    { name: "權杖一", num: "Ace", type: "wands", eng: "Ace of Wands", keyword: "靈感", upright: "新靈感迸發、創意火花、激情開始、行動慾望、創業精神、能量湧現、新專案", reversed: "創意受阻、缺乏動力、計劃擱淺、拖延行動、熱情消退、不敢開始", img: "https://i.postimg.cc/8zh3GBk9/ed2ce5320ab2882ead4f42a9492923ae.jpg" },
    { name: "權杖二", num: "2", type: "wands", eng: "Two of Wands", keyword: "規劃", upright: "規劃未來、展望遠方、個人力量、決策時刻、探索可能、離開舒適區、勇敢", reversed: "恐懼未知、缺乏計劃、自我設限、猶豫不決、停滯不前、害怕改變", img: "https://i.postimg.cc/pLD7vYVq/181ffcef5e2caec52135f3fd3bb60e60.jpg" },
    { name: "權杖三", num: "3", type: "wands", eng: "Three of Wands", keyword: "擴充套件", upright: "擴充套件視野、遠見卓識、探索精神、等待成果、貿易合作、海外機會、領導", reversed: "障礙出現、延遲到來、預期未達、合作受阻、遠見不足、耐心缺失", img: "https://i.postimg.cc/XYwhWcNk/170261009cbe95510da1b5ab7c3ecdcc.jpg" },
    { name: "權杖四", num: "4", type: "wands", eng: "Four of Wands", keyword: "慶典", upright: "慶祝時刻、穩定基礎、家庭幸福、里程碑達成、和諧團聚、安居樂業、豐收", reversed: "不穩定狀態、家庭矛盾、延遲慶祝、基礎動搖、和諧被打破、暫緩", img: "https://i.postimg.cc/VkjTwBsq/a4480049b7630cec92c1245db9b65035.jpg" },
    { name: "權杖五", num: "5", type: "wands", eng: "Five of Wands", keyword: "競爭", upright: "競爭激烈、衝突不斷、挑戰重重、意見分歧、鬥爭狀態、能量爭奪、混亂", reversed: "內部衝突、避免對抗、達成協議、和解可能、放下爭執、尋求共識", img: "https://i.postimg.cc/zGnMNSDn/71341bdf2261a50098c9cf5b4763e238.jpg" },
    { name: "權杖六", num: "6", type: "wands", eng: "Six of Wands", keyword: "凱旋", upright: "勝利凱旋、獲得認可、成功喜悅、公眾讚譽、自信滿滿、領導地位、好訊息", reversed: "私下的成功、不穩定的成功、傲慢自大、失去支援、期待落空、延遲", img: "https://i.postimg.cc/0yp3vd5m/02c1bb07bb55c9c7ad18daea4ea4732a.jpg" },
    { name: "權杖七", num: "7", type: "wands", eng: "Seven of Wands", keyword: "堅守", upright: "防禦姿態、堅守立場、面對挑戰、堅持信念、不畏艱難、迎難而上、勇氣", reversed: "放棄抵抗、被壓倒、自我懷疑、無力應對、屈服壓力、退縮逃避", img: "https://i.postimg.cc/Mpy4wbZB/b2437558d88e7ad755ab686ca5c16f44.jpg" },
    { name: "權杖八", num: "8", type: "wands", eng: "Eight of Wands", keyword: "速度", upright: "迅速行動、進展加速、旅行將至、訊息傳來、能量釋放、快速發展、衝刺", reversed: "延誤延遲、等待過程、障礙出現、計劃受阻、緩慢進展、訊息遲到", img: "https://i.postimg.cc/sgp8z9fv/8dedf2bca5a629d0778f1260d812868f.jpg" },
    { name: "權杖九", num: "9", type: "wands", eng: "Nine of Wands", keyword: "堅韌", upright: "堅韌不拔、彈性恢復、最後挑戰、邊界意識、謹慎戒備、準備迎戰、耐力", reversed: "偏執多疑、頑固不化、不願妥協、防衛過度、精疲力竭、被迫放棄", img: "https://i.postimg.cc/13pTScRt/79248609ebe669bfdbbf0bb8a6f3baf4.jpg" },
    { name: "權杖十", num: "10", type: "wands", eng: "Ten of Wands", keyword: "重擔", upright: "責任過重、負擔壓力、努力奮鬥、接近終點、承擔過多、疲憊不堪、堅持", reversed: "放下重擔、委派任務、精簡生活、解脫壓力、學會放手、減輕負擔", img: "https://i.postimg.cc/RZr82bmq/d6e15b8d05aa8769a873f91cefa5a340.jpg" },
    { name: "權杖侍者", num: "Page", type: "wands", eng: "Page of Wands", keyword: "熱情", upright: "熱情洋溢、探索精神、新訊息將至、好奇心強、創意潛力、冒險嘗試、活力", reversed: "輕率決定、三分鐘熱度、缺乏方向、訊息延遲、創意受阻、熱情消退", img: "https://i.postimg.cc/Mpk4grwK/3375196008b411d59a8ef6b218a706d8.jpg" },
    { name: "權杖騎士", num: "Knight", type: "wands", eng: "Knight of Wands", keyword: "冒險", upright: "冒險精神、充沛能量、勇敢行動、自信進取、旅行出發、追求激情、衝動", reversed: "魯莽行事、分散注意力、缺乏耐心、衝動後果、半途而廢、能量耗盡", img: "https://i.postimg.cc/2SpJgXYk/47f44a5727edbaf82f76c243387bcf41.jpg" },
    { name: "權杖女王", num: "Queen", type: "wands", eng: "Queen of Wands", keyword: "魅力", upright: "魅力四射、自信滿滿、熱情洋溢、獨立自主、領袖氣質、吸引他人、陽光", reversed: "自私自利、嫉妒心強、內向退縮、缺乏自信、熱情熄滅、控制慾強", img: "https://i.postimg.cc/4xCMjFGX/82d378bbafc5c9a257c91a40e5a0deaf.jpg" },
    { name: "權杖國王", num: "King", type: "wands", eng: "King of Wands", keyword: "領袖", upright: "領袖風範、願景遠大、創業精神、激勵他人、果斷決策、成熟穩重、權威", reversed: "專橫霸道、衝動行事、高壓控制、濫用權力、決策失誤、失去威信", img: "https://i.postimg.cc/MKfNPJC8/08f0f33165febd7ee79ac12ec795ad7e.jpg" },
    { name: "聖盃一", num: "Ace", type: "cups", eng: "Ace of Cups", keyword: "愛湧現", upright: "新戀情萌芽、情感開始流動、靈性連線、直覺增強、豐盛喜悅、愛滿溢", reversed: "情感封閉、愛的阻塞、內心空虛、無法付出、情感枯竭、缺乏共鳴", img: "https://i.postimg.cc/nryRbM6k/273ec8e6e58eeb6ee63a63fd4f639b1f.jpg" },
    { name: "聖盃二", num: "2", type: "cups", eng: "Two of Cups", keyword: "聯結", upright: "聯結關係、夥伴關係、相互吸引、和諧互動、平等相愛、心靈相通、合作", reversed: "失衡關係、誤解誤會、分離傾向、單相思、情感不公、關係破裂", img: "https://i.postimg.cc/ZnG7t01P/e74f7e6d4e351965dc2b0ef1b3442d93.jpg" },
    { name: "聖盃三", num: "3", type: "cups", eng: "Three of Cups", keyword: "慶祝", upright: "慶祝歡聚、友情深厚、社群溫暖、喜悅分享、創意合作、姐妹情誼、派對", reversed: "過度放縱、孤立自己、朋友衝突、表面和諧、情感消耗、團體矛盾", img: "https://i.postimg.cc/0jTWRrL0/832c9a5200494a0c807429cc93952286.jpg" },
    { name: "聖盃四", num: "4", type: "cups", eng: "Four of Cups", keyword: "冥想", upright: "冥想狀態、無聊倦怠、重新評估、內省時刻、錯過眼前機會、不滿現狀", reversed: "新機會出現、重新參與生活、走出冷漠、接受饋贈、開啟心扉、覺醒", img: "https://i.postimg.cc/6q2jmC1M/15d1185a92f07038c32528152d7f73d0.jpg" },
    { name: "聖盃五", num: "5", type: "cups", eng: "Five of Cups", keyword: "失落", upright: "失落感強、悲傷情緒、後悔自責、專注負面、遺憾過去、無法釋懷、痛苦", reversed: "從失去中恢復、學會接受、繼續前進、看到希望、寬恕他人、放下", img: "https://i.postimg.cc/rs0nP5Yg/49dffe658b336e3f72b6c8e08d34eb24.jpg" },
    { name: "聖盃六", num: "6", type: "cups", eng: "Six of Cups", keyword: "懷舊", upright: "懷舊情緒、過去回憶、天真爛漫、收到禮物、童年記憶、重逢時刻、單純", reversed: "困在過去、不切實際、成長受阻、無法前進、沉溺回憶、拒絕長大", img: "https://i.postimg.cc/J0D62jd3/1b73e7a42135de2e8bf75ec7d5731355.jpg" },
    { name: "聖盃七", num: "7", type: "cups", eng: "Seven of Cups", keyword: "幻想", upright: "幻想重重、選擇過多、白日做夢、願望投射、迷失方向、不切實際、誘惑", reversed: "聚焦目標、從幻想回歸現實、決斷時刻、看清真相、選擇明確、落地", img: "https://i.postimg.cc/brDCB1Fk/6b9cba94ba7e150fee51a0deedbdfeca.jpg" },
    { name: "聖盃八", num: "8", type: "cups", eng: "Eight of Cups", keyword: "離去", upright: "離開現狀、追尋更深意義、放下過去、踏上旅程、告別過去、探索精神", reversed: "逃避問題、放棄責任、停滯不前、不敢離開、猶豫不決、無處可去", img: "https://i.postimg.cc/KjkqHtsg/9d037a30311a7c71d8b112066e90a90a.jpg" },
    { name: "聖盃九", num: "9", type: "cups", eng: "Nine of Cups", keyword: "滿足", upright: "滿足感強、願望成真、幸福滿滿、感恩之心、豐盛富足、自我實現、快樂", reversed: "不滿足感、物質主義、過分自滿、貪婪慾望、表面光鮮、內心空虛", img: "https://i.postimg.cc/Gt875vS8/2ee0bc4068be0dc8dc916a3d602da2af.jpg" },
    { name: "聖盃十", num: "10", type: "cups", eng: "Ten of Cups", keyword: "圓滿", upright: "情感圓滿、家庭幸福、內心平和、真愛永恆、和諧關係、幸福歸宿、喜悅", reversed: "家庭矛盾、不和諧音、幸福幻滅、關係緊張、情感裂痕、失去和諧", img: "https://i.postimg.cc/ZnB7M6DR/28cf2538308f40a6a6bc321a45e80ba2.jpg" },
    { name: "聖盃侍者", num: "Page", type: "cups", eng: "Page of Cups", keyword: "直覺", upright: "創意湧現、直覺資訊、情感探索、藝術靈感、夢境啟示、溫柔敏感、訊息", reversed: "情緒化嚴重、逃避現實、創意受阻、幼稚行為、情感混亂、不成熟", img: "https://i.postimg.cc/9MNgbL14/362ea49a1b85f4e980578e652a2e5097.jpg" },
    { name: "聖盃騎士", num: "Knight", type: "cups", eng: "Knight of Cups", keyword: "浪漫", upright: "浪漫多情、魅力四射、藝術氣質、追求理想、情感冒險、溫柔體貼、邀請", reversed: "多愁善感、幻想破滅、無法兌現諾言、情感欺騙、不切實際、逃避", img: "https://i.postimg.cc/85nX4Zwj/a194c456550d36f2c798a6b2ec24a9af.jpg" },
    { name: "聖盃女王", num: "Queen", type: "cups", eng: "Queen of Cups", keyword: "慈悲", upright: "同理心強、慈悲為懷、直覺敏銳、情感成熟、關懷他人、溫柔包容、滋養", reversed: "情緒失控、不安全感強、依賴他人、情感勒索、過度敏感、脆弱", img: "https://i.postimg.cc/Sst1dgVK/80204fb42105c75a3ed665961917b0c4.jpg" },
    { name: "聖盃國王", num: "King", type: "cups", eng: "King of Cups", keyword: "情感智慧", upright: "情感平衡、智慧圓融、外交手腕、慷慨大方、情感成熟、包容穩定、溫和", reversed: "情緒操控、冷漠無情、情緒不穩定、喜怒無常、壓抑情感、虛假", img: "https://i.postimg.cc/G2SgKXzd/94e1246d36f6e13dc303bd3144b2896f.jpg" },
    { name: "寶劍一", num: "Ace", type: "swords", eng: "Ace of Swords", keyword: "真相", upright: "真相大白、思維清晰、突破困境、新思想湧現、正義伸張、理智戰勝、洞察", reversed: "混亂思維、謊言欺騙、思維混亂、無法決斷、真相被掩、誤解重重", img: "https://i.postimg.cc/25GKbkZv/8796ef62d2135917b2585380ef1e403d.jpg" },
    { name: "寶劍二", num: "2", type: "swords", eng: "Two of Swords", keyword: "僵局", upright: "僵持不下、難以決斷、封閉心門、逃避真相、拒絕看見、內心矛盾、平衡", reversed: "資訊顯現、做出決定、困境解除、看清真相、開啟心扉、釋放壓力", img: "https://i.postimg.cc/yNjbg1ZJ/46a8207ec3f77e0436bdd2d958d85153.jpg" },
    { name: "寶劍三", num: "3", type: "swords", eng: "Three of Swords", keyword: "心碎", upright: "心碎欲絕、悲傷難抑、失去之痛、分離打擊、痛苦折磨、淚水流淌、失望", reversed: "從悲傷恢復、寬恕他人、療愈開始、接受現實、釋放心痛、重新開始", img: "https://i.postimg.cc/bvgBDytZ/3f88e25f2caa455fab226c8e9b71e2b7.jpg" },
    { name: "寶劍四", num: "4", type: "swords", eng: "Four of Swords", keyword: "休養", upright: "休息恢復、靜默冥想、暫時撤退、休養生息、獨處充電、等待時機、安寧", reversed: "重返活動、再次啟用、不耐煩休息、提前行動、精力恢復、躁動不安", img: "https://i.postimg.cc/3w1c48vN/0b76c577cc2f356ab474fde5c653a4f8.jpg" },
    { name: "寶劍五", num: "5", type: "swords", eng: "Five of Swords", keyword: "衝突", upright: "衝突升級、失敗收場、空洞勝利、不誠實手段、爭吵不斷、勝之不武、損失", reversed: "和解可能、超越衝突、走向和平、放下爭執、接受失敗、尋求共識", img: "https://i.postimg.cc/XvLzGjCv/c7e327ad086f503b55be7b22a8ec7805.jpg" },
    { name: "寶劍六", num: "6", type: "swords", eng: "Six of Swords", keyword: "過渡", upright: "過渡時期、逃離困境、平靜旅程、向前邁進、艱難前行、希望在前、療愈", reversed: "抗拒改變、無處可逃、困難過渡、停滯不前、反覆掙扎、無法擺脫", img: "https://i.postimg.cc/fbCrtz9M/c4d36a80ec72fcc67689b64f536e6c5a.jpg" },
    { name: "寶劍七", num: "7", type: "swords", eng: "Seven of Swords", keyword: "策略", upright: "策略計劃、欺騙隱瞞、單獨行動、不誠實手段、智取逃避、偷偷摸摸、機智", reversed: "真相揭露、良心發現、歸還所得、承認錯誤、放棄欺騙、面對後果", img: "https://i.postimg.cc/jjcFwx7b/a3f6098c94ec09059bfc931d09bd6b16.jpg" },
    { name: "寶劍八", num: "8", type: "swords", eng: "Eight of Swords", keyword: "束縛", upright: "受困束縛、限制重重、負面思維、無助感強、自我設限、無法掙脫、恐懼", reversed: "重獲自由、新視角出現、接受幫助、打破枷鎖、釋放自我、看清真相", img: "https://i.postimg.cc/MGqLpMvT/04fcc588cd33657692a92619aea39ed7.jpg" },
    { name: "寶劍九", num: "9", type: "swords", eng: "Nine of Swords", keyword: "焦慮", upright: "焦慮不安、噩夢連連、擔憂過度、內心痛苦、罪惡感強、失眠困擾、絕望", reversed: "從絕望走出、尋求幫助、希望重現、減輕焦慮、放下負擔、自我寬恕", img: "https://i.postimg.cc/cJ0zLgr4/e81e8ab062e810198907252f14b0b2f2.jpg" },
    { name: "寶劍十", num: "10", type: "swords", eng: "Ten of Swords", keyword: "終結", upright: "終結時刻、失敗打擊、被背叛感、最低谷期、痛苦結束、崩潰邊緣、絕望", reversed: "從失敗恢復、抗拒接受、新開始萌芽、慢慢起身、教訓吸取、重生", img: "https://i.postimg.cc/FKN6Hd7h/227daf3b9af1be2460550dca58bded74.jpg" },
    { name: "寶劍侍者", num: "Page", type: "swords", eng: "Page of Swords", keyword: "洞察", upright: "好奇心強、洞察力敏銳、機警靈活、新想法湧現、警覺性高、學習迅速、訊息", reversed: "散漫無序、粗心大意、言語傷人、八卦傳播、缺乏重點、溝通不暢", img: "https://i.postimg.cc/yNsG8gk4/f3bac9ab5a52947e4b66a4ac632d70ef.jpg" },
    { name: "寶劍騎士", num: "Knight", type: "swords", eng: "Knight of Swords", keyword: "衝勁", upright: "行動力強、衝勁十足、直接果斷、野心勃勃、智慧戰鬥、快速前進、勇氣", reversed: "魯莽行事、倉促決定、過於好鬥、言語尖刻、不顧後果、急躁衝動", img: "https://i.postimg.cc/1zsd3n42/522975dc24a7604bd9446badf86a42d1.jpg" },
    { name: "寶劍女王", num: "Queen", type: "swords", eng: "Queen of Swords", keyword: "獨立", upright: "獨立自主、清晰思考、直接坦率、聰明睿智、設立界限、理性決策、誠實", reversed: "刻薄無情、過於批判、痛苦過往、冷漠疏離、心胸狹隘、報復心強", img: "https://i.postimg.cc/KYxW8k4V/7e8f572137114fa7dc96882b66dfc560.jpg" },
    { name: "寶劍國王", num: "King", type: "swords", eng: "King of Swords", keyword: "理性", upright: "理性權威、思維清晰、道德標準高、客觀決策、公正判斷、智慧領導、經驗", reversed: "操控他人、專橫霸道、濫用權力、冷酷無情、判斷失誤、剛愎自用", img: "https://i.postimg.cc/7LwRZGbN/b0f5d9218e2e4ef9a4652df089b97b9a.jpg" },
    { name: "星幣一", num: "Ace", type: "pentacles", eng: "Ace of Pentacles", keyword: "機遇", upright: "新物質機遇、豐盛富足、財富開始、安全感增強、實用開端、踏實起步、禮物", reversed: "錯失良機、財務不穩、固執己見、投資失誤、缺乏規劃、機會溜走", img: "https://i.postimg.cc/9MNgbL1V/94448c6a431ceb9959491624fea0e38a.jpg" },
    { name: "星幣二", num: "2", type: "pentacles", eng: "Two of Pentacles", keyword: "平衡", upright: "多工處理、適應性強、時間管理、收支平衡、靈活應對、忙中有序、節奏", reversed: "失去平衡、混亂無序、過度承諾、財務緊張、手忙腳亂、無法兼顧", img: "https://i.postimg.cc/G2SgKXK6/757698797cf41a491b3ab99d688854dc.jpg" },
    { name: "星幣三", num: "3", type: "pentacles", eng: "Three of Pentacles", keyword: "協作", upright: "團隊合作、技能提升、協作共贏、學習成長、學徒階段、共同目標、認可", reversed: "缺乏團隊精神、品質不達標、孤立工作、溝通不暢、技術不足、合作失敗", img: "https://i.postimg.cc/Kzspf0fp/a452903cc09ba4daa5cab2093c51a5c3.jpg" },
    { name: "星幣四", num: "4", type: "pentacles", eng: "Four of Pentacles", keyword: "守護", upright: "安全感需求、節儉儲蓄、守護財富、控制慾強、固守現狀、保守穩重、積累", reversed: "過度節儉、貪婪成性、財務損失、抓得太緊、不願分享、害怕失去", img: "https://i.postimg.cc/k45hW0NP/26b157d62962905f2dc877344c61e1b9.jpg" },
    { name: "星幣五", num: "5", type: "pentacles", eng: "Five of Pentacles", keyword: "艱難", upright: "艱難時期、物質損失、孤立無援、健康問題、貧困感強、被排斥外、擔憂", reversed: "從艱難恢復、尋求幫助、好轉跡象、重獲支援、走出低谷、改善", img: "https://i.postimg.cc/TwPHnzVz/d4f448dd9e6eac42bd34952713f8b35a.jpg" },
    { name: "星幣六", num: "6", type: "pentacles", eng: "Six of Pentacles", keyword: "給予", upright: "慷慨給予、接受饋贈、平衡施受、慈善行為、財富流動、幫助他人、分享", reversed: "債務纏身、吝嗇小氣、權力不平衡、索取過度、依賴他人、不公", img: "https://i.postimg.cc/ZRqD6G82/68b1beb7020af71fa4e727c28dc610d6.jpg" },
    { name: "星幣七", num: "7", type: "pentacles", eng: "Seven of Pentacles", keyword: "耕耘", upright: "長期投資、耐心等待、成果評估、持續努力、耕耘收穫、審視進度、堅持", reversed: "缺乏遠見、焦慮不安、無效努力、回報不足、灰心喪氣、放棄堅持", img: "https://i.postimg.cc/cHJ5fpRD/4e78f21fb36d384b237ce384885a5fb0.jpg" },
    { name: "星幣八", num: "8", type: "pentacles", eng: "Eight of Pentacles", keyword: "精進", upright: "工匠精神、技能提升、投入工作、專注細節、精益求精、學習鑽研、勤奮", reversed: "完美主義、缺乏專注、質量下降、工作倦怠、敷衍了事、技能不足", img: "https://i.postimg.cc/JnhdjfNp/dde01f64fc66e6c7446edc3750f81cb0.jpg" },
    { name: "星幣九", num: "9", type: "pentacles", eng: "Nine of Pentacles", keyword: "優雅", upright: "豐盛富足、優雅從容、自給自足、物質享受、獨立自信、花園豐收、寧靜", reversed: "過度勞累、物質主義、虛假繁榮、孤獨空虛、依賴他人、表面光鮮", img: "https://i.postimg.cc/4d3FpD65/68db2a7d50d230a020feb7f6f404efa3.jpg" },
    { name: "星幣十", num: "10", type: "pentacles", eng: "Ten of Pentacles", keyword: "圓滿", upright: "家族傳承、長期穩定、財富圓滿、遺產繼承、世代繁榮、根基深厚、歸屬", reversed: "家族衝突、財務不穩、傳統破裂、遺產糾紛、失去根基、離散", img: "https://i.postimg.cc/tTgmFK3d/40492228d3d7b1658ef883153e8d6e3b.jpg" },
    { name: "星幣侍者", num: "Page", type: "pentacles", eng: "Page of Pentacles", keyword: "學習", upright: "學習熱情、實際技能、計劃制定、謹慎踏實、新工作開始、專注努力、潛力", reversed: "缺乏進展、不切實際、懶惰拖延、學習受阻、目標不明、浪費時間", img: "https://i.postimg.cc/76LQSF3S/372d86040b237875ac164802856a4432.jpg" },
    { name: "星幣騎士", num: "Knight", type: "pentacles", eng: "Knight of Pentacles", keyword: "務實", upright: "勤勉可靠、務實穩重、責任心強、按部就班、耐心堅持、工作努力、守護", reversed: "停滯不前、無聊乏味、過於保守、缺乏冒險、效率低下、固執不變", img: "https://i.postimg.cc/G2pSvWFD/f9dedf51440bafc9ddb64b8ecf45362a.jpg" },
    { name: "星幣女王", num: "Queen", type: "pentacles", eng: "Queen of Pentacles", keyword: "滋養", upright: "務實養育、富足慷慨、關愛家庭、接地氣的生活、物質與情感平衡、舒適", reversed: "工作與生活失衡、嫉妒他人、過度物質、忽視情感、操勞過度、焦慮", img: "https://i.postimg.cc/xCdFLwvN/9aa38a0ab78af98aeb73d93a00b74573.jpg" },
    { name: "星幣國王", num: "King", type: "pentacles", eng: "King of Pentacles", keyword: "繁榮", upright: "物質成功、財務安全、商業頭腦、可靠穩重、富足豐盛、投資有道、成就", reversed: "固執己見、物質主義、冒險財務、貪婪腐敗、失去判斷、投資失敗", img: "https://i.postimg.cc/MG5FM6Q0/c8093dafa7eb0921bb16f32c77df51f6.jpg" }
];const TAROT_TYPE_NAMES = { major: '大阿卡納', wands: '權杖', cups: '聖盃', swords: '寶劍', pentacles: '星幣' };

let currentTarotSpread = 'single';

function setTarotSpread(spread) {
    currentTarotSpread = spread;
    document.querySelectorAll('.tarot-spread-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.spread === spread);
    });
    const desc = document.getElementById('tarot-spread-desc');
    if (spread === 'single') {
        if (desc) desc.textContent = '單張牌 · 直指當下';
    } else if (spread === 'three') {
        if (desc) desc.textContent = '三張牌 · 洞察全域性';
    }
}

function resetTarotDivination() {
    const setup = document.getElementById('tarot-setup');
    const result = document.getElementById('tarot-result');
    const resetBtn = document.getElementById('tarot-reset-btn');
    const qInput = document.getElementById('tarot-question');
    if (setup) setup.style.display = '';
    if (result) result.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'none';
    if (qInput) qInput.value = '';
    currentTarotSpread = 'single';
    document.querySelectorAll('.tarot-spread-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.spread === 'single');
    });
    const desc = document.getElementById('tarot-spread-desc');
    if (desc) desc.textContent = '單張牌 · 直指當下';
}

function startTarotDraw() {
    const shuffled = [...ALL_78_TAROT_CARDS].sort(() => Math.random() - 0.5);
    const question = (document.getElementById('tarot-question') || {}).value || '';
    const questionTrimmed = question.trim();
    const drawnCards = [];

function cardHTML(card, position, labelOverride) {
        const isReversed = Math.random() > 0.5;
        const meaning = isReversed ? card.reversed : card.upright;
        const posLabel = labelOverride || position;
        
        drawnCards.push({ name: card.name, keyword: card.keyword, position: posLabel, isReversed, meaning });

        const frontContent = card.img 
            ? `<img src="${card.img}" style="width: 100%; height: 100%; object-fit: cover; ${isReversed ? 'transform: rotate(180deg);' : ''}">`
            : `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; background:var(--primary-bg); color:var(--text-secondary);">
                 <i class="fas ${card.icon}" style="font-size:40px; margin-bottom:10px; ${isReversed ? 'transform: rotate(180deg);' : ''}"></i>
                 <div style="font-size:14px; font-weight:bold;">${card.name}</div>
                 <div style="font-size:10px; margin-top:5px;"></div>
               </div>`;

return `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
            <div class="tarot-container-3d tarot-responsive" style="margin-bottom: 10px; cursor: pointer;" onclick="this.classList.toggle('flipped');">
                <div class="tarot-card-inner">
                    <div class="tarot-face tarot-front" style="padding: 0; overflow: hidden; border: 2px solid var(--border-color); background: var(--secondary-bg);">
                        ${frontContent}
                    </div>

                    <div class="tarot-face tarot-back" style="background: linear-gradient(135deg, var(--secondary-bg), rgba(var(--accent-color-rgb), 0.05)); border: 2px solid rgba(var(--accent-color-rgb), 0.3); padding: 15px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow-y: auto;">
                        <div style="font-size:10px; color:var(--text-secondary); margin-bottom:6px;">${posLabel}</div>
                        <div class="tarot-card-name" style="font-size:16px; font-weight: 700;">${card.name}</div>
                        <div class="tarot-position-badge ${isReversed ? 'reversed' : 'upright'}" style="margin:4px auto; font-size:10px; padding: 2px 8px; background: var(--primary-bg);">${isReversed ? '逆位' : '正位'}</div>
                        <div style="font-weight: bold; color: var(--accent-color); font-size:12px; margin: 8px 0 4px;">「${card.keyword}」</div>
                        <div style="font-size: 11px; text-align: left; line-height: 1.6; color: var(--text-primary); width: 100%;">${meaning}</div>
                    </div>
                </div>
            </div>
        </div>`;
    }
    let resultHTML = '';
    const qDisplay = questionTrimmed ? `<div class="lenormand-question-show">「${questionTrimmed}」</div>` : '';
    let spreadLabel = '';

    if (currentTarotSpread === 'single') {
        spreadLabel = '單張塔羅';
        const card = shuffled[0];
        resultHTML = `${qDisplay}
        <div style="text-align:center;font-size:12px;color:var(--text-secondary);margin-bottom:12px;"><i class="fas fa-star-and-crescent"></i> 塔羅為你揭示 · 一切皆有答案</div>
        <div class="tarot-row single-card">${cardHTML(card, '當下')}</div>`;
    } else if (currentTarotSpread === 'three') {
        spreadLabel = '三張塔羅';
        const [card1, card2, card3] = shuffled.slice(0, 3);
        resultHTML = `${qDisplay}
        <div style="text-align:center;font-size:12px;color:var(--text-secondary);margin-bottom:12px;"><i class="fas fa-star-and-crescent"></i> 三張牌為你揭示 · 洞見能量流動</div>
        <div class="tarot-row">${cardHTML(card1, '牌一')}${cardHTML(card2, '牌二')}${cardHTML(card3, '牌三')}</div>`;
    }

    const resultEl = document.getElementById('tarot-result');
    const setupEl = document.getElementById('tarot-setup');
    const resetBtn = document.getElementById('tarot-reset-btn');
    if (resultEl) { resultEl.innerHTML = resultHTML; resultEl.style.display = ''; }
    if (setupEl) setupEl.style.display = 'none';
    if (resetBtn) resetBtn.style.display = '';

    saveDiviHistory({ type: spreadLabel, question: questionTrimmed, cards: drawnCards });
}

document.addEventListener('click', function(e) {
    const btn = e.target.closest('.tarot-spread-btn');
    if (!btn) return;
    setTarotSpread(btn.dataset.spread);
});
document.addEventListener('click', function(e) {
    if (e.target.id === 'close-tarot-divination') {
        const modal = document.getElementById('fortune-lenormand-modal');
        if (modal) hideModal(modal);
    }
});

const DIVI_HISTORY_KEY = 'diviHistory_v1';
const DIVI_HISTORY_MAX = 50;

function getDiviHistory() {
    try { return JSON.parse(localStorage.getItem(DIVI_HISTORY_KEY) || '[]'); } catch(e) { return []; }
}

function saveDiviHistory(entry) {
    const history = getDiviHistory();
    entry.id = Date.now();
    entry.time = new Date().toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
    history.unshift(entry);
    if (history.length > DIVI_HISTORY_MAX) history.splice(DIVI_HISTORY_MAX);
    localStorage.setItem(DIVI_HISTORY_KEY, JSON.stringify(history));
}

function clearDiviHistory() {
    if (!confirm('確定要清空所有占卜記錄嗎？')) return;
    localStorage.removeItem(DIVI_HISTORY_KEY);
    renderDiviHistory();
}

function renderDiviHistory() {
    const list = document.getElementById('divi-history-list');
    const empty = document.getElementById('divi-history-empty');
    if (!list) return;
    const history = getDiviHistory();
    if (!history.length) {
        list.innerHTML = '';
        if (empty) empty.style.display = '';
        return;
    }
    if (empty) empty.style.display = 'none';
    list.innerHTML = history.map(entry => {
        const cardTags = (entry.cards || []).map(c =>
            `<span class="divi-history-card-tag ${c.isReversed ? 'reversed' : ''}">
                ${c.isReversed ? '<i class="fas fa-arrow-down" style="font-size:9px;"></i>' : '<i class="fas fa-arrow-up" style="font-size:9px;"></i>'}
                ${c.name}
            </span>`
        ).join('');
        const detailLines = (entry.cards || []).map(c =>
            `<div style="margin-bottom:6px;"><b>${c.name}${c.isReversed ? ' 逆位' : ' 正位'}</b><br>${c.keyword} — ${c.meaning}</div>`
        ).join('');
        return `
        <div class="divi-history-item">
            <div class="divi-history-meta">
                <span class="divi-history-type">${entry.type || '占卜'}</span>
                <span class="divi-history-time">${entry.time || ''}</span>
            </div>
            ${entry.question ? `<div class="divi-history-question">「${entry.question}」</div>` : ''}
            <div class="divi-history-cards">${cardTags}</div>
            ${detailLines ? `<button class="divi-history-expand-btn" onclick="toggleDiviDetail(this)">檢視解讀 ▾</button>
            <div class="divi-history-detail">${detailLines}</div>` : ''}
        </div>`;
    }).join('');
}
function toggleDiviDetail(btn) {
    const detail = btn.nextElementSibling;
    if (!detail) return;
    const open = detail.classList.toggle('open');
    btn.textContent = open ? '收起 ▴' : '檢視解讀 ▾';
}

const _origSwitchFLTab = switchFLTab;
window.switchFLTab = function(tab) {
    _origSwitchFLTab(tab);
    if (tab === 'divihistory') renderDiviHistory();
};

document.addEventListener('click', function(e) {
    if (e.target.id === 'close-divihistory') {
        const modal = document.getElementById('fortune-lenormand-modal');
        if (modal) hideModal(modal);
    }
});

function renderFavorites() {
    const list = document.getElementById('favorites-list');
    if (!list) return;

    const favoritedMessages = (typeof messages !== 'undefined' ? messages : [])
        .filter(m => m.favorited && m.type !== 'system');

    if (favoritedMessages.length === 0) {
        list.innerHTML = `
            <div class="stats-empty-state">
                <div class="stats-empty-icon"><i class="fas fa-star"></i></div>
                <h3>收藏夾空空如也</h3>
                <p>點選訊息旁的 ☆ 星標即可收藏</p>
            </div>`;
        return;
    }

    list.innerHTML = favoritedMessages.map(msg => {
        const isUser = msg.sender === 'user';
        const senderName = isUser
            ? ((typeof settings !== 'undefined' && settings.myName) || '我')
            : ((typeof settings !== 'undefined' && settings.partnerName) || msg.sender || '對方');
        const ts = msg.timestamp ? new Date(msg.timestamp).toLocaleString('zh-CN', {
            month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }) : '';
        const content = msg.text
            ? msg.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
            : (msg.image ? `<img src="${msg.image}" style="max-width:100%;max-height:180px;border-radius:8px;display:block;margin-top:4px;cursor:pointer;" onclick="if(typeof viewImage==='function')viewImage('${msg.image.replace(/'/g,'\\\'')}')" loading="lazy">` : '');
        const avatarEl = isUser
            ? (typeof DOMElements !== 'undefined' ? DOMElements.me.avatar : null)
            : (typeof DOMElements !== 'undefined' ? DOMElements.partner.avatar : null);
        const avatarImg = avatarEl ? avatarEl.querySelector('img') : null;
        const avatarHtml = avatarImg
            ? `<img src="${avatarImg.src}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
            : `<div style="width:28px;height:28px;border-radius:50%;background:rgba(var(--accent-color-rgb),0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-user" style="font-size:11px;color:var(--accent-color);"></i></div>`;
        return `
            <div class="fav-item" style="
                display:flex;flex-direction:column;gap:4px;
                padding:12px 14px;border-radius:12px;
                background:var(--primary-bg);
                border:1px solid var(--border-color);
                margin-bottom:10px;
                position:relative;
            ">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                    ${avatarHtml}
                    <span style="font-size:12px;font-weight:600;color:var(--accent-color);">${senderName}</span>
                    <span style="font-size:11px;color:var(--text-secondary);margin-left:auto;padding-right:24px;">${ts}</span>
                </div>
                <div style="font-size:13px;color:var(--text-primary);line-height:1.5;word-break:break-word;">${content}</div>
                <button class="fav-remove-btn" data-id="${msg.id}" style="
                    position:absolute;top:8px;right:10px;
                    background:none;border:none;cursor:pointer;
                    color:var(--text-secondary);font-size:14px;padding:2px 4px;
                    opacity:0.6;
                " title="取消收藏"><i class="fas fa-star" style="color:var(--accent-color);"></i></button>
            </div>`;
    }).join('');

    list.querySelectorAll('.fav-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = Number(btn.dataset.id);
            const msg = (typeof messages !== 'undefined' ? messages : []).find(m => m.id === id);
            if (msg) {
                msg.favorited = false;
                if (typeof throttledSaveData === 'function') throttledSaveData();
                if (typeof showNotification === 'function') showNotification('已取消收藏', 'success', 1500);
                renderFavorites();
            }
        });
    });
}
window.renderFavorites = renderFavorites;

window._runMsgSearch = function() {
    const input = document.getElementById('msg-search-input');
    const dateFrom = document.getElementById('msg-search-date-from');
    const dateTo = document.getElementById('msg-search-date-to');
    const resultsEl = document.getElementById('msg-search-results');
    if (!resultsEl) return;

    const q = (input ? input.value.trim() : '').toLowerCase();
    const from = dateFrom && dateFrom.value ? new Date(dateFrom.value) : null;
    const to = dateTo && dateTo.value ? new Date(dateTo.value + 'T23:59:59') : null;

    if (!q && !from && !to) {
        resultsEl.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-secondary);font-size:13px;">輸入關鍵詞或選擇日期開始搜尋</div>';
        return;
    }

    const allMessages = typeof messages !== 'undefined' ? messages : [];
    const results = allMessages.filter(m => {
        if (m.type === 'system') return false;
        const ts = m.timestamp ? new Date(m.timestamp) : null;
        if (from && ts && ts < from) return false;
        if (to && ts && ts > to) return false;
        if (q && m.text && m.text.toLowerCase().includes(q)) return true;
        if (q && !m.text && m.image) return false; 
        return !q; 
    });

    if (results.length === 0) {
        resultsEl.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-secondary);font-size:13px;">未找到 "${q || '相關'}" 的訊息</div>`;
        return;
    }

    const myAvatarEl = typeof DOMElements !== 'undefined' ? DOMElements.me.avatar : null;
    const partnerAvatarEl = typeof DOMElements !== 'undefined' ? DOMElements.partner.avatar : null;
    const myImg = myAvatarEl ? myAvatarEl.querySelector('img') : null;
    const partnerImg = partnerAvatarEl ? partnerAvatarEl.querySelector('img') : null;

    function getAvatarHtml(isUser) {
        const img = isUser ? myImg : partnerImg;
        if (img) return `<img src="${img.src}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;">`;
        return `<div style="width:28px;height:28px;border-radius:50%;background:rgba(var(--accent-color-rgb),0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-user" style="font-size:11px;color:var(--accent-color);"></i></div>`;
    }

    function highlight(text, keyword) {
        if (!keyword) return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const escaped = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const re = new RegExp('(' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        return escaped.replace(re, '<mark style="background:rgba(var(--accent-color-rgb),0.25);color:var(--accent-color);border-radius:2px;padding:0 1px;">$1</mark>');
    }

    resultsEl.innerHTML = results.slice(0, 100).map(msg => {
        const isUser = msg.sender === 'user';
        const senderName = isUser
            ? ((typeof settings !== 'undefined' && settings.myName) || '我')
            : ((typeof settings !== 'undefined' && settings.partnerName) || msg.sender || '對方');
        const ts = msg.timestamp ? new Date(msg.timestamp).toLocaleString('zh-CN', {
            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        }) : '';
        const content = msg.text
            ? highlight(msg.text, q)
            : (msg.image ? `<img src="${msg.image}" style="max-height:60px;border-radius:6px;display:block;margin-top:4px;" loading="lazy">` : '');
        return `<div style="display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border-radius:12px;background:var(--primary-bg);border:1px solid var(--border-color);margin-bottom:8px;cursor:pointer;"
            onclick="if(typeof showNotification==='function')showNotification('已定位訊息', 'info', 1500); if(typeof scrollToQuotedMessage==='function'){var el=document.createElement('div');el.dataset.replyId='${msg.id}';scrollToQuotedMessage(el);}">
            ${getAvatarHtml(isUser)}
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                    <span style="font-size:12px;font-weight:600;color:var(--accent-color);">${senderName}</span>
                    <span style="font-size:11px;color:var(--text-secondary);">${ts}</span>
                </div>
                <div style="font-size:13px;color:var(--text-primary);line-height:1.5;word-break:break-word;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">${content}</div>
            </div>
        </div>`;
    }).join('') + (results.length > 100 ? `<div style="text-align:center;padding:10px;font-size:12px;color:var(--text-secondary);">僅顯示前100條，共找到 ${results.length} 條</div>` : '');
};

let wheelOptions = ["是", "否", "再想一想", "聽你的"];
let wheelResultText = "";

function initDecisionModule() {
    const entryBtn = document.getElementById('decision-function'); 
    if(entryBtn) {
        const newBtn = entryBtn.cloneNode(true);
        entryBtn.parentNode.replaceChild(newBtn, entryBtn);
        newBtn.addEventListener('click', () => {
            hideModal(document.getElementById('advanced-modal'));
            showModal(document.getElementById('decision-menu-modal'));
        });
    }

    const openCoinBtn = document.getElementById('open-coin-toss');
    const openWheelBtn = document.getElementById('open-wheel');
    const closeMenuBtn = document.getElementById('close-decision-menu');
    const closeWheelBtn = document.getElementById('close-wheel');
    const addOptionBtn = document.getElementById('add-wheel-option');
    const spinBtn = document.getElementById('spin-wheel-btn');
    const sendResultBtn = document.getElementById('send-wheel-result');

    if (openCoinBtn && !openCoinBtn.dataset.initialized) {
        openCoinBtn.addEventListener('click', () => {
            hideModal(document.getElementById('decision-menu-modal'));
            handleCoinToss();
        });
        openCoinBtn.dataset.initialized = 'true';
    }

    if (openWheelBtn && !openWheelBtn.dataset.initialized) {
        openWheelBtn.addEventListener('click', () => {
            hideModal(document.getElementById('decision-menu-modal'));
            initPicker();
            showModal(document.getElementById('wheel-modal'));
        });
        openWheelBtn.dataset.initialized = 'true';
    }
    
    if (closeMenuBtn && !closeMenuBtn.dataset.initialized) {
        closeMenuBtn.addEventListener('click', () => hideModal(document.getElementById('decision-menu-modal')));
        closeMenuBtn.dataset.initialized = 'true';
    }

    if (closeWheelBtn && !closeWheelBtn.dataset.initialized) {
        closeWheelBtn.addEventListener('click', () => hideModal(document.getElementById('wheel-modal')));
        closeWheelBtn.dataset.initialized = 'true';
    }

    if (addOptionBtn && !addOptionBtn.dataset.initialized) {
        addOptionBtn.addEventListener('click', () => {
            wheelOptions.push(`選項 ${wheelOptions.length + 1}`);
            renderPickerOptions();
            renderPickerCards();
        });
        addOptionBtn.dataset.initialized = 'true';
    }

    if (spinBtn && !spinBtn.dataset.initialized) {
        spinBtn.addEventListener('click', doPick);
        spinBtn.dataset.initialized = 'true';
    }
    
    if (sendResultBtn && !sendResultBtn.dataset.initialized) {
        sendResultBtn.addEventListener('click', () => {
            if(wheelResultText) {
                sendMessage(`✨ 隨機抽籤結果：${wheelResultText}`, 'normal');
                hideModal(document.getElementById('wheel-modal'));
                wheelResultText = "";
                sendResultBtn.style.display = 'none';
                const resultEl = document.getElementById('wheel-result');
                if (resultEl) { resultEl.textContent = ""; resultEl.classList.remove('show'); }
                spinBtn.disabled = false;
            }
        });
        sendResultBtn.dataset.initialized = 'true';
    }
}

function initPicker() {
    renderPickerOptions();
    renderPickerCards();
    const result = document.getElementById('wheel-result');
    const sendBtn = document.getElementById('send-wheel-result');
    const spinBtn = document.getElementById('spin-wheel-btn');
    if (result) { result.textContent = ""; result.classList.remove('show'); }
    if (sendBtn) sendBtn.style.display = 'none';
    if (spinBtn) spinBtn.disabled = false;
    wheelResultText = "";
}

function renderPickerOptions() {
    const list = document.getElementById('wheel-options-list');
    if (!list) return;
    list.innerHTML = '';
    const colors = ['#FFD93D','#FF6B6B','#6BCB77','#4D96FF','#E0C3FC','#FF9A8B','#A8D8EA','#C44569'];
    wheelOptions.forEach((opt, index) => {
        const item = document.createElement('div');
        item.className = 'picker-option-item';
        item.innerHTML = `
            <div class="picker-option-color-dot" style="background:${colors[index % colors.length]}"></div>
            <input type="text" class="picker-option-input" value="${opt}" placeholder="輸入選項...">
            <span class="picker-option-remove"><i class="fas fa-times"></i></span>
        `;
        item.querySelector('input').addEventListener('input', (e) => {
            wheelOptions[index] = e.target.value;
            renderPickerCards();
        });
        item.querySelector('.picker-option-remove').addEventListener('click', () => {
            if(wheelOptions.length <= 2) {
                showNotification('至少保留兩個選項', 'warning');
                return;
            }
            wheelOptions.splice(index, 1);
            renderPickerOptions();
            renderPickerCards();
        });
        list.appendChild(item);
    });
}

function renderPickerCards(selectedIndex = -1) {
    const row = document.getElementById('picker-cards-row');
    if (!row) return;
    const colors = ['#FFD93D','#FF6B6B','#6BCB77','#4D96FF','#E0C3FC','#FF9A8B','#A8D8EA','#C44569'];
    row.innerHTML = '';
    wheelOptions.forEach((opt, i) => {
        const card = document.createElement('div');
        card.className = 'picker-card';
        if (selectedIndex >= 0) {
            if (i === selectedIndex) card.classList.add('selected');
            else card.classList.add('unselected');
        }
        if (selectedIndex >= 0 && i === selectedIndex) {
            card.style.background = `linear-gradient(135deg, ${colors[i % colors.length]}, ${colors[(i+2) % colors.length]})`;
        } else {
            card.style.borderTop = `3px solid ${colors[i % colors.length]}`;
        }
        card.style.animationDelay = (i * 0.06) + 's';
        const label = opt || `選項${i+1}`;
        card.textContent = label.length > 6 ? label.slice(0,5) + '…' : label;
        row.appendChild(card);
    });
}

function doPick() {
    if (wheelOptions.length < 2) {
        showNotification("請至少新增兩個選項", "warning");
        return;
    }
    const spinBtn = document.getElementById('spin-wheel-btn');
    const resultDisplay = document.getElementById('wheel-result');
    const sendBtn = document.getElementById('send-wheel-result');
    
    spinBtn.disabled = true;
    sendBtn.style.display = 'none';
    resultDisplay.classList.remove('show');
    resultDisplay.textContent = "";

    let flashCount = 0;
    const totalFlashes = 16 + Math.floor(Math.random() * 8);
    const finalIndex = Math.floor(Math.random() * wheelOptions.length);
    
    function flash() {
        const row = document.getElementById('picker-cards-row');
        if (!row) return;
        const cards = row.querySelectorAll('.picker-card');
        cards.forEach(c => c.style.transform = '');
        
        let showIdx;
        if (flashCount < totalFlashes - 3) {
            showIdx = Math.floor(Math.random() * wheelOptions.length);
        } else {
            showIdx = finalIndex;
        }
        
        cards.forEach((c, i) => {
            if (i === showIdx) {
                c.style.transform = 'translateY(-4px) scale(1.06)';
                c.style.background = `linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb),0.7))`;
                c.style.borderColor = 'transparent';
                c.style.color = '#fff';
            } else {
                c.style.transform = '';
                c.style.background = '';
                c.style.borderColor = '';
                c.style.color = '';
            }
        });
        
        flashCount++;
        const delay = flashCount < 8 ? 80 : flashCount < 14 ? 130 : 250;
        if (flashCount < totalFlashes) {
            setTimeout(flash, delay);
        } else {
            setTimeout(() => {
                renderPickerCards(finalIndex);
                wheelResultText = wheelOptions[finalIndex];
                resultDisplay.innerHTML = `<i class="fas fa-star" style="font-size:14px; margin-right:6px;"></i>${wheelResultText}`;
                resultDisplay.classList.add('show');
                spinBtn.disabled = false;
                sendBtn.style.display = 'inline-block';
                playSound('favorite');
            }, 300);
        }
    }
    
    flash();
}

function handleCoinToss() {
    const overlay = DOMElements.coinTossOverlay;
    if (!overlay) return;
    overlay.classList.remove('finished');
    overlay.classList.add('visible');
    const resultText = DOMElements.coinResultText;
    if (resultText) resultText.textContent = '';
    const sendBtn = DOMElements.sendCoinResult;
    if (sendBtn) sendBtn.style.display = 'none';
    const retryBtn = document.getElementById('retry-coin-toss');
    if (retryBtn) retryBtn.style.display = 'none';
    if (DOMElements.animatedCoin) DOMElements.animatedCoin.style.transform = '';
    startCoinFlipAnimation();
}
window.handleCoinToss = handleCoinToss;

function startCoinFlipAnimation() {
    const coin = DOMElements.animatedCoin;
    const resultText = DOMElements.coinResultText;
    const overlay = DOMElements.coinTossOverlay;
    if (!coin || !overlay) return;

    overlay.classList.remove('finished');
    if (resultText) resultText.textContent = '';
    const sendBtn = DOMElements.sendCoinResult;
    if (sendBtn) sendBtn.style.display = 'none';
    const retryBtn = document.getElementById('retry-coin-toss');
    if (retryBtn) retryBtn.style.display = 'none';

    const isHeads = Math.random() < 0.5;
    const result = isHeads ? '正面 ☀️' : '反面 🌙';
    lastCoinResult = result;

    coin.classList.remove('flipping-heads', 'flipping-tails', 'coin-show-front', 'coin-show-back');
    void coin.offsetWidth;
    coin.classList.add(isHeads ? 'flipping-heads' : 'flipping-tails');
    setTimeout(() => {
        coin.classList.remove('flipping-heads', 'flipping-tails');
        coin.style.transform = isHeads ? 'rotateY(0deg)' : 'rotateY(180deg)';
        if (resultText) resultText.textContent = result;
        overlay.classList.add('finished');
        if (sendBtn) sendBtn.style.display = '';
        if (retryBtn) retryBtn.style.display = '';
        if (typeof playSound === 'function') playSound('favorite');
    }, 3050);
}
window.startCoinFlipAnimation = startCoinFlipAnimation;

function initComboMenu() {
    const comboBtn = document.getElementById('combo-btn');
    const picker = document.getElementById('user-sticker-picker');
    const contentArea = document.getElementById('combo-content-area');
    
    if (!comboBtn || !picker) return;
    
    if (comboBtn.dataset.initialized) return;
    
    comboBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = picker.classList.contains('active');
        
        if (isActive) {
            picker.classList.remove('active');
        } else {
            switchTab('my-sticker');
            picker.classList.add('active');
        }
    });
    
    comboBtn.dataset.initialized = 'true';

    document.addEventListener('click', (e) => {
        if (!picker.contains(e.target) && !comboBtn.contains(e.target)) {
            picker.classList.remove('active');
        }
    });

    const tabs = picker.querySelectorAll('.combo-tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });

    function updateAddBtnVisibility(tabId) {
        const addBtn = document.getElementById('sticker-add-btn');
        if (addBtn) addBtn.style.display = (tabId === 'my-sticker') ? 'flex' : 'none';
    }

    function switchTab(tabId) {
        tabs.forEach(b => b.classList.remove('active'));
        const activeBtn = Array.from(tabs).find(b => b.dataset.tab === tabId);
        if (activeBtn) activeBtn.classList.add('active');
        updateAddBtnVisibility(tabId);

        if (tabId === 'my-sticker') {
            renderMyStickerLibrary();
        } else if (tabId === 'partner-sticker') {
            renderPartnerStickerLibrary();
        } else {
            renderUserPokeMenu();
        }
    }

    function makeStickerItem(src, onClick) {
        const item = document.createElement('div');
        item.className = 'sticker-grid-item';
        item.innerHTML = `<img src="${src}" loading="lazy">`;
        item.onclick = (e) => { e.stopPropagation(); onClick(); };
        return item;
    }

    function makeDeletableStickerItem(src, onClick, onDelete) {
        const item = document.createElement('div');
        item.className = 'sticker-grid-item';
        item.style.position = 'relative';
        item.innerHTML = `<img src="${src}" loading="lazy"><div class="sticker-delete-btn" title="刪除"><i class="fas fa-times"></i></div>`;
        item.querySelector('img').onclick = (e) => { e.stopPropagation(); onClick(); };
        item.querySelector('.sticker-delete-btn').onclick = (e) => { e.stopPropagation(); onDelete(); };
        return item;
    }

    function renderMyStickerLibrary() {
        contentArea.innerHTML = '';
        if (!myStickerLibrary || myStickerLibrary.length === 0) {
            contentArea.innerHTML = `
                <div class="empty-sticker-tip">
                    <i class="fas fa-user-circle"></i>
                    還沒有我的專屬表情哦<br>
                    點選右上角"新增"按鈕上傳圖片~
                </div>
            `;
            return;
        }
        const grid = document.createElement('div');
        grid.className = 'sticker-grid-view';
        myStickerLibrary.forEach((src, idx) => {
            const item = makeDeletableStickerItem(src, () => {
                addMessage({ id: Date.now(), sender: 'user', text: '', timestamp: new Date(), image: src, status: 'sent', type: 'normal' });
                playSound('send');
                picker.classList.remove('active');
                const delayRange = settings.replyDelayMax - settings.replyDelayMin;
                setTimeout(simulateReply, settings.replyDelayMin + Math.random() * delayRange);
            }, () => {
                myStickerLibrary.splice(idx, 1);
                localforage.setItem(getStorageKey('myStickerLibrary'), myStickerLibrary);
                showNotification('✓ 已刪除', 'success');
                renderMyStickerLibrary();
            });
            grid.appendChild(item);
        });
        contentArea.appendChild(grid);
    }

    function renderPartnerStickerLibrary() {
        contentArea.innerHTML = '';
        if (!stickerLibrary || stickerLibrary.length === 0) {
            contentArea.innerHTML = `
                <div class="empty-sticker-tip">
                    <i class="far fa-images"></i>
                    對方表情庫還是空的哦<br>
                    請去"高階功能"->"自定義回覆"->"表情庫"中新增圖片~
                </div>
            `;
            return;
        }
        const grid = document.createElement('div');
        grid.className = 'sticker-grid-view';
        stickerLibrary.forEach(src => {
            const item = makeStickerItem(src, () => {
                addMessage({ id: Date.now(), sender: 'user', text: '', timestamp: new Date(), image: src, status: 'sent', type: 'normal' });
                playSound('send');
                picker.classList.remove('active');
                const delayRange = settings.replyDelayMax - settings.replyDelayMin;
                setTimeout(simulateReply, settings.replyDelayMin + Math.random() * delayRange);
            });
            grid.appendChild(item);
        });
        contentArea.appendChild(grid);
    }

    function renderStickerLibrary() { renderMyStickerLibrary(); }
    function renderUserPokeMenu() {
        contentArea.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'poke-list-view';

        const customBtn = document.createElement('button');
        customBtn.className = 'custom-poke-btn';
        customBtn.innerHTML = '<i class="fas fa-pen"></i> 自定義動作';
        customBtn.onclick = (e) => {
            e.stopPropagation();
            picker.classList.remove('active');
            showModal(DOMElements.pokeModal.modal, DOMElements.pokeModal.input);
        };
        wrapper.appendChild(customBtn);

        const userPresets = [
            "拍了拍對方的頭",
            "戳了戳對方的臉頰",
            "抱住了對方",
            "給對方比了個心",
            "牽起了對方的手",
            "看著對方發呆"
        ];

        const title = document.createElement('div');
        title.style.fontSize = '12px';
        title.style.color = 'var(--text-secondary)';
        title.style.marginBottom = '5px';
        title.innerText = '快捷動作';
        wrapper.appendChild(title);

        userPresets.forEach(text => {
            const item = document.createElement('div');
            item.className = 'poke-quick-item';
            item.innerText = text;
            item.onclick = (e) => {
                e.stopPropagation();
                addMessage({
                    id: Date.now(),
                    text: _formatPokeText(`${settings.myName} ${text}`), 
                    timestamp: new Date(),
                    type: 'system' 
                });
                picker.classList.remove('active');
                
                setTimeout(simulateReply, 1500);
            };
            wrapper.appendChild(item);
        });

        contentArea.appendChild(wrapper);
    }
}

(function() {
    var STOP_WORDS = new Set([
        '的','了','是','我','你','他','她','它','們','這','那','有','在','就','也','都',
        '和','與','或','但','不','沒','很','太','更','最','已','被','讓','把','對','從',
        '到','於','以','為','之','其','而','則','所','等','啊','哦','嗯','哈','呢','吧',
        '嗎','嘛','呀','哇','哎','唉','嗯嗯','哈哈','嘻嘻','呵呵','哦哦','啊啊','哈哈哈',
        '一','二','三','四','五','六','七','八','九','十','個','次','條','件','種',
        '好','行','可以','可','又','再','還','來','去','說','想','知道','覺得','感覺',
        '什麼','怎麼','為什麼','哪','誰','哪裡','怎樣','如何','這麼','那麼',
        '然後','因為','所以','如果','雖然','但是','而且','不過','只是','只有',
        '沒有','不是','還是','就是','真的','對啊','好的','好吧','那個','這個',
        '今天','昨天','明天','現在','以前','以後','時候','時間','一下','一直','一個',
        'ok','OK','Ok','yes','no','hh','hhhh','hhh','嗯','額',
        '圖片','表情','語音','【圖片】','【表情】','【語音】','撤回了一條訊息','已撤回'
    ]);

    function tokenize(text) {
        text = text
            .replace(/https?:\/\/\S+/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/[^\u4e00-\u9fa5a-zA-Z]/g, ' ')
            .toLowerCase();
        var words = {};
        var cn = text.replace(/[a-z ]/g, '');
        // 使用非重疊分詞：優先提取長詞，避免"我想你"同時產生"我想"和"想你"
        // 策略：對每個起點只取一次最長匹配（4>3>2），跳過已覆蓋字元
        var covered = new Array(cn.length).fill(false);
        // 先掃一遍提取4字詞
        for (var i = 0; i + 4 <= cn.length; i++) {
            var w4 = cn.slice(i, i + 4);
            if (!STOP_WORDS.has(w4)) {
                words[w4] = (words[w4] || 0) + 2.4;
                covered[i] = covered[i+1] = covered[i+2] = covered[i+3] = true;
                i += 3; // 跳過已覆蓋字元
            }
        }
        // 再掃3字詞（跳過已覆蓋位置）
        covered = new Array(cn.length).fill(false); // 重置，用於3字
        for (var j = 0; j + 3 <= cn.length; j++) {
            var w3 = cn.slice(j, j + 3);
            if (!STOP_WORDS.has(w3)) {
                words[w3] = (words[w3] || 0) + 1.8;
                j += 2;
            }
        }
        // 2字詞：步長2，非重疊，不與已有詞重複計數
        for (var k = 0; k + 2 <= cn.length; k += 2) {
            var w2 = cn.slice(k, k + 2);
            if (!STOP_WORDS.has(w2)) {
                words[w2] = (words[w2] || 0) + 1;
            }
        }
        // 英文單詞（長度≥3）
        (text.match(/[a-z]{3,}/g) || []).forEach(function(w) {
            if (!STOP_WORDS.has(w)) words[w] = (words[w] || 0) + 1;
        });
        return words;
    }

    function mergeFreq(a, b) {
        var o = Object.assign({}, a);
        Object.keys(b).forEach(function(k) { o[k] = (o[k] || 0) + b[k]; });
        return o;
    }

    function topWords(freq, n) {
        var min = Object.keys(freq).length > 60 ? 2 : 1;
        return Object.entries(freq)
            .filter(function(e) { return e[1] >= min && e[0].length >= 2; })
            .sort(function(a, b) { return b[1] - a[1]; })
            .slice(0, n)
            .map(function(e) { return { word: e[0], count: e[1] }; });
    }

    function resolveFont() {
        var el = document.createElement('span');
        el.style.cssText = 'position:absolute;visibility:hidden;font-family:var(--font-family)';
        document.body.appendChild(el);
        var f = getComputedStyle(el).fontFamily || '"PingFang SC","Microsoft YaHei",sans-serif';
        document.body.removeChild(el);
        return f;
    }

    function hex3(hex) {
        hex = hex.replace('#','');
        if (hex.length === 3) hex = hex.split('').map(function(c){return c+c;}).join('');
        var n = parseInt(hex, 16);
        return [(n>>16)&255, (n>>8)&255, n&255];
    }
    function drawWordCloud(canvas, words) {
        var ctx   = canvas.getContext('2d');
        var dpr   = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var W = canvas.width / dpr;
        var H = canvas.height / dpr;

        var cs     = getComputedStyle(document.documentElement);
        var accent = cs.getPropertyValue('--accent-color').trim() || '#c5a47e';
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var rgb    = hex3(accent);
        var font   = resolveFont();

        ctx.fillStyle = isDark ? '#141414' : '#ffffff';
        ctx.fillRect(0, 0, W, H);

        if (!words.length) return;

        var maxC = words[0].count;
        var minC = words[words.length - 1].count;
        var placed = [];

        var MIN_F = 11, MAX_F = 54;

        function fontSize(c) {
            if (maxC === minC) return 24;
            var t = Math.log(1 + c - minC) / Math.log(1 + maxC - minC);
            return Math.round(MIN_F + t * (MAX_F - MIN_F));
        }

        function wordAlpha(idx, total) {
            if (idx === 0) return 1.0;
            if (idx < 3)   return 0.82;
            if (idx < 8)   return 0.64;
            if (idx < 20)  return 0.46;
            return Math.max(0.20, 0.46 - (idx - 20) / total * 0.25);
        }

        function tilt(word, idx) {
            if (idx < 5) return 0;
            var h = 0;
            for (var i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) | 0;
            return (Math.abs(h) % 6 === 0) ? (Math.PI / 2) : 0;
        }

        function overlaps(x, y, w, h, pad) {
            for (var i = 0; i < placed.length; i++) {
                var p = placed[i];
                if (x - pad < p.x + p.w && x + w + pad > p.x &&
                    y - pad < p.y + p.h && y + h + pad > p.y) return true;
            }
            return false;
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;

        words.forEach(function(item, idx) {
            var fs  = fontSize(item.count);
            var fw  = idx < 2 ? '800' : idx < 8 ? '600' : '400';
            var rot = tilt(item.word, idx);
            var a   = wordAlpha(idx, words.length);

            ctx.font = fw + ' ' + fs + 'px ' + font;
            var tw = ctx.measureText(item.word).width;
            var th = fs * 1.25;

            var bw = rot !== 0 ? th + 2 : tw;
            var bh = rot !== 0 ? tw + 2 : th;
            var pad = idx < 3 ? 9 : idx < 12 ? 4 : 2;

            var placed_ = false;
            var cx = W / 2, cy = H / 2;

            for (var t = 0; t < 320; t += 0.09) {
                var ang = t * 2.2;
                var r   = 1.8 * ang;
                var bx  = cx + r * Math.cos(ang) * 1.2 - bw / 2;
                var by  = cy + r * Math.sin(ang) * 0.88 - bh / 2;

                if (bx >= pad && by >= pad && bx + bw <= W - pad && by + bh <= H - pad) {
                    if (!overlaps(bx, by, bw, bh, pad)) {
                        ctx.save();
                        ctx.globalAlpha = a;
                        ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
                        ctx.translate(bx + bw/2, by + bh/2);
                        ctx.rotate(rot);
                        ctx.fillText(item.word, 0, 0);
                        ctx.restore();
                        placed.push({ x: bx, y: by, w: bw, h: bh });
                        placed_ = true;
                        break;
                    }
                }
            }

            if (!placed_) {
                var fsS = Math.max(10, fs * 0.58);
                ctx.font = '400 ' + fsS + 'px ' + font;
                var tw2 = ctx.measureText(item.word).width + 2;
                var th2 = fsS * 1.25;
                for (var fb = 0; fb < 60; fb++) {
                    var fx = 6 + Math.random() * (W - tw2 - 12);
                    var fy = 6 + Math.random() * (H - th2 - 12);
                    if (!overlaps(fx, fy, tw2, th2, 2)) {
                        ctx.save();
                        ctx.globalAlpha = Math.min(a, 0.32);
                        ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
                        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                        ctx.fillText(item.word, fx, fy);
                        ctx.restore();
                        placed.push({ x: fx, y: fy, w: tw2, h: th2 });
                        break;
                    }
                }
            }
        });
    }

    window.renderWordCloud = function() {
        var container = document.getElementById('wordcloud-container');
        if (!container) return;

        if (typeof messages === 'undefined' || !messages || !messages.length) {
            container.innerHTML = '<div class="wc-empty"><i class="fas fa-ghost"></i><p>還沒有聊天記錄</p><span>多聊幾句，詞雲就會出現～</span></div>';
            return;
        }

        var pName = (typeof settings !== 'undefined' && settings.partnerName) ? settings.partnerName : '對方';
        var mName = (typeof settings !== 'undefined' && settings.myName)      ? settings.myName      : '我';

        var partnerMsgs = messages.filter(function(m) { return m.sender !== 'user' && m.text && m.type !== 'system' && m.type !== 'call-event'; });
        var myMsgs      = messages.filter(function(m) { return m.sender === 'user' && m.text && m.type !== 'system' && m.type !== 'call-event'; });

        var pFreq = {}, mFreq = {};
        partnerMsgs.forEach(function(m) { pFreq = mergeFreq(pFreq, tokenize(m.text)); });
        myMsgs.forEach(function(m)      { mFreq = mergeFreq(mFreq, tokenize(m.text)); });
        var aFreq = mergeFreq(pFreq, mFreq);

        var pTop = topWords(pFreq, 60);
        var mTop = topWords(mFreq, 60);
        var aTop = topWords(aFreq, 60);

        var cur = container._currentView || 'all';

        function data(v) {
            if (v === 'partner') return { words: pTop, total: partnerMsgs.length };
            if (v === 'me')      return { words: mTop, total: myMsgs.length };
            return { words: aTop, total: partnerMsgs.length + myMsgs.length };
        }

        function renderRank(words) {
            var el = container.querySelector('.wc-rank-list');
            if (!el) return;
            if (!words.length) { el.innerHTML = '<div class="wc-rank-empty">暫無資料</div>'; return; }
            var cs     = getComputedStyle(document.documentElement);
            var accent = cs.getPropertyValue('--accent-color').trim() || '#c5a47e';
            var rgb    = hex3(accent);
            var max    = words[0].count;
            el.innerHTML = words.slice(0, 10).map(function(item, i) {
                var pct = Math.round(item.count / max * 100);
                var numStyle = i < 3
                    ? 'color:rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+');font-weight:700;'
                    : 'color:var(--text-secondary);font-weight:500;';
                return '<div class="wc-rank-item">'
                    + '<span class="wc-rank-num" style="'+numStyle+'">' + (i < 9 ? '0'+(i+1) : i+1) + '</span>'
                    + '<span class="wc-rank-word">' + item.word + '</span>'
                    + '<div class="wc-rank-bar-wrap">'
                    +   '<div class="wc-rank-bar" style="width:'+pct+'%;background:rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(0.2+pct/100*0.6)+');"></div>'
                    + '</div>'
                    + '<span class="wc-rank-count">' + Math.round(item.count) + '</span>'
                    + '</div>';
            }).join('');
        }

        function renderSummary(d) {
            var el = container.querySelector('.wc-summary');
            if (!el) return;
            el.innerHTML =
                '<span class="wc-summary-pill"><i class="fas fa-comment-dots"></i> ' + d.total + ' 條</span>'
                + '<span class="wc-summary-pill"><i class="fas fa-font"></i> ' + d.words.length + ' 詞</span>';
        }

        function renderView(v) {
            container._currentView = v;
            container.querySelectorAll('.wc-view-btn').forEach(function(b) {
                b.classList.toggle('active', b.dataset.view === v);
            });
            var canvas = container.querySelector('#wc-canvas');
            if (!canvas) return;
            var d = data(v);
            drawWordCloud(canvas, d.words);
            renderRank(d.words);
            renderSummary(d);
        }

        if (!container.querySelector('#wc-canvas')) {
            var dpr = window.devicePixelRatio || 1;
            var cw  = Math.min(container.offsetWidth || (container.parentElement && container.parentElement.offsetWidth) || 340, 500);
            var ch  = Math.round(cw * 0.72);

            container.innerHTML =
                '<div class="wc-header">'
                +   '<div class="wc-tabs"><div class="wc-tabs-track">'
                +     '<button class="wc-view-btn'+(cur==='all'?' active':'')+'" data-view="all">全部</button>'
                +     '<button class="wc-view-btn'+(cur==='partner'?' active':'')+'" data-view="partner">'+pName+'</button>'
                +     '<button class="wc-view-btn'+(cur==='me'?' active':'')+'" data-view="me">'+mName+'</button>'
                +   '</div></div>'
                +   '<button class="wc-regen-btn" title="換一種佈局"><i class="fas fa-redo"></i></button>'
                + '</div>'
                + '<div class="wc-summary"></div>'
                + '<div class="wc-canvas-wrap">'
                +   '<canvas id="wc-canvas" width="'+(cw*dpr)+'" height="'+(ch*dpr)+'" style="width:'+cw+'px;height:'+ch+'px;display:block;"></canvas>'
                + '</div>'
                + '<div class="wc-rank-section">'
                +   '<div class="wc-rank-title"><i class="fas fa-bars"></i> 高頻詞 Top 10</div>'
                +   '<div class="wc-rank-list"></div>'
                + '</div>';

            container.querySelector('.wc-tabs-track').addEventListener('click', function(e) {
                var b = e.target.closest('.wc-view-btn');
                if (b) renderView(b.dataset.view);
            });
            container.querySelector('.wc-regen-btn').addEventListener('click', function() {
                var canvas = container.querySelector('#wc-canvas');
                var d = data(container._currentView);
                var shuffled = d.words.slice().sort(function(a, b) {
                    return a.count !== b.count ? b.count - a.count : Math.random() - 0.5;
                });
                drawWordCloud(canvas, shuffled);
            });
        }

        renderView(cur);
    };

})();
