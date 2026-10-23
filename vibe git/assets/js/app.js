/* Dev Instruments — core, router and static views */
(function () {
  'use strict';

  var KEY = 'dev-instruments-v2';
  var state = load();
  var cleanup = null;
  var app = document.getElementById('app');

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          data.done = data.done || {};
          data.learned = data.learned || {};
          data.missions = data.missions || {};
          return data;
        }
      }
    } catch (e) { /* file:// and private mode */ }
    return { done: {}, learned: {}, missions: {} };
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function allCmd() { return window.CMD_DATA.groups.reduce(function (a, g) { return a.concat(g.items); }, []); }
  function allGit() { return window.GIT_DATA.groups.reduce(function (a, g) { return a.concat(g.items); }, []); }
  function trackData(track) { return track === 'cmd' ? window.CMD_DATA : window.GIT_DATA; }
  function trackTasks(track) { return track === 'cmd' ? window.CMD_TASKS : window.GIT_TASKS; }
  function trackItems(track) { return track === 'cmd' ? allCmd() : allGit(); }

  function doneCount(track) {
    return trackTasks(track).filter(function (t) { return state.done[t.id]; }).length;
  }
  function learnedCount(track) {
    return trackItems(track).filter(function (i) { return state.learned[track + ':' + i.id]; }).length;
  }
  function computeXP() {
    var xp = 0;
    window.CMD_TASKS.concat(window.GIT_TASKS).forEach(function (t) { if (state.done[t.id]) xp += t.xp || 10; });
    (window.MISSIONS || []).forEach(function (m) { if (state.missions[m.id]) xp += m.xp || 20; });
    return xp;
  }
  function levelInfo() {
    var xp = computeXP();
    var per = 150;
    var level = Math.floor(xp / per) + 1;
    var rest = xp % per;
    return { xp: xp, level: level, rest: rest, per: per, left: per - rest };
  }

  function updateChrome() {
    var ct = window.CMD_TASKS.length, gt = window.GIT_TASKS.length;
    var c = doneCount('cmd'), g = doneCount('git');
    var nc = document.getElementById('nav-cmd-count');
    var ng = document.getElementById('nav-git-count');
    if (nc) { nc.textContent = c + '/' + ct; nc.classList.toggle('done', c === ct); }
    if (ng) { ng.textContent = g + '/' + gt; ng.classList.toggle('done', g === gt); }
    var info = levelInfo();
    var xv = document.getElementById('xp-value');
    if (xv) xv.textContent = info.xp + ' XP';
    var bar = document.getElementById('xp-bar');
    if (bar) bar.style.width = Math.round(info.rest / info.per * 100) + '%';
    var hint = document.getElementById('xp-hint');
    if (hint) hint.textContent = 'Уровень ' + info.level + ' · ещё ' + info.left + ' XP до следующего';
  }

  function toast(text, type) {
    var stack = document.getElementById('toast-stack');
    if (!stack) return;
    var t = document.createElement('div');
    t.className = 'toast toast--' + (type || 'info');
    t.textContent = text;
    stack.appendChild(t);
    setTimeout(function () {
      t.classList.add('out');
      setTimeout(function () { t.remove(); }, 320);
    }, 2600);
  }

  function confetti() {
    var wrap = document.getElementById('confetti');
    if (!wrap) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var colors = ['#4ade80', '#22d3ee', '#fb923c', '#a78bfa', '#facc15', '#f472b6'];
    for (var i = 0; i < 34; i++) {
      var p = document.createElement('i');
      p.style.left = (45 + Math.random() * 10) + '%';
      p.style.top = '-12px';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() * 460 - 230) + 'px');
      p.style.animationDelay = (Math.random() * 0.18) + 's';
      p.style.animationDuration = (0.9 + Math.random() * 0.5) + 's';
      wrap.appendChild(p);
      setTimeout(function (node) { return function () { node.remove(); }; }(p), 1800);
    }
  }

  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      ta.remove();
      toast('Скопировано', 'ok');
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast('Скопировано', 'ok'); }, fallback);
    } else fallback();
  }

  function setActiveNav(path) {
    document.querySelectorAll('.nav__link').forEach(function (a) {
      var r = a.getAttribute('data-route');
      a.classList.toggle('active', r === path);
    });
  }

  function nextTask(track) {
    return trackTasks(track).filter(function (t) { return !state.done[t.id]; })[0] || null;
  }

  function trackCard(track) {
    var isCmd = track === 'cmd';
    var data = trackData(track);
    var items = trackItems(track);
    var tasks = trackTasks(track);
    var learned = learnedCount(track);
    var done = doneCount(track);
    var next = nextTask(track);
    var pct = Math.round(learned / items.length * 100);
    return '' +
      '<article class="track-card track-card--' + track + '">' +
        '<div class="track-card__top">' +
          '<div class="track-card__icon">' + (isCmd ? '⌨️' : '⑂') + '</div>' +
          '<div><h3>' + data.title + '</h3><div class="track-card__sub">' + (isCmd ? 'windows shell · .bat' : 'version control · branching') + '</div></div>' +
        '</div>' +
        '<p>' + data.tagline + '</p>' +
        '<div class="track-card__stats">' +
          '<div><b>' + items.length + '</b>команд</div>' +
          '<div><b>' + tasks.length + '</b>заданий</div>' +
          '<div><b>' + done + '</b>решено</div>' +
        '</div>' +
        '<div class="bar bar--' + track + '"><i style="width:' + pct + '%"></i></div>' +
        '<div class="track-card__foot">' +
          '<span class="small dim">Изучено ' + learned + ' из ' + items.length + '</span>' +
          '<div class="track-card__links">' +
            '<a class="btn btn--sm" href="#/' + track + '">Теория</a>' +
            (next
              ? '<a class="btn btn--sm btn--primary" href="#/' + track + '/practice?task=' + next.id + '">Продолжить →</a>'
              : '<a class="btn btn--sm" href="#/' + track + '/practice">Все решены ✓</a>') +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ---------------- Home ---------------- */
  function renderHome() {
    var totalTasks = window.CMD_TASKS.length + window.GIT_TASKS.length;
    var totalDone = doneCount('cmd') + doneCount('git');
    var totalItems = allCmd().length + allGit().length;
    var totalLearned = learnedCount('cmd') + learnedCount('git');
    var missionsDone = (window.MISSIONS || []).filter(function (m) { return state.missions[m.id]; }).length;
    var info = levelInfo();

    app.innerHTML = '<div class="page">' +
      '<section class="hero">' +
        '<div>' +
          '<div class="hero__badge"><b>2026</b> Windows CMD + Git · тренажёр</div>' +
          '<h1>Терминал — это мышца.<span class="grad-cmd">Тренируй её.</span></h1>' +
          '<p class="lead">Не конспект, который страшно открыть. Короткая теория, живые песочницы, анимации веток и задания с проверкой — пока команды не начнут отскакивать от зубов.</p>' +
          '<div class="hero__actions">' +
            '<a class="btn btn--primary" href="#/cmd/practice">Начать тренировку →</a>' +
            '<a class="btn" href="#/git/play">Посмотреть анимацию Git</a>' +
          '</div>' +
          '<div class="hero__meta">' +
            '<div><b>' + totalItems + '</b>команд в теории</div>' +
            '<div><b>' + totalTasks + '</b>заданий с проверкой</div>' +
            '<div><b>' + info.xp + '</b>опыта набрано</div>' +
          '</div>' +
        '</div>' +
        '<div class="hero-term">' +
          '<div class="hero-term__bar"><span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span><span class="hero-term__title">dev-instruments — bash</span></div>' +
          '<div class="hero-term__body" id="hero-term-body"></div>' +
        '</div>' +
      '</section>' +

      '<section class="card-grid card-grid--2">' + trackCard('cmd') + trackCard('git') + '</section>' +

      '<section class="section">' +
        '<div class="section__head"><div><h2>Как это работает</h2><p>Четыре шага, которые не дают просто пролистать.</p></div></div>' +
        '<div class="card-grid card-grid--4">' +
          '<div class="step-card"><b>01 / ТЕОРИЯ</b><h4>Прочитал — понял</h4><p>Каждая команда: синтаксис, живой пример, подводный камень. Отмечай изученное, чтобы видеть прогресс.</p></div>' +
          '<div class="step-card"><b>02 / ПЕСОЧНИЦА</b><h4>Потрогал — запомнил</h4><p>Виртуальная файловая система и настоящий граф Git. Ошибки безопасны, история видна.</p></div>' +
          '<div class="step-card"><b>03 / ЗАДАНИЯ</b><h4>Решил — закрепил</h4><p>Ввод команды, выбор, сопоставление, порядок шагов. Мгновенная проверка и объяснение.</p></div>' +
          '<div class="step-card"><b>04 / АНИМАЦИИ</b><h4>Увидел — не забудешь</h4><p>Fast-forward, rebase, cherry-pick, reset — по шагам на графе, а не на картинке в конспекте.</p></div>' +
        '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="section__head"><div><h2>Твой прогресс</h2><p>Всё хранится локально в браузере — можно закрыть и вернуться.</p></div></div>' +
        '<div class="panel" style="display:flex;flex-wrap:wrap;gap:28px;align-items:center;justify-content:space-between">' +
          '<div class="practice-top__stats" style="gap:34px">' +
            '<div><b class="green">' + totalDone + '</b>заданий решено</div>' +
            '<div><b>' + totalLearned + '</b>команд изучено</div>' +
            '<div><b>' + missionsDone + '</b>миссий в песочницах</div>' +
            '<div><b class="orange">' + info.level + '</b>уровень</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<a class="btn" href="#/cmd/play">CMD-песочница</a>' +
            '<a class="btn btn--git" href="#/git/play">Git-визуализатор</a>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="panel" style="display:flex;flex-wrap:wrap;align-items:center;gap:24px;justify-content:space-between;border-color:rgba(103,232,249,.2);background:linear-gradient(120deg,rgba(103,232,249,.06),rgba(14,22,38,.6))">' +
          '<div style="max-width:620px">' +
            '<div class="eyebrow">Шпаргалка</div>' +
            '<h3 style="font-size:24px;margin-bottom:8px">Всё самое нужное — на одну страницу</h3>' +
            '<p class="muted small">Компактные таблицы команд CMD и Git сгруппированы по задачам. Открыл, вспомнил, закрыл. Можно распечатать.</p>' +
          '</div>' +
          '<a class="btn btn--primary" href="#/cheatsheet">Открыть шпаргалку →</a>' +
        '</div>' +
      '</section>' +

      '<div class="section" style="text-align:center;color:var(--dim);font-size:12px">' +
        '<p>Сделано для быстрой отработки: <b>CMD</b> · <b>Git</b> · без установки и регистрации.</p>' +
      '</div>' +
    '</div>';

    playHero();
  }

  function playHero() {
    var body = document.getElementById('hero-term-body');
    if (!body) return;
    var seq = [
      { type: 'cmd', prompt: 'C:\\dev>', text: 'git status', cls: 'prompt' },
      { type: 'out', text: 'On branch main' },
      { type: 'out', text: 'nothing to commit, working tree clean' },
      { type: 'cmd', prompt: 'C:\\dev>', text: 'git switch -c feature', cls: 'prompt' },
      { type: 'out', text: "Switched to a new branch 'feature'", cls: 'ok' },
      { type: 'cmd', prompt: 'C:\\dev>', text: 'git merge --no-ff feature', cls: 'prompt' },
      { type: 'out', text: 'Merge made by the ort strategy.', cls: 'ok' },
      { type: 'cmd', prompt: 'C:\\dev>', text: 'dir *.txt /b', cls: 'prompt' },
      { type: 'out', text: 'readme.txt\nnotes.txt' }
    ];
    var stopped = false;
    cleanup = function () { stopped = true; };
    var i = 0;

    function addLine() {
      if (stopped) return;
      if (i >= seq.length) {
        var cur = document.createElement('div');
        cur.className = 'ln';
        cur.innerHTML = '<span class="prompt">C:\\dev&gt;</span> <span class="cursor"></span>';
        body.appendChild(cur);
        return;
      }
      var item = seq[i++];
      var line = document.createElement('div');
      line.className = 'ln';
      if (item.type === 'cmd') {
        line.innerHTML = '<span class="' + (item.cls || 'prompt') + '">' + esc(item.prompt) + '</span> ';
        body.appendChild(line);
        var span = document.createElement('span');
        span.className = 'cmdline';
        line.appendChild(span);
        var chars = item.text.split('');
        var k = 0;
        (function typeChar() {
          if (stopped) return;
          if (k < chars.length) {
            span.textContent += chars[k++];
            body.scrollTop = body.scrollHeight;
            setTimeout(typeChar, 34);
          } else {
            setTimeout(addLine, 420);
          }
        })();
      } else {
        item.text.split('\n').forEach(function (t, idx) {
          var l = document.createElement('div');
          l.className = 'ln ' + (item.cls || 'out');
          l.textContent = t;
          body.appendChild(l);
        });
        body.scrollTop = body.scrollHeight;
        setTimeout(addLine, 330);
      }
    }
    setTimeout(addLine, 450);
  }

  /* ---------------- Theory ---------------- */
  function renderTheory(track) {
    var data = trackData(track);
    var items = trackItems(track);
    var tasks = trackTasks(track);
    var learned = learnedCount(track);
    var isCmd = track === 'cmd';

    var concepts = data.concepts.map(function (c) {
      var flow = '';
      if (c.flow) {
        flow = '<div class="concept__flow">' + c.flow.map(function (f, i) {
          return (i ? '<i>→</i>' : '') + '<b>' + esc(f) + '</b>';
        }).join('') + '</div>';
      }
      var code = c.code ? '<div class="example"><code>' + esc(c.code) + '</code></div>' : '';
      return '<div class="concept"><h4><span>' + c.tag + '</span>' + c.title + '</h4><p>' + c.text + '</p>' + flow + code + '</div>';
    }).join('');

    var groupsHtml = data.groups.map(function (g) {
      var cards = g.items.map(function (item) { return commandCard(track, item); }).join('');
      return '<section class="cmd-group" id="group-' + track + '-' + g.id + '" data-group="' + g.id + '">' +
        '<div class="cmd-group__head"><h3>' + esc(g.title) + '</h3><span>' + g.items.length + ' команд</span></div>' +
        '<div class="cmd-list">' + cards + '</div>' +
      '</section>';
    }).join('');

    var chips = '<button class="chip active" data-group="all">Все</button>' + data.groups.map(function (g) {
      return '<button class="chip" data-group="' + g.id + '">' + esc(g.title) + '</button>';
    }).join('');

    app.innerHTML = '<div class="page track-' + track + '">' +
      '<div class="page-head">' +
        '<div>' +
          '<div class="eyebrow">' + (isCmd ? 'Windows CMD' : 'Git') + ' · теория</div>' +
          '<h1>' + (isCmd ? 'Командная строка <span class="grad-cmd">без магии</span>' : 'Git <span class="grad-git">без страха</span>') + '</h1>' +
          '<p class="lead" style="margin-top:14px">' + data.tagline + ' Каждая карточка раскрывается: синтаксис, примеры, ловушки. Отмечай изученное — прогресс виден в меню.</p>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<span class="track-pill track-pill--' + track + '">' + items.length + ' команд · ' + tasks.length + ' заданий</span>' +
          '<span class="track-pill" id="theory-learned">изучено ' + learned + ' / ' + items.length + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="concept-grid">' + concepts + '</div>' +

      '<div class="theory-tools">' +
        '<div class="search"><input id="theory-search" type="search" placeholder="Поиск: copy, reset, rebase, поток..." autocomplete="off"></div>' +
        '<div class="chips" id="theory-chips">' + chips + '</div>' +
      '</div>' +

      '<div id="theory-list">' + groupsHtml + '</div>' +
      '<div class="theory-empty" id="theory-empty" style="display:none">Ничего не найдено. Попробуй другое слово или сбрось фильтр.</div>' +

      '<div class="callout" style="margin-top:38px">' +
        '<div class="callout__icon">' + (isCmd ? '⌨️' : '⑂') + '</div>' +
        '<div><p><b>Проверь себя.</b> Теория без практики выветривается за день. Открой задания — там есть ввод команд, выбор и сценарии. Или зайди в ' +
        (isCmd ? '<a href="#/cmd/play" style="color:var(--accent)">песочницу CMD</a>' : '<a href="#/git/play" style="color:var(--accent)">визуализатор Git</a>') + '.</p></div>' +
      '</div>' +
    '</div>';

    initTheoryFilters(track);

    // open card from hash like #/cmd#card-cmd-cd
    if (location.hash.indexOf('#card-') > -1) {
      var id = location.hash.split('#card-')[1];
      var card = document.getElementById('card-' + id);
      if (card) { card.classList.add('open'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
  }

  function commandCard(track, item) {
    var examples = item.examples.map(function (ex) {
      return '<div class="example"><code>' + esc(ex.code) + '</code>' +
        (ex.note ? '<small>' + ex.note + '</small>' : '') +
        '<button class="copy-btn" type="button" data-copy="' + esc(ex.code) + '" title="Скопировать">⧉</button></div>';
    }).join('');
    var demo = item.demo ? '<a class="btn btn--sm" href="#/git/play?scenario=' + item.demo + '">▶ Анимация</a>' : '';
    var learned = !!state.learned[track + ':' + item.id];
    var search = (item.name + ' ' + item.desc + ' ' + item.syntax + ' ' + item.examples.map(function (e) { return e.code + ' ' + e.note; }).join(' ')).toLowerCase();
    return '<article class="cmd-card' + (learned ? ' learned' : '') + '" id="card-' + track + '-' + item.id + '" data-id="' + item.id + '" data-search="' + esc(search) + '">' +
      '<button class="cmd-card__head" type="button" aria-expanded="false">' +
        '<span class="learn-dot"></span>' +
        '<span><span class="cmd-card__name">' + esc(item.name) + '</span><span class="cmd-card__desc">' + item.desc + '</span></span>' +
        '<span class="cmd-card__chev">▶</span>' +
      '</button>' +
      '<div class="cmd-card__body">' +
        '<div class="syntax">' + esc(item.syntax) + '</div>' +
        '<p>' + item.desc + '</p>' +
        '<div class="examples">' + examples + '</div>' +
        (item.tip ? '<div class="tip"><b>Совет.</b> ' + item.tip + '</div>' : '') +
        (item.warn ? '<div class="tip warnbox"><b>Осторожно.</b> ' + item.warn + '</div>' : '') +
        '<div class="cmd-card__actions">' +
          '<button class="learn-btn" type="button" data-learn="' + item.id + '">' + (learned ? '✓ Изучено' : 'Отметить изученным') + '</button>' +
          demo +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function initTheoryFilters(track) {
    var search = document.getElementById('theory-search');
    var chips = document.getElementById('theory-chips');
    var list = document.getElementById('theory-list');
    var empty = document.getElementById('theory-empty');
    var activeGroup = 'all';

    function apply() {
      var q = (search.value || '').trim().toLowerCase();
      var visible = 0;
      document.querySelectorAll('.cmd-card').forEach(function (card) {
        var group = card.closest('.cmd-group').getAttribute('data-group');
        var okGroup = activeGroup === 'all' || group === activeGroup;
        var okText = !q || card.getAttribute('data-search').indexOf(q) > -1;
        var show = okGroup && okText;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      document.querySelectorAll('.cmd-group').forEach(function (g) {
        var has = g.querySelectorAll('.cmd-card:not([style*="display: none"])').length > 0;
        g.style.display = has ? '' : 'none';
      });
      empty.style.display = visible ? 'none' : 'block';
    }

    search.addEventListener('input', apply);
    chips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      chips.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      activeGroup = chip.getAttribute('data-group');
      apply();
    });

    list.addEventListener('click', function (e) {
      var head = e.target.closest('.cmd-card__head');
      if (head) {
        var card = head.closest('.cmd-card');
        var open = card.classList.toggle('open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
        return;
      }
      var learn = e.target.closest('.learn-btn');
      if (learn) {
        var id = learn.getAttribute('data-learn');
        var key = track + ':' + id;
        var isLearned = !!state.learned[key];
        if (isLearned) delete state.learned[key]; else state.learned[key] = true;
        save();
        var card2 = learn.closest('.cmd-card');
        card2.classList.toggle('learned', !isLearned);
        learn.textContent = !isLearned ? '✓ Изучено' : 'Отметить изученным';
        var pill = document.getElementById('theory-learned');
        if (pill) pill.textContent = 'изучено ' + learnedCount(track) + ' / ' + trackItems(track).length;
        toast(!isLearned ? 'Команда отмечена как изученная' : 'Отметка снята', !isLearned ? 'ok' : 'info');
        updateChrome();
        return;
      }
    });
  }

  /* ---------------- Cheatsheet ---------------- */
  function renderCheatsheet() {
    function blocks(data, isCmd) {
      return data.cheats.map(function (b) {
        return '<div class="cheat-block"><h4>' + esc(b.title) + '</h4>' + b.rows.map(function (r) {
          return '<div class="cheat-row ' + (isCmd ? '' : 'cheat-row--git') + '" data-search="' + esc((r[0] + ' ' + r[1]).toLowerCase()) + '">' +
            '<code>' + esc(r[0]) + '</code><span>' + r[1] + '</span></div>';
        }).join('') + '</div>';
      }).join('');
    }

    app.innerHTML = '<div class="page">' +
      '<div class="page-head">' +
        '<div><div class="eyebrow">Шпаргалка · печать</div><h1>Всё нужное <span class="grad-cmd">на одной странице</span></h1>' +
        '<p class="lead" style="margin-top:12px">Сгруппировано по задачам, а не по алфавиту: «найти», «скопировать», «отменить». Ctrl+P — и можно распечатать.</p></div>' +
        '<div style="display:flex;gap:8px"><button class="btn" id="cheat-print">⌨ Распечатать</button><a class="btn btn--primary" href="#/cmd/practice">К заданиям →</a></div>' +
      '</div>' +
      '<div class="search" style="max-width:460px;margin-bottom:6px"><input id="cheat-search" type="search" placeholder="Фильтр по команде или действию..." autocomplete="off"></div>' +
      '<div class="cheat-grid">' +
        '<div class="cheat-col"><div class="cmd-group__head"><h3>Windows CMD</h3><span>' + allCmd().length + ' команд</span></div>' + blocks(window.CMD_DATA, true) + '</div>' +
        '<div class="cheat-col"><div class="cmd-group__head"><h3>Git</h3><span>' + allGit().length + ' команд</span></div>' + blocks(window.GIT_DATA, false) + '</div>' +
      '</div>' +
      '<div class="cheat-empty" id="cheat-empty" style="display:none">Ничего не найдено. Попробуй другое слово — например, <b>commit</b>, <b>копировать</b> или <b>ветки</b>.</div>' +
      '<div class="cheat-note" style="margin-top:20px">Главное правило Git: <b>reset</b> — для локальной истории, <b>revert</b> — для того, что уже у других. Главное правило CMD: <b>&gt;</b> стирает, <b>&gt;&gt;</b> дописывает. Главное правило головы: сначала <b>git status</b> / <b>dir</b>, потом действие.</div>' +
    '</div>';

    document.getElementById('cheat-print').addEventListener('click', function () { window.print(); });
    var search = document.getElementById('cheat-search');
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      document.querySelectorAll('.cheat-row').forEach(function (row) {
        row.style.display = !q || row.getAttribute('data-search').indexOf(q) > -1 ? '' : 'none';
      });
      document.querySelectorAll('.cheat-block').forEach(function (b) {
        var has = b.querySelectorAll('.cheat-row:not([style*="display: none"])').length > 0;
        b.style.display = has ? '' : 'none';
      });
      var any = document.querySelectorAll('.cheat-row:not([style*="display: none"])').length > 0;
      document.getElementById('cheat-empty').style.display = any ? 'none' : 'block';
    });
  }

  /* ---------------- Router ---------------- */
  function route() {
    if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
    var raw = (location.hash || '#/').replace(/^#/, '');
    var qIndex = raw.indexOf('?');
    var path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
    var params = {};
    if (qIndex >= 0) {
      raw.slice(qIndex + 1).split('&').forEach(function (pair) {
        var kv = pair.split('=');
        params[decodeURIComponent(kv[0] || '')] = decodeURIComponent(kv[1] || '');
      });
    }
    if (!path || path === '/') path = '/';
    if (path.length > 1) path = path.replace(/\/$/, '');
    setActiveNav(path);
    setSidebar(false);
    window.scrollTo(0, 0);

    var titles = {
      '/': 'Dev Instruments — CMD & Git trainer',
      '/cmd': 'Windows CMD — теория · Dev Instruments',
      '/cmd/practice': 'CMD — задания · Dev Instruments',
      '/cmd/play': 'CMD — песочница · Dev Instruments',
      '/git': 'Git — теория · Dev Instruments',
      '/git/practice': 'Git — задания · Dev Instruments',
      '/git/play': 'Git — визуализатор · Dev Instruments',
      '/cheatsheet': 'Шпаргалка · Dev Instruments'
    };
    document.title = titles[path] || 'Dev Instruments';

    if (path === '/') renderHome();
    else if (path === '/cmd') renderTheory('cmd');
    else if (path === '/git') renderTheory('git');
    else if (path === '/cmd/practice' && window.renderPractice) window.renderPractice('cmd', params);
    else if (path === '/git/practice' && window.renderPractice) window.renderPractice('git', params);
    else if (path === '/cmd/play' && window.renderCmdPlay) window.renderCmdPlay();
    else if (path === '/git/play' && window.renderGitPlay) window.renderGitPlay(params);
    else if (path === '/cheatsheet') renderCheatsheet();
    else app.innerHTML = '<div class="page panel"><h1>404</h1><p class="muted">Такой страницы нет.</p><div class="btn-row"><a class="btn btn--primary" href="#/">На главную</a></div></div>';

    updateChrome();
    var main = document.getElementById('app');
    if (main) main.focus({ preventScroll: true });
  }

  function setSidebar(open) {
    var sidebar = document.getElementById('sidebar');
    var scrim = document.getElementById('scrim');
    var bar = document.getElementById('mobile-bar');
    if (sidebar) sidebar.classList.toggle('open', open);
    if (scrim) scrim.classList.toggle('show', open);
    if (bar) bar.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', open);
  }

  /* ---------------- Global events ---------------- */
  document.addEventListener('click', function (e) {
    var copy = e.target.closest('[data-copy]');
    if (copy) {
      e.preventDefault();
      copyText(copy.getAttribute('data-copy'));
      copy.classList.add('copied');
      copy.textContent = '✓';
      setTimeout(function () { copy.classList.remove('copied'); copy.textContent = '⧉'; }, 1200);
    }
    var burger = e.target.closest('#mobile-bar');
    if (burger) {
      var sidebar = document.getElementById('sidebar');
      setSidebar(!(sidebar && sidebar.classList.contains('open')));
    }
    if (e.target.id === 'scrim') setSidebar(false);
    var nav = e.target.closest('.nav__link');
    if (nav) setSidebar(false);
  });

  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setSidebar(false);
  });

  window.App = {
    state: state,
    save: save,
    esc: esc,
    toast: toast,
    confetti: confetti,
    copyText: copyText,
    updateChrome: updateChrome,
    computeXP: computeXP,
    levelInfo: levelInfo,
    doneCount: doneCount,
    learnedCount: learnedCount,
    trackTasks: trackTasks,
    trackItems: trackItems,
    trackData: trackData,
    nextTask: nextTask,
    allCmd: allCmd,
    allGit: allGit,
    setCleanup: function (fn) { cleanup = fn; },
    rerender: route
  };

  updateChrome();
  route();
})();
