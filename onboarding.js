(function() {
    var TI_AVATAR_KEY = 'tiSettings_showAvatar';
    var TI_TEXT_KEY = 'tiSettings_customText';
    var tiShowAvatar = localStorage.getItem(TI_AVATAR_KEY) !== 'false';
    var tiCustomText = localStorage.getItem(TI_TEXT_KEY) || '';

    function applyTiAvatarVisibility() {
        var avatarEl = document.getElementById('typing-indicator-avatar');
        if (!avatarEl) return;
        avatarEl.style.display = tiShowAvatar ? '' : 'none';
    }

    function getTiLabel() {
        if (tiCustomText) return tiCustomText;
        var name = (window.settings && settings.partnerName) ? settings.partnerName : '對方';
        return name + ' 正在輸入';
    }

    function updatePreview() {
        var previewText = document.getElementById('ti-preview-text');
        var previewAvatar = document.getElementById('ti-preview-avatar');
        if (previewText) previewText.textContent = getTiLabel();
        if (previewAvatar) previewAvatar.style.display = tiShowAvatar ? '' : 'none';
        var label = document.getElementById('typing-indicator-label');
        if (label && label.textContent) label.textContent = getTiLabel();
        var actualAvatar = document.getElementById('typing-indicator-avatar');
        if (actualAvatar) actualAvatar.style.display = tiShowAvatar ? '' : 'none';
    }

    function syncPillUI() {
        var row = document.getElementById('ti-avatar-toggle');
        if (!row) return;
        if (tiShowAvatar) {
            row.classList.add('active');
        } else {
            row.classList.remove('active');
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        applyTiAvatarVisibility();
    });

    var _origSetLabel = null;
    function patchTypingLabel() {
        var label = document.getElementById('typing-indicator-label');
        if (label && tiCustomText) {
            label.textContent = tiCustomText;
        }
    }
    var labelEl = null;
    function initLabelObserver() {
        labelEl = document.getElementById('typing-indicator-label');
        if (!labelEl || labelEl._tiObserved) return;
        labelEl._tiObserved = true;
        var obs = new MutationObserver(function() {
            if (tiCustomText && labelEl.textContent !== tiCustomText) {
                labelEl.textContent = tiCustomText;
            }
        });
        obs.observe(labelEl, { childList: true, characterData: true, subtree: true });
    }
    setTimeout(initLabelObserver, 1000);

    document.addEventListener('click', function(e) {
        var ti = e.target.closest('.typing-indicator');
        if (!ti) return;
        e.stopPropagation();
        initLabelObserver();
        var modal = document.getElementById('ti-settings-modal');
        if (!modal) return;
        var input = document.getElementById('ti-text-input');
        if (input) input.value = tiCustomText;
        syncPillUI();
        updatePreview();
        var partnerImg = document.querySelector('#partner-info .message-avatar img') ||
                         document.querySelector('.partner-avatar img') ||
                         document.querySelector('[id*="partner"] img');
        var previewAvatar = document.getElementById('ti-preview-avatar');
        if (previewAvatar && partnerImg) {
            previewAvatar.innerHTML = '<img src="' + partnerImg.src + '" style="width:100%;height:100%;object-fit:cover;">';
        }
        modal.classList.add('open');
    });

    document.addEventListener('click', function(e) {
        var modal = document.getElementById('ti-settings-modal');
        if (!modal || !modal.classList.contains('open')) return;
        if (e.target === modal) modal.classList.remove('open');
    });
    document.addEventListener('click', function(e) {
        if (e.target.id === 'ti-settings-close-btn') {
            var modal = document.getElementById('ti-settings-modal');
            if (modal) modal.classList.remove('open');
        }
    });

    document.addEventListener('click', function(e) {
        var row = e.target.closest('#ti-avatar-toggle');
        if (!row) return;
        tiShowAvatar = !tiShowAvatar;
        localStorage.setItem(TI_AVATAR_KEY, tiShowAvatar);
        syncPillUI();
        updatePreview();
        applyTiAvatarVisibility();
    });

    document.addEventListener('click', function(e) {
        if (e.target.id !== 'ti-text-save-btn') return;
        var input = document.getElementById('ti-text-input');
        if (!input) return;
        tiCustomText = input.value.trim();
        localStorage.setItem(TI_TEXT_KEY, tiCustomText);
        updatePreview();
        e.target.textContent = '已儲存 ✓';
        setTimeout(function() { e.target.textContent = '儲存'; }, 1200);
    });

    document.addEventListener('click', function(e) {
        if (e.target.id !== 'ti-text-reset-btn') return;
        tiCustomText = '';
        localStorage.removeItem(TI_TEXT_KEY);
        var input = document.getElementById('ti-text-input');
        if (input) input.value = '';
        updatePreview();
    });

    document.addEventListener('DOMContentLoaded', function() { syncPillUI(); });
    setTimeout(syncPillUI, 800);
})();


