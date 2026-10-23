/* Playgrounds: CMD missions + Git visualizer / sandbox */
(function () {
  'use strict';

  var CMD_MISSIONS = [
    {
      id: 'cmd-m1', track: 'cmd', xp: 20, title: 'Навигация и папка',
      desc: 'Выйди из project в C:\\dev и создай там папку backup.',
      steps: ['cd ..', 'md backup'],
      check: function (sim) {
        return sim.cwd.join('\\').toLowerCase() === 'dev' && sim.isDir('C:\\dev\\backup');
      }
    },
    {
      id: 'cmd-m2', track: 'cmd', xp: 25, title: 'Копирование по маске',
      desc: 'Скопируй все .txt из C:\\dev\\project в C:\\dev\\backup.',
      steps: ['cd C:\\dev\\project', 'copy *.txt C:\\dev\\backup\\'],
      check: function (sim) {
        return sim.readFile('C:\\dev\\backup\\readme.txt') != null && sim.readFile('C:\\dev\\backup\\notes.txt') != null;
      }
    },
    {
      id: 'cmd-m3', track: 'cmd', xp: 25, title: 'Рекурсивное копирование',
      desc: 'Скопируй папку site со всеми вложенными файлами в C:\\dev\\backup\\site. Пустые папки тоже должны сохраниться.',
      steps: ['cd C:\\dev\\project', 'xcopy site C:\\dev\\backup\\site /E /I'],
      check: function (sim) {
        return sim.readFile('C:\\dev\\backup\\site\\index.html') != null && sim.readFile('C:\\dev\\backup\\site\\assets\\logo.txt') != null;
      }
    },
    {
      id: 'cmd-m4', track: 'cmd', xp: 30, title: 'Процессы → файл → сортировка',
      desc: 'Сохрани tasklist в C:\\dev\\processes.txt, затем отсортируй его в C:\\dev\\sorted.txt через ключ /o.',
      steps: ['cd /d C:\\dev', 'tasklist > processes.txt', 'sort processes.txt /o sorted.txt'],
      check: function (sim) {
        var p = sim.readFile('C:\\dev\\processes.txt');
        var s = sim.readFile('C:\\dev\\sorted.txt');
        return !!(p && p.toLowerCase().indexOf('chrome.exe') > -1 && s && s.length);
      }
    },
    {
      id: 'cmd-m5', track: 'cmd', xp: 25, title: 'Переменная и запись',
      desc: 'Создай переменную NAME со своим именем и запиши её значение в C:\\dev\\name.txt.',
      steps: ['set NAME=Никита', 'echo %NAME% > C:\\dev\\name.txt'],
      check: function (sim) {
        var v = sim.getVar('NAME');
        var f = sim.readFile('C:\\dev\\name.txt');
        return !!(v && f && f.toLowerCase().indexOf(String(v).toLowerCase()) > -1);
      }
    }
  ];

  var GIT_MISSIONS = [
    {
      id: 'git-m1', track: 'git', xp: 20, title: 'Первый коммит',
      desc: 'Добавь файлы в индекс и создай первый коммит с любым осмысленным сообщением.',
      steps: ['git add .', 'git commit -m "initial commit"'],
      check: function (sim) {
        return sim.state().commits >= 1 && !!sim.model.branches.main;
      }
    },
    {
      id: 'git-m2', track: 'git', xp: 30, title: 'Ветка и fast-forward',
      desc: 'Создай ветку feature, сделай в ней коммит, вернись на main и влей feature так, чтобы получился fast-forward.',
      steps: ['git switch -c feature', 'echo "feature" > feature.txt', 'git add .', 'git commit -m "feat: feature"', 'git switch main', 'git merge feature'],
      check: function (sim) {
        var b = sim.model.branches;
        if (!b.feature || !b.main) return false;
        if (b.feature !== b.main) return false;
        if (sim.branch !== 'main') return false;
        var reach = sim.model.reachableFrom(b.main);
        var tip = sim.model.commits.filter(function (c) { return c.id === b.main; })[0];
        return Object.keys(reach).length >= 2 && tip && tip.branch === 'feature' && tip.parents.length < 2;
      }
    },
    {
      id: 'git-m3', track: 'git', xp: 30, title: 'Merge-коммит',
      desc: 'Сделай так, чтобы в истории появился merge-коммит с двумя родителями: используй --no-ff.',
      steps: ['git switch feature', 'echo "more" >> feature.txt', 'git add .', 'git commit -m "feat: more"', 'git switch main', 'git merge --no-ff feature'],
      check: function (sim) {
        var b = sim.model.branches;
        if (!b.main) return false;
        var reach = sim.model.reachableFrom(b.main);
        return sim.model.commits.some(function (c) { return reach[c.id] && c.parents.length > 1; });
      }
    },
    {
      id: 'git-m4', track: 'git', xp: 30, title: 'Откат назад',
      desc: 'Сделай ещё один коммит, затем откати main на один коммит жёстко (reset --hard HEAD~1). Старый коммит должен остаться в reflog.',
      steps: ['echo "tmp" > tmp.txt', 'git add .', 'git commit -m "tmp"', 'git reset --hard HEAD~1'],
      check: function (sim) {
        if (!sim.model.branches.main) return false;
        var reach = sim.model.reachableFrom(sim.model.branches.main);
        var hasReset = sim.model.reflog.some(function (r) { return /^reset:/.test(r.msg); });
        return hasReset && Object.keys(reach).length < sim.model.commits.length;
      }
    }
  ];

  window.MISSIONS = CMD_MISSIONS.concat(GIT_MISSIONS);

  function missionCard(m, done) {
    var App = window.App;
    return '<div class="mission' + (done ? ' done' : '') + '" data-mission="' + m.id + '">' +
      '<h4><span class="dot-status"></span>' + App.esc(m.title) + '</h4>' +
      '<p>' + App.esc(m.desc) + '</p>' +
      '<ol class="mission__steps" id="steps-' + m.id + '" style="display:none">' + m.steps.map(function (s) {
        return '<li>' + App.esc(s) + '</li>';
      }).join('') + '</ol>' +
      '<div class="mission__foot">' +
        '<button class="btn btn--sm btn--ghost" data-mission-hint="' + m.id + '">Подсказка</button>' +
        '<span class="small dim" style="align-self:center">+' + m.xp + ' XP</span>' +
      '</div>' +
    '</div>';
  }

  function checkMissions(track, sim) {
    var App = window.App;
    var list = track === 'cmd' ? CMD_MISSIONS : GIT_MISSIONS;
    list.forEach(function (m) {
      if (App.state.missions[m.id]) return;
      var ok = false;
      try { ok = m.check(sim); } catch (e) { ok = false; }
      if (!ok) return;
      App.state.missions[m.id] = true;
      App.save();
      App.updateChrome();
      App.confetti();
      App.toast('Миссия выполнена: ' + m.title + ' (+' + m.xp + ' XP)', 'ok');
      var card = document.querySelector('[data-mission="' + m.id + '"]');
      if (card) {
        card.classList.add('done');
        var btn = card.querySelector('[data-mission-hint]');
        if (btn) { btn.textContent = '✓ Выполнено'; btn.disabled = true; }
      }
    });
  }

  /* ================= CMD playground ================= */
  window.renderCmdPlay = function () {
    var App = window.App;
    var app = document.getElementById('app');
    var doneMissions = CMD_MISSIONS.filter(function (m) { return App.state.missions[m.id]; }).length;

    app.innerHTML = '<div class="page">' +
      '<div class="page-head">' +
        '<div><div class="eyebrow">Windows CMD · песочница</div><h1>Безопасная <span class="grad-cmd">командная строка</span></h1>' +
          '<p class="lead" style="margin-top:12px">Виртуальная файловая система: можно ломать, копировать и удалять сколько угодно. Начни с <code>dir</code> и <code>help</code>.</p></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><span class="track-pill track-pill--cmd">' + doneMissions + ' / ' + CMD_MISSIONS.length + ' миссий</span><a class="btn" href="#/cmd">← Теория</a></div>' +
      '</div>' +
      '<div class="play-layout">' +
        '<div class="play-main">' +
          '<div class="term">' +
            '<div class="term__bar"><span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span><span class="term__title">cmd.exe — C:\\dev\\project</span>' +
              '<div class="term__actions"><button class="icon-btn" id="cmd-reset" title="Сбросить песочницу">⟲</button></div></div>' +
            '<div class="term__body" id="cmd-output"></div>' +
            '<div class="term__row"><span class="t-prompt" id="cmd-prompt">C:\\dev\\project&gt;</span><input class="term__input" id="cmd-input" autocomplete="off" spellcheck="false" placeholder="введи команду и нажми Enter"></div>' +
            '<div class="term__hintbar"><span>↑ / ↓ — история</span><span>Ctrl+L — очистка</span><span>help — команды</span></div>' +
          '</div>' +
          '<div class="panel" style="margin-top:14px">' +
            '<div class="panel-title">Быстрый старт</div>' +
            '<div class="chips">' +
              ['dir', 'tree /f', 'tasklist | findstr chrome', 'findstr /i "error" app.log', 'help'].map(function (c) {
                return '<button class="chip" data-fill="' + App.esc(c) + '">' + App.esc(c) + '</button>';
              }).join('') +
            '</div>' +
            '<p class="small dim" style="margin-top:10px">Клик вставляет команду в строку — можно отредактировать и выполнить.</p>' +
          '</div>' +
        '</div>' +
        '<aside class="play-side">' +
          '<div class="panel">' +
            '<div class="panel-title">Миссии</div>' +
            '<div class="mission-list">' + CMD_MISSIONS.map(function (m) { return missionCard(m, !!App.state.missions[m.id]); }).join('') + '</div>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-title">Подсказки по песочнице</div>' +
            '<div class="play-help">' +
              '<p><code>help</code> — список поддерживаемых команд.</p>' +
              '<p><code>echo текст &gt; file.txt</code> — создать файл с текстом.</p>' +
              '<p><code>type file.txt</code> — прочитать файл.</p>' +
              '<p><code>cd ..</code> — подняться на уровень выше.</p>' +
              '<p>Файловая система виртуальная: реальные файлы не пострадают.</p>' +
            '</div>' +
          '</div>' +
        '</aside>' +
      '</div>' +
    '</div>';

    var output = document.getElementById('cmd-output');
    var input = document.getElementById('cmd-input');
    var prompt = document.getElementById('cmd-prompt');

    var sim = new CmdTerminal({
      output: output,
      input: input,
      prompt: prompt,
      onAfter: function () { checkMissions('cmd', sim); }
    });

    sim.print([
      'Microsoft Windows [Version 10.0.26100.1]',
      '(c) Microsoft Corporation. All rights reserved.',
      '',
      'Виртуальная песочница CMD. help — список команд.',
      ''
    ], 't-dim');
    sim.execute('dir');

    input.focus();

    document.getElementById('cmd-reset').addEventListener('click', function () {
      sim.reset();
      sim.print(['Песочница сброшена.', ''], 't-dim');
      input.focus();
    });

    app.querySelectorAll('[data-fill]').forEach(function (b) {
      b.addEventListener('click', function () {
        input.value = b.getAttribute('data-fill');
        input.focus();
      });
    });

    app.querySelectorAll('[data-mission-hint]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-mission-hint');
        var el = document.getElementById('steps-' + id);
        if (!el) return;
        var show = el.style.display === 'none';
        el.style.display = show ? '' : 'none';
        b.textContent = show ? 'Скрыть подсказку' : 'Подсказка';
      });
    });
  };

  /* ================= Git playground ================= */
  window.renderGitPlay = function (params) {
    var App = window.App;
    var app = document.getElementById('app');
    var tab = params.tab === 'sandbox' ? 'sandbox' : 'scenario';

    app.innerHTML = '<div class="page">' +
      '<div class="page-head">' +
        '<div><div class="eyebrow">Git · визуализатор</div><h1>Ветки, которые <span class="grad-git">видно</span></h1>' +
          '<p class="lead" style="margin-top:12px">Смотри, как merge, rebase и reset меняют граф. Или работай в песочнице: команды настоящие, репозиторий виртуальный.</p></div>' +
        '<a class="btn" href="#/git">← Теория</a>' +
      '</div>' +
      '<div class="tabs" style="margin-bottom:16px">' +
        '<button class="tab ' + (tab === 'scenario' ? 'active' : '') + '" data-tab="scenario">▶ Сценарии</button>' +
        '<button class="tab ' + (tab === 'sandbox' ? 'active' : '') + '" data-tab="sandbox">⌨ Песочница</button>' +
      '</div>' +
      '<div id="git-play-root"></div>' +
    '</div>';

    app.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = btn.getAttribute('data-tab');
        location.hash = '#/git/play' + (t === 'sandbox' ? '?tab=sandbox' : '');
      });
    });

    if (tab === 'sandbox') mountGitSandbox();
    else mountScenario(params.scenario);
  };

  function mountScenario(initialId) {
    var App = window.App;
    var root = document.getElementById('git-play-root');
    var scenarios = window.GIT_SCENARIOS;
    var current = scenarios.filter(function (s) { return s.id === initialId; })[0] || scenarios[0];
    var model = null;
    var view = null;
    var pos = 0;
    var timer = null;

    root.innerHTML = '<div class="git-play">' +
      '<div class="chips" id="scenario-chips" style="margin-bottom:4px">' + scenarios.map(function (s) {
        return '<button class="chip ' + (s.id === current.id ? 'active' : '') + '" data-scenario="' + s.id + '">' + App.esc(s.title) + '</button>';
      }).join('') + '</div>' +
      '<div class="gitgraph-wrap">' +
        '<div class="gitgraph-wrap__bar"><h4 id="scenario-name"></h4><div class="legend" id="scenario-legend"></div></div>' +
        '<div class="gitgraph" id="scenario-graph"></div>' +
      '</div>' +
      '<div class="panel scenario-panel">' +
        '<div class="scenario-desc" id="scenario-desc"></div>' +
        '<div class="narration"><div class="narration__cmd" id="narration-cmd"></div><div class="narration__text" id="narration-text"></div></div>' +
        '<div class="scenario-nav">' +
          '<button class="btn btn--sm" id="sc-reset" title="Сначала">⟲</button>' +
          '<button class="btn btn--sm" id="sc-prev">← Назад</button>' +
          '<button class="btn btn--sm btn--git" id="sc-next">Шаг →</button>' +
          '<button class="btn btn--sm" id="sc-play">▶ Авто</button>' +
          '<div class="step-dots" id="sc-dots"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

    var graphEl = document.getElementById('scenario-graph');

    function stop() { if (timer) { clearInterval(timer); timer = null; } var b = document.getElementById('sc-play'); if (b) b.textContent = '▶ Авто'; }
    App.setCleanup(stop);

    function rebuild(to) {
      stop();
      model = new GitModel(current.init());
      view = new GitGraphView(graphEl);
      view.setModel(model);
      for (var i = 0; i < to; i++) {
        try { current.steps[i].apply(model); } catch (e) { /* ignore */ }
      }
      pos = to;
      view.render();
      update();
    }

    function update() {
      document.getElementById('scenario-name').textContent = current.title;
      document.getElementById('scenario-desc').textContent = current.desc;
      var cmdEl = document.getElementById('narration-cmd');
      var textEl = document.getElementById('narration-text');
      if (pos === 0) {
        cmdEl.textContent = '$ # начальное состояние';
        textEl.textContent = 'Нажми «Шаг →» или «Авто», чтобы увидеть, как команда меняет граф.';
      } else {
        cmdEl.textContent = '$ ' + current.steps[pos - 1].cmd;
        textEl.textContent = current.steps[pos - 1].text;
      }
      var legend = document.getElementById('scenario-legend');
      legend.innerHTML = current.legend.map(function (b) {
        var lane = model.laneOf(b);
        return '<span><i style="background:' + window.GIT_PALETTE[lane % window.GIT_PALETTE.length] + '"></i>' + App.esc(b) + '</span>';
      }).join('');
      var dots = document.getElementById('sc-dots');
      dots.innerHTML = '';
      for (var i = 0; i <= current.steps.length; i++) {
        var d = document.createElement('span');
        d.className = 'step-dot' + (i === pos ? ' on' : '');
        dots.appendChild(d);
      }
      document.getElementById('sc-prev').disabled = pos === 0;
      document.getElementById('sc-next').disabled = pos >= current.steps.length;
    }

    function next() {
      if (pos >= current.steps.length) { stop(); return; }
      current.steps[pos].apply(model);
      pos++;
      view.render();
      update();
      if (pos >= current.steps.length) stop();
    }

    document.getElementById('sc-next').addEventListener('click', function () { stop(); next(); });
    document.getElementById('sc-prev').addEventListener('click', function () { rebuild(Math.max(0, pos - 1)); });
    document.getElementById('sc-reset').addEventListener('click', function () { rebuild(0); });
    document.getElementById('sc-play').addEventListener('click', function () {
      if (timer) { stop(); return; }
      if (pos >= current.steps.length) rebuild(0);
      var btn = this;
      btn.textContent = '❚❚ Пауза';
      timer = setInterval(function () {
        if (pos >= current.steps.length) { stop(); return; }
        next();
      }, 1700);
      App.setCleanup(stop);
    });

    document.getElementById('scenario-chips').addEventListener('click', function (e) {
      var chip = e.target.closest('[data-scenario]');
      if (!chip) return;
      location.hash = '#/git/play?scenario=' + chip.getAttribute('data-scenario');
    });

    rebuild(0);
  }

  function mountGitSandbox() {
    var App = window.App;
    var root = document.getElementById('git-play-root');
    var doneMissions = GIT_MISSIONS.filter(function (m) { return App.state.missions[m.id]; }).length;

    root.innerHTML = '<div class="git-play">' +
      '<div class="gitgraph-wrap">' +
        '<div class="gitgraph-wrap__bar"><h4>git graph — sandbox</h4><span class="graph-hint">клик по коммиту — файлы и diff</span><div class="legend" id="sandbox-legend"></div></div>' +
        '<div class="gitgraph" id="sandbox-graph"></div>' +
      '</div>' +
      '<div class="commit-inspector" id="commit-inspector" hidden>' +
        '<div class="commit-inspector__head">' +
          '<div class="commit-inspector__hash" id="ci-hash"></div>' +
          '<div class="commit-inspector__meta"><h3 id="ci-msg"></h3><div class="commit-inspector__sub" id="ci-sub"></div></div>' +
          '<button class="icon-btn" id="ci-close" type="button" title="Закрыть">✕</button>' +
        '</div>' +
        '<div class="commit-inspector__body">' +
          '<div class="commit-inspector__files" id="ci-files"></div>' +
          '<div class="commit-inspector__preview" id="ci-preview"></div>' +
        '</div>' +
      '</div>' +
      '<div class="play-layout">' +
        '<div class="play-main">' +
          '<div class="term term--git">' +
            '<div class="term__bar"><span class="dot dot--r"></span><span class="dot dot--y"></span><span class="dot dot--g"></span><span class="term__title">git sandbox — ~/repo</span>' +
              '<div class="term__actions"><button class="icon-btn" id="git-reset" title="Сбросить песочницу">⟲</button></div></div>' +
            '<div class="term__body" id="git-output"></div>' +
            '<div class="term__row"><span class="t-prompt" id="git-prompt">~/repo (main) $</span><input class="term__input" id="git-input" autocomplete="off" spellcheck="false" placeholder="git status"></div>' +
            '<div class="term__hintbar"><span>↑ / ↓ — история</span><span>Ctrl+L — очистка</span><span>help — команды</span><span>reset — сброс</span></div>' +
          '</div>' +
          '<div class="panel" style="margin-top:14px">' +
            '<div class="panel-title">Быстрый старт</div>' +
            '<div class="chips">' +
              ['git status', 'git add .', 'git commit -m "initial"', 'git log --oneline --graph --all', 'git switch -c feature', 'git merge --no-ff feature'].map(function (c) {
                return '<button class="chip" data-gitfill="' + App.esc(c) + '">' + App.esc(c) + '</button>';
              }).join('') +
            '</div>' +
            '<p class="small dim" style="margin-top:10px">Песочница не идеальна, но честно повторяет связь <b>рабочая папка → индекс → коммит</b> и топологию веток.</p>' +
          '</div>' +
        '</div>' +
        '<aside class="play-side">' +
          '<div class="panel">' +
            '<div class="panel-title">Состояние</div>' +
            '<div class="status-grid" id="git-status"></div>' +
            '<div class="files-head"><div class="panel-title">Файлы <span class="panel-count" id="git-file-count">0</span></div>' +
              '<button class="mini-btn" id="git-file-add" type="button" title="Создать файл">＋</button></div>' +
            '<div class="conflict-banner" id="git-conflicts" hidden></div>' +
            '<div class="file-list file-list--manager" id="git-files"></div>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-title">Миссии · ' + doneMissions + ' / ' + GIT_MISSIONS.length + '</div>' +
            '<div class="mission-list">' + GIT_MISSIONS.map(function (m) { return missionCard(m, !!App.state.missions[m.id]); }).join('') + '</div>' +
          '</div>' +
          '<div class="panel">' +
            '<div class="panel-title">Подсказки</div>' +
            '<div class="play-help">' +
              '<p><code>git status</code> — что в индексе и рабочей папке.</p>' +
              '<p><code>echo "текст" &gt; file.txt</code> — создать файл, <code>rm file</code> — удалить.</p>' +
              '<p><code>ls</code> — файлы, <code>cat file</code> — содержимое.</p>' +
              '<p>Нажми на узел графа, чтобы посмотреть файлы коммита и их содержимое.</p>' +
              '<p>При конфликте открой файл в панели «Файлы», убери маркеры и нажми «В индекс».</p>' +
              '<p><code>git merge --abort</code> отменяет слияние с конфликтами.</p>' +
            '</div>' +
          '</div>' +
        '</aside>' +
      '</div>' +
      '<div class="modal" id="git-file-modal" hidden>' +
        '<div class="modal__backdrop" data-file-close></div>' +
        '<div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="file-modal-title">' +
          '<div class="modal__head"><h3 id="file-modal-title">Новый файл</h3><button class="icon-btn" type="button" data-file-close title="Закрыть">✕</button></div>' +
          '<div class="modal__conflict" id="file-modal-conflict" hidden>' +
            '<div class="modal__conflict-text"><b>Конфликт слияния.</b> Убери маркеры вручную или выбери одну из версий:</div>' +
            '<div class="modal__conflict-actions"><button class="btn btn--sm" type="button" id="file-modal-ours">Взять HEAD</button><button class="btn btn--sm" type="button" id="file-modal-theirs">Взять их</button></div>' +
          '</div>' +
          '<label class="modal__label">Имя файла<input id="file-modal-name" type="text" autocomplete="off" spellcheck="false" placeholder="notes.txt"></label>' +
          '<label class="modal__label">Содержимое<textarea id="file-modal-content" spellcheck="false" placeholder="Текст файла..."></textarea></label>' +
          '<div class="modal__hint">После сохранения нажми <b>＋</b> в строке файла, чтобы добавить его в индекс, или выполни <code>git add .</code>.</div>' +
          '<div class="modal__actions">' +
            '<button class="btn btn--ghost btn--danger" id="file-modal-delete" type="button">Удалить</button>' +
            '<span class="modal__spacer"></span>' +
            '<button class="btn" type="button" data-file-close>Отмена</button>' +
            '<button class="btn btn--primary" id="file-modal-save" type="button">Сохранить</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    var output = document.getElementById('git-output');
    var input = document.getElementById('git-input');
    var prompt = document.getElementById('git-prompt');
    var view = new GitGraphView(document.getElementById('sandbox-graph'));
    var sim = new GitSandbox({
      output: output,
      input: input,
      prompt: prompt,
      view: view,
      onChange: function (s) {
        renderStatus(s);
        checkMissions('git', s);
      }
    });

    view.setModel(sim.model);
    renderStatus(sim);
    sim.print([
      'Виртуальный репозиторий в ~/repo. Уже есть файлы: README.md, hello.txt, app.js.',
      'Они пока untracked. Начни с git status и git add .',
      ''
    ], 't-dim');
    input.focus();

    var selectedCommitId = null;
    var selectedCommitFile = null;
    var selectedCommitMode = 'content';
    var editFileName = null;
    var modal = document.getElementById('git-file-modal');
    if (modal && modal.parentNode !== document.body) document.body.appendChild(modal);
    var modalName = document.getElementById('file-modal-name');
    var modalContent = document.getElementById('file-modal-content');
    var modalTitle = document.getElementById('file-modal-title');
    var modalDelete = document.getElementById('file-modal-delete');
    view.setSelectHandler(function (id) { openCommit(id); });

    function has(obj, key) { return Object.prototype.hasOwnProperty.call(obj || {}, key); }
    function commitById(id) {
      return sim.model.commits.filter(function (c) { return c.id === id; })[0] || null;
    }
    function allFileNames(s) {
      var set = {};
      [s.headFiles(), s.model.files, s.staged, s.deletedStaged, s.conflicts].forEach(function (obj) {
        Object.keys(obj || {}).forEach(function (f) { set[f] = true; });
      });
      return Object.keys(set).sort();
    }
    function stateMeta(st) {
      return {
        clean: { mark: '·', label: 'чистый', cls: 'clean' },
        untracked: { mark: 'U', label: 'не отслеживается', cls: 'untracked' },
        modified: { mark: 'M', label: 'изменён', cls: 'modified' },
        deleted: { mark: 'D', label: 'удалён', cls: 'deleted' },
        staged: { mark: 'S', label: 'в индексе', cls: 'staged' },
        'staged-deleted': { mark: 'D', label: 'удаление в индексе', cls: 'staged' },
        conflict: { mark: '!', label: 'конфликт', cls: 'conflict' }
      }[st] || { mark: '?', label: st, cls: '' };
    }

    function renderStatus(s) {
      var state = s.state();
      var head = s.model.head;
      var headLabel = head.type === 'detached' ? 'detached' : head.name;
      var reach = s.model.headCommit() ? Object.keys(s.model.reachableFrom(s.model.headCommit())).length : 0;
      var el = document.getElementById('git-status');
      if (el) {
        var conflictCount = s.unresolvedConflicts().length;
        el.innerHTML =
          '<div class="status-item"><span>ветка</span><b>' + App.esc(headLabel) + '</b></div>' +
          '<div class="status-item"><span>HEAD</span><b>' + (s.model.headCommit() ? String(s.model.headCommit()).slice(0, 7) : '—') + '</b></div>' +
          '<div class="status-item"><span>коммитов</span><b>' + reach + ' / ' + state.commits + '</b></div>' +
          '<div class="status-item"><span>в индексе</span><b>' + (state.staged.length || Object.keys(s.deletedStaged || {}).length || 0) + '</b></div>' +
          (conflictCount ? '<div class="status-item status-item--conflict"><span>конфликты</span><b>' + conflictCount + '</b></div>' : '');
      }
      var legend = document.getElementById('sandbox-legend');
      if (legend) {
        legend.innerHTML = Object.keys(s.model.branches).map(function (b) {
          var lane = s.model.laneOf(b);
          return '<span><i style="background:' + window.GIT_PALETTE[lane % window.GIT_PALETTE.length] + '"></i>' + App.esc(b) + '</span>';
        }).join('') || '<span>веток пока нет</span>';
      }
      renderFileManager(s);
      renderConflicts(s);
      if (selectedCommitId) {
        if (commitById(selectedCommitId)) renderCommitInspector();
        else closeCommit();
      }
    }

    function renderFileManager(s) {
      var filesEl = document.getElementById('git-files');
      var countEl = document.getElementById('git-file-count');
      if (!filesEl) return;
      var names = allFileNames(s);
      if (countEl) countEl.textContent = names.length;
      if (!names.length) {
        filesEl.innerHTML = '<span class="small dim">файлов нет — создай первый</span>';
        return;
      }
      filesEl.innerHTML = names.map(function (f) {
        var st = s.statusOf(f);
        var meta = stateMeta(st);
        var exists = has(s.model.files, f);
        var actions = '';
        if (st === 'staged' || st === 'staged-deleted') {
          actions += '<button class="file-action" type="button" data-file-action="unstage" data-file="' + App.esc(f) + '" title="Убрать из индекса">−</button>';
        } else if (st === 'conflict' || st === 'modified' || st === 'untracked' || st === 'deleted') {
          actions += '<button class="file-action" type="button" data-file-action="stage" data-file="' + App.esc(f) + '" title="Добавить в индекс">＋</button>';
        }
        if (exists || st === 'deleted') {
          actions += '<button class="file-action" type="button" data-file-action="edit" data-file="' + App.esc(f) + '" title="' + (exists ? 'Редактировать' : 'Восстановить') + '">✎</button>';
        }
        if (exists) {
          actions += '<button class="file-action file-action--danger" type="button" data-file-action="delete" data-file="' + App.esc(f) + '" title="Удалить файл">✕</button>';
        }
        return '<div class="file-row file-row--' + meta.cls + '" data-file="' + App.esc(f) + '" tabindex="0" role="button" title="' + App.esc(meta.label) + ' · нажми, чтобы открыть">' +
          '<span class="file-mark">' + meta.mark + '</span>' +
          '<span class="file-name">' + App.esc(f) + '</span>' +
          '<span class="file-actions">' + actions + '</span>' +
        '</div>';
      }).join('');
    }

    function renderConflicts(s) {
      var el = document.getElementById('git-conflicts');
      if (!el) return;
      var unresolved = s.unresolvedConflicts();
      if (!unresolved.length) {
        el.hidden = true;
        el.innerHTML = '';
        return;
      }
      el.hidden = false;
      el.innerHTML = '<div class="conflict-banner__head">⚠ Конфликты слияния · ' + unresolved.length + '</div>' +
        '<div class="conflict-banner__hint">Открой файл, убери маркеры <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code> <code>=======</code> <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> и нажми «＋» в строке файла.</div>' +
        '<div class="conflict-files">' + unresolved.map(function (f) {
          return '<button type="button" class="conflict-file" data-file-open="' + App.esc(f) + '">' + App.esc(f) + '</button>';
        }).join('') + '</div>';
    }

    function closeCommit() {
      selectedCommitId = null;
      selectedCommitFile = null;
      var inspector = document.getElementById('commit-inspector');
      if (inspector) inspector.hidden = true;
      view.select(null);
    }

    function openCommit(id) {
      var c = commitById(id);
      if (!c) return;
      selectedCommitId = id;
      selectedCommitFile = null;
      selectedCommitMode = 'content';
      var inspector = document.getElementById('commit-inspector');
      if (!inspector) return;
      inspector.hidden = false;
      var hashEl = document.getElementById('ci-hash');
      hashEl.textContent = c.id;
      var lane = sim.model.laneOf(c.branch);
      hashEl.style.color = window.GIT_PALETTE[lane % window.GIT_PALETTE.length];
      hashEl.style.borderColor = window.GIT_PALETTE[lane % window.GIT_PALETTE.length];
      document.getElementById('ci-msg').textContent = c.msg;
      renderCommitInspector();
      view.select(id);
      inspector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function renderCommitInspector() {
      var c = commitById(selectedCommitId);
      if (!c) { closeCommit(); return; }
      var parent = c.parents && c.parents[0] ? sim.filesOf(c.parents[0]) : {};
      var current = c.files || {};
      var names = Object.keys(Object.assign({}, parent, current)).sort();
      var rows = names.map(function (f) {
        var st;
        if (!has(parent, f)) st = 'added';
        else if (!has(current, f)) st = 'deleted';
        else if (parent[f] !== current[f]) st = 'modified';
        else st = 'clean';
        return { file: f, st: st };
      });
      var rank = { added: 0, modified: 1, deleted: 2, clean: 3 };
      rows.sort(function (a, b) { return rank[a.st] - rank[b.st] || a.file.localeCompare(b.file); });
      if (!selectedCommitFile || !names.some(function (f) { return f === selectedCommitFile; })) {
        var firstChanged = rows.filter(function (r) { return r.st !== 'clean'; })[0];
        selectedCommitFile = (firstChanged || rows[0] || {}).file || null;
      }
      var branches = Object.keys(sim.model.branches).filter(function (b) { return sim.model.branches[b] === c.id; });
      var isHead = (sim.model.head.type === 'branch' && branches.indexOf(sim.model.head.name) >= 0) ||
        (sim.model.head.type === 'detached' && sim.model.head.commit === c.id);
      var parentText = c.parents.length
        ? (c.parents.length === 1 ? 'родитель: ' : 'родители: ') + c.parents.map(function (p) {
            return '<button type="button" class="ci-parent" data-ci-parent="' + App.esc(p) + '" title="Открыть родительский коммит">' + p.slice(0, 7) + '</button>';
          }).join(' ')
        : 'корневой коммит';
      var sub = '<span class="ci-chip">' + branches.length + ' ' + branchWord(branches.length) + '</span>' +
        (isHead ? '<span class="ci-chip ci-chip--head">HEAD</span>' : '') +
        '<span class="ci-parents">' + parentText + '</span>';
      document.getElementById('ci-sub').innerHTML = sub;
      var filesEl = document.getElementById('ci-files');
      filesEl.innerHTML = rows.length ? rows.map(function (r) {
        var meta = { added: ['A', 'новый'], modified: ['M', 'изменён'], deleted: ['D', 'удалён'], clean: ['·', 'без изменений'] }[r.st];
        return '<button type="button" class="ci-file ci-file--' + r.st + (r.file === selectedCommitFile ? ' active' : '') + '" data-ci-file="' + App.esc(r.file) + '">' +
          '<span class="ci-file__mark">' + meta[0] + '</span>' +
          '<span class="ci-file__name">' + App.esc(r.file) + '</span>' +
          '<span class="ci-file__state">' + meta[1] + '</span>' +
        '</button>';
      }).join('') : '<div class="ci-empty">В коммите нет файлов.</div>';
      renderCommitPreview(c, parent);
    }

    function branchWord(n) { return n === 1 ? 'ветка' : n >= 2 && n <= 4 ? 'ветки' : 'веток'; }

    function renderCommitPreview(c, parent) {
      var el = document.getElementById('ci-preview');
      if (!el) return;
      var f = selectedCommitFile;
      if (!f) { el.innerHTML = '<div class="ci-empty">В коммите нет файлов.</div>'; return; }
      var current = c.files || {};
      var st;
      if (!has(parent, f)) st = 'added';
      else if (!has(current, f)) st = 'deleted';
      else if (parent[f] !== current[f]) st = 'modified';
      else st = 'clean';
      var meta = { added: ['A', 'новый'], modified: ['M', 'изменён'], deleted: ['D', 'удалён'], clean: ['·', 'без изменений'] }[st];
      var content = st === 'deleted' ? parent[f] : current[f];
      content = content == null ? '' : String(content);
      var body;
      if (selectedCommitMode === 'diff') {
        if (st === 'clean') body = '<div class="ci-empty">В этом файле нет изменений относительно родителя.</div>';
        else {
          var diff = sim.fileDiffLines(
            st === 'added' ? null : (parent[f] == null ? '' : parent[f]),
            st === 'deleted' ? null : (current[f] == null ? '' : current[f])
          );
          body = diff.length
            ? '<div class="ci-diff">' + diff.map(function (row) {
                return '<div class="ci-diff__line ' + (row.cls || '') + '">' + App.esc(row.text) + '</div>';
              }).join('') + '</div>'
            : '<div class="ci-empty">Изменений нет.</div>';
        }
      } else {
        body = '<pre class="ci-code">' + (content ? App.esc(content) : '<span class="dim">(пустой файл)</span>') + '</pre>';
      }
      el.innerHTML = '<div class="ci-preview__head">' +
          '<div class="ci-preview__title"><span class="ci-file__mark">' + meta[0] + '</span><b>' + App.esc(f) + '</b><span class="ci-file__state">' + meta[1] + '</span></div>' +
          '<div class="ci-preview__tools">' +
            '<button type="button" class="ci-tab' + (selectedCommitMode === 'content' ? ' active' : '') + '" data-ci-mode="content">Код</button>' +
            '<button type="button" class="ci-tab' + (selectedCommitMode === 'diff' ? ' active' : '') + '" data-ci-mode="diff">Diff</button>' +
            '<button type="button" class="icon-btn ci-copy" data-ci-copy title="Скопировать содержимое">⧉</button>' +
          '</div>' +
        '</div>' +
        '<div class="ci-preview__body">' + body + '</div>';
    }

    function openFileModal(name) {
      if (!modal) return;
      editFileName = name || null;
      var exists = name != null && (has(sim.model.files, name) || has(sim.headFiles(), name));
      var content = '';
      if (name != null) content = has(sim.model.files, name) ? sim.model.files[name] : (sim.headFiles()[name] || '');
      modalTitle.textContent = name ? 'Редактировать: ' + name : 'Новый файл';
      modalName.value = name || '';
      modalName.readOnly = !!name;
      modalContent.value = content;
      modalDelete.hidden = !exists;
      var cf = name && sim.conflicts[name] && !sim.conflicts[name].resolved ? sim.conflicts[name] : null;
      var conflictEl = document.getElementById('file-modal-conflict');
      conflictEl.hidden = !cf;
      if (cf) {
        document.getElementById('file-modal-ours').textContent = 'Взять HEAD';
        document.getElementById('file-modal-theirs').textContent = 'Взять ' + (cf.target || 'их');
      }
      modal.hidden = false;
      document.body.classList.add('modal-open');
      setTimeout(function () { (name ? modalContent : modalName).focus(); }, 40);
    }

    function closeFileModal() {
      if (!modal) return;
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      editFileName = null;
    }

    function saveFileModal() {
      var name = (modalName.value || '').trim();
      if (!name) { App.toast('Введи имя файла', 'info'); modalName.focus(); return; }
      if (/[\\/]/.test(name) || name === '.' || name === '..') { App.toast('Имя без слэшей и точек пути', 'info'); modalName.focus(); return; }
      if (editFileName == null && (has(sim.model.files, name) || has(sim.headFiles(), name))) {
        App.toast('Файл уже существует — открой его в списке', 'info');
        modalName.focus();
        return;
      }
      var isNew = editFileName == null;
      sim.writeFile(name, modalContent.value);
      closeFileModal();
      App.toast(isNew ? 'Файл создан' : 'Файл сохранён', 'ok');
    }

    document.getElementById('git-file-add').addEventListener('click', function () { openFileModal(null); });
    document.getElementById('ci-close').addEventListener('click', closeCommit);

    document.getElementById('ci-files').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ci-file]');
      if (!b) return;
      selectedCommitFile = b.getAttribute('data-ci-file');
      renderCommitInspector();
    });
    document.getElementById('ci-sub').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ci-parent]');
      if (b) openCommit(b.getAttribute('data-ci-parent'));
    });
    document.getElementById('ci-preview').addEventListener('click', function (e) {
      var tab = e.target.closest('[data-ci-mode]');
      if (tab) { selectedCommitMode = tab.getAttribute('data-ci-mode'); renderCommitInspector(); return; }
      if (e.target.closest('[data-ci-copy]')) {
        var c = commitById(selectedCommitId);
        if (!c || !selectedCommitFile) return;
        var parentFiles = c.parents && c.parents[0] ? sim.filesOf(c.parents[0]) : {};
        var val = has(c.files, selectedCommitFile) ? c.files[selectedCommitFile] : parentFiles[selectedCommitFile];
        App.copyText(val != null ? val : '');
      }
    });

    document.getElementById('git-files').addEventListener('click', function (e) {
      var action = e.target.closest('[data-file-action]');
      if (action) {
        var file = action.getAttribute('data-file');
        var kind = action.getAttribute('data-file-action');
        if (kind === 'stage') {
          var r = sim.stageFile(file);
          if (!r.ok) App.toast(r.error, 'info');
          else App.toast('В индекс: ' + file, 'ok');
        } else if (kind === 'unstage') {
          sim.unstageFile(file);
          App.toast('Убрано из индекса: ' + file, 'info');
        } else if (kind === 'edit') openFileModal(file);
        else if (kind === 'delete') {
          if (!confirm('Удалить файл ' + file + '? Изменение можно будет вернуть через редактирование.')) return;
          sim.deleteFile(file);
          App.toast('Файл удалён', 'info');
        }
        return;
      }
      var row = e.target.closest('[data-file]');
      if (row) openFileModal(row.getAttribute('data-file'));
    });
    document.getElementById('git-files').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('[data-file-action]')) return;
      var row = e.target.closest('[data-file]');
      if (!row) return;
      e.preventDefault();
      openFileModal(row.getAttribute('data-file'));
    });
    document.getElementById('git-conflicts').addEventListener('click', function (e) {
      var b = e.target.closest('[data-file-open]');
      if (b) openFileModal(b.getAttribute('data-file-open'));
    });

    modal.querySelectorAll('[data-file-close]').forEach(function (b) {
      b.addEventListener('click', closeFileModal);
    });
    document.getElementById('file-modal-ours').addEventListener('click', function () {
      if (editFileName && sim.conflicts[editFileName]) { modalContent.value = sim.conflicts[editFileName].ours || ''; modalContent.focus(); }
    });
    document.getElementById('file-modal-theirs').addEventListener('click', function () {
      if (editFileName && sim.conflicts[editFileName]) { modalContent.value = sim.conflicts[editFileName].theirs || ''; modalContent.focus(); }
    });
    document.getElementById('file-modal-save').addEventListener('click', saveFileModal);
    document.getElementById('file-modal-delete').addEventListener('click', function () {
      if (!editFileName) return;
      if (!confirm('Удалить файл ' + editFileName + '?')) return;
      sim.deleteFile(editFileName);
      closeFileModal();
      App.toast('Файл удалён', 'info');
    });
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeFileModal(); }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveFileModal(); }
    });

    document.getElementById('git-reset').addEventListener('click', function () {
      sim.reset();
      sim.print(['Песочница сброшена. Файлы снова untracked, история пуста.', ''], 't-dim');
      input.focus();
    });

    root.querySelectorAll('[data-gitfill]').forEach(function (b) {
      b.addEventListener('click', function () {
        input.value = b.getAttribute('data-gitfill');
        input.focus();
      });
    });

    root.querySelectorAll('[data-mission-hint]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-mission-hint');
        var el = document.getElementById('steps-' + id);
        if (!el) return;
        var show = el.style.display === 'none';
        el.style.display = show ? '' : 'none';
        b.textContent = show ? 'Скрыть подсказку' : 'Подсказка';
      });
    });

    App.setCleanup(function () {
      document.body.classList.remove('modal-open');
      var m = document.getElementById('git-file-modal');
      if (m && m.parentNode === document.body) m.remove();
    });
  }
})();
