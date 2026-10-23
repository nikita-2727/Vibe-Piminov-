/* Git graph model + animated SVG/DOM visualizer */
(function () {
  var PALETTE = ['#fb923c', '#22d3ee', '#a78bfa', '#4ade80', '#f472b6', '#facc15', '#60a5fa'];

  function GitModel(data) {
    data = data || {};
    this.commits = (data.commits || []).map(function (x) { return Object.assign({}, x); });
    this.branches = Object.assign({}, data.branches || {});
    this.head = data.head || { type: 'branch', name: Object.keys(this.branches)[0] || 'main' };
    this.lanes = Object.assign({}, data.lanes || {});
    this.reflog = data.reflog || [];
    this.seq = this.commits.reduce(function (m, x) { return Math.max(m, x.seq); }, -1);
    this.counter = 1;
    this.files = Object.assign({}, data.files || {});
    this.staged = Object.assign({}, data.staged || {});
    this.squashPending = false;
    this.index = {};
  }

  GitModel.prototype.laneOf = function (branch) {
    if (branch == null) branch = 'detached';
    if (!(branch in this.lanes)) {
      var used = Object.keys(this.lanes).length;
      this.lanes[branch] = used;
    }
    return this.lanes[branch];
  };

  GitModel.prototype.nextHash = function () {
    var n = (this.counter++ * 2654435761 + this.commits.length * 97) >>> 0;
    var h = n.toString(16) + Math.floor(Math.random() * 4096).toString(16);
    return (h + '0000000').slice(0, 7);
  };

  GitModel.prototype.newCommit = function (branch, msg, parents, opts) {
    opts = opts || {};
    var commit = {
      id: opts.id || this.nextHash(),
      branch: branch,
      msg: msg,
      parents: (parents || []).filter(Boolean),
      seq: opts.seq != null ? opts.seq : ++this.seq,
      files: opts.files ? Object.assign({}, opts.files) : Object.assign({}, this.files)
    };
    this.commits.push(commit);
    return commit;
  };

  GitModel.prototype.headCommit = function () {
    if (!this.head) return null;
    if (this.head.type === 'branch') return this.branches[this.head.name] || null;
    return this.head.commit || null;
  };

  GitModel.prototype.reachableFrom = function (id) {
    var result = {};
    var commits = this.commits;
    var byId = {};
    commits.forEach(function (c) { byId[c.id] = c; });
    (function walk(x) {
      if (!x || result[x] || !byId[x]) return;
      result[x] = true;
      (byId[x].parents || []).forEach(walk);
    })(id);
    return result;
  };

  GitModel.prototype.reachableSet = function () {
    var self = this;
    var all = {};
    Object.keys(this.branches).forEach(function (b) {
      var r = self.reachableFrom(self.branches[b]);
      Object.keys(r).forEach(function (k) { all[k] = true; });
    });
    if (this.head && this.head.type === 'detached') {
      var rh = this.reachableFrom(this.head.commit);
      Object.keys(rh).forEach(function (k) { all[k] = true; });
    }
    return all;
  };

  GitModel.prototype.findCommit = function (ref) {
    if (!ref) return null;
    ref = String(ref).trim();
    if (ref === 'HEAD' || ref === '@') return this.headCommit();
    if (ref === 'main' && !this.branches.main) return null;

    var m = ref.match(/^(.*?)(~+|\^)(\d*)$/);
    if (m && m[1]) {
      var base = this.findCommit(m[1]);
      if (!base) return null;
      var byId = {};
      this.commits.forEach(function (c) { byId[c.id] = c; });
      var cur = base;
      if (m[2][0] === '~') {
        var n = m[3] ? parseInt(m[3], 10) : m[2].length;
        for (var i = 0; i < n; i++) {
          var cc = byId[cur];
          if (!cc || !cc.parents.length) return null;
          cur = cc.parents[0];
        }
      } else {
        var k = m[3] ? parseInt(m[3], 10) : 1;
        var node = byId[cur];
        if (!node || !node.parents[k - 1]) return null;
        cur = node.parents[k - 1];
      }
      return cur;
    }

    if (this.branches[ref]) return this.branches[ref];

    var at = ref.match(/^HEAD@\{(\d+)\}$/);
    if (at) {
      var idx = parseInt(at[1], 10);
      if (this.reflog[idx]) return this.reflog[idx].commit;
      return null;
    }

    var hit = null;
    this.commits.forEach(function (c) { if (!hit && c.id.indexOf(ref) === 0) hit = c.id; });
    return hit;
  };

  GitModel.prototype.resolve = GitModel.prototype.findCommit;

  GitModel.prototype.recordHead = function (msg) {
    var cid = this.headCommit();
    if (!cid) return;
    this.reflog.unshift({ commit: cid, msg: msg, time: Date.now() });
  };

  GitModel.prototype.diffTargets = function () {
    var headId = this.headCommit();
    var head = null;
    this.commits.forEach(function (c) { if (c.id === headId) head = c; });
    return head ? Object.assign({}, head.files || {}) : {};
  };

  /* ---------------- View ---------------- */
  function GitGraphView(container) {
    this.el = container;
    this.canvas = document.createElement('div');
    this.canvas.className = 'gitgraph__canvas';
    this.el.innerHTML = '';
    this.el.appendChild(this.canvas);
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.canvas.appendChild(this.svg);
    this.nodes = {};
    this.chips = {};
    this.models = null;
    this.known = {};
    this.onSelect = null;
    this.selectedId = null;
    var self = this;
    this.canvas.addEventListener('click', function (e) {
      var node = e.target.closest('.commit');
      if (node && self.onSelect) self.onSelect(node.getAttribute('data-id'));
    });
    this.canvas.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var node = e.target.closest('.commit');
      if (!node || !self.onSelect) return;
      e.preventDefault();
      self.onSelect(node.getAttribute('data-id'));
    });
  }

  GitGraphView.prototype.select = function (id) {
    this.selectedId = id || null;
    var self = this;
    Object.keys(this.nodes).forEach(function (cid) {
      self.nodes[cid].classList.toggle('selected', cid === id);
    });
  };

  GitGraphView.prototype.setSelectHandler = function (fn) {
    this.onSelect = fn || null;
    this.canvas.classList.toggle('is-interactive', !!fn);
    var self = this;
    Object.keys(this.nodes).forEach(function (id) {
      var node = self.nodes[id];
      node.tabIndex = fn ? 0 : -1;
      if (fn) node.setAttribute('role', 'button');
      else node.removeAttribute('role');
    });
  };

  GitGraphView.prototype.setModel = function (model) {
    this.models = model;
    this.known = {};
    this.canvas.innerHTML = '';
    this.canvas.appendChild(this.svg);
    this.nodes = {};
    this.chips = {};
    this.render();
  };

  GitGraphView.prototype.render = function () {
    var self = this;
    var m = this.models;
    if (!m) return;
    if (!this.svg.parentNode) this.canvas.insertBefore(this.svg, this.canvas.firstChild);
    var emptyEl = this.canvas.querySelector('.graph-empty');
    if (!m.commits.length) {
      this.svg.innerHTML = '';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'graph-empty';
        emptyEl.textContent = 'пустой репозиторий — сделай первый коммит';
        this.canvas.appendChild(emptyEl);
      }
      emptyEl.style.display = '';
      Object.keys(this.nodes).forEach(function (id) { self.nodes[id].remove(); });
      Object.keys(this.chips).forEach(function (key) { self.chips[key].remove(); });
      this.nodes = {};
      this.chips = {};
      return;
    }
    if (emptyEl) emptyEl.remove();

    var dx = 94, dy = 92, padX = 64, padY = 82;
    var maxSeq = m.commits.reduce(function (a, c) { return Math.max(a, c.seq); }, 0);
    var maxLane = 0;
    Object.keys(m.lanes).forEach(function (k) { maxLane = Math.max(maxLane, m.lanes[k]); });
    m.commits.forEach(function (c) { maxLane = Math.max(maxLane, m.laneOf(c.branch)); });

    var width = padX * 2 + maxSeq * dx + 80;
    var height = padY + maxLane * dy + 120;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.svg.setAttribute('width', width);
    this.svg.setAttribute('height', height);
    this.svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    var pos = {};
    m.commits.forEach(function (c) {
      pos[c.id] = {
        x: padX + c.seq * dx,
        y: padY + m.laneOf(c.branch) * dy
      };
    });

    var reachable = m.reachableSet();
    var headId = m.headCommit();

    /* edges */
    var parts = [];
    m.commits.forEach(function (child) {
      (child.parents || []).forEach(function (pid, i) {
        if (!pos[pid]) return;
        var a = pos[pid], b = pos[child.id];
        var lane = m.laneOf(child.branch);
        var color = PALETTE[lane % PALETTE.length];
        var hidden = !reachable[child.id] || !reachable[pid];
        var d;
        if (Math.abs(a.y - b.y) < 1) {
          d = 'M' + a.x + ' ' + a.y + ' L' + b.x + ' ' + b.y;
        } else {
          var cx = (a.x + b.x) / 2;
          d = 'M' + a.x + ' ' + a.y + ' C' + cx + ' ' + a.y + ', ' + cx + ' ' + b.y + ', ' + b.x + ' ' + b.y;
        }
        var cls = 'edge' + (i > 0 ? ' edge--merge' : '');
        parts.push('<path class="' + cls + '" d="' + d + '" stroke="' + color + '"' +
          (hidden ? ' opacity="0.18" stroke-dasharray="3 4"' : '') + ' />');
      });
    });
    this.svg.innerHTML = parts.join('');

    /* commits */
    m.commits.forEach(function (c) {
      var el = self.nodes[c.id];
      var isNew = !el;
      if (!el) {
        el = document.createElement('div');
        el.className = 'commit';
        el.dataset.id = c.id;
        el.tabIndex = self.onSelect ? 0 : -1;
        if (self.onSelect) el.setAttribute('role', 'button');
        el.innerHTML = '<div class="commit__dot"><span></span></div><div class="commit__hash">' + c.id.slice(0, 5) + '</div>';
        el.title = c.msg;
        self.canvas.appendChild(el);
        self.nodes[c.id] = el;
      }
      var p = pos[c.id];
      el.style.left = p.x + 'px';
      el.style.top = p.y + 'px';
      var lane = m.laneOf(c.branch);
      el.style.color = PALETTE[lane % PALETTE.length];
      el.classList.toggle('is-head', c.id === headId && m.head.type === 'branch');
      el.classList.toggle('dangling', !reachable[c.id]);
      el.classList.toggle('selected', c.id === self.selectedId);
      el.classList.toggle('new', isNew && Object.keys(self.known).length > 0);
      el.title = c.msg + ' · ' + c.id.slice(0, 7);
      el.setAttribute('aria-label', 'Коммит ' + c.id.slice(0, 7) + ': ' + c.msg);
    });

    /* branch labels */
    var groups = {};
    Object.keys(m.branches).forEach(function (b) {
      var cid = m.branches[b];
      if (!pos[cid]) return;
      (groups[cid] = groups[cid] || []).push(b);
    });
    Object.keys(groups).forEach(function (cid) {
      groups[cid].sort();
    });

    var wantedChips = {};
    Object.keys(m.branches).forEach(function (b) {
      var cid = m.branches[b];
      if (!pos[cid]) return;
      var idx = groups[cid].indexOf(b);
      var isHead = m.head.type === 'branch' && m.head.name === b;
      var key = 'b:' + b;
      wantedChips[key] = true;
      var chip = self.chips[key];
      if (!chip) {
        chip = document.createElement('div');
        chip.className = 'branch-chip';
        self.canvas.appendChild(chip);
        self.chips[key] = chip;
      }
      chip.style.color = PALETTE[m.laneOf(b) % PALETTE.length];
      chip.style.left = pos[cid].x + 'px';
      chip.style.top = (pos[cid].y - 26 - idx * 21) + 'px';
      chip.classList.toggle('is-head', isHead);
      chip.innerHTML = (isHead ? '<span class="head-tag">HEAD</span>' : '') + b;
    });

    if (m.head.type === 'detached') {
      var cid = m.head.commit;
      if (pos[cid]) {
        wantedChips['d:head'] = true;
        var chip = self.chips['d:head'];
        if (!chip) {
          chip = document.createElement('div');
          chip.className = 'branch-chip';
          self.canvas.appendChild(chip);
          self.chips['d:head'] = chip;
        }
        chip.style.color = PALETTE[m.laneOf('detached') % PALETTE.length];
        chip.style.left = pos[cid].x + 'px';
        chip.style.top = (pos[cid].y - 26) + 'px';
        chip.classList.add('is-head');
        chip.innerHTML = '<span class="head-tag">HEAD</span> detached';
      }
    }

    Object.keys(self.chips).forEach(function (key) {
      if (!wantedChips[key]) {
        self.chips[key].remove();
        delete self.chips[key];
      }
    });

    Object.keys(self.nodes).forEach(function (id) {
      if (!m.commits.some(function (c) { return c.id === id; })) {
        self.nodes[id].remove();
        delete self.nodes[id];
      }
      self.known[id] = true;
    });

    var self2 = this;
    requestAnimationFrame(function () {
      self2.el.scrollLeft = Math.max(0, width - self2.el.clientWidth);
    });
  };

  window.GitModel = GitModel;
  window.GitGraphView = GitGraphView;
  window.GIT_PALETTE = PALETTE;
})();