(function() {
    var PLEDGE_KEY = 'splashPledgeSigned_v5';
    var TOTAL = 7;
    var PLEDGE_TEXT = '我絕不盈利、造謠、污衊或嘲諷，並對自己的使用行為負完全責任';
    var CHAPTERS = ['字卡', '謠言', '盈利', '看法', '通話', '年齡', '承諾'];
    var cur = 0;

    function initSplash() {
        var splash = document.getElementById('splash-declaration');
        if (!splash) return;

        localStorage.removeItem('splashPledgeSigned_v4');
        localStorage.removeItem('splashPledgeSigned_v3');
        localStorage.removeItem('splashPledgeSigned_v2');
        localStorage.removeItem('splashPledgeSigned_v1');
        localStorage.removeItem('splashPledgeSigned');

        if (localStorage.getItem(PLEDGE_KEY) === 'true') {
            splash.style.display = 'none';
            return;
        }

        var chaptersEl = document.getElementById('splash-chapters');
        if (chaptersEl) {
            var html = '';
            for (var d = 0; d < TOTAL; d++) {
                html += '<button type="button" class="splash-chapter'+(d===0?' active':'')+'" data-chapter="'+d+'">'+CHAPTERS[d]+'</button>';
            }
            chaptersEl.innerHTML = html;
            chaptersEl.addEventListener('click', function(e) {
                var btn = e.target.closest('.splash-chapter');
                if (btn) goTo(parseInt(btn.getAttribute('data-chapter'), 10));
            });
        }

        var prevBtn   = document.getElementById('splash-prev-btn');
        var nextBtn   = document.getElementById('splash-next-btn');
        var enterBtn  = document.getElementById('splash-enter-btn');
        var pledgeInp = document.getElementById('splash-pledge-input');

        if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (cur > 0) goTo(cur - 1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (cur < TOTAL - 1) goTo(cur + 1);
            });
        }
        if (enterBtn) {
            enterBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (enterBtn.classList.contains('ready')) enterSite();
            });
        }
        if (pledgeInp) {
            pledgeInp.addEventListener('input', function() {
                var val = pledgeInp.value;
                var hint = document.getElementById('splash-pledge-hint');
                var _n = function (x) { return String(x).replace(/\s+/g, '').replace(/汙/g, '污').replace(/[，,]/g, '，'); };
                if (_n(val) === _n(PLEDGE_TEXT) || _n(val) === _n('我绝不盈利、造谣、污蔑或嘲讽，并对自己的使用行为负完全责任')) {
                    pledgeInp.classList.add('correct');
                    if (hint) { hint.textContent = '✓ 承諾已確認，可以進入了'; hint.className = 'splash-pledge-hint ok'; }
                    if (enterBtn) {
                        enterBtn.classList.add('ready');
                        enterBtn.disabled = false;
                    }
                } else {
                    pledgeInp.classList.remove('correct');
                    if (hint) { hint.textContent = '請完整輸入上方承諾後方可進入'; hint.className = 'splash-pledge-hint'; }
                    if (enterBtn) {
                        enterBtn.classList.remove('ready');
                        enterBtn.disabled = true;
                    }
                }
            });
            pledgeInp.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && enterBtn && enterBtn.classList.contains('ready')) {
                    enterSite();
                }
            });
        }

        updateUI();
    }

    function goTo(idx) {
        var slides = document.querySelectorAll('.splash-slide');
        var chapters = document.querySelectorAll('.splash-chapter');
        var prevIdx = cur;
        if (idx === prevIdx) return;

        if (slides[prevIdx]) {
            slides[prevIdx].classList.remove('active');
            slides[prevIdx].classList.add('exit-left');
            var exitEl = slides[prevIdx];
            setTimeout(function() { exitEl.classList.remove('exit-left'); }, 420);
        }

        cur = idx;

        if (slides[cur]) {
            slides[cur].classList.add('active');
        }

        chapters.forEach(function(btn, i) {
            btn.classList.toggle('active', i === cur);
            btn.classList.toggle('done', i < cur);
        });

        var activeChapter = chapters[cur];
        if (activeChapter && activeChapter.scrollIntoView) {
            activeChapter.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        var main = document.querySelector('.splash-letter-main');
        if (main) main.scrollTop = 0;

        updateUI();

        if (cur === TOTAL - 1) {
            setTimeout(function() {
                var inp = document.getElementById('splash-pledge-input');
                if (inp) inp.focus();
            }, 450);
        }
    }

    function updateUI() {
        var prevBtn  = document.getElementById('splash-prev-btn');
        var nextBtn  = document.getElementById('splash-next-btn');
        var enterBtn = document.getElementById('splash-enter-btn');
        var pageNum  = document.getElementById('splash-page-num');
        var fill     = document.getElementById('splash-progress-fill');

        if (pageNum) pageNum.textContent = (cur + 1) + ' / ' + TOTAL;
        if (fill) fill.style.width = ((cur + 1) / TOTAL * 100) + '%';
        if (prevBtn) { prevBtn.disabled = (cur === 0); }
        if (cur === TOTAL - 1) {
            if (nextBtn)  nextBtn.style.display  = 'none';
            if (enterBtn) enterBtn.style.display = '';
        } else {
            if (nextBtn)  nextBtn.style.display  = '';
            if (enterBtn) enterBtn.style.display = 'none';
        }
    }

    function enterSite() {
        localStorage.setItem(PLEDGE_KEY, 'true');
        var splash = document.getElementById('splash-declaration');
        if (splash) {
            splash.classList.add('splash-fade-out');
            setTimeout(function() { splash.style.display = 'none'; }, 900);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSplash);
    } else {
        initSplash();
    }
})();

