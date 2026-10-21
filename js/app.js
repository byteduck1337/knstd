document.addEventListener('DOMContentLoaded', () => {
  const state = {
    screen: 'menu', tab: 'hiragana', groups: [],
    settings: { length: 20, methods: ['qe', 'flashcard', 'mc', 'romajiSelect', 'stroke'] },
    profile: { sessions: 0, correct: 0, total: 0, timeSec: 0 },
    charStats: {}, srs: {}, dict: [],
    train: { mode: null, queue: [], index: 0, total: 0, correct: 0, score: 0, startTime: 0, locked: false, cleanup: null, timer: null, hudTimer: null }
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
  };
  const save = (key, val) => localStorage.setItem(`km_${key}`, JSON.stringify(val));

  const go = (name) => {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`screen-${name}`);
    if (el) el.classList.add('active');
    state.screen = name;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name !== 'training' && state.train.mode) endTraining();
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
    if (text && window.wanakana) {
      $('#dictRomaji').value = window.wanakana.toRomaji(text);
    }
  });

  // Кнопка M (Локальный словарь)
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

  // Кнопка API (Google Translate)
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

  const renderLeaderboard = () => {
    const users = [
      { name: 'You', xp: state.profile.correct * 10, me: true },
      { name: 'Tanuki', xp: 1500 }, { name: 'Sakura', xp: 1200 }, { name: 'Kenji', xp: 1000 }, { name: 'Yuki', xp: 800 }
    ].sort((a,b) => b.xp - a.xp);
    $('#leaderboardList').innerHTML = users.map((u, i) => `
      <div class="dict-item" style="${u.me ? 'border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05);' : ''}">
        <div style="font-family: var(--font-mono); width: 40px; color: ${i===0?'#fff':'var(--text-muted)'}">#${i+1}</div>
        <div class="avatar" style="width: 32px; height: 32px; font-size: 0.7rem;">${u.name[0]}</div>
        <div class="dict-info"><div class="dict-native">${u.name}</div></div>
        <div style="font-family: var(--font-mono); font-weight: 600;">${u.xp} XP</div>
      </div>
    `).join('');
  };

  const renderProgress = () => {
    const mastered = Object.keys(state.charStats).filter(c => statusOf(c) === 'green').length;
    $('#islandKanji').textContent = mastered;
    $('#islandVocab').textContent = state.dict.length;
    $('#islandSessions').textContent = state.profile.sessions;
  };

  $('#settingsBtn').onclick = () => {
    $('#settingsOverlay').classList.add('active');
    $$('#lengthGrid .tab-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.length, 10) === state.settings.length));
    $$('.method-checkbox input').forEach(cb => cb.checked = state.settings.methods.includes(cb.value));
  };
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
    const level = Math.floor(state.profile.correct / 50) + 1;
    
    $('#profSessions').textContent = state.profile.sessions;
    $('#profAccuracy').textContent = `${acc}%`;
    $('#profMastered').textContent = Object.keys(state.charStats).filter(c => statusOf(c) === 'green').length;
    $('#profTime').textContent = `${mins}m`;
    $('#profLevel').textContent = level;
    
    $('#profileOverlay').classList.add('active');
  };
  $('#closeProfileBtn').onclick = () => $('#profileOverlay').classList.remove('active');

  $('#resetBtn').onclick = () => {
    if (confirm('Reset ALL progress? This cannot be undone.')) { localStorage.clear(); location.reload(); }
  };

  $('#startKanaBtn').onclick = startKana;

  $$('.overlay').forEach(o => {
    o.onclick = (e) => { if (e.target === o) o.classList.remove('active'); };
  });

  load();
  go('menu');
});