/* Windows CMD simulator — a small but honest virtual filesystem */
(function () {
  function dir(children) { return { type: 'dir', children: children || {} }; }
  function file(content) { return { type: 'file', content: content || '' }; }

  function initialState() {
    return dir({
      dev: dir({
        project: dir({
          'readme.txt': file('# Demo project\nThis folder is here to practise CMD.\n'),
          'notes.txt': file('Charlie\nAlice\nBob\n'),
          'app.log': file('2026-10-01 info: server started\n2026-10-01 error: database not found\n2026-10-02 warn: cache is cold\n2026-10-02 error: retry connection\n2026-10-03 info: ready\n'),
          src: dir({
            'main.js': file('console.log("hello");\n'),
            'utils.js': file('export const sum = (a, b) => a + b;\n'),
            'style.css': file('body { margin: 0; }\n')
          }),
          site: dir({
            'index.html': file('<!doctype html>\n<h1>Demo</h1>\n'),
            assets: dir({
              'logo.txt': file('[logo]\n')
            })
          })
        }),
        tools: dir({
          'clean.bat': file('@echo off\ndel /q *.tmp\n')
        })
      }),
      Users: dir({
        student: dir({
          Desktop: dir({ 'welcome.txt': file('Welcome to the CMD playground!\n') }),
          Documents: dir({}),
          Downloads: dir({})
        })
      })
    });
  }

  var TASKLIST = [
    ['System Idle Process', 0, 'Services', '8 K'],
    ['explorer.exe', 4821, 'Console', '82 416 K'],
    ['chrome.exe', 11224, 'Console', '245 632 K'],
    ['chrome.exe', 11890, 'Console', '198 204 K'],
    ['Code.exe', 9032, 'Console', '312 880 K'],
    ['node.exe', 14410, 'Console', '64 120 K'],
    ['notepad.exe', 15102, 'Console', '12 348 K'],
    ['cmd.exe', 15500, 'Console', '4 096 K'],
    ['git.exe', 15880, 'Console', '9 112 K']
  ];

  var HELP_LINES = [
    ['Песочница CMD — поддерживаются:', 't-info'],
    ['  dir [путь] [/a] [/b] [/s] [/o]     список файлов', ''],
    ['  cd [путь]                          сменить папку', ''],
    ['  md / mkdir [путь]                  создать папку', ''],
    ['  rd / rmdir [путь] [/s] [/q]        удалить папку', ''],
    ['  del [маска]                        удалить файлы', ''],
    ['  copy [что] [куда] [/y]             копировать (a+b → c)', ''],
    ['  move / ren                         переместить / переименовать', ''],
    ['  xcopy src dst /e /i                рекурсивное копирование', ''],
    ['  type / more / sort / findstr       работа с текстом', ''],
    ['  echo [текст] [> файл] [>> файл]    вывод и запись', ''],
    ['  tasklist | findstr chrome          процессы и фильтры', ''],
    ['  taskkill /im name /f               завершить процесс', ''],
    ['  set / set /a / set /p / setx       переменные', ''],
    ['  if exist ... , tree /f, where, cls, help', ''],
    ['', ''],
    ['Совет: ↑/↓ — история команд, Ctrl+L — очистка.', 't-dim']
  ];

  function CmdTerminal(opts) {
    this.output = opts.output;
    this.input = opts.input;
    this.promptEl = opts.prompt;
    this.onAfter = opts.onAfter || function () {};
    this.fs = initialState();
    this.cwd = ['dev', 'project'];
    this.vars = {
      PATH: 'C:\\Windows\\system32;C:\\Windows;C:\\Program Files\\Git\\cmd',
      USERPROFILE: 'C:\\Users\\student',
      USERNAME: 'student',
      COMPUTERNAME: 'DEV-PC',
      TEMP: 'C:\\Users\\student\\AppData\\Local\\Temp',
      OS: 'Windows_NT'
    };
    this.history = [];
    this.histIdx = 0;
    this.pending = null;
    this.killed = {};
    this.attach();
    this.reset(true);
  }

  CmdTerminal.prototype.attach = function () {
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

  CmdTerminal.prototype.reset = function (silent) {
    this.fs = initialState();
    this.cwd = ['dev', 'project'];
    this.pending = null;
    this.killed = {};
    if (!silent) this.clear();
    if (!silent) {
      this.print(['Песочница сброшена. Ты снова в C:\\dev\\project.', ''], 't-dim');
      this.print([this.pathString() + '> dir', '']);
    }
    this.updatePrompt();
    this.onAfter();
  };

  CmdTerminal.prototype.updatePrompt = function () {
    if (this.promptEl) this.promptEl.textContent = this.pathString() + '>';
  };

  CmdTerminal.prototype.pathString = function () {
    return 'C:\\' + this.cwd.join('\\');
  };

  CmdTerminal.prototype.clear = function () {
    if (this.output) this.output.innerHTML = '';
  };

  CmdTerminal.prototype.print = function (lines, cls) {
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

  CmdTerminal.prototype.printRich = function (rows) {
    if (!this.output) return;
    rows.forEach(function (r) {
      var text = typeof r === 'string' ? r : r.text;
      var cls = typeof r === 'string' ? '' : (r.cls || '');
      var div = document.createElement('div');
      div.className = 't-line ' + cls;
      div.textContent = text == null ? '' : text;
      this.output.appendChild(div);
    }, this);
    this.output.scrollTop = this.output.scrollHeight;
  };

  CmdTerminal.prototype.printCommand = function (line) {
    if (!this.output) return;
    var div = document.createElement('div');
    div.className = 't-line';
    var p = document.createElement('span');
    p.className = 't-prompt';
    p.textContent = this.pathString() + '>';
    div.appendChild(p);
    div.appendChild(document.createTextNode(' ' + line));
    this.output.appendChild(div);
    this.output.scrollTop = this.output.scrollHeight;
  };

  CmdTerminal.prototype.execute = function (line) {
    line = String(line || '');
    if (!line.trim()) {
      this.printCommand('');
      return;
    }
    this.printCommand(line);
    this.history.push(line);
    this.histIdx = this.history.length;

    if (this.pending) {
      var pend = this.pending;
      this.pending = null;
      this.vars[pend.name] = line;
      this.print(['[' + pend.name + '] = ' + line, '']);
      this.input && (this.input.placeholder = '');
      this.onAfter();
      return;
    }

    var parts = this.splitPipeline(line);
    var stdin = null;
    var self = this;
    parts.forEach(function (part, i) {
      var parsed = self.parseSegment(part);
      if (parsed.error) {
        self.print([parsed.error], 't-err');
        stdin = '';
        return;
      }
      var result = self.run(parsed.cmd, stdin, parsed.inputFile);
      var text = result.lines.map(function (l) { return typeof l === 'string' ? l : l.text; }).join('\n');
      if (parsed.outFile) {
        self.writeFile(parsed.outFile, text, parsed.outMode === '>>');
        if (result.ok) self.print(['Записано в ' + parsed.outFile + (parsed.outMode === '>>' ? ' (дописано)' : '')], 't-dim');
      } else if (i === parts.length - 1) {
        self.printRich(result.lines);
      }
      stdin = text;
      if (!result.ok) {
        if (i === parts.length - 1 && !parsed.outFile) { /* already printed */ }
      }
    });
    this.updatePrompt();
    this.onAfter();
  };

  CmdTerminal.prototype.splitPipeline = function (line) {
    var parts = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') { q = !q; cur += ch; }
      else if (ch === '|' && !q) { parts.push(cur); cur = ''; }
      else cur += ch;
    }
    parts.push(cur);
    return parts;
  };

  CmdTerminal.prototype.parseSegment = function (segment) {
    var text = segment.replace(/2>&1/g, ' ');
    var outFile = null, outMode = '>', inputFile = null;
    var q = false, cutAt = -1, mode = '>';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '"') { q = !q; continue; }
      if (!q && ch === '>') {
        cutAt = i;
        mode = text[i + 1] === '>' ? '>>' : '>';
        break;
      }
    }
    if (cutAt >= 0) {
      outFile = text.slice(cutAt + (mode === '>>' ? 2 : 1)).trim();
      text = text.slice(0, cutAt);
      outMode = mode;
      if (!outFile) return { error: 'После > нужно имя файла.' };
      outFile = outFile.replace(/^"|"$/g, '');
    }
    // strip 2>&1
    text = text.replace(/2>&1/g, '').trim();

    q = false;
    var inCut = -1;
    for (var j = 0; j < text.length; j++) {
      var c = text[j];
      if (c === '"') { q = !q; continue; }
      if (!q && c === '<') { inCut = j; break; }
    }
    if (inCut >= 0) {
      inputFile = text.slice(inCut + 1).trim().replace(/^"|"$/g, '');
      text = text.slice(0, inCut);
    }
    return { cmd: text.trim(), outFile: outFile, outMode: outMode, inputFile: inputFile };
  };

  /* ---------- filesystem helpers ---------- */
  CmdTerminal.prototype.childKey = function (node, name) {
    if (!node || node.type !== 'dir') return null;
    var lower = name.toLowerCase();
    var keys = Object.keys(node.children);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === lower) return keys[i];
    }
    return null;
  };

  CmdTerminal.prototype.resolveSegments = function (token, base) {
    token = String(token == null ? '' : token).replace(/\//g, '\\').trim();
    if (!token) return (base || this.cwd).slice();
    var parts;
    var drive = token.match(/^([a-zA-Z]):/);
    if (drive) {
      if (drive[1].toUpperCase() !== 'C') return { error: 'В песочнице есть только диск C:' };
      token = token.slice(2);
      if (token[0] !== '\\') token = '\\' + token;
    }
    if (token[0] === '\\') {
      parts = [];
      token = token.slice(1);
    } else {
      parts = (base || this.cwd).slice();
    }
    var segs = token.split('\\');
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (!s || s === '.') continue;
      if (s === '..') { if (parts.length) parts.pop(); continue; }
      parts.push(s);
    }
    return parts;
  };

  CmdTerminal.prototype.getNode = function (segments) {
    var node = this.fs;
    for (var i = 0; i < segments.length; i++) {
      if (!node || node.type !== 'dir') return null;
      var key = this.childKey(node, segments[i]);
      if (!key) return null;
      node = node.children[key];
    }
    return node;
  };

  CmdTerminal.prototype.getParent = function (segments) {
    if (!segments.length) return { parent: null, name: '' };
    var parentSegs = segments.slice(0, -1);
    var parent = this.getNode(parentSegs);
    return { parent: parent, name: segments[segments.length - 1], parentSegs: parentSegs };
  };

  CmdTerminal.prototype.exists = function (path) {
    var segs = this.resolveSegments(path);
    if (segs.error) return false;
    return !!this.getNode(segs);
  };

  CmdTerminal.prototype.isDir = function (path) {
    var segs = this.resolveSegments(path);
    if (segs.error) return false;
    var n = this.getNode(segs);
    return !!(n && n.type === 'dir');
  };

  CmdTerminal.prototype.readFile = function (path) {
    var segs = this.resolveSegments(path);
    if (segs.error) return null;
    var n = this.getNode(segs);
    return n && n.type === 'file' ? n.content : null;
  };

  CmdTerminal.prototype.writeFile = function (path, text, append) {
    var segs = this.resolveSegments(path);
    if (segs.error) return false;
    var info = this.getParent(segs);
    if (!info.parent || info.parent.type !== 'dir') return false;
    var key = this.childKey(info.parent, info.name) || info.name;
    var existing = info.parent.children[key];
    if (existing && existing.type === 'dir') return false;
    info.parent.children[key] = file(append && existing ? existing.content + (existing.content && !existing.content.endsWith('\n') ? '\n' : '') + text : text);
    return true;
  };

  CmdTerminal.prototype.removePath = function (segments) {
    var info = this.getParent(segments);
    if (!info.parent) return false;
    var key = this.childKey(info.parent, info.name);
    if (!key) return false;
    delete info.parent.children[key];
    return true;
  };

  CmdTerminal.prototype.makeDir = function (path) {
    var segs = this.resolveSegments(path);
    if (segs.error) return { error: segs.error };
    var node = this.fs;
    for (var i = 0; i < segs.length; i++) {
      var key = this.childKey(node, segs[i]);
      if (key) {
        node = node.children[key];
        if (node.type !== 'dir') return { error: 'Файл уже существует: ' + segs.slice(0, i + 1).join('\\') };
      } else {
        node.children[segs[i]] = dir({});
        node = node.children[segs[i]];
      }
    }
    return { ok: true };
  };

  CmdTerminal.prototype.listDir = function (node) {
    return Object.keys(node.children).map(function (k) {
      return { name: k, node: node.children[k] };
    });
  };

  CmdTerminal.prototype.wildcardMatch = function (name, pattern) {
    var re = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
    return re.test(name);
  };

  CmdTerminal.prototype.expand = function (token, base, dirsOnly) {
    base = base || this.cwd;
    token = String(token || '').replace(/\//g, '\\');
    if (!/[*?]/.test(token)) {
      var segs = this.resolveSegments(token, base);
      if (segs.error) return [];
      var n = this.getNode(segs);
      if (!n) return [];
      return [{ name: segs[segs.length - 1], node: n, segs: segs, full: n.type === 'dir' ? 'C:\\' + segs.join('\\') : 'C:\\' + segs.join('\\') }];
    }
    var idx = token.lastIndexOf('\\');
    var dirPart = idx >= 0 ? token.slice(0, idx) : '';
    var mask = idx >= 0 ? token.slice(idx + 1) : token;
    var dirSegs = dirPart ? this.resolveSegments(dirPart, base) : base.slice();
    if (dirSegs.error) return [];
    var dirNode = this.getNode(dirSegs);
    if (!dirNode || dirNode.type !== 'dir') return [];
    var self = this;
    return this.listDir(dirNode).filter(function (e) {
      if (dirsOnly && e.node.type !== 'dir') return false;
      return self.wildcardMatch(e.name, mask);
    }).map(function (e) {
      return { name: e.name, node: e.node, segs: dirSegs.concat([e.name]) };
    });
  };

  CmdTerminal.prototype.displaySegs = function (segs) {
    return 'C:\\' + segs.join('\\');
  };

  /* ---------- command runner ---------- */
  CmdTerminal.prototype.run = function (raw, stdin, inputFile) {
    var tokens = this.tokenize(this.expandVars(raw));
    if (!tokens.length) return { ok: true, lines: [] };
    var cmd = tokens[0].toLowerCase();
    var args = tokens.slice(1);
    var self = this;

    if (inputFile) {
      var content = this.readFile(inputFile, true);
      if (content == null) return { ok: false, lines: [this.errLine('Не удалось прочитать ' + inputFile)] };
      stdin = content;
    }

    function ok(lines) {
      if (!Array.isArray(lines)) lines = [lines];
      return { ok: true, lines: lines };
    }
    function err(lines) {
      if (!Array.isArray(lines)) lines = [lines];
      return { ok: false, lines: lines.map(function (l) { return { text: l, cls: 't-err' }; }) };
    }

    switch (cmd) {
      case 'help':
      case '?':
        return ok(HELP_LINES.map(function (l) { return { text: l[0], cls: l[1] }; }));

      case 'cls':
        this.clear();
        return ok([]);

      case 'echo': {
        var rest = raw.replace(/^\s*echo\b/i, '');
        rest = this.expandVars(rest);
        if (/^off$/i.test(rest.trim())) return ok(['ECHO is off.']);
        if (/^on$/i.test(rest.trim())) return ok(['ECHO is on.']);
        if (rest.trim() === '.') return ok(['']);
        return ok([rest.replace(/^\s/, '')]);
      }

      case 'cd':
      case 'chdir': {
        if (!args.length) return ok([this.pathString()]);
        if (/^\/d$/i.test(args[0]) && args[1]) args.shift();
        var segs = this.resolveSegments(args.join(' '));
        if (segs.error) return err([segs.error]);
        var target = this.getNode(segs);
        if (!target) return err(['Не удаётся найти путь: ' + args.join(' ')]);
        if (target.type !== 'dir') return err(['Не каталог: ' + args.join(' ')]);
        this.cwd = segs;
        this.updatePrompt();
        return ok([]);
      }

      case 'dir': {
        var showAll = args.some(function (a) { return /^\/a/i.test(a); });
        var bare = args.some(function (a) { return /^\/b/i.test(a); });
        var recursive = args.some(function (a) { return /^\/s/i.test(a); });
        var reverse = args.some(function (a) { return /^\/o:-/i.test(a); });
        var pathArg = args.filter(function (a) { return a[0] !== '/'; }).join(' ') || '.';
        var segs2 = this.resolveSegments(pathArg);
        if (segs2.error) return err([segs2.error]);
        var node2 = this.getNode(segs2);
        if (!node2) return err(['Файл не найден: ' + pathArg]);
        if (node2.type === 'file') return ok(['C:\\' + segs2.join('\\')]);
        var lines = [];
        var entries = this.listDir(node2);
        if (recursive) {
          var walk = function (node, p) {
            self.listDir(node).forEach(function (e) {
              if (e.node.type === 'dir') {
                lines.push(' Каталог: ' + self.displaySegs(p.concat([e.name])));
                walk(e.node, p.concat([e.name]));
              }
            });
          };
          walk(node2, segs2);
        }
        if (!bare) lines.push(' Содержимое папки ' + this.displaySegs(segs2), '');
        var rows = entries.filter(function (e) {
          if (showAll) return true;
          return !e.name.startsWith('.');
        }).sort(function (a, b) {
          var d = (a.node.type === 'dir' ? 0 : 1) - (b.node.type === 'dir' ? 0 : 1);
          if (d) return d;
          return a.name.localeCompare(b.name);
        });
        if (reverse) rows.reverse();
        if (!rows.length && bare) return ok(['']);
        rows.forEach(function (e) {
          if (bare) {
            lines.push(e.name);
          } else {
            var dt = e.node.type === 'dir' ? '<DIR>' : '';
            var size = e.node.type === 'dir' ? '' : String(e.node.content.length).padStart(7, ' ');
            lines.push((dt ? dt.padEnd(12) : size.padStart(12)) + '  ' + e.name);
          }
        });
        if (!bare) {
          var files = rows.filter(function (e) { return e.node.type === 'file'; }).length;
          var dirs = rows.length - files;
          lines.push('', '               ' + files + ' файлов, ' + dirs + ' папок');
        }
        return ok(lines);
      }

      case 'md':
      case 'mkdir': {
        if (!args.length) return err(['Нужно имя папки: md backup']);
        var r = this.makeDir(args.join(' '));
        return r.error ? err([r.error]) : ok([]);
      }

      case 'rd':
      case 'rmdir': {
        if (!args.length) return err(['Нужно имя папки: rd temp /s /q']);
        var rec = args.some(function (a) { return /^\/s/i.test(a); });
        var path = args.filter(function (a) { return a[0] !== '/'; }).join(' ');
        var segs3 = this.resolveSegments(path);
        if (segs3.error) return err([segs3.error]);
        var n3 = this.getNode(segs3);
        if (!n3) return err(['Не удаётся найти путь: ' + path]);
        if (n3.type !== 'dir') return err(['Это файл, а не папка. Используй del: ' + path]);
        if (Object.keys(n3.children).length && !rec) {
          return err(['Папка не пуста. Добавь /s: rd "' + path + '" /s /q']);
        }
        this.removePath(segs3);
        return ok(['Удалена папка: ' + this.displaySegs(segs3)]);
      }

      case 'del':
      case 'erase': {
        var files = args.filter(function (a) { return a[0] !== '/'; });
        if (!files.length) return err(['Нужно имя файла или маска: del *.tmp']);
        var total = 0;
        files.forEach(function (f) {
          self.expand(f).forEach(function (e) {
            if (e.node.type === 'file') { self.removePath(e.segs); total++; }
          });
        });
        if (!total) return err(['Не найдено файлов по маске: ' + files.join(' ')]);
        return ok(['Удалено файлов: ' + total]);
      }

      case 'copy': {
        var noSlash = args.filter(function (a) { return a[0] !== '/'; });
        if (noSlash.length < 2) return err(['Формат: copy источник назначение']);
        var src = noSlash[0], dst = noSlash[1];
        if (src.indexOf('+') >= 0) {
          var parts2 = src.split('+');
          var content = '';
          for (var pi = 0; pi < parts2.length; pi++) {
            var val = this.readFile(parts2[pi]);
            if (val == null) return err(['Файл не найден: ' + parts2[pi]]);
            content += val;
          }
          if (!this.writeFile(dst, content, false)) return err(['Не удалось создать ' + dst]);
          return ok(['Склеено в ' + dst]);
        }
        var expanded = this.expand(src);
        if (!expanded.length) return err(['Не найдено: ' + src]);
        var dstSegs = this.resolveSegments(dst);
        var dstNode = this.getNode(dstSegs);
        var dstIsDir = dst && (dst.endsWith('\\') || (dstNode && dstNode.type === 'dir'));
        if (dstIsDir && !dstNode) {
          return err(['Папка назначения не существует: ' + dst + '. Сначала: md ' + dst]);
        }
        if (expanded.length > 1 && !dstIsDir) {
          return err(['Несколько файлов можно копировать только в папку: copy *.txt backup\\']);
        }
        var copied = 0;
        expanded.forEach(function (e) {
          if (e.node.type !== 'file') return;
          var target = dstIsDir ? dst.replace(/\\$/, '') + '\\' + e.name : dst;
          if (self.writeFile(target, e.node.content, false)) copied++;
        });
        if (!copied) return err(['Копирование не удалось']);
        return ok(['Скопировано файлов: ' + copied]);
      }

      case 'move': {
        var noSlash2 = args.filter(function (a) { return a[0] !== '/'; });
        if (noSlash2.length < 2) return err(['Формат: move источник назначение']);
        var src2 = noSlash2[0], dst2 = noSlash2[1];
        var ssegs = this.resolveSegments(src2);
        var snode = this.getNode(ssegs);
        if (!snode) return err(['Не найдено: ' + src2]);
        var dsegs = this.resolveSegments(dst2);
        var dnode = this.getNode(dsegs);
        if (dnode && dnode.type === 'dir') {
          var newPath = dst2.replace(/\\$/, '') + '\\' + ssegs[ssegs.length - 1];
          if (this.exists(newPath)) return err(['Файл уже существует: ' + newPath]);
          if (snode.type === 'dir') {
            dnode.children[ssegs[ssegs.length - 1]] = snode;
          } else {
            this.writeFile(newPath, snode.content, false);
          }
          this.removePath(ssegs);
          return ok(['Перемещено в ' + newPath]);
        }
        // rename / move to exact path
        var info = this.getParent(dsegs);
        if (!info.parent) return err(['Не удалось переместить: ' + dst2]);
        if (this.childKey(info.parent, info.name)) return err(['Файл уже существует: ' + dst2]);
        info.parent.children[info.name] = snode;
        this.removePath(ssegs);
        return ok(['Переименовано/перемещено: ' + dst2]);
      }

      case 'ren':
      case 'rename': {
        if (args.length < 2) return err(['Формат: ren старое_имя новое_имя']);
        var old = args[0], neu = args[1];
        if (neu.indexOf('\\') >= 0 || neu.indexOf('/') >= 0) return err(['ren меняет только имя, без пути. Для переноса используй move.']);
        var osegs = this.resolveSegments(old);
        var onode = this.getNode(osegs);
        if (!onode) return err(['Не найдено: ' + old]);
        var pinfo = this.getParent(osegs);
        if (this.childKey(pinfo.parent, neu)) return err(['Имя уже занято: ' + neu]);
        pinfo.parent.children[neu] = onode;
        delete pinfo.parent.children[Object.keys(pinfo.parent.children).filter(function (k) { return k.toLowerCase() === pinfo.name.toLowerCase(); })[0]];
        return ok(['Переименовано: ' + old + ' → ' + neu]);
      }

      case 'type': {
        if (!args.length) return err(['Формат: type файл']);
        var out = [];
        for (var ti = 0; ti < args.length; ti++) {
          var content2 = this.readFile(args[ti]);
          if (content2 == null) return err(['Не найден файл: ' + args[ti]]);
          out.push(content2.replace(/\n$/, ''));
        }
        return ok(out.join('\n'));
      }

      case 'more': {
        if (!args.length) {
          return ok((stdin || '').split('\n'));
        }
        var c3 = this.readFile(args[0]);
        if (c3 == null) return err(['Не найден файл: ' + args[0]]);
        return ok(c3.replace(/\n$/, '').split('\n'));
      }

      case 'sort': {
        var rev = args.some(function (a) { return /^\/r/i.test(a); });
        var oIdx = args.findIndex(function (a) { return /^\/o/i.test(a); });
        var sortFile = args.filter(function (a) { return a[0] !== '/'; })[0];
        var data;
        if (sortFile) {
          var c4 = this.readFile(sortFile);
          if (c4 == null) return err(['Не найден файл: ' + sortFile]);
          data = c4;
        } else if (stdin != null) {
          data = stdin;
        } else {
          return err(['Формат: sort файл [/r] [/o результат]']);
        }
        var arr = data.replace(/\n$/, '').split('\n').sort(function (a, b) { return a.localeCompare(b, 'ru', { sensitivity: 'base' }); });
        if (rev) arr.reverse();
        if (oIdx >= 0) {
          var target = args[oIdx + 1];
          if (!target) return err(['После /o нужно имя файла']);
          if (!this.writeFile(target, arr.join('\n'), false)) return err(['Не удалось записать ' + target]);
          return ok(['Отсортировано в ' + target]);
        }
        return ok(arr);
      }

      case 'find':
      case 'findstr': {
        var ci = args.some(function (a) { return /^\/i/i.test(a); });
        var numbered = args.some(function (a) { return /^\/n/i.test(a); });
        var invert = args.some(function (a) { return /^\/v/i.test(a); });
        var exact = args.some(function (a) { return /^\/c:/i.test(a); });
        var patterns = [];
        var files2 = [];
        args.forEach(function (a) {
          if (/^\/c:/i.test(a)) patterns.push(a.slice(3).replace(/^"|"$/g, ''));
          else if (a[0] !== '/') {
            if (patterns.length === 0) {
              a.split(/\s+/).forEach(function (p) { patterns.push(p.replace(/^"|"$/g, '')); });
            } else files2.push(a);
          }
        });
        if (!patterns.length) return err(['Формат: findstr /i "текст" файл']);
        var source;
        if (files2.length) {
          var c5 = this.readFile(files2[0]);
          if (c5 == null) return err(['Не найден файл: ' + files2[0]]);
          source = c5;
        } else source = stdin;
        if (source == null) source = '';
        var result = [];
        source.replace(/\n$/, '').split('\n').forEach(function (line, i) {
          var hay = ci ? line.toLowerCase() : line;
          var match;
          if (exact) {
            match = patterns.some(function (p) { return hay.indexOf(ci ? p.toLowerCase() : p) >= 0; });
          } else {
            match = patterns.some(function (p) { return hay.indexOf(ci ? p.toLowerCase() : p) >= 0; });
          }
          if (match !== invert) {
            result.push((numbered ? (i + 1) + ':' : '') + line);
          }
        });
        if (!result.length) return { ok: false, lines: [{ text: '', cls: '' }] };
        return ok(result);
      }

      case 'xcopy':
      case 'robocopy': {
        var noSlash3 = args.filter(function (a) { return a[0] !== '/'; });
        if (noSlash3.length < 2) return err(['Формат: xcopy источник назначение /E /I']);
        var srcSegs = this.resolveSegments(noSlash3[0]);
        var srcNode = this.getNode(srcSegs);
        if (!srcNode) return err(['Не найдено: ' + noSlash3[0]]);
        var dstSegs2 = this.resolveSegments(noSlash3[1]);
        var dstNode2 = this.getNode(dstSegs2);
        if (dstNode2 && dstNode2.type === 'file') return err(['Назначение — файл: ' + noSlash3[1]]);
        if (!dstNode2) {
          var mk = this.makeDir(noSlash3[1]);
          if (mk.error) return err([mk.error]);
          dstNode2 = this.getNode(dstSegs2);
        }
        var count = 0;
        var copyTree = function (src, dst) {
          Object.keys(src.children).forEach(function (k) {
            var child = src.children[k];
            if (child.type === 'dir') {
              if (!dst.children[k]) dst.children[k] = dir({});
              copyTree(child, dst.children[k]);
            } else {
              dst.children[k] = file(child.content);
              count++;
            }
          });
        };
        if (srcNode.type === 'file') {
          dstNode2.children[srcSegs[srcSegs.length - 1]] = file(srcNode.content);
          count = 1;
        } else {
          copyTree(srcNode, dstNode2);
        }
        if (!count) return ok(['Скопировано 0 файлов (папка пуста).']);
        return ok(['Скопировано файлов: ' + count + ' → ' + noSlash3[1]]);
      }

      case 'tree': {
        var showFiles = args.some(function (a) { return /^\/f/i.test(a); });
        var ascii = args.some(function (a) { return /^\/a/i.test(a); });
        var pathArg2 = args.filter(function (a) { return a[0] !== '/'; })[0] || '.';
        var tsegs = this.resolveSegments(pathArg2);
        var tnode = this.getNode(tsegs);
        if (!tnode) return err(['Не найдено: ' + pathArg2]);
        if (tnode.type !== 'dir') return err(['Не папка: ' + pathArg2]);
        var lines2 = ['Структура папок', this.displaySegs(tsegs)];
        var prefixes = [];
        var walkTree = function (node, prefix) {
          var entries = self.listDir(node).filter(function (e) { return showFiles || e.node.type === 'dir'; });
          entries.forEach(function (e, i) {
            var last = i === entries.length - 1;
            lines2.push(prefix + (last ? '└───' : '├───') + e.name);
            if (e.node.type === 'dir') walkTree(e.node, prefix + (last ? '    ' : '│   '));
          });
        };
        walkTree(tnode, '');
        return ok(lines2);
      }

      case 'where': {
        var prog = (args[0] || '').toLowerCase();
        var known = {
          git: 'C:\\Program Files\\Git\\cmd\\git.exe',
          node: 'C:\\Program Files\\nodejs\\node.exe',
          python: 'C:\\Users\\student\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
          cmd: 'C:\\Windows\\System32\\cmd.exe',
          notepad: 'C:\\Windows\\System32\\notepad.exe'
        };
        if (known[prog]) return ok([known[prog]]);
        return err(['INFO: Could not find files for the given pattern(s).']);
      }

      case 'chcp': {
        if (args[0]) return ok(['Active code page: ' + args[0]]);
        return ok(['Active code page: 65001']);
      }

      case 'title':
      case 'color':
      case 'start':
      case 'timeout':
      case 'pause':
        return ok(['[' + cmd + '] ' + (args.join(' ') || 'ok') + ' — в песочнице команда имитируется.']);

      case 'setx': {
        if (args.length < 2) return err(['Формат: setx ИМЯ значение']);
        this.vars[args[0]] = args.slice(1).join(' ');
        return ok(['SUCCESS: Specified value was saved. (имитация; в реальном CMD — для новых окон)']);
      }

      case 'set': {
        if (!args.length) {
          return ok(Object.keys(this.vars).sort().map(function (k) { return k + '=' + self.vars[k]; }));
        }
        var joined = args.join(' ');
        if (/^\/a$/i.test(args[0])) {
          var expr = args.slice(1).join(' ');
          var m = expr.match(/^([a-zA-Z_][\w]*)\s*=\s*(.+)$/);
          if (!m) {
            var val = this.evalMath(expr);
            return val == null ? err(['Некорректное выражение: ' + expr]) : ok([String(val)]);
          }
          var v = this.evalMath(m[2]);
          if (v == null) return err(['Некорректное выражение: ' + m[2]]);
          this.vars[m[1]] = v;
          return ok([]);
        }
        if (/^\/p$/i.test(args[0])) {
          var rest2 = joined.replace(/^\/p\s+/i, '');
          var eq = rest2.indexOf('=');
          if (eq < 0) return err(['Формат: set /p ИМЯ=подсказка']);
          var name = rest2.slice(0, eq).trim();
          var prompt = rest2.slice(eq + 1);
          this.pending = { name: name, prompt: prompt };
          if (this.input) this.input.placeholder = prompt + ' (нажми Enter)';
          return ok([prompt]);
        }
        var eq2 = joined.indexOf('=');
        if (eq2 < 0) {
          var key = joined.trim();
          if (this.vars[key] != null) return ok([key + '=' + this.vars[key]]);
          return err(['Переменная не найдена: ' + key]);
        }
        var nm = joined.slice(0, eq2);
        var vl = joined.slice(eq2 + 1);
        if (nm.endsWith(' ')) return err(['Пробел перед = стал частью имени. Пиши: set NAME=value']);
        if (vl === '') { delete this.vars[nm.trim()]; return ok([]); }
        this.vars[nm.trim()] = vl;
        return ok([]);
      }

      case 'tasklist': {
        var csv = args.some(function (a) { return /^\/fo:?csv$/i.test(a); });
        var nh = args.some(function (a) { return /^\/nh$/i.test(a); });
        var filt = args.join(' ').match(/imagename\s+eq\s+"?([^"\s]+)"?/i);
        var rows2 = TASKLIST.filter(function (r) {
          if (self.killed[r[0]]) return false;
          if (filt && r[0].toLowerCase() !== filt[1].toLowerCase()) return false;
          return true;
        });
        if (csv) {
          var out2 = rows2.map(function (r) { return '"' + r[0] + '","' + r[1] + '","' + r[2] + '","' + r[3] + '"'; });
          if (!nh) out2.unshift('"Image Name","PID","Session Name","Mem Usage"');
          return ok(out2);
        }
        var out3 = ['', 'Image Name                     PID Session Name        Mem Usage', '========================= ======== ================ ============'];
        rows2.forEach(function (r) {
          out3.push((r[0] + ' '.repeat(26)).slice(0, 26) + (String(r[1]) + ' '.repeat(9)).slice(0, 9) + (r[2] + ' '.repeat(17)).slice(0, 17) + r[3]);
        });
        return ok(out3);
      }

      case 'taskkill': {
        var nameM = args.join(' ').match(/\/im\s+"?([^"\s]+)"?/i);
        var pidM = args.join(' ').match(/\/pid\s+(\d+)/i);
        var force = args.some(function (a) { return /^\/f/i.test(a); });
        var targetName = nameM ? nameM[1] : null;
        if (!targetName && !pidM) return err(['Формат: taskkill /IM имя /F или taskkill /PID 1234 /F']);
        var found = TASKLIST.filter(function (r) {
          if (targetName) return r[0].toLowerCase() === targetName.toLowerCase();
          return String(r[1]) === pidM[1];
        }).filter(function (r) { return !self.killed[r[0]]; });
        if (!found.length) return err(['ERROR: The process not found.']);
        found.forEach(function (r) { self.killed[r[0]] = true; });
        return ok(found.map(function (r) {
          return 'SUCCESS: The process "' + r[0] + '" with PID ' + r[1] + ' has been terminated.' + (force ? ' (forced)' : '');
        }));
      }

      case 'pause':
        return ok(['Нажмите любую клавишу . . . (в песочнице пауза не блокирует)']);

      case 'exit':
        return ok(['В песочнице окно не закрывается. Используй «Сбросить».']);

      case 'attrib':
      case 'fc':
      case 'mklink':
      case 'mklink':
        return ok(['Команда ' + cmd + ' не реализована в песочнице. Смотри теорию — там есть примеры.']);

      default:
        return err(["'" + tokens[0] + "' не является внутренней или внешней командой.", 'Введи help, чтобы увидеть список поддерживаемых команд.']);
    }
  };

  CmdTerminal.prototype.errLine = function (t) { return { text: t, cls: 't-err' }; };

  CmdTerminal.prototype.tokenize = function (line) {
    var tokens = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') { q = !q; continue; }
      if (/\s/.test(ch) && !q) {
        if (cur) { tokens.push(cur); cur = ''; }
      } else cur += ch;
    }
    if (cur) tokens.push(cur);
    return tokens;
  };

  CmdTerminal.prototype.expandVars = function (text) {
    var self = this;
    if (text.indexOf('%') < 0) return text;
    return text.replace(/%([^%]+)%/g, function (all, name) {
      if (name.toUpperCase() === 'CD') return self.pathString();
      if (name.toUpperCase() === 'DATE') return new Date().toLocaleDateString('ru-RU');
      if (name.toUpperCase() === 'TIME') return new Date().toLocaleTimeString('ru-RU');
      if (name.toUpperCase() === 'RANDOM') return String(Math.floor(Math.random() * 32768));
      return self.vars[name] != null ? self.vars[name] : all;
    });
  };

  CmdTerminal.prototype.evalMath = function (expr) {
    expr = expr.replace(/\+/g, '+').replace(/%/g, '%');
    if (!/^[\d+\-*/%()\s]+$/.test(expr)) return null;
    try {
      // eslint-disable-next-line no-new-func
      var v = Function('"use strict";return (' + expr + ')')();
      if (typeof v !== 'number' || !isFinite(v)) return null;
      return Math.trunc(v);
    } catch (e) { return null; }
  };

  CmdTerminal.prototype.getVar = function (name) {
    return this.vars[name] != null ? this.vars[name] : (name === 'CD' ? this.pathString() : null);
  };

  window.CmdTerminal = CmdTerminal;
})();