const tourOverlay = document.getElementById('tour-overlay');
const tourPopover = document.getElementById('tour-popover');
const tourHighlightBox = document.getElementById('tour-highlight-box');
const tourTitle = document.getElementById('tour-title');
const tourContent = document.getElementById('tour-content');
const tourStepCounter = document.getElementById('tour-step-counter');
const tourNextBtn = document.getElementById('tour-next-btn');
const tourPrevBtn = document.getElementById('tour-prev-btn');
const tourSkipBtn = document.getElementById('tour-skip-btn');


let currentTourStep = 0;
let isTourActive = false;

const tourSteps = [
    {
        title: "✨ 歡迎來到「傳訊」",
        content: "這裡是你們專屬的私密空間。<br><br>這個教程共 <b>20 步</b>，帶你從頭到尾認識每一個功能，建議完整看完哦🥺<br><br>點選「下一步」開始吧！",
        position: 'center'
    },
    {
        element: '#my-avatar',
        title: "📷 你的頭像",
        content: "這是<b>你的頭像</b>。<br><br>點選它可以上傳圖片作為你的頭像。",
        position: 'bottom'
    },
    {
        element: '#my-name',
        title: "✏️ 你的暱稱",
        content: "這裡顯示的是<b>你的名字</b>。<br><br>點選名字可以直接修改。",
        position: 'bottom'
    },
    {
        element: '#my-status-container',
        title: "💬 你的狀態簽名",
        content: "這裡是你的<b>狀態簽名</b>。<br><br>點選可以編輯，一般而言對方是能看見的哦～",
        position: 'bottom'
    },
    {
        element: '#partner-avatar',
        title: "Ta 的頭像",
        content: "這裡是<b>夢角的頭像</b>，同樣點選可以上傳更換。",
        position: 'bottom'
    },
    {
        element: '#partner-name',
        title: "Ta 的暱稱",
        content: "這是<b>夢角的暱稱</b>，同樣點選可以修改。",
        position: 'bottom'
    },
    {
        element: '.header-motto',
        title: "🌸 頂部格言",
        content: "這裡顯示著格言～自定義回覆裡可修改。",
        position: 'bottom'
    },
    {
        element: '#message-input',
        title: "⌨️ 訊息輸入框",
        content: "在這裡<b>輸入你想說的話</b>，按回車鍵或點選右邊的傳送按鈕就能發出去。",
        position: 'top'
    },
    {
        element: '#send-btn',
        title: "🚀 傳送訊息",
        content: "點選這個<b>紙飛機按鈕</b>就能傳送訊息。<br><br>傳送後對方會在幾秒內給你回覆，你可以在「聊天設定」裡調整回覆的速度快慢哦。",
        position: 'top'
    },
    {
        element: '#attachment-btn',
        title: "🖼️ 傳送圖片 / 表情包",
        content: "點選這裡可以<b>傳送圖片</b>，支援相簿圖片和表情包。<br><br>你還可以在「高階功能 → 回覆庫」中上傳自定義的表情，到時候對方也會發給你！",
        position: 'top'
    },
    {
        element: '#poke-btn',
        title: "👋 拍一拍互動",
        content: "這是「<b>拍一拍</b>」功能，發出後會顯示一條互動訊息，比如「輕拍了你一下」。<br><br>可以在「高階功能 → 自定義拍一拍」裡新增更多的動作！",
        position: 'top'
    },
    {
        element: '#continue-btn',
        title: "讓 Ta 繼續說",
        content: "不知道說什麼了？或者想讓 Ta 多說幾句？<br><br>點選這個按鈕，<b>夢角會主動找你說話。",
        position: 'top'
    },
    {
        element: '#batch-btn',
        title: "📦 批次傳送模式",
        content: "開啟<b>批次模式</b>後，你可以先寫好多條訊息，再一次性全部發出去<br><br>點選按鈕開啟，編輯完成後再次點選「傳送全部」即可。",
        position: 'top'
    },
    {
        element: '#settings-btn',
        title: "⚙️ 設定中心",
        content: "所有個性化配置都在這個<b>設定按鈕</b>裡，我們點進去看一下！<br>",
        position: 'bottom',
        onBefore: () => { if (isTourActive) document.querySelectorAll('.modal').forEach(m => hideModal(m)); }
    },
    {
        element: '#appearance-settings',
        title: "🎨 外觀設定",
        content: "<b>外觀設定</b>裡可以：<br>• 切換 10 款主題配色（金/藍/粉…）<br>• 調整字型大小<br>• 更換聊天背景圖<br>• 自定義氣泡樣式 CSS<br>",
        position: 'bottom',
        onBefore: () => { if (isTourActive) showModal(DOMElements.settingsModal.modal); }
    },
    {
        element: '#chat-settings',
        title: "💬 聊天設定",
        content: "<b>聊天設定</b>裡可以調整：<br>• 訊息音效開關<br>• 已讀回執顯示<br>• 對方回覆速度（快/慢）<br>• 訊息氣泡樣式（圓角/方形）",
        position: 'bottom'
    },
    {
        element: '#advanced-settings',
        title: "🚀 高階功能 — 必看！",
        content: "<b>高階功能</b>是整個應用最強大的板塊，裡面有：<br>• <b>心晴手帳</b>：記錄每天的心情<br>• <b>信封投遞</b>：給夢角寫一封信<br>• <b>紀念日</b>：倒計時 / 紀念天數<br>• <b>運勢占卜</b>：每日運勢<br>• <b>自定義回覆</b>：讓夢角說你想聽的話<br>• <b>音樂播放器</b>：背景音樂",
        position: 'bottom'
    },
    {
        element: '#data-settings',
        title: "💾 資料管理",
        content: "<b>資料管理</b>裡可以：<br>• 匯出聊天記錄（備份到本地）<br>• 匯入之前備份的記錄<br>• 檢視儲存空間佔用<br>• 開啟後臺訊息通知推送<br>• 重置所有資料<br>• 重放本教程",
        position: 'top'
    },
    {
        element: '#theme-toggle',
        title: "🌙 日 / 夜模式切換",
        content: "這個按鈕可以快速<b>切換白天 / 夜晚</b>模式。<br><br>夜晚模式下整體變成深色背景，對眼睛更友好，睡前聊天必備！✨",
        position: 'bottom',
        onBefore: () => { if (isTourActive) hideModal(DOMElements.settingsModal.modal); }
    },
    {
        element: '#favorites-btn',
        title: "⭐ 收藏夾",
        content: "長按或點選一條訊息，會彈出操作選單，可以把訊息<b>收藏</b>起來。<br><br>所有收藏的訊息都會儲存在這個收藏夾裡，隨時可以翻閱回味～",
        position: 'bottom'
    },
    {
        element: '#session-manager-btn',
        title: "📂 會話管理",
        content: "你可以建立<b>多個獨立的聊天會話</b>，每個會話都有獨立的聊天記錄。<br>",
        position: 'bottom'
    },
    {
        title: "✋ 訊息操作提示",
        content: "點選任意一條訊息，會出現操作選單：<br>• ⭐ <b>收藏</b>：儲存到收藏夾<br>• ↩️ <b>回覆</b>：引用這條訊息回覆<br>• 📝 <b>註釋</b>：給訊息新增備註<br>• 🗑️ <b>刪除</b>：刪除這條訊息",
        position: 'center'
    },
    {
        title: "🎉 你已掌握所有功能！",
        content: "恭喜你完成了新手引導！現在你已經瞭解了「傳訊」的全部功能。<br><br>希望你們在這裡收穫滿滿的愛與幸福 🥺💕",
        position: 'center'
    }
];

