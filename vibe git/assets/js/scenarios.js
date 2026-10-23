/* Animated Git scenarios. Each step mutates a GitModel and re-renders the graph. */
(function () {
  function c(id, branch, msg, parents, seq) {
    return { id, branch, msg, parents: parents || [], seq };
  }

  window.GIT_SCENARIOS = [
    {
      id: 'ff',
      title: 'Fast-forward merge',
      short: 'main просто переезжает',
      desc: 'Ветка feature выросла из main, а main с тех пор не менялся. Git не создаёт новый коммит — просто передвигает указатель main вперёд.',
      legend: ['main', 'feature'],
      init: function () {
        return {
          commits: [
            c('a1f0c2e', 'main', 'init project', [], 0),
            c('b2e7d19', 'main', 'add api', ['a1f0c2e'], 1),
            c('c3f8a41', 'feature', 'feat: ui', ['b2e7d19'], 2)
          ],
          branches: { main: 'b2e7d19', feature: 'c3f8a41' },
          head: { type: 'branch', name: 'feature' },
          lanes: { main: 0, feature: 1 }
        };
      },
      steps: [
        {
          cmd: 'git switch main',
          text: 'Переходим на main. HEAD теперь смотрит на main, который стоит на коммите «add api».',
          apply: function (m) { m.head = { type: 'branch', name: 'main' }; }
        },
        {
          cmd: 'git merge feature',
          text: 'main — предок feature, поэтому возможен fast-forward. Указатель main просто переезжает на c3f8a41. Нового коммита нет, история линейна.',
          apply: function (m) { m.branches.main = m.branches.feature; }
        }
      ]
    },
    {
      id: 'noff',
      title: 'Merge с --no-ff',
      short: 'Всегда merge-коммит',
      desc: 'Даже когда возможен fast-forward, --no-ff заставляет Git создать отдельный коммит слияния. В истории остаётся видно, что существовала ветка.',
      legend: ['main', 'feature'],
      init: function () {
        return {
          commits: [
            c('a1f0c2e', 'main', 'init project', [], 0),
            c('b2e7d19', 'main', 'add api', ['a1f0c2e'], 1),
            c('c3f8a41', 'feature', 'feat: ui', ['b2e7d19'], 2),
            c('d4a9b52', 'main', 'hotfix: config', ['b2e7d19'], 3)
          ],
          branches: { main: 'd4a9b52', feature: 'c3f8a41' },
          head: { type: 'branch', name: 'main' },
          lanes: { main: 0, feature: 1 }
        };
      },
      steps: [
        {
          cmd: 'git merge --no-ff feature',
          text: 'main и feature разошлись от «add api». Git создаёт merge-коммит M с двумя родителями: d4a9b52 и c3f8a41.',
          apply: function (m) {
            var merge = m.newCommit('main', 'merge: feature', [m.branches.main, m.branches.feature]);
            merge.merge = true;
            m.branches.main = merge.id;
          }
        }
      ]
    },
    {
      id: 'squash',
      title: 'Squash-слияние',
      short: 'Много коммитов → один',
      desc: '--squash применяет изменения feature, но не создаёт merge-коммит и не связывает истории. Дальше ты сам делаешь один обычный коммит.',
      legend: ['main', 'feature'],
      init: function () {
        return {
          commits: [
            c('a1f0c2e', 'main', 'init project', [], 0),
            c('b2e7d19', 'main', 'add api', ['a1f0c2e'], 1),
            c('c3f8a41', 'feature', 'feat: ui', ['b2e7d19'], 2),
            c('d4a9b52', 'feature', 'feat: styles', ['c3f8a41'], 3),
            c('e5b0c63', 'main', 'chore: deps', ['b2e7d19'], 4)
          ],
          branches: { main: 'e5b0c63', feature: 'd4a9b52' },
          head: { type: 'branch', name: 'main' },
          lanes: { main: 0, feature: 1 }
        };
      },
      steps: [
        {
          cmd: 'git merge --squash feature',
          text: 'Изменения из feature оказались в индексе. Merge-коммита нет, ветки пока не связаны.',
          apply: function (m) { m.squashPending = true; }
        },
        {
          cmd: 'git commit -m "feat: ui (squashed)"',
          text: 'Один обычный коммит с суммарными изменениями. В main — одна запись вместо двух, feature осталась отдельной веткой.',
          apply: function (m) {
            var squashed = m.newCommit('main', 'feat: ui (squashed)', [m.branches.main]);
            m.branches.main = squashed.id;
            m.squashPending = false;
          }
        }
      ]
    },
    {
      id: 'rebase',
      title: 'Rebase',
      short: 'Линейная история, новые хеши',
      desc: 'Rebase переносит коммиты feature на актуальный main. Внешне история становится линейной, но все перенесённые коммиты получают новые хеши.',
      legend: ['main', 'feature'],
      init: function () {
        return {
          commits: [
            c('a1f0c2e', 'main', 'init project', [], 0),
            c('b2e7d19', 'main', 'add api', ['a1f0c2e'], 1),
            c('c3f8a41', 'feature', 'feat: ui', ['b2e7d19'], 2),
            c('d4a9b52', 'feature', 'feat: styles', ['c3f8a41'], 3)
          ],
          branches: { main: 'b2e7d19', feature: 'd4a9b52' },
          head: { type: 'branch', name: 'feature' },
          lanes: { main: 0, feature: 1 }
        };
      },
      steps: [
        {
          cmd: 'git switch main',
          text: 'Пока feature жила своей жизнью, main ушёл вперёд: добавился коммит «chore: deps».',
          apply: function (m) {
            m.head = { type: 'branch', name: 'main' };
            var deps = m.newCommit('main', 'chore: deps', [m.branches.main]);
            m.branches.main = deps.id;
          }
        },
        {
          cmd: 'git switch feature',
          text: 'Возвращаемся на feature. Сейчас её коммиты растут от старого «add api».',
          apply: function (m) { m.head = { type: 'branch', name: 'feature' }; }
        },
        {
          cmd: 'git rebase main',
          text: 'Git откладывает коммиты feature и применяет их заново поверх main. c3f8a41 и d4a9b52 стали недостижимыми — вместо них новые коммиты с новыми хешами.',
          apply: function (m) {
            var base = m.branches.main;
            var old = m.reachableFrom(m.branches.feature);
            var chain = m.commits
              .filter(function (x) { return old[x.id] && x.branch === 'feature'; })
              .sort(function (a, b) { return a.seq - b.seq; });
            var parent = base;
            chain.forEach(function (x) {
              var copy = m.newCommit('feature', x.msg, [parent]);
              parent = copy.id;
            });
            m.branches.feature = parent;
          }
        }
      ]
    },
    {
      id: 'cherry',
      title: 'Cherry-pick',
      short: 'Один коммит в другую ветку',
      desc: 'Cherry-pick копирует изменения выбранного коммита в текущую ветку. Новый коммит получает новый хеш, а остальные коммиты ветки не переносятся.',
      legend: ['main', 'feature'],
      init: function () {
        return {
          commits: [
            c('a1f0c2e', 'main', 'init project', [], 0),
            c('b2e7d19', 'main', 'add api', ['a1f0c2e'], 1),
            c('c3f8a41', 'feature', 'fix: parser', ['b2e7d19'], 2),
            c('d4a9b52', 'feature', 'chore: tests', ['c3f8a41'], 3),
            c('e5b0c63', 'main', 'docs: readme', ['b2e7d19'], 4)
          ],
          branches: { main: 'e5b0c63', feature: 'd4a9b52' },
          head: { type: 'branch', name: 'main' },
          lanes: { main: 0, feature: 1 }
        };
      },
      steps: [
        {
          cmd: 'git cherry-pick -x c3f8a41',
          text: 'На main появился новый коммит с тем же diff, что у «fix: parser». Сообщение дополнено ссылкой на источник, хеш другой.',
          apply: function (m) {
            var copy = m.newCommit('main', 'fix: parser', [m.branches.main]);
            copy.cherry = true;
            m.branches.main = copy.id;
          }
        }
      ]
    },
    {
      id: 'reset',
      title: 'Reset --hard',
      short: 'Ветка назад, коммит в reflog',
      desc: 'reset --hard передвигает ветку назад и стирает изменения в рабочей папке. Сам коммит остаётся в объектах и находится через reflog.',
      legend: ['main'],
      init: function () {
        return {
          commits: [
            c('a1f0c2e', 'main', 'init project', [], 0),
            c('b2e7d19', 'main', 'add api', ['a1f0c2e'], 1),
            c('c3f8a41', 'main', 'broken change', ['b2e7d19'], 2)
          ],
          branches: { main: 'c3f8a41' },
          head: { type: 'branch', name: 'main' },
          lanes: { main: 0 }
        };
      },
      steps: [
        {
          cmd: 'git reset --hard HEAD~1',
          text: 'main сдвинулся на «add api». Коммит c3f8a41 больше не достижим из ветки и показан призраком. Файлы рабочей папки тоже откатились.',
          apply: function (m) { m.branches.main = m.commits[1].id; }
        },
        {
          cmd: 'git reflog  →  git reset --hard HEAD@{1}',
          text: 'Reflog помнит перемещение. Потерянный коммит можно вернуть, пока запись не истекла (обычно 90 дней).',
          apply: function (m) { m.branches.main = m.commits[2].id; }
        }
      ]
    },
    {
      id: 'revert',
      title: 'Revert',
      short: 'Отмена без переписывания',
      desc: 'revert не удаляет плохой коммит, а создаёт новый с обратными изменениями. Безопасно для веток, которые уже у других.',
      legend: ['main'],
      init: function () {
        return {
          commits: [
            c('a1f0c2e', 'main', 'init project', [], 0),
            c('b2e7d19', 'main', 'add broken feature', ['a1f0c2e'], 1),
            c('c3f8a41', 'main', 'add tests', ['b2e7d19'], 2)
          ],
          branches: { main: 'c3f8a41' },
          head: { type: 'branch', name: 'main' },
          lanes: { main: 0 }
        };
      },
      steps: [
        {
          cmd: 'git revert b2e7d19',
          text: 'Поверх истории появился коммит, отменяющий изменения b2e7d19. Старые коммиты на месте, история не переписана.',
          apply: function (m) {
            var rev = m.newCommit('main', 'Revert "add broken feature"', [m.branches.main]);
            rev.revert = true;
            m.branches.main = rev.id;
          }
        }
      ]
    },
    {
      id: 'detached',
      title: 'Detached HEAD',
      short: 'Коммит в никуда',
      desc: 'Если переключиться на коммит вместо ветки, HEAD отцепляется. Сделанный здесь коммит не принадлежит ни одной ветке и теряется при переключении.',
      legend: ['main', 'detached'],
      init: function () {
        return {
          commits: [
            c('a1f0c2e', 'main', 'init project', [], 0),
            c('b2e7d19', 'main', 'add api', ['a1f0c2e'], 1),
            c('c3f8a41', 'main', 'add ui', ['b2e7d19'], 2)
          ],
          branches: { main: 'c3f8a41' },
          head: { type: 'branch', name: 'main' },
          lanes: { main: 0, detached: 1 }
        };
      },
      steps: [
        {
          cmd: 'git switch --detach HEAD~1',
          text: 'HEAD теперь указывает прямо на коммит b2e7d19, а не на ветку. Это detached HEAD: можно смотреть и экспериментировать.',
          apply: function (m) { m.head = { type: 'detached', commit: 'b2e7d19' }; }
        },
        {
          cmd: 'git commit -m "experiment"',
          text: 'Новый коммит создан, но на него не указывает ни одна ветка. Пока HEAD здесь, он жив.',
          apply: function (m) {
            var exp = m.newCommit('detached', 'experiment', ['b2e7d19']);
            m.head = { type: 'detached', commit: exp.id };
          }
        },
        {
          cmd: 'git switch main',
          text: 'Возврат на main. Коммит experiment стал недостижимым: его спасёт только новая ветка или reflog.',
          apply: function (m) { m.head = { type: 'branch', name: 'main' }; }
        }
      ]
    }
  ];
})();
