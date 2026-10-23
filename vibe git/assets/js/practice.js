/* Task engine for CMD and Git practice */
(function () {
  'use strict';

  function normalize(s) {
    return String(s == null ? '' : s)
      .replace(/\r/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\s*([>|&])\s*/g, '$1');
  }

  function splitLines(s) {
    return String(s || '').replace(/\r/g, '').split('\n').map(normalize).filter(function (x) { return x.length; });
  }

  window.renderPractice = function (track, params) {
    var App = window.App;
    var tasks = App.trackTasks(track);
    var isCmd = track === 'cmd';
    var data = App.trackData(track);
    var runtime = {};
    var filter = 'all';

    tasks.forEach(function (t, i) {
      var pairMap = {};
      runtime[t.id] = {
        choice: [],
        order: [],
        pool: t.type === 'order' ? shuffle(t.steps.map(function (_, k) { return k; })) : [],
        match: {},
        activeLeft: null,
        attempts: 0,
        number: i + 1
      };
      if (t.type === 'match') {
        t.pairs.forEach(function (p, k) { pairMap[k] = null; });
        runtime[t.id].match = pairMap;
      }
    });

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
      return a;
    }

    var done = tasks.filter(function (t) { return App.state.done[t.id]; }).length;
    var xpTrack = tasks.filter(function (t) { return App.state.done[t.id]; }).reduce(function (a, t) { return a + (t.xp || 10); }, 0);
    var pct = Math.round(done / tasks.length * 100);

    var levels = [
      { n: 1, title: 'Разминка', desc: 'Базовые команды и синтаксис. Здесь важно не спешить и заметить детали.' },
      { n: 2, title: 'Уверенный уровень', desc: 'Рабочие сценарии: несколько флагов, конвейеры, ветки и отмена.' },
      { n: 3, title: 'Сценарии и ловушки', desc: 'Задания из семинаров и ситуации, где легко потерять работу.' }
    ];

    function renderTask(t) {
      var rt = runtime[t.id];
      var isDone = !!App.state.done[t.id];
      var tags = '<span class="tag tag--type">' + typeName(t.type) + '</span>' +
        (t.seminar ? '<span class="tag tag--seminar">семинар</span>' : '') +
        '<span class="tag tag--xp">+' + (t.xp || 10) + ' XP</span>';
      return '<article class="task' + (isDone ? ' done' : '') + (params.task === t.id ? ' open' : '') + '" id="task-' + t.id + '" data-id="' + t.id + '" data-level="' + t.level + '" data-seminar="' + (t.seminar ? '1' : '0') + '">' +
        '<button class="task__head" type="button" aria-expanded="' + (params.task === t.id ? 'true' : 'false') + '">' +
          '<span class="task__num">' + (isDone ? '✓' : pad(rt.number)) + '</span>' +
          '<span style="min-width:0"><span class="task__title">' + App.esc(t.title) + '</span>' +
            '<span class="task__meta"><span class="task__tags">' + tags + '</span></span></span>' +
          '<span class="task__chev">▶</span>' +
        '</button>' +
        '<div class="task__body">' +
          '<div class="task__prompt">' + t.prompt + '</div>' +
          answerHtml(t, rt) +
          '<div class="task__actions">' +
            '<button class="btn btn--primary btn--sm" data-act="check">Проверить</button>' +
            '<button class="btn btn--sm" data-act="hint">Подсказки</button>' +
            '<button class="btn btn--sm btn--ghost" data-act="solution">Решение</button>' +
            '<span class="spacer"></span>' +
            '<span class="small dim">' + (isDone ? 'решено' : 'попыток: ' + rt.attempts) + '</span>' +
          '</div>' +
          '<div class="hints">' + t.hint.map(function (h) { return '<p>' + h + '</p>'; }).join('') + '</div>' +
          '<div class="solution">' +
            '<div class="example"><code>' + App.esc(t.solution) + '</code></div>' +
            '<div class="solution__note"><b>Разбор.</b> ' + t.explain + '<br><span class="dim">Просмотр решения не засчитывает задание.</span></div>' +
          '</div>' +
          '<div class="feedback"></div>' +
        '</div>' +
      '</article>';
    }

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function typeName(type) {
      return { input: 'команда', choice: 'выбор', multi: 'выбор', match: 'сопоставление', order: 'порядок' }[type] || type;
    }

    function answerHtml(t, rt) {
      if (t.type === 'input') {
        var multi = t.multiline || (t.answers && t.answers.some(function (a) { return a.indexOf('\n') >= 0; }));
        return '<div class="answer-area"><div class="answer-label">' + (multi ? 'Твои команды (каждая с новой строки)' : 'Команда') + '</div>' +
          (multi
            ? '<textarea class="answer-input" rows="3" spellcheck="false" placeholder="' + App.esc(t.placeholder || 'введи команды...') + '"></textarea>'
            : '<input class="answer-input" type="text" spellcheck="false" autocomplete="off" placeholder="' + App.esc(t.placeholder || 'введи команду...') + '">') +
          '<div class="answer-keyhint">' + (multi ? 'Enter — новая строка · Ctrl+Enter — проверить' : 'Enter — проверить') + '</div>' +
          '</div>';
      }
      if (t.type === 'choice') {
        var letter = ['A', 'B', 'C', 'D', 'E', 'F'];
        return '<div class="answer-area"><div class="answer-label">' + (t.multi ? 'Выбери все подходящие' : 'Выбери один вариант') + '</div><div class="options">' +
          t.options.map(function (opt, i) {
            return '<button type="button" class="option" data-i="' + i + '"><span class="option__key">' + letter[i] + '</span><span>' + App.esc(opt) + '</span></button>';
          }).join('') + '</div></div>';
      }
      if (t.type === 'match') {
        var right = shuffle(t.pairs.map(function (p, i) { return { text: p[1], i: i }; }));
        return '<div class="answer-area"><div class="answer-label">Нажми на команду слева, затем на её значение справа</div>' +
          '<div class="match-grid">' +
            '<div class="match-col">' + t.pairs.map(function (p, i) {
              return '<button type="button" class="match-item" data-side="left" data-i="' + i + '"><code>' + App.esc(p[0]) + '</code></button>';
            }).join('') + '</div>' +
            '<div class="match-col">' + right.map(function (r) {
              return '<button type="button" class="match-item" data-side="right" data-i="' + r.i + '"><span>' + App.esc(r.text) + '</span></button>';
            }).join('') + '</div>' +
          '</div><div class="match-hint">Совпавшие пары подсвечиваются зелёным.</div></div>';
      }
      if (t.type === 'order') {
        return '<div class="answer-area"><div class="answer-label">Собери правильную последовательность</div>' +
          '<div class="order-list" data-order-list></div>' +
          '<div class="order-pool" data-order-pool>' + rt.pool.map(function (idx) {
            return '<button type="button" class="order-chip" data-step="' + idx + '"><code>' + App.esc(t.steps[idx]) + '</code></button>';
          }).join('') + '</div></div>';
      }
      return '';
    }

    function renderLevels() {
      return levels.map(function (lv) {
        var list = tasks.filter(function (t) { return t.level === lv.n; });
        var solved = list.filter(function (t) { return App.state.done[t.id]; }).length;
        return '<section class="task-level" data-level="' + lv.n + '">' +
          '<div class="task-level__head"><h3>' + lv.title + '</h3><span>' + solved + ' / ' + list.length + '</span></div>' +
          '<p class="task-level__desc">' + lv.desc + '</p>' +
          '<div class="task-list">' + list.map(renderTask).join('') + '</div>' +
        '</section>';
      }).join('');
    }

    app.innerHTML = '<div class="page track-' + track + '">' +
      '<div class="page-head">' +
        '<div><div class="eyebrow">' + (isCmd ? 'Windows CMD' : 'Git') + ' · практика</div>' +
          '<h1>' + (isCmd ? 'Отработка <span class="grad-cmd">команд</span>' : 'Отработка <span class="grad-git">Git</span>') + '</h1>' +
          '<p class="lead" style="margin-top:12px">' + (isCmd ? 'Ввод, выбор, сопоставление и порядок шагов. Проверка мгновенная, объяснение — после ответа.' : 'От базовых коммитов до rebase и спасения через reflog. Ошибаться здесь бесплатно.') + '</p>' +
        '</div>' +
        '<a class="btn" href="#/' + track + '">← К теории</a>' +
      '</div>' +
      '<div class="practice-top">' +
        '<div class="practice-top__stats">' +
          '<div><b>' + done + ' / ' + tasks.length + '</b>решено</div>' +
          '<div><b class="' + (isCmd ? 'green' : 'orange') + '">' + pct + '%</b>прогресс</div>' +
          '<div><b>' + xpTrack + '</b>XP за задания</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          '<button class="btn btn--sm" id="practice-reset">Сбросить прогресс</button>' +
        '</div>' +
      '</div>' +
      '<div class="filter-row" id="practice-filters">' +
        '<button class="chip active" data-filter="all">Все</button>' +
        '<button class="chip" data-filter="undone">Не решено</button>' +
        '<button class="chip" data-filter="seminar">Из семинара</button>' +
        '<span class="spacer"></span>' +
        '<span class="small dim" id="filter-count">' + tasks.length + ' заданий</span>' +
      '</div>' +
      '<div id="practice-list">' + renderLevels() + '</div>' +
    '</div>';

    var listEl = document.getElementById('practice-list');
    App.setCleanup(null);

    if (params.task) {
      var target = document.getElementById('task-' + params.task);
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 80);
    }

    /* open / close */
    listEl.addEventListener('click', function (e) {
      var head = e.target.closest('.task__head');
      if (head) {
        var taskEl = head.closest('.task');
        var open = taskEl.classList.toggle('open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) setTimeout(function () { taskEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60);
        return;
      }

      var card = e.target.closest('.task');
      if (!card) return;
      var id = card.getAttribute('data-id');
      var task = tasks.filter(function (t) { return t.id === id; })[0];
      var rt = runtime[id];

      var act = e.target.closest('[data-act]');
      if (act) {
        var kind = act.getAttribute('data-act');
        if (kind === 'check') checkTask(card, task, rt);
        else if (kind === 'hint') {
          var h = card.querySelector('.hints');
          h.classList.toggle('show');
          act.textContent = h.classList.contains('show') ? 'Скрыть подсказки' : 'Подсказки';
        } else if (kind === 'solution') {
          var s = card.querySelector('.solution');
          s.classList.toggle('show');
          act.textContent = s.classList.contains('show') ? 'Скрыть решение' : 'Решение';
        }
        return;
      }

      if (task.type === 'choice') {
        var opt = e.target.closest('.option');
        if (!opt) return;
        var idx = parseInt(opt.getAttribute('data-i'), 10);
        if (task.multi) {
          var at = rt.choice.indexOf(idx);
          if (at >= 0) rt.choice.splice(at, 1); else rt.choice.push(idx);
        } else rt.choice = [idx];
        card.querySelectorAll('.option').forEach(function (o) {
          o.classList.toggle('selected', rt.choice.indexOf(parseInt(o.getAttribute('data-i'), 10)) >= 0);
          o.classList.remove('correct', 'wrong');
        });
        return;
      }

      if (task.type === 'match') {
        var mi = e.target.closest('.match-item');
        if (!mi || mi.classList.contains('matched')) return;
        var side = mi.getAttribute('data-side');
        var i = parseInt(mi.getAttribute('data-i'), 10);
        if (side === 'left') {
          card.querySelectorAll('.match-item[data-side="left"]').forEach(function (x) { x.classList.remove('active'); });
          mi.classList.add('active');
          rt.activeLeft = i;
          return;
        }
        if (rt.activeLeft == null) {
          toastHint(card, 'Сначала выбери команду слева.');
          return;
        }
        var left = rt.activeLeft;
        var correct = left === i;
        if (correct) {
          rt.match[left] = i;
          rt.activeLeft = null;
          var l = card.querySelector('.match-item[data-side="left"][data-i="' + left + '"]');
          var r = card.querySelector('.match-item[data-side="right"][data-i="' + i + '"]');
          l.classList.remove('active');
          l.classList.add('matched');
          r.classList.add('matched');
          card.querySelectorAll('.match-item[data-side="left"]').forEach(function (x) { x.classList.remove('active'); });
          var total = task.pairs.length;
          var matched = Object.keys(rt.match).filter(function (k) { return rt.match[k] != null; }).length;
          if (matched === total) {
            var fb = card.querySelector('.feedback');
            fb.className = 'feedback show ok';
            fb.innerHTML = '<div class="feedback__title">✓ Всё верно</div>' + task.explain;
            solve(card, task, rt);
          }
        } else {
          mi.classList.add('wrong');
          var l2 = card.querySelector('.match-item[data-side="left"][data-i="' + left + '"]');
          if (l2) l2.classList.add('wrong');
          setTimeout(function () { mi.classList.remove('wrong'); if (l2) l2.classList.remove('wrong'); }, 500);
        }
        return;
      }

      if (task.type === 'order') {
        var chip = e.target.closest('.order-chip');
        if (chip) {
          var step = parseInt(chip.getAttribute('data-step'), 10);
          rt.order.push(step);
          rt.pool = rt.pool.filter(function (x) { return x !== step; });
          renderOrder(card, task, rt);
          return;
        }
        var sel = e.target.closest('.order-item');
        if (sel) {
          var step2 = parseInt(sel.getAttribute('data-step'), 10);
          rt.order = rt.order.filter(function (x) { return x !== step2; });
          rt.pool.push(step2);
          renderOrder(card, task, rt);
          return;
        }
        return;
      }
    });

    listEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || e.shiftKey) return;
      var input = e.target.closest('.answer-input');
      if (!input) return;
      // Enter adds a line in multiline answers; Ctrl/Cmd+Enter checks them.
      if (input.tagName === 'TEXTAREA' && !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      var card = input.closest('.task');
      var id = card.getAttribute('data-id');
      var task = tasks.filter(function (t) { return t.id === id; })[0];
      checkTask(card, task, runtime[id]);
    });

    document.getElementById('practice-filters').addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll('#practice-filters .chip').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      filter = chip.getAttribute('data-filter');
      applyFilter();
    });

    function applyFilter() {
      var shown = 0;
      document.querySelectorAll('.task').forEach(function (t) {
        var isDone = t.classList.contains('done');
        var isSeminar = t.getAttribute('data-seminar') === '1';
        var show = filter === 'all' || (filter === 'undone' && !isDone) || (filter === 'seminar' && isSeminar);
        t.style.display = show ? '' : 'none';
        if (show) shown++;
      });
      document.querySelectorAll('.task-level').forEach(function (lv) {
        var has = lv.querySelectorAll('.task:not([style*="display: none"])').length > 0;
        lv.style.display = has ? '' : 'none';
      });
      var fc = document.getElementById('filter-count');
      if (fc) fc.textContent = shown + ' заданий';
    }

    document.getElementById('practice-reset').addEventListener('click', function () {
      if (!confirm('Сбросить весь прогресс по заданиям и теории? Это действие нельзя отменить.')) return;
      App.state.done = {};
      App.state.learned = {};
      App.state.missions = {};
      App.save();
      App.updateChrome();
      App.toast('Прогресс сброшен', 'info');
      App.rerender();
    });

    function toastHint(card, text) {
      var fb = card.querySelector('.feedback');
      fb.className = 'feedback show bad';
      fb.innerHTML = '<div class="feedback__title">Подсказка</div>' + App.esc(text);
      setTimeout(function () { if (fb.classList.contains('bad')) { fb.classList.remove('show'); } }, 2200);
    }

    function renderOrder(card, task, rt) {
      var list = card.querySelector('[data-order-list]');
      var pool = card.querySelector('[data-order-pool]');
      if (!list || !pool) return;
      list.innerHTML = rt.order.length
        ? rt.order.map(function (idx, i) {
            return '<button type="button" class="order-item" data-step="' + idx + '"><b>' + (i + 1) + '</b><code>' + App.esc(task.steps[idx]) + '</code></button>';
          }).join('')
        : '<div class="small dim" style="padding:4px 2px">Пусто — добавляй шаги из списка ниже</div>';
      pool.innerHTML = rt.pool.map(function (idx) {
        return '<button type="button" class="order-chip" data-step="' + idx + '"><code>' + App.esc(task.steps[idx]) + '</code></button>';
      }).join('');
    }

    function checkTask(card, task, rt) {
      var ok = false;
      var input = card.querySelector('.answer-input');
      if (task.type === 'input') {
        var raw = input ? input.value : '';
        if (task.pattern) {
          ok = task.pattern.test(raw.trim());
        } else {
          var value = splitLines(raw).join('\n');
          if (!value) return flashEmpty(card);
          ok = task.answers.some(function (a) { return splitLines(a).join('\n') === value; });
        }
      } else if (task.type === 'choice') {
        if (!rt.choice.length) return flashEmpty(card);
        var correct = task.correct.slice().sort().join(',');
        var selected = rt.choice.slice().sort().join(',');
        ok = correct === selected;
      } else if (task.type === 'order') {
        if (rt.order.length !== task.steps.length) return flashEmpty(card);
        ok = rt.order.every(function (v, i) { return v === i; });
      } else if (task.type === 'match') {
        var matched = Object.keys(rt.match).filter(function (k) { return rt.match[k] != null; }).length;
        ok = matched === task.pairs.length;
      }

      if (ok) {
        markAnswer(card, task, rt, true);
        solve(card, task, rt);
        var fb = card.querySelector('.feedback');
        fb.className = 'feedback show ok';
        fb.innerHTML = '<div class="feedback__title">✓ Верно</div>' + task.explain +
          '<div class="solution" style="display:block"><div class="example" style="margin-top:10px"><code>' + App.esc(task.solution) + '</code></div></div>' +
          nextButtonHtml(task);
        bindNext(card);
        if (input) input.classList.add('correct');
      } else {
        rt.attempts++;
        var f = card.querySelector('.feedback');
        f.className = 'feedback show bad';
        f.innerHTML = '<div class="feedback__title">Пока не то</div>' +
          (task.type === 'input'
            ? 'Сравни команду посимвольно: команда, пробел, ключи, путь. Регистр в CMD не важен, а вот порядок аргументов — да.'
            : 'Вернись к теории или открой подсказки — там есть направление мысли.') +
          (rt.attempts >= 3 ? '<br><span class="dim">Третья попытка: можно открыть решение кнопкой ниже — без XP, но с разбором.</span>' : '');
        if (input) {
          var area = input.closest('.answer-area');
          if (area) {
            area.classList.add('wrong');
            setTimeout(function () { area.classList.remove('wrong'); }, 450);
          }
        }
        var counter = card.querySelector('.task__actions .dim');
        if (counter) counter.textContent = 'попыток: ' + rt.attempts;
        markAnswer(card, task, rt, false);
      }
    }

    function flashEmpty(card) {
      var f = card.querySelector('.feedback');
      f.className = 'feedback show bad';
      f.innerHTML = '<div class="feedback__title">Пусто</div>Сначала введи ответ или выбери вариант.';
      var input = card.querySelector('.answer-input');
      if (input) {
        input.closest('.answer-area').classList.add('wrong');
        setTimeout(function () { input.closest('.answer-area').classList.remove('wrong'); }, 400);
      }
    }

    function nextButtonHtml(task) {
      var next = tasks.filter(function (t) { return !App.state.done[t.id] && t.id !== task.id; })[0];
      return next ? '<div style="margin-top:12px"><button class="btn btn--sm" data-next="' + next.id + '">Следующее нерешённое →</button></div>' : '<div style="margin-top:10px" class="small dim">Все задания трека решены. Красиво.</div>';
    }

    function bindNext(card) {
      var btn = card.querySelector('[data-next]');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-next');
        var nextEl = document.getElementById('task-' + id);
        if (!nextEl) return;
        if (filter !== 'all') {
          filter = 'all';
          document.querySelectorAll('#practice-filters .chip').forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-filter') === 'all'); });
          applyFilter();
        }
        nextEl.classList.add('open');
        nextEl.querySelector('.task__head').setAttribute('aria-expanded', 'true');
        nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var inp = nextEl.querySelector('.answer-input');
        if (inp) setTimeout(function () { inp.focus(); }, 350);
      });
    }

    function markAnswer(card, task, rt, ok) {
      if (task.type === 'choice') {
        card.querySelectorAll('.option').forEach(function (o) {
          var i = parseInt(o.getAttribute('data-i'), 10);
          var isCorrect = task.correct.indexOf(i) >= 0;
          var isSelected = rt.choice.indexOf(i) >= 0;
          o.classList.remove('wrong', 'correct');
          if (ok && isCorrect) o.classList.add('correct');
          if (!ok && isSelected && !isCorrect) o.classList.add('wrong');
          if (!ok && isCorrect) o.classList.add('correct');
        });
      }
      if (task.type === 'order') {
        card.querySelectorAll('.order-item').forEach(function (o, i) {
          o.classList.remove('correct', 'wrong');
          o.classList.add(ok ? 'correct' : 'wrong');
        });
      }
    }

    function solve(card, task, rt) {
      var wasDone = !!App.state.done[task.id];
      if (!wasDone) {
        App.state.done[task.id] = { ts: Date.now() };
        App.save();
        App.updateChrome();
        App.confetti();
        App.toast('+' + (task.xp || 10) + ' XP · ' + task.title, 'ok');
        card.classList.add('done');
        var num = card.querySelector('.task__num');
        if (num) num.textContent = '✓';
        var head = card.querySelector('.task__head');
        if (head) head.setAttribute('aria-expanded', 'true');
        var counter = card.querySelector('.task__actions .dim');
        if (counter) counter.textContent = 'решено';
        var topDone = tasks.filter(function (t) { return App.state.done[t.id]; }).length;
        var pct2 = Math.round(topDone / tasks.length * 100);
        var stats = document.querySelectorAll('.practice-top__stats b');
        if (stats[0]) stats[0].textContent = topDone + ' / ' + tasks.length;
        if (stats[1]) stats[1].textContent = pct2 + '%';
        if (stats[2]) stats[2].textContent = tasks.filter(function (t) { return App.state.done[t.id]; }).reduce(function (a, t) { return a + (t.xp || 10); }, 0);
        var lvEl = card.closest('.task-level');
        if (lvEl) {
          var lv = lvEl.getAttribute('data-level');
          var list = tasks.filter(function (t) { return String(t.level) === lv; });
          var solved = list.filter(function (t) { return App.state.done[t.id]; }).length;
          var span = lvEl.querySelector('.task-level__head span');
          if (span) span.textContent = solved + ' / ' + list.length;
        }
        applyFilter();
      }
    }
  };
})();