function startTour() {
    isTourActive = true;
    tourOverlay.style.display = 'block';
    setTimeout(() => tourOverlay.classList.add('active'), 10);
    currentTourStep = 0;
    showTourStep(currentTourStep);
}

function endTour() {
    isTourActive = false;
    tourOverlay.classList.remove('active');
    tourPopover.classList.remove('visible');
    setTimeout(() => {
        tourOverlay.style.display = 'none';
        tourHighlightBox.style.width = '0px';
        tourHighlightBox.style.height = '0px';
        tourHighlightBox.style.opacity = '0';
    }, 300);
    localforage.setItem(APP_PREFIX + 'tour_seen', 'true');
    document.querySelectorAll('.modal').forEach(m => hideModal(m));
    setTimeout(function() {
        if (typeof window.tryShowDailyGreeting === 'function') {
            window.tryShowDailyGreeting();
        }
    }, 900);
}

function showTourStep(index) {
    if (index < 0 || index >= tourSteps.length) {
        endTour();
        return;
    }
    const step = tourSteps[index];
    if (step.onBefore) {
        step.onBefore();
    }
    setTimeout(() => {
        tourTitle.textContent = step.title;
        tourContent.innerHTML = step.content;
        tourStepCounter.textContent = `${index + 1} / ${tourSteps.length}`;
        tourPopover.classList.remove('visible');
        tourPrevBtn.style.visibility = (index === 0) ? 'hidden' : 'visible';
        if (index === tourSteps.length - 1) {
            tourNextBtn.innerHTML = '完成 <i class="fas fa-check"></i>';
        } else {
            tourNextBtn.innerHTML = '下一步 <i class="fas fa-arrow-right"></i>';
        }
        const targetElement = step.element ? document.querySelector(step.element) : null;
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            tourHighlightBox.style.width = `${rect.width + 10}px`;
            tourHighlightBox.style.height = `${rect.height + 10}px`;
            tourHighlightBox.style.top = `${rect.top - 5}px`;
            tourHighlightBox.style.left = `${rect.left - 5}px`;
            tourHighlightBox.style.opacity = '1';
            positionPopover(rect, step.position);
        } else {
            tourHighlightBox.style.opacity = '0';
            tourHighlightBox.style.width = '0px';
            tourHighlightBox.style.height = '0px';
            tourPopover.style.top = '50%';
            tourPopover.style.left = '50%';
            tourPopover.style.transform = 'translate(-50%, -50%)';
        }
        setTimeout(() => tourPopover.classList.add('visible'), 50);
    }, (step.onBefore ? 400 : 0));
}

