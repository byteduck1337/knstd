document.addEventListener('DOMContentLoaded', () => {
  const API_URL = "https://kana.okeysexsex.workers.dev";

  const state = {
    screen: 'menu', tab: 'hiragana', groups: [],
    settings: { length: 20, methods: ['qe', 'flashcard', 'mc', 'romajiSelect', 'stroke'] },
    profile: { sessions: 0, correct: 0, total: 0, timeSec: 0 },
    charStats: {}, srs: {}, dict: [],
    train: { mode: null, queue: [], index: 0, total: 0, correct: 0, score: 0, startTime: 0, locked: false, cleanup: null, timer: null, hudTimer: null },
    speed: {
      active: false, phase: 'idle', lives: 5, streak: 0, bestStreak: 0,
      score: 0, correct: 0, total: 0, sessionStart: 0, sessionEnd: 0,
      current: null, answerTime: 15000, answerStart: 0, answerTimer: null,
      sessionTimer: null, flashTimers: [], inputLocked: false, rank: 'D',
      totalScore: 0, jpIme: null, level: null,
      nativeLang: null, direction: null
    }
  };

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const shuffle = arr => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const fmtTime = sec => `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;

  const toast = (msg, type = 'info') => {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${msg}</span>`;
    $('#toastContainer').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  };

  const load = () => {
    try { state.groups = JSON.parse(localStorage.getItem('km_groups')) || []; } catch(e){}
    try { state.charStats = JSON.parse(localStorage.getItem('km_stats')) || {}; } catch(e){}
    try { state.srs = JSON.parse(localStorage.getItem('km_srs')) || {}; } catch(e){}
    try { state.dict = JSON.parse(localStorage.getItem('km_dict')) || []; } catch(e){}
    try { state.profile = { ...state.profile, ...JSON.parse(localStorage.getItem('km_profile')) }; } catch(e){}
    try {
      const s = JSON.parse(localStorage.getItem('km_settings'));
      if (s) {
        if (s.length) state.settings.length = s.length;
        if (s.methods && s.methods.length) state.settings.methods = s.methods;
      }
    } catch(e){}
    try {
      const v = localStorage.getItem('km_speed_jpime');
      if (v === 'yes' || v === 'no') state.speed.jpIme = v;
    } catch(e){}
    try {
      const lv = localStorage.getItem('km_speed_level');
      if (lv) state.speed.level = lv;
    } catch(e){}
    try {
      const nl = localStorage.getItem('km_speed_native');
      if (nl === 'ru' || nl === 'en') state.speed.nativeLang = nl;
    } catch(e){}
    try {
      const dir = localStorage.getItem('km_speed_direction');
      if (dir === 'native2jp' || dir === 'jp2native') state.speed.direction = dir;
    } catch(e){}
  };
  const save = (key, val) => localStorage.setItem(`km_${key}`, JSON.stringify(val));

  const go = (name) => {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`screen-${name}`);
    if (el) el.classList.add('active');
    state.screen = name;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name !== 'training' && state.train.mode) endTraining();
    if (name !== 'speed' && state.speed.active) endSpeed(false);
    if (name === 'setup') renderSetup();
    if (name === 'dict') renderDict();
    if (name === 'leaderboard') renderLeaderboard();
    if (name === 'progress') renderProgress();
    if (name === 'sentence') startSentence();
    if (name === 'verb') startVerb();
    if (name === 'reading') startReading();
  };

  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      const target = nav.dataset.nav;
      if (target === 'srs-start') startSRS();
      else if (target === 'speed') openSpeed();
      else go(target);
    }
  });

  $('#logoBtn').addEventListener('click', () => go('menu'));

  const statusOf = char => {
    const st = state.charStats[char];
    if (!st || st.attempts < 3) return 'gray';
    const acc = st.correct / st.attempts;
    if (acc >= 0.9) return 'green';
    if (acc >= 0.6) return 'yellow';
    return 'red';
  };

  const renderSetup = () => {
    $('#startKanaBtn').disabled = state.groups.length === 0;
    $$('.tab-btn[data-tab]').forEach(t => t.classList.toggle('active', t.dataset.tab === state.tab));
    const grid = $('#subgroupGrid');
    grid.innerHTML = '';
    Object.entries(KANA_DATA[state.tab]).forEach(([key, grp]) => {
      const card = document.createElement('div');
      card.className = `subgroup-card ${state.groups.includes(key) ? 'selected' : ''}`;
      card.innerHTML = `<div class="subgroup-name">${grp.name}</div><div class="subgroup-chars">${Object.keys(grp.chars).map(c => `<span class="char-status ${statusOf(c)}">${c}</span>`).join(' ')}</div>`;
      card.onclick = () => {
        const idx = state.groups.indexOf(key);
        if (idx >= 0) state.groups.splice(idx, 1); else state.groups.push(key);
        save('groups', state.groups);
        card.classList.toggle('selected');
        $('#startKanaBtn').disabled = state.groups.length === 0;
      };
      grid.appendChild(card);
    });
  };

  $$('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => { state.tab = btn.dataset.tab; renderSetup(); });
  });

  const cleanupStage = () => {
    const T = state.train;
    if (T.cleanup) { try { T.cleanup(); } catch(e){} T.cleanup = null; }
    if (T.timer) { clearTimeout(T.timer); T.timer = null; }
  };

  const startTimer = () => {
    const T = state.train;
    clearInterval(T.hudTimer);
    T.hudTimer = setInterval(() => {
      if (T.mode) $('#hudTimer').textContent = fmtTime(Math.floor((Date.now() - T.startTime) / 1000));
    }, 1000);
  };

  const completeStage = (char, isCorrect) => {
    const T = state.train;
    if (T.locked) return;
    T.locked = true;
    cleanupStage();
    if (!state.charStats[char]) state.charStats[char] = { attempts: 0, correct: 0 };
    state.charStats[char].attempts++;
    if (isCorrect) { state.charStats[char].correct++; T.correct++; T.score += 100; }
    save('stats', state.charStats);
    $('#hudScore').textContent = `Score: ${T.score}`;
    T.index++;
    T.timer = setTimeout(() => {
      T.locked = false;
      if (T.mode === 'kana') nextKanaStage();
      else if (T.mode === 'srs') nextSRSStage();
    }, isCorrect ? 600 : 1200);
  };

  const endTraining = () => {
    const T = state.train;
    cleanupStage();
    clearInterval(T.hudTimer);
    if (!T.startTime) return;
    const elapsed = Math.floor((Date.now() - T.startTime) / 1000);
    const acc = T.index ? Math.round((T.correct / T.index) * 100) : 0;
    state.profile.sessions++;
    state.profile.correct += T.correct;
    state.profile.total += T.index;
    state.profile.timeSec += elapsed;
    save('profile', state.profile);
    $('#rScore').textContent = T.score || T.correct;
    $('#rAcc').textContent = `${acc}%`;
    $('#rTime').textContent = fmtTime(elapsed);
    T.mode = null;
    go('results');
    submitScore();
  };

  const startKana = () => {
    const currentSet = {};
    state.groups.forEach(g => {
      const grp = KANA_DATA[state.tab][g];
      if (grp) Object.assign(currentSet, grp.chars);
    });
    const pool = [];
    Object.keys(currentSet).forEach(c => {
      const st = state.charStats[c];
      let weight = 1;
      if (st && st.attempts > 0) { const a = st.correct / st.attempts; if (a < 0.7) weight = 3; else if (a < 0.9) weight = 2; }
      for (let i = 0; i < weight; i++) pool.push(c);
    });
    const T = state.train;
    T.mode = 'kana'; T.queue = []; T.index = 0; T.total = state.settings.length;
    T.correct = 0; T.score = 0; T.startTime = Date.now(); T.locked = false; T.currentSet = currentSet;
    for (let i = 0; i < T.total; i++) T.queue.push({ char: pool[Math.floor(Math.random() * pool.length)] });
    $('#hudStage').textContent = `Stage 1 / ${T.total}`;
    $('#hudScore').textContent = `Score: 0`;
    $('#hudTimer').textContent = '0:00';
    $('#endBtn').style.display = 'none';
    $('#progressFill').style.width = '0%';
    startTimer();
    go('training');
    setTimeout(nextKanaStage, 100);
  };

  const nextKanaStage = () => {
    const T = state.train;
    if (T.mode !== 'kana') return;
    cleanupStage();
    if (T.index >= T.total) { endTraining(); return; }
    T.locked = false;
    const char = T.queue[T.index].char;
    $('#hudStage').textContent = `Stage ${T.index + 1} / ${T.total}`;
    $('#progressFill').style.width = `${(T.index / T.total) * 100}%`;
    const container = $('#methodContainer');
    container.innerHTML = '';
    
    const availableMethods = state.settings.methods.filter(m => ['qe', 'flashcard', 'mc', 'romajiSelect', 'stroke'].includes(m));
    if (availableMethods.length === 0) availableMethods.push('flashcard');
    const method = availableMethods[Math.floor(Math.random() * availableMethods.length)];
    
    if (method === 'qe') renderQE(container, char);
    else if (method === 'flashcard') renderFlashcard(container, char);
    else if (method === 'mc') renderMC(container, char);
    else if (method === 'romajiSelect') renderRomajiSelect(container, char);
    else if (method === 'stroke') renderStroke(container, char);
  };

  const startSRS = () => {
    const currentSet = {};
    state.groups.forEach(g => {
      const grp = KANA_DATA[state.tab][g];
      if (grp) Object.assign(currentSet, grp.chars);
    });
    const chars = Object.keys(currentSet);
    if (!chars.length) { toast('Select Kana groups first!', 'error'); go('setup'); return; }
    const due = chars.filter(c => SRS.isDue(state.srs[c]));
    if (!due.length) { toast('No cards due right now!', 'info'); return; }
    const T = state.train;
    T.mode = 'srs'; T.queue = shuffle(due); T.index = 0; T.total = due.length;
    T.correct = 0; T.score = 0; T.startTime = Date.now(); T.locked = false; T.currentSet = currentSet;
    $('#hudStage').textContent = `Card 1 / ${T.total}`;
    $('#hudScore').textContent = `Mode: SRS`;
    $('#hudTimer').textContent = '0:00';
    $('#endBtn').style.display = 'block';
    $('#progressFill').style.width = '0%';
    startTimer();
    go('training');
    setTimeout(nextSRSStage, 100);
  };

  const nextSRSStage = () => {
    const T = state.train;
    if (T.mode !== 'srs') return;
    cleanupStage();
    if (T.index >= T.queue.length) { endTraining(); return; }
    T.locked = false;
    const char = T.queue[T.index];
    $('#hudStage').textContent = `Card ${T.index + 1} / ${T.total}`;
    $('#progressFill').style.width = `${(T.index / T.total) * 100}%`;
    const container = $('#methodContainer');
    container.innerHTML = `
      <div class="method-name">SRS Review</div>
      <div class="kana-display">${char}</div>
      <input type="text" class="text-input" id="srsInput" placeholder="romaji..." autocomplete="off">
      <div class="feedback" id="srsFeedback"></div>
      <div class="rating-row" id="srsRating">
        <button class="rate-btn" data-q="0">Again<small>reset</small></button>
        <button class="rate-btn" data-q="3">Hard<small>+1d</small></button>
        <button class="rate-btn" data-q="4">Good<small>+6d</small></button>
        <button class="rate-btn" data-q="5">Easy<small>+ long</small></button>
      </div>
    `;
    const input = $('#srsInput'), fb = $('#srsFeedback'), rating = $('#srsRating');
    const correctRomaji = T.currentSet[char];
    let answered = false;
    input.focus();
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !answered) {
        answered = true;
        const val = input.value.trim().toLowerCase();
        if (val === correctRomaji) { fb.textContent = '✓ Correct — rate yourself'; fb.className = 'feedback correct'; }
        else { fb.textContent = `✗ Correct answer: ${correctRomaji}`; fb.className = 'feedback wrong'; }
        input.disabled = true;
        $$('.rate-btn', rating).forEach(b => b.classList.add('active'));
      }
    });
    $$('.rate-btn', rating).forEach(btn => {
      btn.onclick = () => {
        if (T.locked) return;
        T.locked = true; cleanupStage();
        const q = parseInt(btn.dataset.q, 10);
        state.srs[char] = SRS.review(state.srs[char], q);
        save('srs', state.srs);
        if (q >= 3) T.correct++;
        T.index++;
        T.timer = setTimeout(() => { T.locked = false; nextSRSStage(); }, 300);
      };
    });
    T.cleanup = () => { input.disabled = true; };
  };

  $('#endBtn').addEventListener('click', endTraining);

  const renderQE = (container, char) => {
    const T = state.train;
    const correct = T.currentSet[char];
    const qIsCorrect = Math.random() < 0.5;
    const wrong = pickWrong(correct);
    const qAns = qIsCorrect ? correct : wrong;
    const eAns = qIsCorrect ? wrong : correct;
    container.innerHTML = `
      <div class="method-name">Time Attack</div>
      <div class="kana-display">${char}</div>
      <div class="qe-options">
        <button class="qe-btn" id="qeQ">Q<small>${qAns}</small></button>
        <button class="qe-btn" id="qeE">E<small>${eAns}</small></button>
      </div>
    `;
    let answered = false;
    const finish = (choice) => {
      if (answered) return;
      answered = true;
      let isCorrect = (choice === 'q' && qIsCorrect) || (choice === 'e' && !qIsCorrect);
      if (choice === 'q') $('#qeQ').classList.add(isCorrect ? 'correct' : 'wrong');
      if (choice === 'e') $('#qeE').classList.add(isCorrect ? 'correct' : 'wrong');
      completeStage(char, isCorrect);
    };
    const keyHandler = (e) => {
      if (e.key.toLowerCase() === 'q') finish('q');
      if (e.key.toLowerCase() === 'e') finish('e');
    };
    document.addEventListener('keydown', keyHandler);
    $('#qeQ').onclick = () => finish('q');
    $('#qeE').onclick = () => finish('e');
    T.cleanup = () => document.removeEventListener('keydown', keyHandler);
  };

  const renderFlashcard = (container, char) => {
    const T = state.train;
    const correct = T.currentSet[char];
    container.innerHTML = `
      <div class="method-name">Flashcard</div>
      <div class="kana-display">${char}</div>
      <input type="text" class="text-input" id="fcInput" placeholder="..." autocomplete="off">
      <div class="feedback" id="fcFeedback"></div>
    `;
    const input = $('#fcInput'), fb = $('#fcFeedback');
    input.focus();
    let answered = false;
    input.addEventListener('input', () => {
      if (answered) return;
      if (input.value.trim().toLowerCase() === correct) {
        answered = true;
        input.disabled = true;
        fb.textContent = '✓ Correct';
        fb.className = 'feedback correct';
        completeStage(char, true);
      }
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !answered && input.value.trim() !== '') {
        input.classList.add('error');
        fb.textContent = `✗ Try again`;
        fb.className = 'feedback wrong';
        input.value = '';
        setTimeout(() => input.classList.remove('error'), 400);
      }
    });
    T.cleanup = () => { input.disabled = true; };
  };

  const renderMC = (container, char) => {
    const T = state.train;
    const correct = T.currentSet[char];
    const opts = shuffle([correct, pickWrong(correct), pickWrong(correct), pickWrong(correct)]);
    container.innerHTML = `
      <div class="method-name">Multiple Choice</div>
      <div class="kana-display">${char}</div>
      <div class="grid-4" id="mcGrid"></div>
    `;
    let answered = false;
    const grid = $('#mcGrid');
    opts.forEach(opt => {
      const btn = document.createElement('div');
      btn.className = 'grid-card';
      btn.textContent = opt;
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        const isCorrect = opt === correct;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) $$('.grid-card', grid).forEach(c => { if (c.textContent === correct) c.classList.add('correct'); });
        completeStage(char, isCorrect);
      };
      grid.appendChild(btn);
    });
    T.cleanup = () => { answered = true; };
  };

  const renderRomajiSelect = (container, char) => {
    const T = state.train;
    const keys = shuffle(Object.keys(T.currentSet)).slice(0, 4);
    if (!keys.includes(char)) keys[0] = char;
    const items = {};
    keys.forEach(k => items[k] = T.currentSet[k]);
    const correctRomaji = items[char];

    container.innerHTML = `
      <div class="method-name">Romaji Select</div>
      <div class="instruction" style="color: var(--text-muted); margin-bottom: 1rem;">Match the kana</div>
      <div class="romaji-layout">
        <div class="romaji-col" id="rCol"></div>
        <div class="arrow-ind">→</div>
        <div class="kana-col" id="kCol"></div>
      </div>
    `;

    let answered = false;
    const rCol = $('#rCol'), kCol = $('#kCol');

    shuffle(Object.values(items)).forEach(r => {
      const el = document.createElement('div');
      el.className = 'romaji-item';
      el.textContent = r;
      el.onclick = () => {
        if (answered) return;
        answered = true;
        const ok = r === correctRomaji;
        el.classList.add(ok ? 'correct-pair' : 'wrong');
        completeStage(char, ok);
      };
      rCol.appendChild(el);
    });
    
    keys.forEach(k => {
      const el = document.createElement('div');
      el.className = 'kana-item';
      el.textContent = k;
      if (k === char) { el.style.borderColor = 'rgba(255,255,255,0.5)'; el.style.background = 'rgba(255,255,255,0.1)'; }
      kCol.appendChild(el);
    });
    T.cleanup = () => { answered = true; };
  };

  const renderStroke = (container, char) => {
    const T = state.train;
    container.innerHTML = `
      <div class="method-name">Stroke Practice</div>
      <div class="canvas-container">
        <div class="canvas-bg-char">${char}</div>
        <canvas id="drawCanvas" class="drawing-canvas" width="220" height="220"></canvas>
      </div>
      <div class="canvas-controls">
        <button class="back-btn" id="strokeClear" style="margin: 0; padding: 0.4rem 1rem;">Clear</button>
        <button class="start-btn" id="strokeCheck" style="margin: 0; width: auto; padding: 0.4rem 1rem;">Check</button>
      </div>
      <div class="feedback" id="strokeFeedback"></div>
    `;

    const canvas = $('#drawCanvas');
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let drawing = false, lastX = 0, lastY = 0, answered = false;

    const pos = ev => {
      const r = canvas.getBoundingClientRect();
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      return { x: cx - r.left, y: cy - r.top };
    };

    const start = ev => { ev.preventDefault(); drawing = true; const p = pos(ev); lastX = p.x; lastY = p.y; };
    const move = ev => { if (!drawing) return; ev.preventDefault(); const p = pos(ev); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke(); lastX = p.x; lastY = p.y; };
    const end = ev => { if (ev) ev.preventDefault(); drawing = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseout', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);

    $('#strokeClear').onclick = () => { ctx.clearRect(0, 0, 220, 220); $('#strokeFeedback').textContent = ''; };
    
    $('#strokeCheck').onclick = () => {
      if (answered) return;
      const data = ctx.getImageData(0, 0, 220, 220).data;
      let px = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) px++;
      if (px < 500) { $('#strokeFeedback').textContent = 'Draw first'; $('#strokeFeedback').className = 'feedback hint'; return; }
      answered = true;
      completeStage(char, true);
    };

    T.cleanup = () => { answered = true; };
  };

  const pickWrong = (correct) => {
    const vals = Object.values(state.train.currentSet);
    let w;
    do { w = vals[Math.floor(Math.random() * vals.length)]; } while (w === correct && vals.length > 1);
    return w;
  };

  const renderDict = () => {
    const query = ($('#dictSearch').value || '').toLowerCase();
    const list = $('#dictList');
    const items = state.dict.filter(e => e.native.toLowerCase().includes(query) || e.jp.includes(query) || e.romaji.toLowerCase().includes(query)).sort((a,b) => b.added - a.added);
    if (!items.length) { list.innerHTML = `<div style="text-align:center; padding: 3rem; color: var(--text-muted);">No entries found.</div>`; return; }
    list.innerHTML = items.map(e => `
      <div class="dict-item">
        <div class="dict-jp">${e.jp}
          <div class="dict-tooltip">${e.native} · ${e.romaji}</div>
        </div>
        <div class="dict-info">
          <div class="dict-native">${e.native}</div>
          <div class="dict-romaji">${e.romaji}</div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); margin-right: 1rem;">${e.type}</div>
        <button class="dict-del" data-id="${e.id}">✕</button>
      </div>
    `).join('');
    $$('.dict-del', list).forEach(btn => {
      btn.onclick = () => { state.dict = state.dict.filter(x => x.id !== btn.dataset.id); save('dict', state.dict); renderDict(); };
    });
  };

  $('#dictSearch').addEventListener('input', renderDict);

  let currentDictType = 'word';
  $$('#dictTypeToggle .tab-btn').forEach(btn => {
    btn.onclick = () => {
      currentDictType = btn.dataset.type;
      $$('#dictTypeToggle .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      const translateBtn = $('#autoTranslateBtn');
      const localBtn = $('#localTranslateBtn');
      if (currentDictType === 'sentence') {
        translateBtn.style.display = 'none';
        localBtn.style.display = 'none';
      } else {
        translateBtn.style.display = 'block';
        localBtn.style.display = 'block';
      }
    };
  });

  $('#addDictBtn').onclick = () => {
    $('#dictOverlay').classList.add('active');
    $('#dictNative').value = ''; $('#dictJp').value = ''; $('#dictRomaji').value = '';
    currentDictType = 'word';
    $$('#dictTypeToggle .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.type === 'word'));
    $('#autoTranslateBtn').style.display = 'block';
    $('#localTranslateBtn').style.display = 'block';
  };
  $('#closeDictBtn').onclick = () => $('#dictOverlay').classList.remove('active');

  const toRomaji = (jpText) => {
    if (window.wanakana) return window.wanakana.toRomaji(jpText);
    return jpText;
  };

  $('#dictJp').addEventListener('input', (e) => {
    const text = e.target.value.trim();
    if (text && window.wanakana) $('#dictRomaji').value = window.wanakana.toRomaji(text);
  });

  $('#localTranslateBtn').onclick = () => {
    const text = $('#dictNative').value.trim().toLowerCase();
    if (!text) { toast('Enter text first!', 'error'); return; }
    const match = DICT_WORDS.find(w => w.en.toLowerCase() === text || w.ru.toLowerCase() === text || w.jp === text);
    if (match) {
      $('#dictJp').value = match.jp;
      $('#dictRomaji').value = match.romaji;
      toast('Found in local dictionary!', 'info');
    } else {
      toast('Not found locally. Try API.', 'error');
    }
  };

  $('#autoTranslateBtn').onclick = async () => {
    const text = $('#dictNative').value.trim();
    if (!text) { toast('Enter text first!', 'error'); return; }
    const isRussian = /[а-яА-ЯёЁ]/.test(text);
    const sourceLang = isRussian ? 'ru' : 'en';
    const btn = $('#autoTranslateBtn');
    btn.textContent = 'Translating...';
    btn.disabled = true;
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=ja&dt=t&dt=rm&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data[0]) {
        const chunks = data[0];
        const jpText = chunks[0][0];
        let romajiText = chunks.slice(1).map(c => c[1] || "").join(' ').trim();
        if (!romajiText) romajiText = toRomaji(jpText);
        if (jpText.toLowerCase() === text.toLowerCase()) {
          toast('Translation failed. Try manual entry.', 'error');
        } else {
          $('#dictJp').value = jpText;
          $('#dictRomaji').value = romajiText;
          toast('Translation successful!', 'info');
        }
      } else {
        toast('Translation failed.', 'error');
      }
    } catch (e) {
      toast('Network error.', 'error');
    } finally {
      btn.textContent = 'AUTO-TRANSLATE (API)';
      btn.disabled = false;
    }
  };

  $('#saveDictBtn').onclick = () => {
    const native = $('#dictNative').value.trim();
    const jp = $('#dictJp').value.trim();
    const romaji = $('#dictRomaji').value.trim();
    if (!native || !jp) { toast('Please fill at least "Your language" and "Japanese".', 'error'); return; }
    state.dict.push({ id: Date.now().toString(), native, jp, romaji, type: currentDictType, added: Date.now() });
    save('dict', state.dict);
    $('#dictOverlay').classList.remove('active');
    renderDict();
    toast('Entry saved!', 'info');
  };

  const startSentence = () => {
    const s = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
    $('#sbPrompt').textContent = `Translate: "${s.en}"`;
    const bank = $('#sbBank'), answer = $('#sbAnswer');
    bank.innerHTML = ''; answer.innerHTML = ''; $('#sbFeedback').textContent = '';
    shuffle(s.jp).forEach(word => {
      const el = document.createElement('div');
      el.className = 'sentence-word';
      el.textContent = word;
      el.onclick = () => {
        el.classList.add('used');
        const a = document.createElement('div');
        a.className = 'sentence-word';
        a.textContent = word;
        a.onclick = () => { a.remove(); el.classList.remove('used'); check(); };
        answer.appendChild(a);
        check();
      };
      bank.appendChild(el);
    });
    const check = () => {
      if (answer.children.length !== s.jp.length) return;
      const current = Array.from(answer.children).map(c => c.textContent);
      if (current.join('') === s.jp.join('')) {
        $('#sbFeedback').textContent = '✓ Correct!';
        $('#sbFeedback').className = 'feedback correct';
        setTimeout(startSentence, 1500);
      } else {
        $('#sbFeedback').textContent = '✗ Incorrect order';
        $('#sbFeedback').className = 'feedback wrong';
        setTimeout(() => { answer.innerHTML = ''; $$('.sentence-word', bank).forEach(b => b.classList.remove('used')); $('#sbFeedback').textContent = ''; }, 1000);
      }
    };
  };

  const startVerb = () => {
    const v = VERBS[Math.floor(Math.random() * VERBS.length)];
    $('#vcVerb').textContent = v.dict;
    $('#vcHint').textContent = `Target: ${v.hint}`;
    const input = $('#vcInput'), fb = $('#vcFeedback');
    input.value = ''; fb.textContent = '';
    input.focus();
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        if (input.value.trim() === v.ans) {
          fb.textContent = '✓ Correct!';
          fb.className = 'feedback correct';
          setTimeout(startVerb, 1500);
        } else {
          fb.textContent = `✗ Answer: ${v.ans}`;
          fb.className = 'feedback wrong';
          setTimeout(startVerb, 2000);
        }
      }
    };
  };

  const startReading = () => {
    const container = $('#readingContainer');
    let html = '';
    for (let char of READING_TEXT.text) {
      const wordKey = Object.keys(READING_TEXT.words).find(k => k.includes(char));
      if (wordKey) html += `<span class="reading-word" data-word="${wordKey}">${char}</span>`;
      else html += char;
    }
    container.innerHTML = html;
    $$('.reading-word', container).forEach(el => {
      el.onclick = () => {
        const data = READING_TEXT.words[el.dataset.word];
        toast(`${el.dataset.word} · Romaji: ${data.romaji} · Meaning: ${data.mean}`);
      };
    });
  };

  const renderLeaderboard = async () => {
    const list = $('#leaderboardList');
    list.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">Loading...</div>`;
    try {
      const res = await fetch(`${API_URL}/leaderboard`);
      const data = await res.json();
      if (!data || data.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No records yet. Be the first!</div>`;
        return;
      }
      const localUsername = localStorage.getItem('km_username') || '';
      list.innerHTML = data.map((u, i) => {
        const isMe = u.username === localUsername;
        const mins = Math.floor(u.time_studied / 60);
        const timeStr = mins > 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`;
        return `
          <div class="dict-item" style="${isMe ? 'border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05);' : ''}">
            <div style="font-family: var(--font-mono); width: 40px; text-align: center; color: ${i<3?'#fff':'var(--text-muted)'}; font-weight: bold;">#${i+1}</div>
            <div class="avatar" style="width: 32px; height: 32px; font-size: 0.7rem;">${u.username[0].toUpperCase()}</div>
            <div class="dict-info" style="margin-left: 1rem;">
              <div class="dict-native">${u.username} ${isMe ? '<span style="font-size:0.6rem; color:var(--accent);">(YOU)</span>' : ''}</div>
            </div>
            <div style="width: 80px; text-align: center; font-family: var(--font-mono); color: var(--accent); font-weight: bold;">${u.mastered}</div>
            <div style="width: 80px; text-align: center; font-family: var(--font-mono);">${u.sessions}</div>
            <div style="width: 100px; text-align: right; font-family: var(--font-mono); color: var(--text-muted);">${timeStr}</div>
          </div>
        `;
      }).join('');
    } catch (e) {
      list.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--status-error);">Failed to load.</div>`;
    }
  };

  const submitScore = async () => {
    let username = localStorage.getItem('km_username');
    if (!username) return;
    const mastered = Object.keys(state.charStats).filter(c => statusOf(c) === 'green').length;
    try {
      await fetch(`${API_URL}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          sessions: state.profile.sessions,
          time_studied: state.profile.timeSec,
          mastered: mastered
        })
      });
      toast('Leaderboard updated!', 'info');
    } catch (e) {}
  };

  const renderProgress = () => {
    const mastered = Object.keys(state.charStats).filter(c => statusOf(c) === 'green').length;
    $('#islandKanji').textContent = mastered;
    $('#islandVocab').textContent = state.dict.length;
    $('#islandSessions').textContent = state.profile.sessions;
  };

  const renderSpeedLives = () => {
    const wrap = $('#speedLives');
    let html = '';
    for (let i = 0; i < 5; i++) {
      const lost = i >= state.speed.lives ? 'lost' : '';
      html += `<svg class="speed-heart ${lost}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.9-10-9.1C.3 8.7 2.4 4.5 6.5 4.5c2.1 0 3.8 1.2 4.5 2.9.7-1.7 2.4-2.9 4.5-2.9 4.1 0 6.2 4.2 4.5 7.4C19.5 16.1 12 21 12 21z"/></svg>`;
    }
    wrap.innerHTML = html;
  };

  const rankFromScore = (score) => {
    if (score >= 95) return 'SSS';
    if (score >= 85) return 'SS';
    if (score >= 75) return 'S';
    if (score >= 60) return 'A';
    if (score >= 45) return 'B';
    if (score >= 30) return 'C';
    return 'D';
  };

  const rankClass = (rank) => {
    const map = { D: 'rank-d', C: 'rank-c', B: 'rank-b', A: 'rank-a', S: 'rank-s', SS: 'rank-ss', SSS: 'rank-sss' };
    return map[rank] || 'rank-d';
  };

  const setSpeedRank = (rank, pop) => {
    const badge = $('#speedRankBadge');
    badge.classList.remove('rank-d', 'rank-c', 'rank-b', 'rank-a', 'rank-s', 'rank-ss', 'rank-sss', 'pop');
    void badge.offsetWidth;
    badge.classList.add(rankClass(rank));
    badge.textContent = rank;
    if (pop) badge.classList.add('pop');
    state.speed.rank = rank;
  };

  const levenshtein = (a, b) => {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    const dp = new Array(n + 1);
    for (let j = 0; j <= n; j++) dp[j] = j;
    for (let i = 1; i <= m; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const tmp = dp[j];
        dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
        prev = tmp;
      }
    }
    return dp[n];
  };

  const similarity = (a, b) => {
    const A = a.toLowerCase().trim();
    const B = b.toLowerCase().trim();
    if (!A && !B) return 100;
    const max = Math.max(A.length, B.length);
    if (!max) return 100;
    const dist = levenshtein(A, B);
    return Math.max(0, Math.round((1 - dist / max) * 100));
  };

  const hasJapaneseChars = (s) => /[\u3040-\u30ff\u4e00-\u9faf]/.test(s);
  const toRomajiLoose = (s) => {
    if (window.wanakana) return window.wanakana.toRomaji(s);
    return s;
  };
  const normalize = (s) => s.toLowerCase().trim();

  const checkAnswer = (given, expected, jpIme) => {
    const g = normalize(given);
    const e = normalize(expected);
    if (!g) return { sim: 0, matchedVariant: null };
    if (hasJapaneseChars(expected)) {
      if (jpIme === 'yes') {
        const simJp = similarity(g, e);
        const romajiExpected = normalize(toRomajiLoose(expected));
        const simRomaji = similarity(g, romajiExpected);
        const best = Math.max(simJp, simRomaji);
        return { sim: best, matchedVariant: simJp >= simRomaji ? 'jp' : 'romaji' };
      } else {
        const romajiExpected = normalize(toRomajiLoose(expected));
        return { sim: similarity(g, romajiExpected), matchedVariant: 'romaji' };
      }
    }
    return { sim: similarity(g, e), matchedVariant: 'plain' };
  };

  const levelFilter = () => {
    const lv = state.speed.level;
    if (!lv || lv === 'quepro') return DICT_WORDS;
    return DICT_WORDS.filter(w => w.level === lv);
  };

  const pickSpeedPair = () => {
    const pool = levelFilter().filter(w => w.en && w.ru && w.jp && w.romaji);
    if (!pool.length) {
      return { prompt: 'error', answer: 'error', lang: 'Error', answerLang: 'Error', jp: false, isJpAnswer: false };
    }
    const item = pool[Math.floor(Math.random() * pool.length)];
    const native = state.speed.nativeLang;
    const nativeWord = native === 'ru' ? item.ru : item.en;
    const nativeLangName = native === 'ru' ? 'Русский' : 'English';
    const dir = state.speed.direction;

    if (dir === 'native2jp') {
      return {
        prompt: nativeWord,
        answer: item.jp,
        lang: nativeLangName,
        answerLang: '日本語',
        jp: false,
        isJpAnswer: true
      };
    } else {
      return {
        prompt: item.jp,
        answer: nativeWord,
        lang: '日本語',
        answerLang: nativeLangName,
        jp: true,
        isJpAnswer: false
      };
    }
  };

  const hideAllSpeedSections = () => {
    ['speedNative', 'speedDirection', 'speedSetup', 'speedLevel', 'speedIntro', 'speedFlashWrap', 'speedAnswerWrap', 'speedSessionEnd'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
  };

  const showSpeedNative = () => {
    hideAllSpeedSections();
    $('#speedNative').classList.add('active');
    $('#speedEndBtn').style.display = 'none';
    $$('.speed-native-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.native === state.speed.nativeLang);
    });
  };

  const showSpeedDirection = () => {
    hideAllSpeedSections();
    $('#speedDirection').classList.add('active');
    $('#speedEndBtn').style.display = 'none';
    const nativeName = state.speed.nativeLang === 'ru' ? 'Русский' : 'English';
    const native2jpTitle = document.querySelector('.speed-direction-card[data-dir="native2jp"] .speed-level-title');
    const jp2nativeTitle = document.querySelector('.speed-direction-card[data-dir="jp2native"] .speed-level-title');
    if (native2jpTitle) native2jpTitle.textContent = `${nativeName} → Japanese`;
    if (jp2nativeTitle) jp2nativeTitle.textContent = `Japanese → ${nativeName}`;
    $$('.speed-direction-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.dir === state.speed.direction);
    });
  };

  const showSpeedSetup = () => {
    hideAllSpeedSections();
    $('#speedSetup').classList.add('active');
    $('#speedEndBtn').style.display = 'none';
    const note = $('#speedSetupNote');
    if (state.speed.jpIme === 'yes') note.textContent = 'Japanese IME: enabled — Japanese answers can be typed as kana/kanji or romaji';
    else if (state.speed.jpIme === 'no') note.textContent = 'Japanese IME: not available — Japanese answers will be typed in romaji';
    else note.textContent = '';
  };

  const showSpeedLevel = () => {
    hideAllSpeedSections();
    $('#speedLevel').classList.add('active');
    $('#speedEndBtn').style.display = 'none';
    $$('#speedLevelGrid .speed-level-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.level === state.speed.level);
    });
    const note = $('#speedLevelNote');
    note.textContent = state.speed.level ? `Selected: ${state.speed.level.toUpperCase()}` : 'No level selected yet';
  };

  const showSpeedIntro = () => {
    hideAllSpeedSections();
    $('#speedIntro').classList.add('active');
    $('#speedEndBtn').style.display = 'none';
    $('#speedSettingsPopover').classList.remove('active');
    $('#speedSettingsBtn').classList.remove('active');
  };

  const openSpeed = () => {
    state.speed.active = false;
    state.speed.phase = 'idle';
    state.speed.lives = 5;
    state.speed.streak = 0;
    state.speed.score = 0;
    state.speed.totalScore = 0;
    state.speed.correct = 0;
    state.speed.total = 0;
    state.speed.answerTime = 15000;
    state.speed.rank = 'D';
    clearSpeedTimers();
    renderSpeedLives();
    $('#speedStreak').textContent = 'Streak 0';
    $('#speedSessionTimer').textContent = '3:00';
    setSpeedRank('D', false);
    $('#speedInput').value = '';
    $('#speedFeedback').textContent = '';
    $('#speedFeedback').className = 'feedback';
    $('#speedTimerBar').style.width = '100%';
    $('#speedTimerBar').className = 'speed-timer-bar';
    go('speed');

    if (!state.speed.nativeLang) {
      showSpeedNative();
    } else if (!state.speed.direction) {
      showSpeedDirection();
    } else if (!state.speed.jpIme) {
      showSpeedSetup();
    } else if (!state.speed.level) {
      showSpeedLevel();
    } else {
      showSpeedIntro();
    }
  };

  const clearSpeedTimers = () => {
    if (state.speed.answerTimer) { clearInterval(state.speed.answerTimer); state.speed.answerTimer = null; }
    if (state.speed.sessionTimer) { clearInterval(state.speed.sessionTimer); state.speed.sessionTimer = null; }
    state.speed.flashTimers.forEach(t => clearTimeout(t));
    state.speed.flashTimers = [];
  };

  const startSpeedSession = () => {
    if (!state.speed.nativeLang) { showSpeedNative(); return; }
    if (!state.speed.direction) { showSpeedDirection(); return; }
    if (!state.speed.jpIme) { showSpeedSetup(); return; }
    if (!state.speed.level) { showSpeedLevel(); return; }

    state.speed.active = true;
    state.speed.phase = 'flash';
    state.speed.lives = 5;
    state.speed.streak = 0;
    state.speed.score = 0;
    state.speed.totalScore = 0;
    state.speed.correct = 0;
    state.speed.total = 0;
    state.speed.answerTime = 15000;
    state.speed.sessionStart = Date.now();
    state.speed.sessionEnd = state.speed.sessionStart + 180000;
    state.speed.inputLocked = false;
    state.speed.rank = 'D';
    renderSpeedLives();
    $('#speedStreak').textContent = 'Streak 0';
    setSpeedRank('D', false);
    $('#speedSetup').classList.remove('active');
    $('#speedLevel').classList.remove('active');
    $('#speedIntro').classList.remove('active');
    $('#speedSessionEnd').classList.remove('active');
    $('#speedNative').classList.remove('active');
    $('#speedDirection').classList.remove('active');
    $('#speedEndBtn').style.display = 'inline-flex';
    $('#speedInput').value = '';
    $('#speedFeedback').textContent = '';
    $('#speedFeedback').className = 'feedback';

    clearInterval(state.speed.sessionTimer);
    state.speed.sessionTimer = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, state.speed.sessionEnd - now);
      $('#speedSessionTimer').textContent = fmtTime(Math.ceil(left / 1000));
      if (left <= 0) endSpeed(true);
    }, 100);

    nextSpeedRound();
  };

  const nextSpeedRound = () => {
    if (!state.speed.active) return;
    if (state.speed.lives <= 0) { endSpeed(true); return; }
    if (Date.now() >= state.speed.sessionEnd) { endSpeed(true); return; }

    state.speed.phase = 'flash';
    const pair = pickSpeedPair();
    state.speed.current = pair;
    state.speed.inputLocked = false;

    const flashWrap = $('#speedFlashWrap');
    const flashWord = $('#speedFlashWord');
    const flashLang = $('#speedFlashLang');
    const answerWrap = $('#speedAnswerWrap');

    answerWrap.classList.remove('active');
    flashWrap.classList.add('active');

    flashWord.className = 'speed-flash-word' + (pair.jp ? ' jp' : '');
    flashWord.textContent = pair.prompt;
    flashLang.textContent = pair.lang;
    flashLang.className = 'speed-flash-lang';

    const flashShowMs = 900;
    const flashHoldMs = 1500;

    state.speed.flashTimers.push(setTimeout(() => {
      flashWord.classList.add('show');
      flashLang.classList.add('show');
    }, 50));

    state.speed.flashTimers.push(setTimeout(() => {
      flashWord.classList.remove('show');
      flashWord.classList.add('hide');
      flashLang.classList.remove('show');
    }, flashShowMs + flashHoldMs));

    state.speed.flashTimers.push(setTimeout(() => {
      flashWrap.classList.remove('active');
      startAnswerPhase();
    }, flashShowMs + flashHoldMs + 300));
  };

  const startAnswerPhase = () => {
    if (!state.speed.active) return;
    state.speed.phase = 'answer';
    const answerWrap = $('#speedAnswerWrap');
    answerWrap.classList.add('active');
    const input = $('#speedInput');
    input.value = '';
    input.disabled = false;
    input.className = 'text-input speed-input';
    const isJpAnswer = state.speed.current && state.speed.current.isJpAnswer;
    if (isJpAnswer && state.speed.jpIme === 'no') {
      input.placeholder = 'Type in romaji...';
    } else if (isJpAnswer) {
      input.placeholder = 'Type kana, kanji or romaji...';
    } else {
      input.placeholder = 'Type the translation...';
    }
    $('#speedFeedback').textContent = '';
    $('#speedFeedback').className = 'feedback';
    setTimeout(() => input.focus(), 50);

    state.speed.answerStart = Date.now();
    const total = state.speed.answerTime;
    const bar = $('#speedTimerBar');
    bar.style.width = '100%';
    bar.className = 'speed-timer-bar';

    clearInterval(state.speed.answerTimer);
    state.speed.answerTimer = setInterval(() => {
      const elapsed = Date.now() - state.speed.answerStart;
      const left = Math.max(0, total - elapsed);
      const pct = (left / total) * 100;
      bar.style.width = `${pct}%`;
      if (pct <= 33) bar.className = 'speed-timer-bar danger';
      else if (pct <= 66) bar.className = 'speed-timer-bar warn';
      if (left <= 0) {
        clearInterval(state.speed.answerTimer);
        state.speed.answerTimer = null;
        handleSpeedTimeout();
      }
    }, 50);
  };

  const handleSpeedTimeout = () => {
    if (!state.speed.active) return;
    if (state.speed.inputLocked) return;
    state.speed.inputLocked = true;
    const fb = $('#speedFeedback');
    const cur = state.speed.current;
    let hint = cur.answer;
    if (cur.isJpAnswer && state.speed.jpIme === 'no') hint = toRomajiLoose(cur.answer);
    fb.textContent = `Timeout — answer: ${hint}`;
    fb.className = 'feedback wrong';
    loseSpeedLife();
    state.speed.streak = 0;
    $('#speedStreak').textContent = 'Streak 0';
    setTimeout(() => {
      if (state.speed.active) nextSpeedRound();
    }, 1200);
  };

  const loseSpeedLife = () => {
    state.speed.lives = Math.max(0, state.speed.lives - 1);
    renderSpeedLives();
    if (state.speed.lives <= 0) {
      setTimeout(() => endSpeed(true), 600);
    }
  };

  const submitSpeedAnswer = () => {
    if (!state.speed.active || state.speed.phase !== 'answer' || state.speed.inputLocked) return;
    const input = $('#speedInput');
    const val = input.value.trim();
    if (!val) return;

    state.speed.inputLocked = true;
    clearInterval(state.speed.answerTimer);
    state.speed.answerTimer = null;
    input.disabled = true;

    const total = state.speed.answerTime;
    const elapsed = Date.now() - state.speed.answerStart;
    const timeUsedPct = Math.min(100, Math.round((elapsed / total) * 100));
    const cur = state.speed.current;
    const result = checkAnswer(val, cur.answer, state.speed.jpIme);
    const sim = result.sim;
    const fb = $('#speedFeedback');

    if (sim >= 80) {
      const rawScore = Math.max(0, sim - timeUsedPct);
      const add = Math.min(100, rawScore);
      state.speed.score += add;
      state.speed.totalScore += add;
      state.speed.correct++;
      state.speed.total++;
      state.speed.streak++;
      if (state.speed.streak > state.speed.bestStreak) state.speed.bestStreak = state.speed.streak;
      $('#speedStreak').textContent = `Streak ${state.speed.streak}`;

      fb.textContent = `+${add} (${sim}% match · ${timeUsedPct}% time)`;
      fb.className = 'feedback correct';

      if (state.speed.answerTime > 3000) {
        state.speed.answerTime = Math.max(3000, state.speed.answerTime - 500);
      }

      setSpeedRank(rankFromScore(sim), true);

      setTimeout(() => {
        if (state.speed.active) nextSpeedRound();
      }, 800);
    } else {
      let shownAnswer = cur.answer;
      if (cur.isJpAnswer && state.speed.jpIme === 'no') shownAnswer = toRomajiLoose(cur.answer);
      fb.textContent = `Wrong — answer: ${shownAnswer}`;
      fb.className = 'feedback wrong';
      state.speed.total++;
      state.speed.streak = 0;
      $('#speedStreak').textContent = 'Streak 0';

      setSpeedRank(rankFromScore(sim), true);

      loseSpeedLife();
      setTimeout(() => {
        if (state.speed.active) nextSpeedRound();
      }, 1200);
    }
  };

  const endSpeed = (showResults) => {
    if (!state.speed.active) return;
    state.speed.active = false;
    state.speed.phase = 'idle';
    clearSpeedTimers();
    $('#speedEndBtn').style.display = 'none';
    const elapsed = state.speed.sessionStart ? Math.floor((Date.now() - state.speed.sessionStart) / 1000) : 0;
    if (showResults) {
      const avg = state.speed.total ? Math.round(state.speed.totalScore / state.speed.total) : 0;
      const finalRank = rankFromScore(avg);
      $('#speedEndRank').textContent = finalRank;
      $('#speedEndScore').textContent = state.speed.totalScore;
      $('#speedEndCorrect').textContent = state.speed.correct;
      $('#speedEndWords').textContent = state.speed.total;
      $('#speedSessionEnd').classList.add('active');
      $('#speedSetup').classList.remove('active');
      $('#speedLevel').classList.remove('active');
      $('#speedIntro').classList.remove('active');
      $('#speedFlashWrap').classList.remove('active');
      $('#speedAnswerWrap').classList.remove('active');
      $('#speedNative').classList.remove('active');
      $('#speedDirection').classList.remove('active');
      if (elapsed > 0) {
        state.profile.sessions++;
        state.profile.timeSec += elapsed;
        save('profile', state.profile);
      }
      setSpeedRank(finalRank, true);
    } else {
      if (!state.speed.nativeLang) showSpeedNative();
      else if (!state.speed.direction) showSpeedDirection();
      else if (!state.speed.jpIme) showSpeedSetup();
      else if (!state.speed.level) showSpeedLevel();
      else showSpeedIntro();
    }
  };

  $$('.speed-native-card').forEach(card => {
    card.onclick = () => {
      state.speed.nativeLang = card.dataset.native;
      localStorage.setItem('km_speed_native', state.speed.nativeLang);
      showSpeedDirection();
    };
  });

  $$('.speed-direction-card').forEach(card => {
    card.onclick = () => {
      state.speed.direction = card.dataset.dir;
      localStorage.setItem('km_speed_direction', state.speed.direction);
      showSpeedSetup();
    };
  });

  $('#speedKbYes').onclick = () => {
    state.speed.jpIme = 'yes';
    localStorage.setItem('km_speed_jpime', 'yes');
    showSpeedLevel();
  };

  $('#speedKbNo').onclick = () => {
    state.speed.jpIme = 'no';
    localStorage.setItem('km_speed_jpime', 'no');
    showSpeedLevel();
  };

  $('#speedSettingsBtn').onclick = (e) => {
    e.stopPropagation();
    $('#speedSettingsBtn').classList.toggle('active');
    $('#speedSettingsPopover').classList.toggle('active');
  };

  document.addEventListener('click', (e) => {
    const popover = $('#speedSettingsPopover');
    const btn = $('#speedSettingsBtn');
    if (popover && popover.classList.contains('active')) {
      if (!e.target.closest('#speedSettingsWrap')) {
        popover.classList.remove('active');
        btn.classList.remove('active');
      }
    }
  });

  $('#speedChangeLangBtn').onclick = () => {
    $('#speedSettingsBtn').classList.remove('active');
    $('#speedSettingsPopover').classList.remove('active');
    showSpeedNative();
  };

  $('#speedChangeLevelBtn').onclick = () => {
    $('#speedSettingsBtn').classList.remove('active');
    $('#speedSettingsPopover').classList.remove('active');
    showSpeedLevel();
  };

  $('#speedChangeKbBtn').onclick = () => {
    $('#speedSettingsBtn').classList.remove('active');
    $('#speedSettingsPopover').classList.remove('active');
    showSpeedSetup();
  };

  $$('#speedLevelGrid .speed-level-card').forEach(card => {
    card.onclick = () => {
      state.speed.level = card.dataset.level;
      localStorage.setItem('km_speed_level', state.speed.level);
      $$('#speedLevelGrid .speed-level-card').forEach(c => c.classList.toggle('selected', c === card));
      const note = $('#speedLevelNote');
      note.textContent = `Selected: ${state.speed.level.toUpperCase()}`;
      setTimeout(() => showSpeedIntro(), 250);
    };
  });

  $('#speedStartBtn').onclick = () => {
    startSpeedSession();
  };
  $('#speedRestartBtn').onclick = () => startSpeedSession();
  $('#speedEndBtn').onclick = () => endSpeed(true);

  $('#speedInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitSpeedAnswer();
    }
  });

  $('#closeSettingsBtn').onclick = () => $('#settingsOverlay').classList.remove('active');

  $$('#lengthGrid .tab-btn').forEach(btn => {
    btn.onclick = () => {
      state.settings.length = parseInt(btn.dataset.length, 10);
      save('settings', state.settings);
      $$('#lengthGrid .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    };
  });

  $$('.method-checkbox input').forEach(cb => {
    cb.addEventListener('change', () => {
      const checked = $$('.method-checkbox input:checked').map(c => c.value);
      if (checked.length === 0) { cb.checked = true; toast('At least one method required', 'error'); return; }
      state.settings.methods = checked;
      save('settings', state.settings);
    });
  });

  $('#profileBtn').onclick = () => {
    const acc = state.profile.total ? Math.round((state.profile.correct / state.profile.total) * 100) : 0;
    const mins = Math.floor(state.profile.timeSec / 60);
    const username = localStorage.getItem('km_username') || '';
    
    $('#profSessions').textContent = state.profile.sessions;
    $('#profAccuracy').textContent = `${acc}%`;
    $('#profMastered').textContent = Object.keys(state.charStats).filter(c => statusOf(c) === 'green').length;
    $('#profTime').textContent = `${mins}m`;
    $('#profileAvatarText').textContent = username ? username[0].toUpperCase() : 'KM';
    $('#usernameInput').value = username;
    $('#profileOverlay').classList.add('active');
  };
  $('#closeProfileBtn').onclick = () => $('#profileOverlay').classList.remove('active');

  $('#usernameInput').addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) {
      localStorage.setItem('km_username', val);
      $('#profileAvatarText').textContent = val[0].toUpperCase();
    }
  });

  $('#updateLeaderboardBtn').onclick = () => {
    if (!localStorage.getItem('km_username')) {
      toast('Please enter a nickname first!', 'error');
      return;
    }
    submitScore();
    $('#profileOverlay').classList.remove('active');
  };

  $('#resetBtn').onclick = () => {
    if (confirm('Reset ALL progress? This cannot be undone.')) { localStorage.clear(); location.reload(); }
  };

  $('#startKanaBtn').onclick = startKana;

  document.addEventListener('click', e => {
    if (e.target.id === 'refreshLeaderboardBtn') renderLeaderboard();
  });

  $$('.overlay').forEach(o => {
    o.onclick = (e) => { if (e.target === o) o.classList.remove('active'); };
  });

  const extTabsWrap = document.getElementById('fx-tabs');
  if (extTabsWrap) {
    const extTabs = extTabsWrap.querySelectorAll('.ext-tab');
    
    extTabsWrap.addEventListener('click', (e) => {
      const clickedTab = e.target.closest('.ext-tab');
      if (!clickedTab) return;

      if (clickedTab.dataset.nav) {
        go(clickedTab.dataset.nav);
      }
      
      if (clickedTab.id === 'extSettingsBtn') {
        $('#settingsOverlay').classList.add('active');
      }

      extTabs.forEach(t => t.classList.remove('active'));
      clickedTab.classList.add('active');
    });
  }

  const initTilt = () => {
    const cards = document.querySelectorAll('.training-card');
    cards.forEach(card => {
      let glare = card.querySelector('.tilt-glare');
      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'tilt-glare';
        card.appendChild(glare);
      }

      const handleMove = (e) => {
        const rect = card.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const mouseX = clientX - (rect.left + rect.width / 2);
        const mouseY = clientY - (rect.top + rect.height / 2);
        
        card.style.transform = `translateY(-4px) rotateX(${-(mouseY / 15)}deg) rotateY(${mouseX / 15}deg)`;
        glare.style.opacity = '1';
        
        const px = ((clientX - rect.left) / rect.width) * 100;
        const py = ((clientY - rect.top) / rect.height) * 100;
        
        const isHovered = card.matches(':hover');
        const glareColor = isHovered ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';
        glare.style.background = `radial-gradient(circle at ${px}% ${py}%, ${glareColor}, transparent 60%)`;
      };

      const reset = () => {
        card.style.transform = `translateY(0) rotateX(0deg) rotateY(0deg)`;
        glare.style.opacity = '0';
      };

      card.addEventListener('mousemove', handleMove);
      card.addEventListener('touchmove', handleMove, { passive: true });
      card.addEventListener('mouseleave', reset);
      card.addEventListener('touchend', reset);
    });
  };

  const initPencilLines = () => {
    const cards = document.querySelectorAll('.training-card');
    
    cards.forEach(card => {
      let canvas = card.querySelector('.pencil-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'pencil-canvas';
        card.prepend(canvas);
      }
      const ctx = canvas.getContext('2d');
      
      let width = card.clientWidth;
      let height = card.clientHeight;
      canvas.width = width;
      canvas.height = height;

      let lines = [];
      let animationFrame;
      let isHovered = false;

      function createRandomLine() {
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        
        const points = [];
        let currentX = startX;
        let currentY = startY;
        
        const numPoints = 4 + Math.floor(Math.random() * 8);
        const angle = (Math.random() * Math.PI * 2);
        const speed = 10 + Math.random() * 20;

        for (let i = 0; i < numPoints; i++) {
          points.push({ x: currentX, y: currentY });
          currentX += Math.cos(angle) * speed + (Math.random() - 0.5) * 15;
          currentY += Math.sin(angle) * speed + (Math.random() - 0.5) * 15;
        }

        return {
          points: points,
          alpha: 0.6 + Math.random() * 0.4,
          fadeSpeed: 0.003 + Math.random() * 0.005,
          moveX: (Math.random() - 0.5) * 3,
          moveY: -1 - Math.random() * 3
        };
      }

      function draw() {
        if (!isHovered && lines.length === 0) return;
        
        ctx.clearRect(0, 0, width, height);
        let activeLines = 0;

        lines.forEach(line => {
          if (line.alpha > 0) {
            activeLines++;
            line.alpha -= line.fadeSpeed;
            line.points.forEach(p => {
              p.x += line.moveX;
              p.y += line.moveY;
            });

            ctx.beginPath();
            ctx.moveTo(line.points[0].x, line.points[0].y);
            for (let i = 1; i < line.points.length; i++) {
              const jx = line.points[i].x + (Math.random() - 0.5) * 2;
              const jy = line.points[i].y + (Math.random() - 0.5) * 2;
              ctx.lineTo(jx, jy);
            }
            
            ctx.strokeStyle = `rgba(0, 0, 0, ${line.alpha})`;
            ctx.lineWidth = 1 + Math.random() * 0.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
          }
        });

        if (activeLines === 0) {
          lines = [];
        } else {
          animationFrame = requestAnimationFrame(draw);
        }
      }

      card.addEventListener('mouseenter', () => {
        isHovered = true;
        width = card.clientWidth;
        height = card.clientHeight;
        canvas.width = width;
        canvas.height = height;

        lines = [];
        const numLines = 20 + Math.floor(Math.random() * 15);
        for (let i = 0; i < numLines; i++) {
          lines.push(createRandomLine());
        }
        
        if (animationFrame) cancelAnimationFrame(animationFrame);
        draw();
      });

      card.addEventListener('mouseleave', () => {
        isHovered = false;
        ctx.clearRect(0, 0, width, height);
        lines = [];
        if (animationFrame) cancelAnimationFrame(animationFrame);
      });
    });
  };

  load();
  go('menu');
  initTilt();
  initPencilLines();
});
