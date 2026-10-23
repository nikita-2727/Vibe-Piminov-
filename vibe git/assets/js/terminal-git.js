/* Git sandbox — a small stateful Git simulator with a live graph */
(function () {
  var HELP = [
    ['Git-песочница. Поддерживаются:', 't-head'],
    ['  git init / status / add / commit / commit --amend', ''],
    ['  git log --oneline --graph --all / show / diff / reflog', ''],
    ['  git branch / switch / checkout / merge [--no-ff|--no-commit|--squash|--abort]', ''],
    ['  git reset --soft|--mixed|--hard <ref> / revert / cherry-pick', ''],
    ['  git rebase / rebase -i / clean / restore / rm --cached', ''],
    ['  git tag / remote / fetch / pull / push / stash', ''],
    ['', ''],
    ['Файлы для работы уже есть: README.md, hello.txt, app.js', 't-dim'],
    ['Создать: echo "text" > file.txt или touch file.txt, удалить: rm file.txt', 't-dim'],
    ['Посмотреть файлы: ls    Прочитать: cat README.md', 't-dim'],
    ['В панели «Файлы» можно создать, изменить, удалить и добавить файл в индекс.', 't-dim'],
    ['При конфликте убери маркеры <<<<<<< ======= >>>>>>>, сохрани и нажми «В индекс».', 't-dim'],
    ['Сбросить песочницу: reset', 't-dim']
  ];

  function GitSandbox(opts) {
    this.output = opts.output;
    this.input = opts.input;
    this.promptEl = opts.prompt;
    this.onChange = opts.onChange || function () {};
    this.view = opts.view || null;
    this.initialFiles = {
      'README.md': '# Git sandbox\nPractise branches, merge and reset here.\n',
      'hello.txt': 'hello world\n',
      'app.js': 'console.log("app");\n'
    };
    this.config = { 'user.name': 'student', 'user.email': 'student@example.com' };
    this.tags = {};
    this.remote = null;
    this.tracking = {};
    this.history = [];
    this.histIdx = 0;
    this.conflicts = {};
    this.mergeSnapshot = null;
    this.attach();
    this.reset(true);
  }

  GitSandbox.prototype.attach = function () {
    var self = this;
    if (!this.input) return;
    this.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var line = self.input.value;
        self.input.value = '';
        self.execute(line);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (self.histIdx > 0) {
          self.histIdx--;
          self.input.value = self.history[self.histIdx] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (self.histIdx < self.history.length - 1) {
          self.histIdx++;
          self.input.value = self.history[self.histIdx] || '';
        } else {
          self.histIdx = self.history.length;
          self.input.value = '';
        }
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        self.clear();
      }
    });
  };

  GitSandbox.prototype.reset = function (silent) {
    this.model = new GitModel({
      commits: [],
      branches: {},
      head: { type: 'branch', name: 'main' },
      lanes: { main: 0, feature: 1, detached: 2 },
      files: Object.assign({}, this.initialFiles)
    });
    this.model.files = Object.assign({}, this.initialFiles);
    this.staged = {};
    this.deletedStaged = {};
    this.branch = 'main';
    this.prevBranch = null;
    this.tags = {};
    this.remote = null;
    this.tracking = {};
    this.pendingMerge = null;
    this.conflicts = {};
    this.mergeSnapshot = null;
    this.stash = [];
    if (!silent) this.clear();
    if (this.view) this.view.setModel(this.model);
    if (!silent) {
      this.print(['Песочница Git сброшена. Репозиторий пуст, файлы не отслеживаются.', 'Начни с git status или сразу: git add . && git commit -m "initial"', ''], 't-dim');
    }
    this.updatePrompt();
    this.onChange(this);
  };

  GitSandbox.prototype.clear = function () {
    if (this.output) this.output.innerHTML = '';
  };

  GitSandbox.prototype.print = function (lines, cls) {
    if (!this.output) return;
    if (typeof lines === 'string') lines = [lines];
    lines.forEach(function (line) {
      var div = document.createElement('div');
      div.className = 't-line ' + (cls || '');
      div.textContent = line == null ? '' : line;
      this.output.appendChild(div);
    }, this);
    this.output.scrollTop = this.output.scrollHeight;
  };

  GitSandbox.prototype.printRich = function (rows) {
    if (!this.output) return;
    rows.forEach(function (r) {
      var div = document.createElement('div');
      div.className = 't-line ' + (r.cls || '');
      div.textContent = r.text == null ? '' : r.text;
      this.output.appendChild(div);
    }, this);
    this.output.scrollTop = this.output.scrollHeight;
  };

  GitSandbox.prototype.printCommand = function (line) {
    if (!this.output) return;
    var div = document.createElement('div');
    div.className = 't-line';
    var p = document.createElement('span');
    p.className = 't-prompt';
    p.textContent = this.promptString();
    div.appendChild(p);
    div.appendChild(document.createTextNode(' ' + line));
    this.output.appendChild(div);
    this.output.scrollTop = this.output.scrollHeight;
  };

  GitSandbox.prototype.promptString = function () {
    if (this.model.head.type === 'detached') {
      return '~/repo (HEAD detached at ' + String(this.model.head.commit || '').slice(0, 7) + ') $';
    }
    return '~/repo (' + this.branch + ') $';
  };

  GitSandbox.prototype.updatePrompt = function () {
    if (this.promptEl) this.promptEl.textContent = this.promptString();
  };

  GitSandbox.prototype.record = function (msg) {
    var cid = this.model.headCommit();
    if (!cid) return;
    this.model.reflog.unshift({ commit: cid, msg: msg, time: Date.now() });
    if (this.model.reflog.length > 80) this.model.reflog.pop();
  };

  GitSandbox.prototype.refresh = function () {
    if (this.view) this.view.render();
    this.updatePrompt();
    this.onChange(this);
  };

  GitSandbox.prototype.execute = function (line) {
    line = String(line || '');
    if (!line.trim()) {
      this.printCommand('');
      return;
    }
    this.printCommand(line);
    this.history.push(line);
    this.histIdx = this.history.length;

    var trimmed = line.trim();
    if (/^(clear|cls)$/i.test(trimmed)) { this.clear(); return; }
    if (/^help$/i.test(trimmed)) {
      this.printRich(HELP.map(function (l) { return { text: l[0], cls: l[1] }; }));
      return;
    }
    if (/^reset$/i.test(trimmed)) { this.reset(); return; }

    var pseudo = this.pseudo(trimmed);
    if (pseudo) { this.printRich(pseudo); this.refresh(); return; }

    if (!/^git(\s|$)/i.test(trimmed)) {
      this.printRich([
        { text: "Это песочница Git. Начинай команды со слова git, например: git status", cls: 't-warn' },
        { text: "Посмотреть список: help. Сбросить: reset.", cls: 't-dim' }
      ]);
      return;
    }

    var tokens = this.tokenize(trimmed);
    var sub = (tokens[1] || '').toLowerCase();
    var args = tokens.slice(2);
    var res;
    try {
      res = this.dispatch(sub, args, tokens);
    } catch (e) {
      res = [{ text: 'Ошибка песочницы: ' + e.message, cls: 't-err' }];
    }
    if (res && res.length) this.printRich(res);
    this.refresh();
  };

  GitSandbox.prototype.pseudo = function (line) {
    var self = this;
    var m = line.match(/^echo\s+(.*?)\s*(>>|>)\s*(.+)$/i);
    if (m) {
      var text = m[1].replace(/^"|"$/g, '');
      var file = m[3].replace(/^"|"$/g, '');
      var append = m[2] === '>>';
      this.model.files[file] = (append && this.model.files[file] != null ? this.model.files[file] : '') + text + '\n';
      return [{ text: (append ? 'Дописано в ' : 'Записано в ') + file, cls: 't-dim' }];
    }
    if (/^touch\s+/.test(line)) {
      var f = line.replace(/^touch\s+/, '').replace(/^"|"$/g, '');
      if (this.model.files[f] == null) this.model.files[f] = '';
      return [{ text: 'Создан файл ' + f, cls: 't-dim' }];
    }
    if (/^(ls|dir)$/i.test(line)) {
      var head = this.headFiles();
      var names = Object.keys(this.model.files).sort();
      if (!names.length) return [{ text: '(пусто)', cls: 't-dim' }];
      return names.map(function (n) {
        var st = self.statusOf(n);
        return { text: (st === 'untracked' ? '?? ' : st === 'staged' ? 'A  ' : st === 'modified' ? ' M ' : '   ') + n, cls: st === 'untracked' ? 't-warn' : st === 'modified' ? 't-err' : st === 'staged' ? 't-ok' : '' };
      });
    }
    if (/^(cat|type)\s+/.test(line)) {
      var f2 = line.replace(/^(cat|type)\s+/, '').replace(/^"|"$/g, '');
      if (this.model.files[f2] == null) return [{ text: 'Нет файла: ' + f2, cls: 't-err' }];
      return this.model.files[f2].replace(/\n$/, '').split('\n').map(function (t) { return { text: t, cls: '' }; });
    }
    if (/^rm\s+/.test(line)) {
      var f3 = line.replace(/^rm\s+/, '').replace(/^"|"$/g, '');
      if (this.model.files[f3] == null) return [{ text: 'Нет файла: ' + f3, cls: 't-err' }];
      delete this.model.files[f3];
      return [{ text: 'Удалён рабочий файл ' + f3 + ' (изменение не закоммичено)', cls: 't-warn' }];
    }
    return null;
  };

  GitSandbox.prototype.tokenize = function (line) {
    var tokens = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"' && !q) { q = true; continue; }
      if (ch === '"' && q) { q = false; continue; }
      if (/\s/.test(ch) && !q) {
        if (cur) { tokens.push(cur); cur = ''; }
      } else cur += ch;
    }
    if (cur) tokens.push(cur);
    return tokens;
  };

  GitSandbox.prototype.headFiles = function () {
    var id = this.model.headCommit();
    var c = this.model.commits.filter(function (x) { return x.id === id; })[0];
    return c ? (c.files || {}) : {};
  };

  GitSandbox.prototype.statusOf = function (file) {
    var head = this.headFiles();
    if (this.conflicts[file] && !this.conflicts[file].resolved) return 'conflict';
    if (this.deletedStaged[file]) return 'staged-deleted';
    if (Object.prototype.hasOwnProperty.call(this.staged, file)) return 'staged';
    if (!Object.prototype.hasOwnProperty.call(head, file)) return 'untracked';
    if (!Object.prototype.hasOwnProperty.call(this.model.files, file)) return 'deleted';
    if (this.model.files[file] !== head[file]) return 'modified';
    return 'clean';
  };

  GitSandbox.prototype.hasConflictMarkers = function (text) {
    return /^(<{7}|={7}|>{7})/m.test(String(text || ''));
  };

  GitSandbox.prototype.unresolvedConflicts = function () {
    var self = this;
    return Object.keys(this.conflicts).filter(function (f) { return !self.conflicts[f].resolved; });
  };

  GitSandbox.prototype.writeFile = function (name, content) {
    this.model.files[name] = content == null ? '' : String(content);
    this.refresh();
  };

  GitSandbox.prototype.deleteFile = function (name) {
    var tracked = Object.prototype.hasOwnProperty.call(this.headFiles(), name);
    delete this.model.files[name];
    if (!tracked) {
      delete this.staged[name];
      delete this.deletedStaged[name];
    }
    this.refresh();
  };

  GitSandbox.prototype.stageFile = function (name) {
    var tracked = Object.prototype.hasOwnProperty.call(this.headFiles(), name);
    if (this.model.files[name] != null && Object.prototype.hasOwnProperty.call(this.model.files, name)) {
      if (this.conflicts[name] && !this.conflicts[name].resolved && this.hasConflictMarkers(this.model.files[name])) {
        return { ok: false, error: 'В файле остались маркеры конфликта. Убери <<<<<<<, ======= и >>>>>>>.' };
      }
      this.staged[name] = this.model.files[name];
      delete this.deletedStaged[name];
      if (this.conflicts[name]) this.conflicts[name].resolved = true;
    } else {
      this.deletedStaged[name] = true;
      delete this.staged[name];
      if (this.conflicts[name]) this.conflicts[name].resolved = true;
    }
    this.refresh();
    return { ok: true, tracked: tracked };
  };

  GitSandbox.prototype.unstageFile = function (name) {
    delete this.staged[name];
    delete this.deletedStaged[name];
    if (this.conflicts[name]) this.conflicts[name].resolved = false;
    this.refresh();
  };

  GitSandbox.prototype.dispatch = function (sub, args, tokens) {
    var self = this;
    var L = function (text, cls) { return { text: text == null ? '' : text, cls: cls || '' }; };
    var ok = function (text) { return [L(text || 'OK', 't-ok')]; };
    var warn = function (text) { return [L(text, 't-warn')]; };
    var err = function (text) { return [L(text, 't-err')]; };

    if (!sub) return [L('Использование: git <команда>. Например: git status', 't-dim')];

    if (sub === 'help') {
      return [{ text: 'git ' + (args[0] || '') + ' — смотри теорию на странице Git. Команды: status, add, commit, log, branch, switch, merge, reset, revert, cherry-pick, rebase, clean, reflog, stash, push.', cls: 't-dim' }];
    }

    if (sub === 'init') {
      if (this.model.commits.length) return [L('Reinitialized existing Git repository.', 't-dim')];
      this.branch = 'main';
      this.model.head = { type: 'branch', name: 'main' };
      return [L('Initialized empty Git repository.', 't-ok')];
    }

    if (sub === 'config') {
      var key = args[0], val = args.slice(1).join(' ');
      if (key && val) { this.config[key.replace(/^--global$/, '')] = val; return ok('Настройка сохранена: ' + key + '=' + val); }
      return Object.keys(this.config).map(function (k) { return L(k + '=' + self.config[k], ''); });
    }

    if (sub === 'status') {
      return this.statusLines();
    }

    if (sub === 'add') {
      if (!args.length) return err('Nothing specified, nothing added. Используй: git add .');
      var all = args.some(function (a) { return a === '.' || a === '-A' || a === '--all'; });
      var filesToAdd = all ? Object.keys(this.model.files) : args.filter(function (a) { return a[0] !== '-'; });
      var added = 0;
      var blocked = [];
      filesToAdd.forEach(function (f) {
        if (Object.prototype.hasOwnProperty.call(self.model.files, f)) {
          if (self.conflicts[f] && !self.conflicts[f].resolved && self.hasConflictMarkers(self.model.files[f])) {
            blocked.push(f);
            return;
          }
          self.staged[f] = self.model.files[f];
          delete self.deletedStaged[f];
          if (self.conflicts[f]) self.conflicts[f].resolved = true;
          added++;
        } else {
          self.deletedStaged[f] = true;
          delete self.staged[f];
          if (self.conflicts[f]) self.conflicts[f].resolved = true;
          added++;
        }
      });
      if (all) {
        Object.keys(this.headFiles()).forEach(function (f) {
          if (!Object.prototype.hasOwnProperty.call(self.model.files, f) && !self.deletedStaged[f]) {
            self.deletedStaged[f] = true;
            if (self.conflicts[f]) self.conflicts[f].resolved = true;
            added++;
          }
        });
      }
      if (blocked.length) {
        return [L('Не добавлено: в файлах остались маркеры конфликта.', 't-warn')]
          .concat(blocked.map(function (f) { return L('  ' + f + ' — убери <<<<<<<, =======, >>>>>>>.', 't-dim'); }));
      }
      if (!added && !Object.keys(self.staged).length && !Object.keys(self.deletedStaged).length) {
        return err('Нечего добавлять: файлы не найдены.');
      }
      return [L('Добавлено в индекс: ' + added + ' файл(ов)', 't-dim')];
    }

    if (sub === 'commit') {
      var msg = null;
      var amend = false;
      var addTracked = false;
      for (var i = 0; i < args.length; i++) {
        if (args[i] === '-m' || args[i] === '--message') { msg = args[i + 1]; i++; }
        else if (/^-am$/.test(args[i])) { addTracked = true; msg = args[i + 1]; i++; }
        else if (/^-a$/.test(args[i])) addTracked = true;
        else if (args[i] === '--amend') amend = true;
        else if (args[i] === '--no-edit') { /* message from last commit */ }
      }
      if (addTracked) {
        Object.keys(this.model.files).forEach(function (f) {
          if (self.headFiles()[f] != null) self.staged[f] = self.model.files[f];
        });
      }
      var unresolved = this.unresolvedConflicts();
      if (unresolved.length) {
        return [L('Нельзя создать коммит: есть нерешённые конфликты.', 't-err')]
          .concat(unresolved.map(function (f) { return L('  ' + f + ' — отредактируй и добавь в индекс.', 't-warn'); }));
      }
      if (amend) {
        var last = this.model.commits.filter(function (c) { return c.id === self.model.headCommit(); })[0];
        if (!last) return err('Нет коммитов для amend.');
        if (msg) last.msg = msg;
        last.files = Object.assign({}, last.files, this.staged);
        this.staged = {};
        this.deletedStaged = {};
        this.record('commit (amend): ' + last.msg);
        return [L('[' + this.branch + ' ' + last.id.slice(0, 7) + '] ' + last.msg + ' (amend)', 't-ok')];
      }
      if (!Object.keys(this.staged).length && !Object.keys(this.deletedStaged).length) {
        return err('nothing to commit, working tree clean. Сначала git add.');
      }
      if (!msg) return err('Нужно сообщение: git commit -m "текст"');
      var headId = this.model.headCommit();
      var files = Object.assign({}, this.headFiles(), this.staged);
      Object.keys(this.deletedStaged).forEach(function (f) { delete files[f]; });
      var branchName = this.model.head.type === 'detached' ? 'detached' : this.branch;
      var parents = headId ? [headId] : [];
      if (this.pendingMerge) {
        parents = [headId].concat(this.pendingMerge.parents.filter(function (p) { return p !== headId; }));
      }
      var commit = this.model.newCommit(branchName, msg, parents, { files: files });
      if (this.model.head.type === 'branch') {
        this.model.branches[this.branch] = commit.id;
      } else {
        this.model.head.commit = commit.id;
      }
      this.model.files = Object.assign({}, files);
      this.staged = {};
      this.deletedStaged = {};
      this.pendingMerge = null;
      this.conflicts = {};
      this.mergeSnapshot = null;
      this.record('commit: ' + msg);
      return [L('[' + (this.model.head.type === 'branch' ? this.branch : 'detached') + ' ' + commit.id.slice(0, 7) + '] ' + msg, 't-ok')];
    }

    if (sub === 'log') {
      return this.logLines(args);
    }

    if (sub === 'show') {
      var ref = args[0] || 'HEAD';
      var cid = this.model.resolve(ref);
      var c = this.model.commits.filter(function (x) { return x.id === cid; })[0];
      if (!c) return err('Неизвестная ссылка: ' + ref);
      return [
        L('commit ' + c.id, 't-head'),
        L('Author: ' + this.config['user.name'] + ' <' + this.config['user.email'] + '>', 't-dim'),
        L('', ''),
        L('    ' + c.msg, ''),
        L('', ''),
        L('Родители: ' + (c.parents.join(', ') || '—'), 't-dim')
      ].concat(this.diffLines(this.parentFiles(c), c.files));
    }

    if (sub === 'diff') {
      var staged = args.some(function (a) { return a === '--staged' || a === '--cached'; });
      if (staged) {
        return this.diffLines(this.headFiles(), Object.assign({}, this.headFiles(), this.staged));
      }
      return this.diffLines(this.headFiles(), this.model.files);
    }

    if (sub === 'branch') {
      if (!args.length) {
        return Object.keys(this.model.branches).sort().map(function (b) {
          var isHead = self.model.head.type === 'branch' && self.model.head.name === b;
          return L((isHead ? '* ' : '  ') + b + ' ' + self.model.branches[b].slice(0, 7), isHead ? 't-ok' : '');
        });
      }
      if (args[0] === '--show-current') return [L(this.model.head.type === 'branch' ? this.branch : 'HEAD detached', '')];
      if (args[0] === '-a' || args[0] === '--all' || /^-[vV]+$/.test(args[0] || '')) {
        return Object.keys(this.model.branches).sort().map(function (b) {
          var isHead = self.model.head.type === 'branch' && self.model.head.name === b;
          return L((isHead ? '* ' : '  ') + b + ' ' + self.model.branches[b].slice(0, 7), isHead ? 't-ok' : '');
        });
      }
      if (args[0] === '-d' || args[0] === '-D') {
        var name = args[1];
        if (!name) return err('Укажи имя ветки: git branch -d feature');
        if (!this.model.branches[name]) return err('Ветка не найдена: ' + name);
        if (name === this.branch) return err('Нельзя удалить текущую ветку.');
        if (args[0] === '-d') {
          var merged = this.model.reachableFrom(this.model.branches[this.branch]);
          if (!merged[this.model.branches[name]]) return err('Ветка не слита. Используй -D, если точно не нужна.');
        }
        delete this.model.branches[name];
        return ok('Удалена ветка ' + name);
      }
      if (args[0] === '-m' && args[1] && args[2]) {
        if (!this.model.branches[args[1]]) return err('Ветка не найдена: ' + args[1]);
        this.model.branches[args[2]] = this.model.branches[args[1]];
        delete this.model.branches[args[1]];
        if (this.branch === args[1]) this.branch = args[2];
        return ok('Переименована: ' + args[1] + ' → ' + args[2]);
      }
      if ((args[0] || '').charAt(0) === '-') return err('Неизвестный ключ: ' + args[0] + '. Доступно: -a, -v, -d, -D, -m, --show-current.');
      var newBranch = args[0];
      if (this.model.branches[newBranch]) return err('Ветка уже существует: ' + newBranch);
      var base = this.model.headCommit();
      if (!base) return err('Сначала сделай хотя бы один коммит.');
      this.model.branches[newBranch] = base;
      return ok('Создана ветка ' + newBranch);
    }

    if (sub === 'switch' || sub === 'checkout') {
      return this.switchTo(args, sub);
    }

    if (sub === 'merge') {
      return this.merge(args);
    }

    if (sub === 'reset') {
      return this.resetCmd(args);
    }

    if (sub === 'revert') {
      var rref = args.filter(function (a) { return a[0] !== '-'; })[0] || 'HEAD';
      var rid = this.model.resolve(rref);
      var rc = this.model.commits.filter(function (x) { return x.id === rid; })[0];
      if (!rc) return err('Неизвестный коммит: ' + rref);
      if (this.dirty()) return err('Есть незакоммиченные изменения. Сначала commit или stash.');
      var target = this.parentFiles(rc);
      var cur = Object.assign({}, this.headFiles());
      Object.keys(cur).forEach(function (f) {
        if (target[f] == null) delete cur[f];
      });
      Object.keys(target).forEach(function (f) { cur[f] = target[f]; });
      var rev = this.model.newCommit(this.branch, 'Revert "' + rc.msg + '"', [this.model.headCommit()], { files: cur });
      this.model.branches[this.branch] = rev.id;
      this.model.files = Object.assign({}, cur);
      this.record('revert: ' + rc.msg);
      return [L('[' + this.branch + ' ' + rev.id.slice(0, 7) + '] Revert "' + rc.msg + '"', 't-ok')];
    }

    if (sub === 'cherry-pick') {
      var x = args.some(function (a) { return a === '-x'; });
      var cref = args.filter(function (a) { return a[0] !== '-'; })[0];
      if (!cref) return err('Формат: git cherry-pick [-x] <hash>');
      var cc = this.model.commits.filter(function (c2) { return c2.id.indexOf(cref) === 0; })[0];
      if (!cc) return err('Коммит не найден: ' + cref);
      if (this.model.head.type === 'detached') return err('Сначала переключись на ветку.');
      if (this.dirty()) return err('Есть незакоммиченные изменения. Сначала commit.');
      var baseFiles = this.parentFiles(cc);
      var next = Object.assign({}, this.headFiles());
      Object.keys(cc.files || {}).forEach(function (f) {
        if (cc.files[f] !== baseFiles[f]) next[f] = cc.files[f];
      });
      var msg2 = cc.msg + (x ? ' (cherry picked from commit ' + cc.id + ')' : '');
      var cp = this.model.newCommit(this.branch, msg2, [this.model.headCommit()], { files: next });
      this.model.branches[this.branch] = cp.id;
      this.model.files = Object.assign({}, next);
      this.record('cherry-pick: ' + cc.msg);
      return [L('[' + this.branch + ' ' + cp.id.slice(0, 7) + '] ' + msg2, 't-ok')];
    }

    if (sub === 'rebase') {
      return this.rebase(args);
    }

    if (sub === 'reflog') {
      if (!this.model.reflog.length) return [L('Reflog пуст — ещё нет перемещений HEAD.', 't-dim')];
      return this.model.reflog.map(function (r, i) { return L((String(r.commit).slice(0, 7) + ' HEAD@{' + i + '}: ' + r.msg), i === 0 ? 't-ok' : ''); });
    }

    if (sub === 'clean') {
      var dry = args.some(function (a) { return a === '-n' || a === '--dry-run'; });
      var dirs = args.some(function (a) { return a === '-d'; });
      var ignored = args.some(function (a) { return a === '-x'; });
      var force = args.some(function (a) { return a === '-f' || a === '--force'; });
      var head = this.headFiles();
      var targets = Object.keys(this.model.files).filter(function (f) {
        return !Object.prototype.hasOwnProperty.call(head, f) && !Object.prototype.hasOwnProperty.call(self.staged, f) && !self.deletedStaged[f];
      });
      if (!dirs) targets = targets.filter(function (f) { return f.indexOf('/') < 0; });
      if (!targets.length) return [L('Нечего удалять. Дерево чистое.', 't-dim')];
      if (dry) return [L('Будет удалено:', 't-warn')].concat(targets.map(function (f) { return L('  ' + f, ''); }));
      if (!force) return err('git clean требует -f (сначала посмотри git clean -n).');
      targets.forEach(function (f) { delete self.model.files[f]; });
      return [L('Удалено файлов: ' + targets.length + (ignored ? ' (включая ignored)' : ''), 't-ok')].concat(targets.map(function (f) { return L('  ' + f, 't-dim'); }));
    }

    if (sub === 'restore') {
      var staged = args.indexOf('--staged') >= 0;
      var f = args.filter(function (a) { return a[0] !== '-'; })[0];
      if (!f) return err('Укажи файл: git restore [--staged] file');
      if (staged) {
        delete this.staged[f];
        delete this.deletedStaged[f];
        return ok('Убрано из индекса: ' + f);
      }
      var hf = this.headFiles()[f];
      if (hf == null) return err('В HEAD нет файла ' + f);
      this.model.files[f] = hf;
      return ok('Восстановлено из HEAD: ' + f);
    }

    if (sub === 'rm') {
      var cached = args.indexOf('--cached') >= 0;
      var files2 = args.filter(function (a) { return a[0] !== '-'; });
      if (!files2.length) return err('Формат: git rm --cached file');
      files2.forEach(function (f2) {
        if (cached) {
          self.deletedStaged[f2] = true;
          delete self.staged[f2];
        } else {
          delete self.model.files[f2];
          self.deletedStaged[f2] = true;
        }
      });
      return ok((cached ? 'Убрано из индекса (файл на диске остался): ' : 'Удалено: ') + files2.join(', '));
    }

    if (sub === 'stash') {
      var act = args[0] || 'push';
      if (act === 'push' || act === 'save') {
        if (!this.dirty()) return [L('Нечего сохранять: рабочее дерево чистое.', 't-dim')];
        var stashMsg = 'WIP';
        var mIdx = args.indexOf('-m') >= 0 ? args.indexOf('-m') : args.indexOf('--message');
        if (mIdx >= 0 && args[mIdx + 1]) stashMsg = args[mIdx + 1];
        else if (act === 'save' && args[1]) stashMsg = args.slice(1).join(' ');
        this.stash.unshift({ files: Object.assign({}, this.model.files), staged: Object.assign({}, this.staged), msg: stashMsg });
        this.model.files = Object.assign({}, this.headFiles());
        this.staged = {};
        this.deletedStaged = {};
        return ok('Сохранено в stash: ' + this.stash[0].msg);
      }
      if (act === 'list') {
        if (!this.stash.length) return [L('stash пуст', 't-dim')];
        return this.stash.map(function (s, i) { return L('stash@{' + i + '}: ' + s.msg, ''); });
      }
      if (act === 'pop' || act === 'apply') {
        if (!this.stash.length) return err('stash пуст');
        var item = this.stash[0];
        this.model.files = Object.assign({}, item.files);
        this.staged = Object.assign({}, item.staged);
        if (act === 'pop') this.stash.shift();
        return ok('Возвращено из stash: ' + item.msg);
      }
      if (act === 'drop') { this.stash.shift(); return ok('Запись stash удалена'); }
      return err('Неизвестное действие stash: ' + act);
    }

    if (sub === 'tag') {
      if (!args.length) {
        return Object.keys(this.tags).map(function (t) { return L(t + ' → ' + self.tags[t].slice(0, 7), ''); });
      }
      var anon = args[0] === '-a';
      var tname = anon ? args[1] : args[0];
      if (!tname) return err('Формат: git tag v1.0');
      this.tags[tname] = this.model.headCommit();
      return ok('Тег ' + tname + ' поставлен на ' + String(this.model.headCommit()).slice(0, 7));
    }

    if (sub === 'remote') {
      if (!args.length || args[0] === '-v') {
        return this.remote ? [L('origin  ' + this.remote + ' (fetch)', ''), L('origin  ' + this.remote + ' (push)', '')] : [L('remote не настроен. git remote add origin <url>', 't-dim')];
      }
      if (args[0] === 'add' && args[1] && args[2]) { this.remote = args[2]; return ok('Добавлен remote ' + args[1] + ' → ' + args[2]); }
      return [L('В песочнице поддерживается git remote -v и git remote add origin <url>.', 't-dim')];
    }

    if (sub === 'fetch') {
      if (!this.remote) return err('Сначала добавь remote: git remote add origin <url>');
      return ok('Обновлено из origin (имитация). Локальные ветки не изменены.');
    }

    if (sub === 'pull') {
      if (!this.remote) return err('Сначала добавь remote.');
      return ok('Already up to date. (имитация — сеть недоступна)');
    }

    if (sub === 'push') {
      if (!this.remote) return err('Сначала добавь remote: git remote add origin <url>');
      var up = args.indexOf('-u') >= 0 || args.indexOf('--set-upstream') >= 0;
      if (up) this.tracking[this.branch] = 'origin/' + this.branch;
      return ok('Ветка ' + this.branch + ' отправлена в origin' + (up ? ' (upstream настроен)' : '') + '. (имитация)');
    }

    if (sub === 'switch' || sub === 'checkout') return this.switchTo(args, sub);

    return [L('Команда git ' + sub + ' не реализована в песочнице. Смотри теорию.', 't-warn')];
  };

  GitSandbox.prototype.dirty = function () {
    var head = this.headFiles();
    if (this.unresolvedConflicts().length) return true;
    if (Object.keys(this.staged).length || Object.keys(this.deletedStaged).length) return true;
    var files = Object.keys(this.model.files);
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (head[f] == null || head[f] !== this.model.files[f]) return true;
    }
    for (var h in head) if (this.model.files[h] == null) return true;
    return false;
  };

  GitSandbox.prototype.switchTo = function (args, sub) {
    var create = args.indexOf('-c') >= 0 || args.indexOf('-b') >= 0 || args.indexOf('--create') >= 0;
    var detach = args.indexOf('--detach') >= 0;
    var target = args.indexOf('-') >= 0 ? '-' : args.filter(function (a) { return a[0] !== '-'; })[0];
    if (create) {
      var name = target;
      if (!name) return [{ text: 'Укажи имя новой ветки: git switch -c feature', cls: 't-err' }];
      if (this.model.branches[name]) return [{ text: 'Ветка уже существует: ' + name, cls: 't-err' }];
      if (!this.model.headCommit()) return [{ text: 'Сначала сделай коммит.', cls: 't-err' }];
      if (this.dirty()) return [{ text: 'Незакоммиченные изменения. Сначала commit или stash.', cls: 't-err' }];
      this.prevBranch = this.branch;
      this.model.branches[name] = this.model.headCommit();
      this.branch = name;
      this.model.head = { type: 'branch', name: name };
      this.record('switch: ' + name);
      return [{ text: 'Switched to a new branch \'' + name + '\'', cls: 't-ok' }];
    }
    if (!target) return [{ text: 'Укажи ветку: git switch main', cls: 't-err' }];
    if (target === '-') target = this.prevBranch;
    if (!target) return [{ text: 'Нет предыдущей ветки.', cls: 't-err' }];

    if (this.model.branches[target]) {
      if (this.dirty()) return [{ text: 'Your local changes would be overwritten by checkout. Commit or stash them.', cls: 't-err' }];
      this.prevBranch = this.branch;
      this.branch = target;
      this.model.head = { type: 'branch', name: target };
      var cid = this.model.branches[target];
      var commit = this.model.commits.filter(function (x) { return x.id === cid; })[0];
      this.model.files = Object.assign({}, (commit && commit.files) || {});
      this.staged = {};
      this.deletedStaged = {};
      this.conflicts = {};
      this.pendingMerge = null;
      this.mergeSnapshot = null;
      this.record('switch: ' + target);
      return [{ text: 'Switched to branch \'' + target + '\'', cls: 't-ok' }];
    }

    var hash = this.model.resolve(target);
    if (!hash) return [{ text: 'Ветка или коммит не найдены: ' + target, cls: 't-err' }];
    var c2 = this.model.commits.filter(function (x) { return x.id === hash; })[0];
    if (this.dirty()) return [{ text: 'Незакоммиченные изменения мешают переключению.', cls: 't-err' }];
    this.model.files = Object.assign({}, (c2 && c2.files) || {});
    this.staged = {};
    this.deletedStaged = {};
    this.conflicts = {};
    this.pendingMerge = null;
    this.mergeSnapshot = null;
    this.model.head = { type: 'detached', commit: hash };
    this.record('checkout: ' + hash.slice(0, 7));
    return [{ text: 'HEAD is now at ' + hash.slice(0, 7) + ' ' + (c2 ? c2.msg : ''), cls: 't-warn' }];
  };

  GitSandbox.prototype.merge = function (args) {
    var L = function (text, cls) { return { text: text == null ? '' : text, cls: cls || '' }; };
    if (args.indexOf('--abort') >= 0) return this.abortMerge();
    var noff = args.indexOf('--no-ff') >= 0;
    var nocommit = args.indexOf('--no-commit') >= 0;
    var squash = args.indexOf('--squash') >= 0;
    var target = args.filter(function (a) { return a[0] !== '-'; })[0];
    if (!target) return [{ text: 'Формат: git merge <ветка>', cls: 't-err' }];
    if (this.model.head.type === 'detached') return [{ text: 'Нельзя merge в detached HEAD. Переключись на ветку.', cls: 't-err' }];
    if (!this.model.branches[target]) return [{ text: 'Ветка не найдена: ' + target, cls: 't-err' }];
    if (this.dirty()) return [{ text: 'Есть незакоммиченные изменения. Закоммить их перед merge.', cls: 't-err' }];
    var ours = this.model.branches[this.branch];
    var theirs = this.model.branches[target];
    if (ours === theirs) return [{ text: 'Already up to date.', cls: 't-dim' }];
    if (this.model.reachableFrom(ours)[theirs]) return [{ text: 'Already up to date.', cls: 't-dim' }];

    var ff = !noff && !squash && !nocommit && !!this.model.reachableFrom(theirs)[ours];
    if (ff) {
      this.model.branches[this.branch] = theirs;
      var tc = this.model.commits.filter(function (x) { return x.id === theirs; })[0];
      this.model.files = Object.assign({}, tc.files);
      this.conflicts = {};
      this.pendingMerge = null;
      this.mergeSnapshot = null;
      this.record('merge ' + target + ': Fast-forward');
      return [{ text: 'Updating ' + ours.slice(0, 7) + '..' + theirs.slice(0, 7), cls: 't-dim' }, { text: 'Fast-forward', cls: 't-ok' }];
    }

    var base = this.mergeBase(ours, theirs);
    var baseFiles = this.filesOf(base);
    var ourFiles = this.headFiles();
    var theirCommit = this.model.commits.filter(function (x) { return x.id === theirs; })[0];
    var snapshot = {
      files: Object.assign({}, this.model.files),
      staged: Object.assign({}, this.staged),
      deletedStaged: Object.assign({}, this.deletedStaged),
      conflicts: Object.assign({}, this.conflicts),
      pendingMerge: this.pendingMerge
    };
    var result = this.mergeFiles(baseFiles, ourFiles, theirCommit.files || {}, target);
    var merged = result.files;
    this.model.files = Object.assign({}, merged);
    this.mergeSnapshot = snapshot;
    this.conflicts = result.conflicts;

    var conflicted = Object.keys(result.conflicts);
    if (conflicted.length) {
      this.staged = {};
      this.deletedStaged = {};
      this.pendingMerge = { target: target, parents: squash ? [] : [theirs], squash: squash };
      return [L('Auto-merging ' + target, 't-dim')]
        .concat(conflicted.map(function (f) { return L('CONFLICT (content): Merge conflict in ' + f, 't-err'); }))
        .concat([
          L('Automatic merge failed; fix conflicts and then commit the result.', 't-err'),
          L('Открой файлы в панели «Файлы», убери маркеры <<<<<<< ======= >>>>>>>, сохрани и нажми «В индекс».', 't-dim')
        ]);
    }

    this.staged = Object.assign({}, merged);
    this.deletedStaged = {};
    if (squash) {
      this.pendingMerge = { target: target, parents: [], squash: true };
      return [L('Squash commit -- not updating HEAD', 't-warn'), L('Изменения в индексе. Теперь: git commit -m "..."', 't-dim')];
    }
    if (nocommit) {
      this.pendingMerge = { target: target, parents: [theirs] };
      return [L('Automatic merge went well; stopped before committing as requested', 't-warn'), L('Проверь git diff --staged и сделай git commit.', 't-dim')];
    }
    var mergeCommit = this.model.newCommit(this.branch, 'merge: ' + target, [ours, theirs], { files: merged });
    this.model.branches[this.branch] = mergeCommit.id;
    this.model.files = Object.assign({}, merged);
    this.staged = {};
    this.deletedStaged = {};
    this.pendingMerge = null;
    this.conflicts = {};
    this.mergeSnapshot = null;
    this.record('merge ' + target + ': Merge made by the ort strategy.');
    return [L('Merge made by the \'ort\' strategy.', 't-ok'), L('[' + this.branch + ' ' + mergeCommit.id.slice(0, 7) + '] merge: ' + target, 't-dim')];
  };

  GitSandbox.prototype.abortMerge = function () {
    if (!this.mergeSnapshot) return [{ text: 'Нет активного merge для отмены.', cls: 't-err' }];
    var s = this.mergeSnapshot;
    this.model.files = Object.assign({}, s.files);
    this.staged = Object.assign({}, s.staged);
    this.deletedStaged = Object.assign({}, s.deletedStaged);
    this.conflicts = Object.assign({}, s.conflicts);
    this.pendingMerge = s.pendingMerge;
    this.mergeSnapshot = null;
    return [{ text: 'Merge aborted.', cls: 't-ok' }];
  };

  GitSandbox.prototype.mergeBase = function (a, b) {
    var A = this.model.reachableFrom(a);
    var B = this.model.reachableFrom(b);
    var common = Object.keys(A).filter(function (x) { return B[x]; });
    if (!common.length) return null;
    var self = this;
    common.sort(function (x, y) {
      var cx = self.model.commits.filter(function (c) { return c.id === x; })[0];
      var cy = self.model.commits.filter(function (c) { return c.id === y; })[0];
      return (cy ? cy.seq : 0) - (cx ? cx.seq : 0);
    });
    return common[0];
  };

  GitSandbox.prototype.filesOf = function (id) {
    if (!id) return {};
    var c = this.model.commits.filter(function (x) { return x.id === id; })[0];
    return c ? (c.files || {}) : {};
  };

  GitSandbox.prototype.parentFiles = function (commit) {
    if (!commit || !commit.parents || !commit.parents.length) return {};
    return this.filesOf(commit.parents[0]);
  };

  GitSandbox.prototype.conflictContent = function (ours, theirs, target) {
    function block(s) {
      s = s == null ? '' : String(s);
      return !s || /\n$/.test(s) ? s : s + '\n';
    }
    return '<<<<<<< HEAD\n' + block(ours) + '=======\n' + block(theirs) + '>>>>>>> ' + target + '\n';
  };

  GitSandbox.prototype.mergeFiles = function (base, ours, theirs, target) {
    var out = {};
    var conflicts = {};
    var keys = Object.keys(Object.assign({}, base, ours, theirs));
    keys.forEach(function (k) {
      var b = base[k], o = ours[k], t = theirs[k];
      if (o === t) out[k] = o;
      else if (o === b) out[k] = t;
      else if (t === b) out[k] = o;
      else {
        out[k] = this.conflictContent(o, t, target || 'MERGE_HEAD');
        conflicts[k] = { base: b == null ? '' : b, ours: o == null ? '' : o, theirs: t == null ? '' : t, target: target, resolved: false };
      }
    }, this);
    Object.keys(out).forEach(function (k) { if (out[k] == null) delete out[k]; });
    return { files: out, conflicts: conflicts };
  };

  GitSandbox.prototype.resetCmd = function (args) {
    var self = this;
    var mode = 'mixed';
    var ref = 'HEAD';
    args.forEach(function (a) {
      if (a === '--soft') mode = 'soft';
      else if (a === '--hard') mode = 'hard';
      else if (a === '--mixed') mode = 'mixed';
      else if (a[0] !== '-') ref = a;
    });
    var id = this.model.resolve(ref);
    if (!id) return [{ text: 'Неизвестная ссылка: ' + ref, cls: 't-err' }];
    var beforeFiles = Object.assign({}, this.model.files);
    var oldHeadFiles = Object.assign({}, this.headFiles());
    if (this.model.head.type === 'branch') this.model.branches[this.branch] = id;
    else this.model.head.commit = id;
    var targetFiles = this.filesOf(id);
    if (mode === 'soft') {
      this.staged = {};
      this.deletedStaged = {};
      Object.keys(oldHeadFiles).forEach(function (f) {
        if (oldHeadFiles[f] !== targetFiles[f]) self.staged[f] = oldHeadFiles[f];
      });
    } else if (mode === 'mixed') {
      this.staged = {};
      this.deletedStaged = {};
    } else {
      this.staged = {};
      this.deletedStaged = {};
      this.model.files = Object.assign({}, targetFiles);
    }
    this.pendingMerge = null;
    this.conflicts = {};
    this.mergeSnapshot = null;
    this.record('reset: moving to ' + ref + ' (' + mode + ')');
    return [{ text: 'HEAD is now at ' + id.slice(0, 7) + ' (--' + mode + ')', cls: 't-warn' }];
  };

  GitSandbox.prototype.rebase = function (args) {
    var interactive = args.indexOf('-i') >= 0 || args.indexOf('--interactive') >= 0;
    var target = args.filter(function (a) { return a[0] !== '-' && a !== 'HEAD'; })[0];
    if (interactive) {
      return [
        { text: 'Интерактивный rebase в песочнице не открывает редактор.', cls: 't-warn' },
        { text: 'В реальном Git появился бы список: pick / reword / edit / squash / fixup / drop.', cls: 't-dim' },
        { text: 'В песочнице используй обычный: git rebase main', cls: 't-dim' }
      ];
    }
    if (!target) return [{ text: 'Формат: git rebase <ветка>', cls: 't-err' }];
    if (this.model.head.type === 'detached') return [{ text: 'Rebase в detached HEAD не поддерживается.', cls: 't-err' }];
    if (!this.model.branches[target]) return [{ text: 'Ветка не найдена: ' + target, cls: 't-err' }];
    if (this.dirty()) return [{ text: 'Есть незакоммиченные изменения. Сначала commit или stash.', cls: 't-err' }];
    var base = this.mergeBase(this.model.branches[this.branch], this.model.branches[target]);
    var ours = this.model.reachableFrom(this.model.branches[this.branch]);
    var theirs = this.model.reachableFrom(this.model.branches[target]);
    var todo = this.model.commits.filter(function (c) {
      return ours[c.id] && !theirs[c.id] && c.id !== base;
    }).sort(function (a, b) { return a.seq - b.seq; });
    if (!todo.length) return [{ text: 'Current branch is up to date.', cls: 't-dim' }];
    var tip = this.model.branches[target];
    var tipFiles = this.filesOf(tip);
    var count = 0;
    todo.forEach(function (c) {
      var prev = this.parentFiles(c);
      var next = Object.assign({}, tipFiles);
      Object.keys(c.files || {}).forEach(function (f) {
        if (c.files[f] !== prev[f]) next[f] = c.files[f];
      });
      var copy = this.model.newCommit(this.branch, c.msg, [tip], { files: next });
      tip = copy.id;
      tipFiles = next;
      count++;
    }, this);
    this.model.branches[this.branch] = tip;
    this.model.files = Object.assign({}, tipFiles);
    this.record('rebase: ' + target);
    return [{ text: 'Successfully rebased and updated refs/heads/' + this.branch + '.', cls: 't-ok' }, { text: 'Перенесено коммитов: ' + count + ' (хеши изменились)', cls: 't-dim' }];
  };

  GitSandbox.prototype.logLines = function (args) {
    var oneline = args.indexOf('--oneline') >= 0;
    var graph = args.indexOf('--graph') >= 0;
    var all = args.indexOf('--all') >= 0;
    var n = 0;
    var iN = args.findIndex(function (a) { return /^-\d+$/.test(a); });
    if (iN >= 0) n = parseInt(args[iN].slice(1), 10);
    var reach = all ? this.model.reachableSet() : this.model.reachableFrom(this.model.headCommit());
    var list = this.model.commits.filter(function (c) { return reach[c.id]; }).sort(function (a, b) { return b.seq - a.seq; });
    if (n) list = list.slice(0, n);
    if (!list.length) return [{ text: 'История пуста. Сделай первый коммит.', cls: 't-dim' }];
    var headId = this.model.headCommit();
    var self = this;
    var lines = [];
    if (graph) lines.push({ text: '*', cls: 't-dim' });
    list.forEach(function (c) {
      var deco = [];
      Object.keys(self.model.branches).forEach(function (b) {
        if (self.model.branches[b] === c.id) deco.push((self.model.head.type === 'branch' && self.model.head.name === b ? 'HEAD -> ' : '') + b);
      });
      if (self.model.head.type === 'detached' && self.model.head.commit === c.id) deco.push('HEAD');
      Object.keys(self.tags).forEach(function (t) { if (self.tags[t] === c.id) deco.push('tag: ' + t); });
      var prefix = graph ? (c.parents.length > 1 ? '* ' : '* ') : '';
      if (oneline) {
        lines.push({ text: prefix + c.id.slice(0, 7) + ' ' + (deco.length ? '(' + deco.join(', ') + ') ' : '') + c.msg, cls: c.id === headId ? 't-ok' : '' });
      } else {
        lines.push({ text: 'commit ' + c.id + (deco.length ? ' (' + deco.join(', ') + ')' : ''), cls: 't-head' });
        lines.push({ text: 'Author: ' + self.config['user.name'] + ' <' + self.config['user.email'] + '>', cls: 't-dim' });
        lines.push({ text: '', cls: '' });
        lines.push({ text: '    ' + c.msg, cls: '' });
        lines.push({ text: '', cls: '' });
      }
    });
    return lines;
  };

  GitSandbox.prototype.fileDiffLines = function (a, b) {
    if (a === b) return [];
    var out = [];
    if (a == null) {
      String(b == null ? '' : b).replace(/\n$/, '').split('\n').forEach(function (l) { out.push({ text: '+' + l, cls: 't-ok' }); });
      return out;
    }
    if (b == null) {
      String(a).replace(/\n$/, '').split('\n').forEach(function (l) { out.push({ text: '-' + l, cls: 't-err' }); });
      return out;
    }
    var al = String(a).replace(/\n$/, '').split('\n');
    var bl = String(b).replace(/\n$/, '').split('\n');
    var max = Math.max(al.length, bl.length);
    for (var i = 0; i < max; i++) {
      if (al[i] === bl[i]) continue;
      if (al[i] != null) out.push({ text: '-' + al[i], cls: 't-err' });
      if (bl[i] != null) out.push({ text: '+' + bl[i], cls: 't-ok' });
    }
    return out;
  };

  GitSandbox.prototype.diffLines = function (oldFiles, newFiles) {
    var out = [];
    var keys = Object.keys(Object.assign({}, oldFiles, newFiles)).sort();
    keys.forEach(function (f) {
      var a = oldFiles[f], b = newFiles[f];
      if (a === b) return;
      out.push({ text: 'diff --git a/' + f + ' b/' + f, cls: 't-dim' });
      if (a == null) {
        out.push({ text: 'new file: ' + f, cls: 't-ok' });
        (b || '').replace(/\n$/, '').split('\n').forEach(function (l) { out.push({ text: '+' + l, cls: 't-ok' }); });
      } else if (b == null) {
        out.push({ text: 'deleted file: ' + f, cls: 't-err' });
        (a || '').replace(/\n$/, '').split('\n').forEach(function (l) { out.push({ text: '-' + l, cls: 't-err' }); });
      } else {
        var al = a.replace(/\n$/, '').split('\n');
        var bl = b.replace(/\n$/, '').split('\n');
        var max = Math.max(al.length, bl.length);
        for (var i = 0; i < max; i++) {
          if (al[i] === bl[i]) continue;
          if (al[i] != null) out.push({ text: '-' + al[i], cls: 't-err' });
          if (bl[i] != null) out.push({ text: '+' + bl[i], cls: 't-ok' });
        }
      }
    });
    return out.length ? out : [{ text: 'Нет различий.', cls: 't-dim' }];
  };

  GitSandbox.prototype.statusLines = function () {
    var L = function (text, cls) { return { text: text, cls: cls || '' }; };
    var lines = [];
    var self = this;
    if (this.model.head.type === 'detached') {
      lines.push(L('HEAD detached at ' + String(this.model.head.commit).slice(0, 7), 't-warn'));
    } else {
      lines.push(L('On branch ' + this.branch, ''));
    }
    if (!this.model.commits.length) lines.push(L('No commits yet', 't-dim'));

    var staged = [], modified = [], untracked = [], deleted = [], conflicted = [];
    var head = this.headFiles();
    var names = Object.keys(Object.assign({}, head, this.model.files, this.staged, this.conflicts));
    names.sort().forEach(function (f) {
      if (self.conflicts[f] && !self.conflicts[f].resolved) conflicted.push(f);
      else if (self.deletedStaged[f]) deleted.push(f);
      else if (Object.prototype.hasOwnProperty.call(self.staged, f)) staged.push(f);
      else if (!Object.prototype.hasOwnProperty.call(head, f)) untracked.push(f);
      else if (!Object.prototype.hasOwnProperty.call(self.model.files, f) || self.model.files[f] !== head[f]) modified.push(f);
    });

    if (conflicted.length) {
      lines.push(L('', ''));
      lines.push(L('Unmerged paths:', 't-err'));
      lines.push(L('  (use "git add <file>..." to mark resolution)', 't-dim'));
      conflicted.forEach(function (f) { lines.push(L('        both modified:   ' + f, 't-err')); });
    }

    if (staged.length || deleted.length) {
      lines.push(L('', ''));
      lines.push(L('Changes to be committed:', 't-ok'));
      lines.push(L('  (use "git restore --staged <file>..." to unstage)', 't-dim'));
      staged.forEach(function (f) {
        var isNew = !Object.prototype.hasOwnProperty.call(head, f);
        var isDel = !Object.prototype.hasOwnProperty.call(self.model.files, f);
        lines.push(L('        ' + (isDel ? 'deleted:    ' : isNew ? 'new file:   ' : 'modified:   ') + f, 't-ok'));
      });
      deleted.forEach(function (f) { lines.push(L('        deleted:    ' + f, 't-ok')); });
    }
    if (modified.length) {
      lines.push(L('', ''));
      lines.push(L('Changes not staged for commit:', 't-warn'));
      lines.push(L('  (use "git add <file>..." to update what will be committed)', 't-dim'));
      modified.forEach(function (f) {
        var isDel = !Object.prototype.hasOwnProperty.call(this.model.files, f);
        lines.push(L('        ' + (isDel ? 'deleted:    ' : 'modified:   ') + f, 't-warn'));
      }, this);
    }
    if (untracked.length) {
      lines.push(L('', ''));
      lines.push(L('Untracked files:', 't-warn'));
      lines.push(L('  (use "git add <file>..." to include in what will be committed)', 't-dim'));
      untracked.forEach(function (f) { lines.push(L('        ' + f, 't-warn')); });
    }
    if (!staged.length && !deleted.length && !modified.length && !untracked.length && !conflicted.length) {
      lines.push(L('', ''));
      lines.push(L('nothing to commit, working tree clean', 't-dim'));
    }
    return lines;
  };

  GitSandbox.prototype.state = function () {
    return {
      commits: this.model.commits.length,
      branches: Object.assign({}, this.model.branches),
      head: this.model.head,
      current: this.branch,
      files: Object.keys(this.model.files),
      staged: Object.keys(this.staged),
      conflicts: Object.keys(this.conflicts).filter(function (f) { return !this.conflicts[f].resolved; }, this),
      merge: this.pendingMerge
    };
  };

  window.GitSandbox = GitSandbox;
})();