function positionPopover(rect, position) {
    const popoverRect = tourPopover.getBoundingClientRect();
    const spacing = 15;
    let top, left;
    switch (position) {
        case 'top':
            top = rect.top - popoverRect.height - spacing;
            left = rect.left + (rect.width / 2) - (popoverRect.width / 2);
            break;
        case 'bottom':
            top = rect.bottom + spacing;
            left = rect.left + (rect.width / 2) - (popoverRect.width / 2);
            break;
        case 'left':
            top = rect.top + (rect.height / 2) - (popoverRect.height / 2);
            left = rect.left - popoverRect.width - spacing;
            break;
        case 'right':
            top = rect.top + (rect.height / 2) - (popoverRect.height / 2);
            left = rect.right + spacing;
            break;
        default:
            top = '50%';
            left = '50%';
            tourPopover.style.transform = 'translate(-50%, -50%)';
            tourPopover.style.top = top;
            tourPopover.style.left = left;
            return;
    }
    if (top < 10) top = 10;
    if (left < 10) left = 10;
    if (left + popoverRect.width > window.innerWidth - 10) {
        left = window.innerWidth - popoverRect.width - 10;
    }
    if (top + popoverRect.height > window.innerHeight - 10) {
        top = window.innerHeight - popoverRect.height - 10;
    }
    tourPopover.style.top = `${top}px`;
    tourPopover.style.left = `${left}px`;
    tourPopover.style.transform = 'none';
}

