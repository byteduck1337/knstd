document.addEventListener('DOMContentLoaded', function() {
    console.log('KanaMaster initialized');
    
    const ICONS = {
        kana: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>',
        srs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/></svg>',
        sentence: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
        verb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
        reading: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
        leaderboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
        progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5V21"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>'
    };

    const svgCheck = '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    const svgCross = '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

    const kanaData = {
        hiragana: {
            vowels: { name: 'Vowels', chars: { 'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o' } },
            k: { name: 'K-row', chars: { 'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko' } },
            s: { name: 'S-row', chars: { 'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so' } },
            t: { name: 'T-row', chars: { 'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to' } },
            n: { name: 'N-row', chars: { 'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no' } },
            h: { name: 'H-row', chars: { 'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho' } },
            m: { name: 'M-row', chars: { 'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo' } },
            y: { name: 'Y-row', chars: { 'や': 'ya', 'ゆ': 'yu', 'よ': 'yo' } },
            r: { name: 'R-row', chars: { 'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro' } },
            w: { name: 'W-row', chars: { 'わ': 'wa', 'を': 'wo', 'ん': 'n' } }
        },
        katakana: {
            vowels: { name: 'Vowels', chars: { 'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o' } },
            k: { name: 'K-row', chars: { 'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko' } },
            s: { name: 'S-row', chars: { 'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so' } },
            t: { name: 'T-row', chars: { 'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to' } },
            n: { name: 'N-row', chars: { 'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no' } },
            h: { name: 'H-row', chars: { 'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho' } },
            m: { name: 'M-row', chars: { 'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo' } },
            y: { name: 'Y-row', chars: { 'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo' } },
            r: { name: 'R-row', chars: { 'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro' } },
            w: { name: 'W-row', chars: { 'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n' } }
        }
    };

    const trainingModes = [
        { id: 'kana', title: 'Kana Recognition', desc: 'Master Hiragana and Katakana through interactive exercises', icon: ICONS.kana, category: 'kana', screen: 'setupScreen' },
        { id: 'srs', title: 'Spaced Repetition (SRS)', desc: 'Scientific flashcard engine that shows words right before you forget them', icon: ICONS.srs, category: 'kana', screen: 'setupScreen' },
        { id: 'sentence', title: 'Sentence Builder', desc: 'Assemble Japanese sentences using word blocks (SOV order)', icon: ICONS.sentence, category: 'grammar', screen: 'sentenceBuilderScreen' },
        { id: 'verb', title: 'Verb Conjugation', desc: 'Practice changing verbs into polite, past, and negative forms', icon: ICONS.verb, category: 'grammar', screen: 'verbConjugationScreen' },
        { id: 'reading', title: 'Interactive Reading', desc: 'Read Japanese texts and tap words for instant meanings', icon: ICONS.reading, category: 'reading', screen: 'readingScreen' },
        { id: 'leaderboard', title: 'Weekly Leaderboard', desc: 'Compete with other learners in weekly XP rankings', icon: ICONS.leaderboard, category: 'gamification', screen: 'leaderboardScreen' },
        { id: 'progress', title: 'Learning Island', desc: 'Build your virtual world as you master Japanese', icon: ICONS.progress, category: 'gamification', screen: 'progressScreen' }
    ];

    let currentTab = 'hiragana';
    let selectedGroups = new Set();
    let currentSet = {};
    let sessionQueue = [];
    let currentStage = 0, totalStages = 20, score = 0, correctAnswers = 0, totalAnswers = 0, streak = 0, bestStreak = 0;
    let testStartTime = 0, timerInterval = null;
    let isRetryQuestion = false;
    let isInfiniteMode = false;
    let charAttemptsInSession = {};
    let consecutiveRetries = 0;
    let srsData = {};
    let charStats = {};
    let profile = { tests: 0, correct: 0, total: 0, bestStreak: 0, timeSec: 0 };
    let settings = {
        sessionLength: 20,
        methods: ['qe', 'flashcard', 'mc', 'romajiSelect', 'stroke']
    };
    let savedSelection = { tab: 'hiragana', groups: [] };

    try {
        const savedSRS = localStorage.getItem('kanaSRS');
        if (savedSRS) srsData = JSON.parse(savedSRS);
    } catch(e) { console.log('SRS load failed', e); }
    try {
        const savedStats = localStorage.getItem('charStats');
        if (savedStats) charStats = JSON.parse(savedStats);
    } catch(e) { console.log('Stats load failed', e); }
    try {
        const savedProfile = localStorage.getItem('kanaProfile');
        if (savedProfile) profile = JSON.parse(savedProfile);
    } catch(e) { console.log('Profile load failed', e); }
    try {
        const savedSettings = localStorage.getItem('kanaSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            if (parsed.sessionLength) settings.sessionLength = parsed.sessionLength;
            if (parsed.methods && parsed.methods.length > 0) settings.methods = parsed.methods;
        }
    } catch(e) { console.log('Settings load failed', e); }
    try {
        const savedSel = localStorage.getItem('kanaSelection');
        if (savedSel) {
            const parsed = JSON.parse(savedSel);
            if (parsed.tab && (parsed.tab === 'hiragana' || parsed.tab === 'katakana')) savedSelection.tab = parsed.tab;
            if (parsed.groups && Array.isArray(parsed.groups)) savedSelection.groups = parsed.groups;
        }
    } catch(e) { console.log('Selection load failed', e); }

    function renderTrainingGrid(category = 'all') {
        const grid = document.getElementById('trainingGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const filtered = category === 'all' ? trainingModes : trainingModes.filter(t => t.category === category);
        filtered.forEach(mode => {
            const card = document.createElement('div');
            card.className = 'training-card';
            card.dataset.mode = mode.id;
            card.innerHTML = `
                <div class="training-card-icon">${mode.icon}</div>
                <div class="training-card-title">${mode.title}</div>
                <div class="training-card-desc">${mode.desc}</div>
                <div class="training-card-badge">${mode.category}</div>
            `;
            card.addEventListener('click', () => openTraining(mode));
            grid.appendChild(card);
        });
    }

    function openTraining(mode) {
        document.getElementById('mainMenuScreen').classList.remove('active');
        document.getElementById(mode.screen).classList.add('active');
        if (mode.id === 'sentence') startSentenceBuilder();
        else if (mode.id === 'verb') startVerbConjugation();
        else if (mode.id === 'reading') startInteractiveReading();
        else if (mode.id === 'leaderboard') renderLeaderboard();
        else if (mode.id === 'progress') renderProgressIsland();
    }

    function showMainMenu() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('mainMenuScreen').classList.add('active');
    }

    // Sentence Builder
    const sentences = [
        { jp: '私は学生です', words: ['私', 'は', '学生', 'です'], en: 'I am a student' },
        { jp: '猫が好きです', words: ['猫', 'が', '好き', 'です'], en: 'I like cats' },
        { jp: '東京に行きます', words: ['東京', 'に', '行きます'], en: 'I go to Tokyo' },
        { jp: '本を読みます', words: ['本', 'を', '読みます'], en: 'I read a book' },
        { jp: '今日は暑い', words: ['今日', 'は', '暑い'], en: 'Today is hot' }
    ];
    let sbStage = 0, sbScore = 0, sbTotal = 5;

    function startSentenceBuilder() {
        sbStage = 0; sbScore = 0;
        document.getElementById('sbTotal').textContent = sbTotal;
        nextSentence();
    }

    function nextSentence() {
        if (sbStage >= sbTotal) { showSentenceResults(); return; }
        sbStage++;
        document.getElementById('sbStage').textContent = sbStage;
        document.getElementById('sbScore').textContent = sbScore;
        const sentence = sentences[Math.floor(Math.random() * sentences.length)];
        const container = document.getElementById('sentenceContainer');
        const shuffledWords = [...sentence.words].sort(() => Math.random() - 0.5);
        container.innerHTML = `
            <div class="instruction">Translate: ${sentence.en}</div>
            <div class="sentence-answer" id="sentenceAnswer"></div>
            <div class="sentence-bank" id="sentenceBank"></div>
            <div class="feedback" id="sbFeedback"></div>
        `;
        const bank = document.getElementById('sentenceBank');
        const answer = document.getElementById('sentenceAnswer');
        shuffledWords.forEach(word => {
            const wordEl = document.createElement('div');
            wordEl.className = 'sentence-word';
            wordEl.textContent = word;
            wordEl.addEventListener('click', () => {
                if (!wordEl.classList.contains('used')) {
                    wordEl.classList.add('used');
                    const answerWord = document.createElement('div');
                    answerWord.className = 'sentence-word';
                    answerWord.textContent = word;
                    answerWord.addEventListener('click', () => {
                        answerWord.remove();
                        wordEl.classList.remove('used');
                    });
                    answer.appendChild(answerWord);
                    checkSentence(sentence.words);
                }
            });
            bank.appendChild(wordEl);
        });
    }

    function checkSentence(correctWords) {
        const answer = document.getElementById('sentenceAnswer');
        const currentWords = Array.from(answer.children).map(el => el.textContent);
        if (currentWords.length === correctWords.length) {
            const isCorrect = currentWords.every((w, i) => w === correctWords[i]);
            const fb = document.getElementById('sbFeedback');
            if (isCorrect) {
                fb.innerHTML = svgCheck + ' Correct!';
                fb.className = 'feedback correct';
                sbScore += 100;
                setTimeout(nextSentence, 1000);
            } else {
                fb.innerHTML = svgCross + ' Incorrect. Try again.';
                fb.className = 'feedback wrong';
                setTimeout(() => {
                    answer.innerHTML = '';
                    document.querySelectorAll('.sentence-word.used').forEach(el => el.classList.remove('used'));
                    fb.textContent = '';
                }, 1500);
            }
        }
    }

    function showSentenceResults() {
        alert(`Sentence Builder Complete!\nScore: ${sbScore}`);
        showMainMenu();
    }

    // Verb Conjugation
    const verbs = [
        { dict: '食べる', forms: { polite: '食べます', past: '食べた', negative: '食べない' } },
        { dict: '飲む', forms: { polite: '飲みます', past: '飲んだ', negative: '飲まない' } },
        { dict: '行く', forms: { polite: '行きます', past: '行った', negative: '行かない' } },
        { dict: '見る', forms: { polite: '見ます', past: '見た', negative: '見ない' } },
        { dict: 'する', forms: { polite: 'します', past: 'した', negative: 'しない' } }
    ];
    let vcStage = 0, vcScore = 0, vcTotal = 5;

    function startVerbConjugation() {
        vcStage = 0; vcScore = 0;
        document.getElementById('vcTotal').textContent = vcTotal;
        nextVerb();
    }

    function nextVerb() {
        if (vcStage >= vcTotal) { showVerbResults(); return; }
        vcStage++;
        document.getElementById('vcStage').textContent = vcStage;
        document.getElementById('vcScore').textContent = vcScore;
        const verb = verbs[Math.floor(Math.random() * verbs.length)];
        const formTypes = ['polite', 'past', 'negative'];
        const formType = formTypes[Math.floor(Math.random() * formTypes.length)];
        const correctForm = verb.forms[formType];
        const container = document.getElementById('verbContainer');
        container.innerHTML = `
            <div class="verb-display">${verb.dict}</div>
            <div class="verb-form-hint">Change to ${formType} form</div>
            <input type="text" class="text-input" id="verbInput" autocomplete="off" placeholder="Type the form...">
            <div class="feedback" id="vcFeedback"></div>
        `;
        const input = document.getElementById('verbInput');
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim();
                const fb = document.getElementById('vcFeedback');
                if (val === correctForm) {
                    fb.innerHTML = svgCheck + ' Correct!';
                    fb.className = 'feedback correct';
                    vcScore += 100;
                    setTimeout(nextVerb, 1000);
                } else {
                    fb.innerHTML = svgCross + ` Correct: ${correctForm}`;
                    fb.className = 'feedback wrong';
                    setTimeout(nextVerb, 2000);
                }
            }
        });
    }

    function showVerbResults() {
        alert(`Verb Conjugation Complete!\nScore: ${vcScore}`);
        showMainMenu();
    }

    // Interactive Reading
    const readingTexts = [
        {
            text: '私は毎日日本語を勉強します。東京は大きい都市です。',
            words: [
                { jp: '私', reading: 'わたし', meaning: 'I, me' },
                { jp: '毎日', reading: 'まいにち', meaning: 'every day' },
                { jp: '日本語', reading: 'にほんご', meaning: 'Japanese language' },
                { jp: '勉強', reading: 'べんきょう', meaning: 'study' },
                { jp: '東京', reading: 'とうきょう', meaning: 'Tokyo' },
                { jp: '大きい', reading: 'おおきい', meaning: 'big, large' },
                { jp: '都市', reading: 'とし', meaning: 'city' }
            ]
        }
    ];

    function startInteractiveReading() {
        const container = document.getElementById('readingContainer');
        const text = readingTexts[0];
        let html = '<div class="reading-text">';
        text.text.split('').forEach(char => {
            const word = text.words.find(w => w.jp.includes(char));
            if (word) {
                html += `<span class="reading-word" data-word="${word.jp}">${char}</span>`;
            } else {
                html += char;
            }
        });
        html += '</div>';
        container.innerHTML = html;
        container.querySelectorAll('.reading-word').forEach(el => {
            el.addEventListener('click', () => {
                const wordData = text.words.find(w => w.jp === el.dataset.word);
                if (wordData) showWordPopup(el, wordData);
            });
        });
    }

    function showWordPopup(el, wordData) {
        const existing = document.querySelector('.word-popup');
        if (existing) existing.remove();
        const popup = document.createElement('div');
        popup.className = 'word-popup';
        popup.innerHTML = `
            <div class="word-popup-title">${wordData.jp}</div>
            <div class="word-popup-reading">${wordData.reading}</div>
            <div class="word-popup-meaning">${wordData.meaning}</div>
        `;
        const rect = el.getBoundingClientRect();
        popup.style.top = (rect.bottom + 10) + 'px';
        popup.style.left = rect.left + 'px';
        document.body.appendChild(popup);
        setTimeout(() => {
            document.addEventListener('click', function handler(e) {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('click', handler);
                }
            });
        }, 100);
    }

    // Leaderboard
    function renderLeaderboard() {
        const container = document.getElementById('leaderboardContainer');
        const users = [
            { name: 'You', level: Math.floor(profile.correct / 50) + 1, xp: profile.correct * 10, isUser: true },
            { name: 'Tanuki', level: 15, xp: 1500, isUser: false },
            { name: 'Sakura', level: 12, xp: 1200, isUser: false },
            { name: 'Kenji', level: 10, xp: 1000, isUser: false },
            { name: 'Yuki', level: 8, xp: 800, isUser: false }
        ].sort((a, b) => b.xp - a.xp);
        container.innerHTML = users.map((user, i) => {
            const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            return `
                <div class="leaderboard-item ${user.isUser ? 'current-user' : ''}">
                    <div class="leaderboard-rank ${rankClass}">#${i + 1}</div>
                    <div class="leaderboard-avatar">${user.name[0]}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${user.name}</div>
                        <div class="leaderboard-level">Level ${user.level}</div>
                    </div>
                    <div class="leaderboard-xp">${user.xp} XP</div>
                </div>
            `;
        }).join('');
    }

    // Progress Island
    function renderProgressIsland() {
        const kanji = Object.keys(charStats).filter(c => getCharStatus(c) === 'green').length;
        const vocab = profile.correct;
        const grammar = Math.floor(profile.tests / 5);
        document.getElementById('islandKanji').textContent = kanji;
        document.getElementById('islandVocab').textContent = vocab;
        document.getElementById('islandGrammar').textContent = grammar;
    }

    function enableTestMode() {
        document.body.classList.add('test-active');
        window.scrollTo(0, 0);
    }

    function disableTestMode() {
        document.body.classList.remove('test-active');
    }

    function updateCharStats(char, isCorrect) {
        if (!charStats[char]) charStats[char] = { attempts: 0, correct: 0 };
        charStats[char].attempts++;
        if (isCorrect) charStats[char].correct++;
        try { localStorage.setItem('charStats', JSON.stringify(charStats)); } catch(e) {}
    }

    function getCharStatus(char) {
        const stats = charStats[char];
        
      
        if (!stats || stats.attempts < 3) return 'gray';
        
        const accuracy = stats.correct / stats.attempts;
        
        
        if (accuracy >= 0.90) return 'green';
        
        
        if (accuracy >= 0.60) return 'yellow';
        
        
        return 'red';
    }

    function getWeightedCharPool() {
        const pool = [];
        Object.keys(currentSet).forEach(char => {
            const stats = charStats[char];
            let weight = 1;
            if (stats && stats.attempts > 0) {
                const accuracy = stats.correct / stats.attempts;
                if (accuracy < 0.7) weight = 3;
                else if (accuracy < 0.9) weight = 2;
            }
            for (let i = 0; i < weight; i++) pool.push(char);
        });
        return pool;
    }

    function updateSRS(char, quality) {
        let record = srsData[char] || { interval: 0, repetitions: 0, ef: 2.5 };
        if (quality >= 3) {
            if (record.repetitions === 0) record.interval = 1;
            else if (record.repetitions === 1) record.interval = 6;
            else record.interval = Math.round(record.interval * record.ef);
            record.repetitions += 1;
        } else {
            record.repetitions = 0;
            record.interval = 1;
        }
        record.ef = Math.max(1.3, record.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
        record.lastReviewed = Date.now();
        record.nextReview = Date.now() + (record.interval * 24 * 60 * 60 * 1000);
        srsData[char] = record;
        try { localStorage.setItem('kanaSRS', JSON.stringify(srsData)); } catch(e) {}
    }

    function getDueCharacters() {
        const now = Date.now();
        return Object.keys(srsData).filter(char => srsData[char].nextReview && srsData[char].nextReview <= now);
    }

    function getMasteredCount() {
        return Object.keys(charStats).filter(char => getCharStatus(char) === 'green').length;
    }

    function updateProfileUI() {
        const acc = profile.total > 0 ? Math.round((profile.correct / profile.total) * 100) : 0;
        const level = Math.floor(profile.correct / 50) + 1;
        const mins = Math.floor(profile.timeSec / 60);
        const profileLevelEl = document.getElementById('profileLevel');
        const profTestsEl = document.getElementById('profTests');
        const profAccuracyEl = document.getElementById('profAccuracy');
        const profMasteredEl = document.getElementById('profMastered');
        const profTimeEl = document.getElementById('profTime');
        const dueCountEl = document.getElementById('dueCount');
        if (profileLevelEl) profileLevelEl.textContent = level;
        if (profTestsEl) profTestsEl.textContent = profile.tests;
        if (profAccuracyEl) profAccuracyEl.textContent = acc + '%';
        if (profMasteredEl) profMasteredEl.textContent = getMasteredCount();
        if (profTimeEl) profTimeEl.textContent = mins + 'm';
        if (dueCountEl) dueCountEl.textContent = getDueCharacters().length;
        document.querySelectorAll('.avatar, .profile-avatar-large').forEach(el => {
            el.textContent = level > 9 ? 'L' + level : 'KM';
        });
    }

    function toggleProfile() {
        const overlay = document.getElementById('profileOverlay');
        if (overlay) overlay.classList.toggle('active');
    }

    function resetProgress() {
        if (confirm('Reset all learning progress and SRS data? This cannot be undone.')) {
            profile = { tests: 0, correct: 0, total: 0, bestStreak: 0, timeSec: 0 };
            srsData = {};
            charStats = {};
            savedSelection = { tab: 'hiragana', groups: [] };
            try {
                localStorage.setItem('kanaProfile', JSON.stringify(profile));
                localStorage.setItem('kanaSRS', JSON.stringify(srsData));
                localStorage.setItem('charStats', JSON.stringify(charStats));
                localStorage.setItem('kanaSelection', JSON.stringify(savedSelection));
            } catch(e) {}
            updateProfileUI();
            toggleProfile();
            currentTab = 'hiragana';
            selectedGroups.clear();
            renderSubgroups();
            updateStartBtn();
        }
    }

    function switchTab(tab) {
        currentTab = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
        if (activeBtn) activeBtn.classList.add('active');
        renderSubgroups();
        updateStartBtn();
    }

    function renderSubgroups() {
        const grid = document.getElementById('subgroupGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const groups = kanaData[currentTab];
        for (const [key, group] of Object.entries(groups)) {
            const card = document.createElement('div');
            card.className = 'subgroup-card';
            card.dataset.key = key;
            if (savedSelection.groups.indexOf(key) !== -1) {
                card.classList.add('selected');
                selectedGroups.add(key);
            }
            const charsHtml = Object.keys(group.chars).map(char => {
                const status = getCharStatus(char);
                return '<span class="char-status ' + status + '">' + char + '</span>';
            }).join(' ');
            card.innerHTML = '<div class="subgroup-name">' + group.name + '</div><div class="subgroup-chars">' + charsHtml + '</div>';
            card.addEventListener('click', function() { toggleGroup(key, card); });
            grid.appendChild(card);
        }
    }

    function toggleGroup(key, card) {
        if (selectedGroups.has(key)) {
            selectedGroups.delete(key);
            card.classList.remove('selected');
        } else {
            selectedGroups.add(key);
            card.classList.add('selected');
        }
        updateStartBtn();
    }

    function updateStartBtn() {
        const btn = document.getElementById('startBtn');
        if (btn) btn.disabled = selectedGroups.size === 0;
    }

    function saveSelection() {
        savedSelection.tab = currentTab;
        savedSelection.groups = Array.from(selectedGroups);
        try { localStorage.setItem('kanaSelection', JSON.stringify(savedSelection)); } catch(e) {}
    }

    function openSettings() {
        const overlay = document.getElementById('settingsOverlay');
        if (!overlay) return;
        document.querySelectorAll('.length-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.length == settings.sessionLength) btn.classList.add('active');
        });
        document.querySelectorAll('.method-checkbox input').forEach(cb => {
            cb.checked = settings.methods.indexOf(cb.value) !== -1;
        });
        updateMethodWarning();
        overlay.classList.add('active');
    }

    function closeSettings() {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    function updateMethodWarning() {
        const warning = document.getElementById('methodWarning');
        const checked = document.querySelectorAll('.method-checkbox input:checked');
        if (warning) warning.style.display = checked.length === 0 ? 'block' : 'none';
    }

    function saveSettings() {
        const lengthBtn = document.querySelector('.length-btn.active');
        if (!lengthBtn) return;
        const length = lengthBtn.dataset.length;
        settings.sessionLength = length === 'infinite' ? 'infinite' : parseInt(length);
        const checkedMethods = [];
        document.querySelectorAll('.method-checkbox input:checked').forEach(cb => {
            checkedMethods.push(cb.value);
        });
        if (checkedMethods.length === 0) {
            updateMethodWarning();
            return;
        }
        settings.methods = checkedMethods;
        try { localStorage.setItem('kanaSettings', JSON.stringify(settings)); } catch(e) {}
        closeSettings();
    }

    function startTest() {
        charAttemptsInSession = {};
        consecutiveRetries = 0;
        saveSelection();
        currentSet = {};
        selectedGroups.forEach(key => {
            Object.assign(currentSet, kanaData[currentTab][key].chars);
        });
        const weightedPool = getWeightedCharPool();
        const dueChars = getDueCharacters().filter(c => currentSet[c]);
        let pool = shuffle([...new Set([...dueChars, ...weightedPool])]);
        if (pool.length === 0) pool = Object.keys(currentSet);
        sessionQueue = [];
        if (settings.sessionLength === 'infinite') {
            isInfiniteMode = true;
            totalStages = 999;
            for (let i = 0; i < 20; i++) sessionQueue.push({ char: pool[i % pool.length], isRetry: false });
        } else {
            isInfiniteMode = false;
            totalStages = settings.sessionLength;
            for (let i = 0; i < totalStages; i++) sessionQueue.push({ char: pool[i % pool.length], isRetry: false });
        }
        currentStage = 0; score = 0; correctAnswers = 0; totalAnswers = 0; streak = 0; bestStreak = 0;
        testStartTime = Date.now();
        const totalEl = document.getElementById('totalStages');
        if (totalEl) totalEl.textContent = isInfiniteMode ? '∞' : totalStages;
        const endBtn = document.getElementById('endSessionBtn');
        if (endBtn) endBtn.style.display = isInfiniteMode ? 'flex' : 'none';
        document.getElementById('setupScreen').classList.remove('active');
        document.getElementById('testScreen').classList.add('active');
        startTimer();
        enableTestMode();
        nextStage();
    }

    function endSessionEarly() {
        if (confirm('End this session now?')) {
            disableTestMode();
            endTest();
        }
    }

    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(function() {
            const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
            const el = document.getElementById('timer');
            if (el) el.textContent = Math.floor(elapsed/60) + ':' + (elapsed%60).toString().padStart(2,'0');
        }, 1000);
    }

    function nextStage() {
        if (isInfiniteMode && sessionQueue.length === 0) {
            const weightedPool = getWeightedCharPool();
            for (let i = 0; i < 10; i++) {
                const char = weightedPool[Math.floor(Math.random() * weightedPool.length)];
                sessionQueue.push({ char: char, isRetry: false });
            }
        }
        if (!isInfiniteMode && sessionQueue.length === 0) {
            disableTestMode();
            endTest();
            return;
        }
        const currentItem = sessionQueue.shift();
        isRetryQuestion = currentItem.isRetry;
        const badge = document.getElementById('retryBadge');
        if (badge) badge.style.display = isRetryQuestion ? 'flex' : 'none';
        currentStage++;
        const stageEl = document.getElementById('stageNum');
        if (stageEl) stageEl.textContent = currentStage;
        if (!isInfiniteMode) {
            const fill = document.getElementById('progressFill');
            if (fill) fill.style.width = (currentStage / totalStages) * 100 + '%';
        }
        const availableMethods = settings.methods.filter(m => ['qe', 'flashcard', 'mc', 'romajiSelect', 'stroke'].indexOf(m) !== -1);
        if (availableMethods.length === 0) availableMethods.push('qe');
        const method = availableMethods[Math.floor(Math.random() * availableMethods.length)];
        const container = document.getElementById('methodContainer');
        if (!container) return;
        container.innerHTML = '';
        try {
            switch(method) {
                case 'qe': renderQE(container, currentItem.char); break;
                case 'flashcard': renderFlashcard(container, currentItem.char); break;
                case 'mc': renderMC(container, currentItem.char); break;
                case 'romajiSelect': renderRomajiSelect(container, currentItem.char); break;
                case 'stroke': renderStroke(container, currentItem.char); break;
                default: renderQE(container, currentItem.char);
            }
        } catch (e) {
            console.error('[ERROR] Method error:', e);
            completeStage(currentItem.char, false);
        }
    }

    function completeStage(char, isCorrect) {
        totalAnswers++;
        updateCharStats(char, isCorrect);
        const quality = isCorrect ? (isRetryQuestion ? 3 : 5) : 1;
        updateSRS(char, quality);
        if (!charAttemptsInSession[char]) charAttemptsInSession[char] = 0;
        charAttemptsInSession[char]++;
        if (!isCorrect) {
            consecutiveRetries++;
            if (consecutiveRetries > 50) { disableTestMode(); endTest(); return; }
            if (charAttemptsInSession[char] < 3) {
                const insertPos = Math.max(0, sessionQueue.length - Math.floor(Math.random() * 3));
                sessionQueue.splice(insertPos, 0, { char: char, isRetry: true });
            }
        } else {
            consecutiveRetries = 0;
            correctAnswers++;
            score += 100 + (streak * 10);
            streak++;
            if (streak > bestStreak) bestStreak = streak;
            charAttemptsInSession[char] = 0;
        }
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = score;
        setTimeout(nextStage, isCorrect ? 600 : 1500);
    }

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = a[i];
            a[i] = a[j];
            a[j] = temp;
        }
        return a;
    }

    function getWrongAnswer(correct, set) {
        const vals = Object.values(set);
        let w;
        do { w = vals[Math.floor(Math.random() * vals.length)]; } while (w === correct);
        return w;
    }

    function renderQE(container, char) {
        const correctAns = currentSet[char];
        const qIsCorrect = Math.random() < 0.5;
        const qAns = qIsCorrect ? correctAns : getWrongAnswer(correctAns, currentSet);
        const eAns = qIsCorrect ? getWrongAnswer(correctAns, currentSet) : correctAns;
        container.innerHTML = 
            '<div class="method-name">Time Attack</div>' +
            '<div class="instruction">Press Q or E for the correct romaji</div>' +
            '<div class="kana-display">' + char + '</div>' +
            '<div class="qe-options">' +
                '<button class="qe-btn" id="qBtn">Q<br><small>' + qAns + '</small></button>' +
                '<button class="qe-btn" id="eBtn">E<br><small>' + eAns + '</small></button>' +
            '</div>' +
            '<div class="timer-bar"><div class="timer-fill" id="timerFill" style="width:100%"></div></div>';
        const start = Date.now();
        const int = setInterval(function() {
            const rem = Math.max(0, 3000 - (Date.now() - start));
            const fill = document.getElementById('timerFill');
            if (fill) fill.style.width = (rem/3000)*100 + '%';
            if (rem <= 0) { clearInterval(int); handleQE(null, correctAns, qIsCorrect, char); }
        }, 50);
        function handle(choice) {
            clearInterval(int);
            handleQE(choice, correctAns, qIsCorrect, char);
        }
        const qBtn = document.getElementById('qBtn');
        const eBtn = document.getElementById('eBtn');
        if (qBtn) qBtn.addEventListener('click', function() { handle('q'); });
        if (eBtn) eBtn.addEventListener('click', function() { handle('e'); });
        function keyHandler(e) {
            if (e.key.toLowerCase() === 'q') { document.removeEventListener('keydown', keyHandler); handle('q'); }
            else if (e.key.toLowerCase() === 'e') { document.removeEventListener('keydown', keyHandler); handle('e'); }
        }
        document.addEventListener('keydown', keyHandler);
    }

    function handleQE(choice, correct, qIsCorrect, char) {
        let isCorrect = false;
        if (choice === 'q' && qIsCorrect) isCorrect = true;
        if (choice === 'e' && !qIsCorrect) isCorrect = true;
        if (choice === 'q') {
            const btn = document.getElementById('qBtn');
            if (btn) btn.classList.add(isCorrect ? 'correct' : 'wrong');
        } else if (choice === 'e') {
            const btn = document.getElementById('eBtn');
            if (btn) btn.classList.add(isCorrect ? 'correct' : 'wrong');
        }
        completeStage(char, isCorrect);
    }

    function renderFlashcard(container, char) {
        const correctAns = currentSet[char];
        container.innerHTML =
            '<div class="method-name">Flashcard</div>' +
            '<div class="instruction">Type the romaji</div>' +
            '<div class="kana-display">' + char + '</div>' +
            '<input type="text" class="text-input" id="fcInput" autocomplete="off" autofocus placeholder="...">' +
            '<div class="feedback" id="fcFeedback"></div>';
        const input = document.getElementById('fcInput');
        const fb = document.getElementById('fcFeedback');
        if (!input || !fb) return;
        input.focus();
        let hasError = false;
        let answered = false;
        input.addEventListener('input', function() {
            if (answered) return;
            const val = input.value.trim().toLowerCase();
            if (val === correctAns) {
                answered = true;
                input.disabled = true;
                if (hasError) {
                    fb.innerHTML = svgCheck + ' Correct! (after retry)';
                    fb.className = 'feedback correct';
                } else {
                    fb.innerHTML = svgCheck + ' Correct!';
                    fb.className = 'feedback correct';
                }
                completeStage(char, true);
            }
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !answered) {
                const val = input.value.trim().toLowerCase();
                if (val !== correctAns) {
                    hasError = true;
                    input.classList.add('error');
                    fb.innerHTML = svgCross + ' Correct answer: ' + correctAns + ' - Type it now';
                    fb.className = 'feedback hint';
                    input.value = '';
                    setTimeout(function() { input.classList.remove('error'); }, 400);
                }
            }
        });
    }

    function renderMC(container, char) {
        const correctAns = currentSet[char];
        const opts = shuffle([correctAns, getWrongAnswer(correctAns, currentSet), getWrongAnswer(correctAns, currentSet), getWrongAnswer(correctAns, currentSet)]);
        container.innerHTML = 
            '<div class="method-name">Multiple Choice</div>' +
            '<div class="instruction">Select the correct romaji</div>' +
            '<div class="kana-display">' + char + '</div>' +
            '<div class="grid-4" id="mcGrid"></div>';
        const grid = document.getElementById('mcGrid');
        if (!grid) return;
        let answered = false;
        opts.forEach(function(opt) {
            const btn = document.createElement('div');
            btn.className = 'grid-card';
            btn.textContent = opt;
            btn.addEventListener('click', function() {
                if (answered) return;
                answered = true;
                const isCorrect = opt === correctAns;
                btn.classList.add(isCorrect ? 'correct-highlight' : 'wrong');
                if (!isCorrect) {
                    grid.querySelectorAll('.grid-card').forEach(function(c) {
                        if (c.textContent === correctAns) c.classList.add('correct-highlight');
                    });
                }
                completeStage(char, isCorrect);
            });
            grid.appendChild(btn);
        });
    }

    function renderRomajiSelect(container, char) {
        const keys = shuffle(Object.keys(currentSet)).slice(0, 4);
        if (keys.indexOf(char) === -1) keys[0] = char;
        const items = {};
        keys.forEach(function(k) { items[k] = currentSet[k]; });
        const correctRomaji = items[char];
        container.innerHTML = 
            '<div class="method-name">Romaji Selection</div>' +
            '<div class="instruction">Select the romaji for the highlighted kana</div>' +
            '<div class="romaji-layout" id="rsLayout"></div>';
        const layout = document.getElementById('rsLayout');
        if (!layout) return;
        let answered = false;
        const romajiCol = document.createElement('div');
        romajiCol.className = 'romaji-col';
        shuffle(Object.values(items)).forEach(function(r) {
            const el = document.createElement('div');
            el.className = 'romaji-item';
            el.textContent = r;
            el.addEventListener('click', function() {
                if (answered) return;
                answered = true;
                const isCorrect = r === correctRomaji;
                if (isCorrect) el.classList.add('correct-pair');
                else el.classList.add('wrong');
                completeStage(char, isCorrect);
            });
            romajiCol.appendChild(el);
        });
        const arrow = document.createElement('div');
        arrow.className = 'arrow-ind';
        arrow.textContent = '→';
        const kanaCol = document.createElement('div');
        kanaCol.className = 'kana-col';
        keys.forEach(function(k) {
            const el = document.createElement('div');
            el.className = 'kana-item';
            el.textContent = k;
            if (k === char) {
                el.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                el.style.background = 'rgba(255, 255, 255, 0.1)';
            }
            kanaCol.appendChild(el);
        });
        layout.appendChild(romajiCol);
        layout.appendChild(arrow);
        layout.appendChild(kanaCol);
    }

    let canvas, ctx, isDrawing = false, strokes = 0, lastX = 0, lastY = 0, strokeChar = '', strokeExpected = 0;

    function renderStroke(container, char) {
        strokeChar = char;
        strokeExpected = 3;
        strokes = 0;
        container.innerHTML = 
            '<div class="method-name">Stroke Order Practice</div>' +
            '<div class="instruction">Trace the character</div>' +
            '<div class="canvas-container">' +
                '<div class="canvas-bg-char">' + char + '</div>' +
                '<canvas id="drawCanvas" class="drawing-canvas" width="260" height="260"></canvas>' +
            '</div>' +
            '<div class="canvas-controls">' +
                '<button class="canvas-btn" id="clearBtn">Clear</button>' +
                '<button class="canvas-btn primary" id="checkBtn">Check</button>' +
            '</div>' +
            '<div class="feedback" id="strokeFeedback"></div>';
        setTimeout(initCanvas, 100);
    }

    function initCanvas() {
        canvas = document.getElementById('drawCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        }
        function startDraw(e) {
            e.preventDefault();
            isDrawing = true;
            const pos = getPos(e);
            lastX = pos.x;
            lastY = pos.y;
            strokes++;
        }
        function draw(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            lastX = pos.x;
            lastY = pos.y;
        }
        function endDraw(e) {
            if (e) e.preventDefault();
            isDrawing = false;
        }
        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('mouseout', endDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', endDraw);
        const clearBtn = document.getElementById('clearBtn');
        const checkBtn = document.getElementById('checkBtn');
        if (clearBtn) clearBtn.addEventListener('click', clearCanvas);
        if (checkBtn) checkBtn.addEventListener('click', checkStroke);
    }

    function clearCanvas() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokes = 0;
        const fb = document.getElementById('strokeFeedback');
        if (fb) fb.textContent = '';
    }

    function checkStroke() {
        if (!ctx || !canvas) return;
        const fb = document.getElementById('strokeFeedback');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let pixelCount = 0;
        for (let i = 3; i < imageData.length; i += 4) {
            if (imageData[i] > 0) pixelCount++;
        }
        const hasDrawing = pixelCount > 500;
        if (!hasDrawing) {
            if (fb) {
                fb.innerHTML = svgCross + ' Please draw the character first.';
                fb.className = 'feedback wrong';
            }
            return;
        }
        const strokeDiff = Math.abs(strokes - strokeExpected);
        if (strokeDiff <= 1) {
            if (fb) {
                fb.innerHTML = svgCheck + ' Good! (' + strokes + ' strokes)';
                fb.className = 'feedback correct';
            }
            completeStage(strokeChar, true);
        } else {
            if (fb) {
                fb.innerHTML = svgCross + ' Expected ~' + strokeExpected + ' strokes, detected ' + strokes + '.';
                fb.className = 'feedback wrong';
            }
            completeStage(strokeChar, false);
        }
    }

    function endTest() {
        clearInterval(timerInterval);
        const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
        profile.tests++;
        profile.correct += correctAnswers;
        profile.total += totalAnswers;
        if (bestStreak > profile.bestStreak) profile.bestStreak = bestStreak;
        profile.timeSec += elapsed;
        try { localStorage.setItem('kanaProfile', JSON.stringify(profile)); } catch(e) {}
        updateProfileUI();
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        const acc = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
        const scoreEl = document.getElementById('finalScore');
        const accEl = document.getElementById('finalAccuracy');
        const timeEl = document.getElementById('finalTime');
        const streakEl = document.getElementById('finalStreak');
        if (scoreEl) scoreEl.textContent = score;
        if (accEl) accEl.textContent = acc + '%';
        if (timeEl) timeEl.textContent = mins + ':' + secs.toString().padStart(2,'0');
        if (streakEl) streakEl.textContent = bestStreak;
        document.getElementById('testScreen').classList.remove('active');
        document.getElementById('resultsScreen').classList.add('active');
    }

    function showSetup() {
        document.getElementById('resultsScreen').classList.remove('active');
        document.getElementById('setupScreen').classList.add('active');
        currentTab = savedSelection.tab;
        selectedGroups.clear();
        savedSelection.groups.forEach(function(g) { selectedGroups.add(g); });
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const activeTabBtn = document.querySelector('.tab-btn[data-tab="' + currentTab + '"]');
        if (activeTabBtn) activeTabBtn.classList.add('active');
        renderSubgroups();
        updateStartBtn();
    }

    // Event Listeners
    const logoBtn = document.getElementById('logoBtn');
    if (logoBtn) logoBtn.addEventListener('click', showMainMenu);
    
    const avatarBtn = document.getElementById('avatarBtn');
    if (avatarBtn) avatarBtn.addEventListener('click', toggleProfile);
    
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
    
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);
    
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);
    
    const settingsOverlay = document.getElementById('settingsOverlay');
    if (settingsOverlay) {
        settingsOverlay.addEventListener('click', function(e) {
            if (e.target === settingsOverlay) closeSettings();
        });
    }
    
    document.querySelectorAll('.length-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.length-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    document.querySelectorAll('.method-checkbox input').forEach(function(cb) {
        cb.addEventListener('change', updateMethodWarning);
    });
    
    const endSessionBtn = document.getElementById('endSessionBtn');
    if (endSessionBtn) endSessionBtn.addEventListener('click', endSessionEarly);
    
    const closeProfileBtn = document.getElementById('closeProfileBtn');
    const closeProfileBtn2 = document.getElementById('closeProfileBtn2');
    if (closeProfileBtn) closeProfileBtn.addEventListener('click', toggleProfile);
    if (closeProfileBtn2) closeProfileBtn2.addEventListener('click', toggleProfile);
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetProgress);
    
    const profileOverlay = document.getElementById('profileOverlay');
    if (profileOverlay) {
        profileOverlay.addEventListener('click', function(e) {
            if (e.target === profileOverlay) toggleProfile();
        });
    }
    
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { switchTab(btn.dataset.tab); });
    });
    
    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.addEventListener('click', startTest);
    
    const newSessionBtn = document.getElementById('newSessionBtn');
    if (newSessionBtn) newSessionBtn.addEventListener('click', showSetup);
    
    const backButtons = ['backToMenuBtn', 'backToMenuBtn2', 'backToMenuBtn3', 'backToMenuBtn4', 'backToMenuBtn5', 'backToMenuBtn6', 'backToMenuBtn7'];
    backButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', showMainMenu);
    });
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTrainingGrid(btn.dataset.category);
        });
    });

    // Initialize
    currentTab = savedSelection.tab;
    savedSelection.groups.forEach(function(g) { selectedGroups.add(g); });
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const initialTabBtn = document.querySelector('.tab-btn[data-tab="' + currentTab + '"]');
    if (initialTabBtn) initialTabBtn.classList.add('active');
    updateProfileUI();
    renderSubgroups();
    updateStartBtn();
    renderTrainingGrid();
    console.log('KanaMaster ready');
});