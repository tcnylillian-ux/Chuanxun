/*應用常量與資料結構*/

        const APP_PREFIX = 'CHAT_APP_V3_';
        const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
        const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
        const MESSAGES_PER_PAGE = 50;
        
        const CONSTANTS = {
            HEADER_MOTTOS: [],
            WELCOME_ANIMATIONS: [{
                line1: "♡ 愛 ♡",
                line2: "✧ 正在連線我們的思緒 ✧"
            },
                {
                    line1: "𝑳𝒐𝒗𝒆",
                    line2: "若要由我來談論愛的話"
                },
                {
                    line1: "𝕰𝖈𝖍𝖔",
                    line2: "聽見我的迴音了嗎？"
                },
                {
                    line1: "𝚂𝚘𝚞𝚕𝚖𝚊𝚝𝚎",
                    line2: "靈魂正在共振"
                },
                {
                    line1: "Akashic Eye",
                    line2: "連結已建立"
                },
                {
                    line1: "✦ 相遇 ✦",
                    line2: "在萬千人海中遇見你"
                },
                {
                    line1: "詩篇",
                    line2: "為你寫下的每一行詩"
                },
                {
                    line1: "Melody",
                    line2: "心跳的旋律為你奏響"
                },
                {
                    line1: "Destiny",
                    line2: "命運的紅線將我們相連"
                },
                {
                    line1: "Memory",
                    line2: "創造屬於我們的回憶"
                },
                {
                    line1: "言葉",
                    line2: "想傳達給你的話語"
                },
                {
                    line1: "絆",
                    line2: "看不見的羈絆"
                },
                {
                    line1: "未來",
                    line2: "一起走向的未來"
                },
                {
                    line1: "希望",
                    line2: "你就是我的希望"
                },
                {
                    line1: "光",
                    line2: "你是我生命中的光"
                },
                {
                    line1: "Amore",
                    line2: "心跳漏拍的那一秒"
                },
                {
                    line1: "共振",
                    line2: "頻率相同的兩個靈魂"
                },
                {
                    line1: "∞",
                    line2: "無限迴圈的思念"
                },
                {
                    line1: "Serendipity",
                    line2: "最美麗的意外"
                },
                {
                    line1: "浮世",
                    line2: "沉浮人世間的溫柔"
                },
                {
                    line1: "量子糾纏",
                    line2: "超越距離的默契"
                },
                {
                    line1: "Elysian",
                    line2: "與你共度的理想鄉"
                },
                {
                    line1: "星軌",
                    line2: "交匯時互放的光亮"
                },
                {
                    line1: "虹色",
                    line2: "折射出所有的可能"
                },
                {
                    line1: "Paracosm",
                    line2: "共同構建的私宇宙"
                },
                {
                    line1: "潮汐",
                    line2: "因你而起的律動"
                },
                {
                    line1: "Æther",
                    line2: "瀰漫在空氣中的悸動"
                },
                {
                    line1: "雙星",
                    line2: "彼此環繞的永恆舞蹈"
                },
                {
                    line1: "緋色",
                    line2: "染上臉頰的溫度"
                },
                {
                    line1: "Symphony",
                    line2: "生命交織的樂章"
                },
                {
                    line1: "經緯",
                    line2: "註定相遇的座標"
                },
                {
                    line1: "Nebula",
                    line2: "朦朧而璀璨的心事"
                },
                {
                    line1: "時雨",
                    line2: "恰到好處的溫柔"
                },
                {
                    line1: "Event Horizon",
                    line2: "再也無法逃離的引力"
                },
                {
                    line1: "花火",
                    line2: "剎那即永恆的光芒"
                },
                {
                    line1: "ℰ𝓉𝑒𝓇𝓃𝒶𝓁",
                    line2: "時間停駐的此刻"
                },
                {
                    line1: "韶光",
                    line2: "與你共度的每寸光陰"
                },
                {
                    line1: "𝒮𝓊𝓂𝓂𝑒𝓇",
                    line2: "永不結束的盛夏"
                },
                {
                    line1: "星霜",
                    line2: "共同經歷的歲月"
                },
                {
                    line1: "𝓚𝓲𝓼𝓼",
                    line2: "未說出口的告白"
                },
                {
                    line1: "月下",
                    line2: "兩人獨處的夜晚"
                },
                {
                    line1: "𝓕𝓸𝓻𝓮𝓿varepsilon𝓻",
                    line2: "想要延續的永遠"
                },
                {
                    line1: "朝露",
                    line2: "晶瑩剔透的真心"
                },
                {
                    line1: "𝓜𝓲𝓻𝓪𝓬𝓵𝓮",
                    line2: "你就是奇蹟本身"
                },
                {
                    line1: "春風",
                    line2: "輕輕拂過的溫柔"
                },
                {
                    line1: "𝓛𝓾𝓬𝓴𝔂",
                    line2: "此生最大的幸運"
                },
                {
                    line1: "螢火",
                    line2: "黑暗中指引的光"
                },
                {
                    line1: "𝓗𝓮𝓪𝓻𝓽",
                    line2: "為你跳動的心臟"
                },
                {
                    line1: "初雪",
                    line2: "純潔無瑕的愛意"
                },
                {
                    line1: "𝓒𝓸𝓶𝓮𝓽",
                    line2: "劃過天際的相遇"
                },
                {
                    line1: "潮鳴",
                    line2: "內心澎湃的聲音"
                },
                {
                    line1: "𝓢𝓽𝓪𝓻𝓭𝓾𝓼𝓽",
                    line2: "散落在身的星塵"
                },
                {
                    line1: "梧桐",
                    line2: "等待鳳凰的執著"
                },
                {
                    line1: "𝓟𝓻𝓮𝓬𝓲𝓸𝓾𝓼",
                    line2: "視若珍寶的你我"
                },
                {
                    line1: "青空",
                    line2: "澄澈如你的眼眸"
                },
                {
                    line1: "𝒜𝓂𝒶𝓇𝓃𝓉𝒽",
                    line2: "永不凋零的心意"
                },
                {
                    line1: "Étoile",
                    line2: "你是我唯一的星辰"
                },
                {
                    line1: "𝑩𝒍ü𝒕𝒆",
                    line2: "悄然綻放的戀慕"
                },
                {
                    line1: "運命",
                    line2: "避無可避的相遇"
                },
                {
                    line1: "𝑪𝒆𝒍𝒆𝒔𝒕𝒆",
                    line2: "來自天際的饋贈"
                },
                {
                    line1: "戀心",
                    line2: "藏不住的悸動"
                },
                {
                    line1: "𝑺𝒆𝒓𝒂𝒑𝒉",
                    line2: "守護你的六翼天使"
                },
                {
                    line1: "一期一會",
                    line2: "一生一次的邂逅"
                },
                {
                    line1: "𝑬𝒑𝒐𝒏𝒂",
                    line2: "穿越時空的眷戀"
                },
                {
                    line1: "月の雫",
                    line2: "月光凝成的淚滴"
                },
                {
                    line1: "𝑽𝒆𝒓𝒔𝒂𝒊𝒍𝒍𝒆𝒔",
                    line2: "為你建造的宮殿"
                },
                {
                    line1: "千夜一夜",
                    line2: "訴不盡的夜話"
                },
                {
                    line1: "𝑴𝒂𝒓é𝒆",
                    line2: "溫柔席捲的浪潮"
                },
                {
                    line1: "桃源郷",
                    line2: "只屬於兩人的樂土"
                },
                {
                    line1: "𝑺𝒐𝒖𝒇𝒇𝒍𝒆𝒓",
                    line2: "甜蜜的折磨"
                },
                {
                    line1: "桜吹雪",
                    line2: "紛飛如雪的思念"
                },
                {
                    line1: "𝑨𝒖𝒓𝒐𝒓𝒆",
                    line2: "黎明前的極光"
                },
                {
                    line1: "十六夜",
                    line2: "最圓滿的夜晚"
                },
                {
                    line1: "𝑪𝒚𝒂𝒏𝒐𝒑𝒉𝒚𝒍𝒍𝒆",
                    line2: "青澀的戀之葉"
                },
                {
                    line1: "金木犀",
                    line2: "秋日裡暗香浮動"
                },
            ],
            WELCOME_ICONS: [
                "fas fa-heart", "fas fa-star", "fas fa-moon", "fas fa-sun", "fas fa-cloud", "fas fa-feather", "fas fa-book", "fas fa-music", "fas fa-pen", "fas fa-key", "fas fa-compass", "fas fa-globe", "fas fa-leaf", "fas fa-water", "fas fa-fire", "fas fa-snowflake", "fas fa-umbrella", "fas fa-anchor", "fas fa-bell", "fas fa-gem", "fas fa-crown", "fas fa-dragon", "fas fa-feather-alt", "fas fa-fish", "fas fa-frog", "fas fa-hat-wizard", "fas fa-magic", "fas fa-ring", "fas fa-scroll", "fas fa-shield-alt", "fas fa-dove", "fas fa-cat", "fas fa-dog", "fas fa-horse", "fas fa-otter", "fas fa-paw", "fas fa-spider", "fas fa-kiwi-bird", "fas fa-crow", "fas fa-dove", "fas fa-seedling", "fas fa-tree", "fas fa-mountain", "fas fa-water", "fas fa-wind", "fas fa-volcano", "fas fa-meteor", "fas fa-satellite", "fas fa-rocket", "fas fa-user-astronaut"
            ],
            PARTNER_STATUSES: [],
            REPLY_MESSAGES: [],
            REPLY_EMOJIS: [],
            POKE_ACTIONS: [],
            TAROT_CARDS: [
                { name: "愚人", eng: "The Fool", meaning: "新的開始、冒險、天真、無畏", keyword: "流浪", icon: "fa-hiking" },
                { name: "魔術師", eng: "The Magician", meaning: "創造力、技能、意志力、化腐朽為神奇", keyword: "創造", icon: "fa-hat-wizard" },
                { name: "女祭司", eng: "The High Priestess", meaning: "直覺、潛意識、神秘、智慧", keyword: "智慧", icon: "fa-book-open" },
                { name: "女帝", eng: "The Empress", meaning: "豐饒、母性、自然、感官享受", keyword: "豐收", icon: "fa-seedling" },
                { name: "皇帝", eng: "The Emperor", meaning: "權威、結構、控制、父親形象", keyword: "支配", icon: "fa-crown" },
                { name: "教皇", eng: "The Hierophant", meaning: "傳統、信仰、教導、精神指引", keyword: "援助", icon: "fa-church" },
                { name: "戀人", eng: "The Lovers", meaning: "愛、和諧、關係、價值觀的選擇", keyword: "結合", icon: "fa-heart" },
                { name: "戰車", eng: "The Chariot", meaning: "意志力、勝利、決心、自我控制", keyword: "勝利", icon: "fa-horse-head" },
                { name: "力量", eng: "Strength", meaning: "勇氣、耐心、控制、內在力量", keyword: "意志", icon: "fa-fist-raised" },
                { name: "隱士", eng: "The Hermit", meaning: "內省、孤獨、尋求真理、指引", keyword: "探索", icon: "fa-lightbulb" },
                { name: "命運之輪", eng: "Wheel of Fortune", meaning: "迴圈、命運、轉折點、運氣", keyword: "輪迴", icon: "fa-dharmachakra" },
                { name: "正義", eng: "Justice", meaning: "公正、真理、因果、法律", keyword: "均衡", icon: "fa-balance-scale" },
                { name: "倒吊人", eng: "The Hanged Man", meaning: "犧牲、新的視角、等待、放下", keyword: "奉獻", icon: "fa-user-injured" },
                { name: "死神", eng: "Death", meaning: "結束、轉變、重生、放手", keyword: "結束", icon: "fa-skull" },
                { name: "節制", eng: "Temperance", meaning: "平衡、適度、耐心、調和", keyword: "淨化", icon: "fa-glass-whiskey" },
                { name: "惡魔", eng: "The Devil", meaning: "束縛、物質主義、慾望、誘惑", keyword: "誘惑", icon: "fa-link" },
                { name: "高塔", eng: "The Tower", meaning: "突變、混亂、啟示、破壞", keyword: "毀滅", icon: "fa-gopuram" },
                { name: "星星", eng: "The Star", meaning: "希望、靈感、平靜、治癒", keyword: "希望", icon: "fa-star" },
                { name: "月亮", eng: "The Moon", meaning: "幻覺、恐懼、焦慮、潛意識", keyword: "不安", icon: "fa-moon" },
                { name: "太陽", eng: "The Sun", meaning: "快樂、成功、活力、清晰", keyword: "生命", icon: "fa-sun" },
                { name: "審判", eng: "Judgement", meaning: "復活、覺醒、號召、決定", keyword: "復活", icon: "fa-bullhorn" },
                { name: "世界", eng: "The World", meaning: "完成、整合、成就、圓滿", keyword: "達成", icon: "fa-globe-americas" }
            ]
        };

window.APP_PREFIX = APP_PREFIX;