function nextTourStep() {
    currentTourStep++;
    showTourStep(currentTourStep);
}

async function createNewSession(switchToIt = true) {
    const newId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const newSession = {
        id: newId,
        name: `會話 ${new Date().toLocaleDateString()}`,
        createdAt: Date.now()
    };

    sessionList.push(newSession);
    await localforage.setItem(`${APP_PREFIX}sessionList`, sessionList);

    if (switchToIt) {
        window.location.hash = newId;
        window.location.reload();
    }
    
    return newId;
}

window.selectAnnType = function(type) {
    currentAnniversaryType = type;
    currentAnnType = type; 
    document.querySelectorAll('.anniversary-type-btn').forEach(btn => {
        if(btn.dataset.type === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    const hint = document.getElementById('ann-type-desc');
    if(hint) {
        hint.textContent = type === 'anniversary' 
            ? '計算從過去某一天到現在已經過了多少天 (例如: 戀愛紀念日)' 
            : '計算從現在到未來某一天還剩下多少天 (例如: 對方生日)';
    }
};

window.deleteAnniversary = function(id, event) {
    if(event) event.stopPropagation();
    
    if(confirm('確定要刪除這個紀念日嗎？')) {
        anniversaries = anniversaries.filter(a => a.id !== id);
        throttledSaveData();
        renderAnniversariesList();
        showNotification('紀念日已刪除', 'success');
    }
};

let activeAnnId = null;

async function fillAnnHeaderCard(ann) {
    const headerCard = document.getElementById('ann-header-card');
    const toolbar = document.getElementById('ann-card-toolbar');
    if (!ann || !headerCard) return;

    activeAnnId = ann.id;
    headerCard.style.display = 'block';
    if (toolbar) toolbar.style.display = 'flex';

    const now = new Date();
    const isCountdown = ann.type === 'countdown';
    const targetDate = new Date(ann.date);
    let diffDays;
    if (isCountdown) {
        diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) diffDays = 0;
    } else {
        diffDays = Math.floor((now - targetDate) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) diffDays = 0;
    }

    const iconEl = document.getElementById('ann-header-icon');
    const labelEl = document.getElementById('ann-header-label');
    if (iconEl) iconEl.textContent = isCountdown ? '♡' : '♥';
    if (labelEl) labelEl.textContent = isCountdown ? 'COUNTDOWN' : 'ANNIVERSARY';
    document.getElementById('ann-header-title').textContent = ann.name;
    document.getElementById('ann-header-date').textContent = ann.date;
    const daysEl = document.getElementById('ann-header-days');
    daysEl.innerHTML = `${diffDays.toLocaleString('zh-CN')}<span class="ann-header-days-unit">${isCountdown ? '天后' : '天'}</span>`;

    const milestonesEl = document.getElementById('ann-header-milestones');
    if (milestonesEl) {
        milestonesEl.innerHTML = '';
        milestonesEl.style.display = 'none';
    }

    const titleEl = document.getElementById('ann-header-title');
    if (titleEl) titleEl.style.display = 'none';
    const labelEl2 = document.getElementById('ann-header-label');
    if (labelEl2) labelEl2.style.display = 'none';
    const dateEl = document.getElementById('ann-header-date');
    if (dateEl) dateEl.style.display = 'none';

    const dataMilestonesEl = document.getElementById('ann-data-milestones');
    if (dataMilestonesEl) {
        const chips = [];
        const pushChip = (t) => chips.push(`<span class="ann-milestone-chip">${t}</span>`);

        if (!isCountdown) {
            if (diffDays > 0 && diffDays < 100) {
                pushChip(`💫 距 100 天還有 ${100 - diffDays} 天`);
            }
            const centPassed = Math.floor(diffDays / 100) * 100;
            if (centPassed > 0) pushChip(`🎉 已到第 ${centPassed} 天`);

            const yearsPassed = Math.floor(diffDays / 365);
            if (yearsPassed > 0) pushChip(`🎊 已過 ${yearsPassed} 週年`);

            if (diffDays >= 100 && diffDays < 365) {
                const nextCent = 100 * (Math.floor(diffDays / 100) + 1);
                pushChip(`⏳ 距下一段百天還有 ${nextCent - diffDays} 天`);
            }
        } else {
            const daysLeft = diffDays;
            if (daysLeft > 0 && daysLeft < 100) {
                pushChip(`⏳ 距 100 天還有 ${100 - daysLeft} 天`);
            }
            if (daysLeft >= 100) {
                const nextCent = 100 * Math.ceil(daysLeft / 100);
                pushChip(`🎉 達到第 ${nextCent} 天段`);
            }
            const yearsLeft = Math.floor(daysLeft / 365);
            if (yearsLeft > 0) pushChip(`🎊 距 ${yearsLeft} 年段還有…`);
        }

        dataMilestonesEl.innerHTML = chips.join('') || `<span style="font-size:12px;opacity:0.65;color:var(--text-secondary);">—</span>`;
    }

    const bgEl = document.getElementById('ann-header-card-bg');
    if (bgEl) {
        const savedBg = await localforage.getItem(getStorageKey(`annHeaderBg_${ann.id}`));
        bgEl.style.backgroundImage = savedBg ? `url(${savedBg})` : '';
    }

    document.querySelectorAll('.ann-item-card').forEach(el => el.classList.remove('ann-item-active'));
    const activeEl = document.querySelector(`.ann-item-card[data-ann-id="${ann.id}"]`);
    if (activeEl) activeEl.classList.add('ann-item-active');
}

function renderAnniversariesList() {
    const listContainer = document.getElementById('ann-list-container');
    const headerCard = document.getElementById('ann-header-card');
    const toolbar = document.getElementById('ann-card-toolbar');
    
    if (!listContainer) return;
    listContainer.innerHTML = '';

    anniversaries.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (anniversaries.length === 0) {
        if (headerCard) headerCard.style.display = 'none';
        if (toolbar) toolbar.style.display = 'none';
        const dataTabs = document.getElementById('ann-data-tabs');
        const dataPanel = document.getElementById('ann-data-panel');
        if (dataTabs) dataTabs.style.display = 'none';
        if (dataPanel) dataPanel.style.display = 'none';
        listContainer.innerHTML = `
            <div class="ann-empty">
                <div class="ann-empty-icon">💝</div>
                <p>還沒有紀念日<br>去新增一個屬於你們的日子吧~</p>
            </div>`;
        return;
    }

    const now = new Date();
    const defaultAnn = anniversaries.find(a => a.type === 'anniversary') || anniversaries[0];
    fillAnnHeaderCard(defaultAnn);
    const dataTabs = document.getElementById('ann-data-tabs');
    const dataPanel = document.getElementById('ann-data-panel');
    if (dataTabs) dataTabs.style.display = 'flex';
    if (dataPanel) dataPanel.style.display = 'none';

    anniversaries.forEach(ann => {
        const targetDate = new Date(ann.date);
        let diffDays = 0;
        let typeClass = '';
        let typeLabel = '';
        let dayLabel = '';

        if (ann.type === 'countdown') {
            typeClass = 'type-future';
            typeLabel = '倒數';
            dayLabel = '天后';
            diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
            if(diffDays < 0) diffDays = 0;
        } else {
            typeClass = 'type-past';
            typeLabel = '已過';
            dayLabel = '天';
            diffDays = Math.floor((now - targetDate) / (1000 * 60 * 60 * 24));
        }

        const formattedDays = diffDays.toLocaleString('zh-CN');

        const html = `
            <div class="ann-item-card ${typeClass}" data-ann-id="${ann.id}" onclick="selectAnnCard(${ann.id})" style="cursor:pointer;" title="起始日：${ann.date}">
                <div class="ann-item-left">
                    <div class="ann-item-name">
                        ${ann.name}
                        <span class="ann-tag">${typeLabel}</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center;">
                    <div class="ann-item-right">
                        <div class="ann-item-days">${formattedDays}</div>
                        <div class="ann-item-days-unit">${dayLabel}</div>
                    </div>
                    <div class="ann-delete-btn" onclick="event.stopPropagation(); deleteAnniversaryItem(${ann.id})">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', html);
    });
}

window.selectAnnCard = function(id) {
    const ann = anniversaries.find(a => a.id === id);
    if (ann) fillAnnHeaderCard(ann);
};

window.clearAnnCardBg = async function() {
    if (!activeAnnId) return;
    await localforage.removeItem(getStorageKey(`annHeaderBg_${activeAnnId}`));
    const bgEl = document.getElementById('ann-header-card-bg');
    if (bgEl) bgEl.style.backgroundImage = '';
    showNotification('封面圖已清除', 'success');
};

window.switchAnnDataTab = function(tab) {
    const panel = document.getElementById('ann-data-panel');
    const cardBtn = document.getElementById('ann-tab-card');
    const dataBtn = document.getElementById('ann-tab-data');
    if (!panel || !cardBtn || !dataBtn) return;
    const showData = tab === 'data';
    panel.style.display = showData ? 'block' : 'none';
    // 保持按鈕配色不變，用透明度表達當前頁
    cardBtn.style.opacity = showData ? '0.75' : '1';
    dataBtn.style.opacity = showData ? '1' : '0.75';
};


function initAnniversaryModule() {
    const entryBtn = document.getElementById('anniversary-function');
    
    if (entryBtn) {
        const newBtn = entryBtn.cloneNode(true);
        entryBtn.parentNode.replaceChild(newBtn, entryBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('重要日按鈕被點選');
            
            const advancedModal = document.getElementById('advanced-modal');
            const annModal = document.getElementById('anniversary-modal');
            
            if (advancedModal) hideModal(advancedModal);
            renderAnniversariesList();
                if (typeof window.switchAnnDataTab === 'function') window.switchAnnDataTab('card');
            if (annModal) showModal(annModal);
        });
    }

    const closeBtn = document.getElementById('close-anniversary-modal');
    if (closeBtn) {
        const newClose = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newClose, closeBtn);
        newClose.addEventListener('click', () => hideModal(document.getElementById('anniversary-modal')));
    }

    const openAddBtn = document.getElementById('open-ann-add-btn');
    const editorSlide = document.getElementById('ann-editor-slide');
    if (openAddBtn) {
        openAddBtn.onclick = () => {
            document.getElementById('ann-input-name').value = '';
            document.getElementById('ann-input-date').value = '';
            window.selectAnnType('anniversary');
            if (editorSlide) editorSlide.classList.add('active');
        };
    }

    const closeEditorBtn = document.getElementById('close-ann-editor');
    if (closeEditorBtn) {
        closeEditorBtn.onclick = () => {
            if (editorSlide) editorSlide.classList.remove('active');
        };
    }

    const saveBtn = document.getElementById('save-ann-btn');
    if (saveBtn) {
        const newSave = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSave, saveBtn);
        
        newSave.addEventListener('click', () => {
            addAnniversary(); 
            if (editorSlide) editorSlide.classList.remove('active');
        });
    }

    const annBgInput = document.getElementById('ann-header-bg-input');
    if (annBgInput) {
        annBgInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!activeAnnId) { showNotification('請先選擇一個紀念日', 'warning'); return; }
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const dataUrl = ev.target.result;
                const bgEl = document.getElementById('ann-header-card-bg');
                if (bgEl) bgEl.style.backgroundImage = `url(${dataUrl})`;
                await localforage.setItem(getStorageKey(`annHeaderBg_${activeAnnId}`), dataUrl);
                showNotification('封面圖已更新 ', 'success');
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        });
    }
}
function prevTourStep() {
    currentTourStep--;
    showTourStep(currentTourStep);
}

function setupTutorialListeners() {
    tourNextBtn.addEventListener('click', nextTourStep);
    tourPrevBtn.addEventListener('click', prevTourStep);
    tourSkipBtn.addEventListener('click', endTour);

    const replayBtn = document.getElementById('replay-tutorial-btn');
    if(replayBtn) {
        replayBtn.addEventListener('click', () => {
            hideModal(DOMElements.dataModal.modal);
            setTimeout(() => {
                if (confirm('確定要重新開始新手引導教程嗎？')) {
                    startTour();
                }
            }, 300);
        });
    }
}


