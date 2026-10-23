/* Git — practice tasks */
window.GIT_TASKS = [
  /* ================= LEVEL 1 ================= */
  {
    id: 'git-01', level: 1, type: 'input', xp: 10,
    title: 'Представься Git',
    prompt: 'Настрой имя автора коммитов <code>Nikita</code> глобально для всех репозиториев.',
    pattern: /^git\s+config\s+--global\s+user\.name\s+["']?.+["']?$/i,
    hint: ['Ключ настройки — user.name, область — --global.'],
    solution: 'git config --global user.name "Nikita"',
    explain: 'Имя и email попадают в каждый коммит. <b>--global</b> пишет в ~/.gitconfig, без него — в .git/config текущего репозитория.'
  },
  {
    id: 'git-02', level: 1, type: 'input', xp: 10,
    title: 'Новый репозиторий',
    prompt: 'Инициализируй Git-репозиторий в текущей папке.',
    answers: ['git init'],
    hint: ['Команда из двух слов, создаёт скрытую папку .git.'],
    solution: 'git init',
    explain: '<b>git init</b> создаёт .git и делает текущую папку рабочим каталогом. Вся история живёт в .git — удалишь её, потеряешь историю.'
  },
  {
    id: 'git-03', level: 1, type: 'input', xp: 10,
    title: 'Короткий статус',
    prompt: 'Покажи состояние репозитория в <b>кратком</b> формате.',
    answers: ['git status -s', 'git status --short', 'git status --short --branch', 'git status -sb'],
    hint: ['Флаг сокращения — -s или --short.'],
    solution: 'git status -s',
    explain: 'Краткий статус: <b>??</b> — untracked, <b>M</b> — изменён, <b>A</b> — добавлен, <b>D</b> — удалён. Первая колонка — индекс, вторая — рабочая папка.'
  },
  {
    id: 'git-04', level: 1, type: 'input', xp: 10,
    title: 'Первый коммит одной строкой',
    prompt: 'Добавь <b>все</b> изменения в индекс и создай коммит с сообщением <code>initial commit</code> — одной командной строкой.',
    pattern: /^git\s+add\s+(\.|-A|--all)\s*(&&|;)\s*git\s+commit\s+-m\s+["']?.+["']?$/i,
    hint: ['Соедини две команды через &&.', 'Сообщение передаётся ключом -m.'],
    solution: 'git add . && git commit -m "initial commit"',
    explain: '<b>&amp;&amp;</b> выполнит commit только если add успешен. Это стандартный однострочник; в PowerShell 5 && не работает — там нужен <b>;</b>.'
  },
  {
    id: 'git-05', level: 1, type: 'input', xp: 10,
    title: 'Быстрый коммит tracked-файлов',
    prompt: 'Закоммить изменения уже отслеживаемых файлов с сообщением <code>fix: typo</code>, не вызывая отдельно git add.',
    pattern: /^git\s+commit\s+(-am|-a\s+-m)\s+["']?.+["']?$/i,
    hint: ['У commit есть ключ, который сам добавляет изменения tracked-файлов.'],
    solution: 'git commit -am "fix: typo"',
    explain: '<b>-a</b> не добавляет новые файлы (untracked) — только изменения уже известных Git файлов. Для новых всё равно нужен <b>git add</b>.'
  },
  {
    id: 'git-06', level: 1, type: 'input', xp: 10,
    title: 'Красивый граф истории',
    prompt: 'Покажи историю <b>всех веток</b> одной строкой на коммит, с ASCII-графом и подписями веток.',
    answers: [
      'git log --oneline --graph --all --decorate',
      'git log --oneline --graph --all',
      'git log --graph --oneline --all --decorate',
      'git log --all --oneline --graph',
      'git log --oneline --graph --all --decorate --branches'
    ],
    hint: ['Нужны четыре ключа: oneline, graph, all, decorate.'],
    solution: 'git log --oneline --graph --all --decorate',
    explain: '<b>--all</b> добавляет ветки и теги, <b>--graph</b> рисует связи, <b>--decorate</b> подписывает указатели. Это лучший способ понять, что происходит в репозитории.'
  },
  {
    id: 'git-07', level: 1, type: 'input', xp: 10,
    title: 'Ветка и переключение',
    prompt: 'Создай ветку <code>feature</code> и сразу переключись на неё (современный синтаксис через switch).',
    answers: ['git switch -c feature', 'git switch --create feature', 'git checkout -b feature'],
    hint: ['У switch есть ключ create.'],
    solution: 'git switch -c feature',
    explain: '<b>switch -c</b> создаёт ветку от текущего коммита и переносит HEAD. Старый аналог — <b>checkout -b</b>.'
  },
  {
    id: 'git-08', level: 1, type: 'input', xp: 10,
    title: 'Назад на main',
    prompt: 'Переключись обратно на ветку <code>main</code>.',
    answers: ['git switch main', 'git checkout main'],
    hint: ['switch + имя ветки.'],
    solution: 'git switch main',
    explain: 'Переключение меняет файлы в рабочей папке на состояние ветки. Незакоммиченные изменения могут помешать — Git предупредит.'
  },
  {
    id: 'git-09', level: 1, type: 'input', xp: 10,
    title: 'Удалить слитую ветку',
    prompt: 'Удали локальную ветку <code>feature</code>, которая уже слита в текущую.',
    answers: ['git branch -d feature', 'git branch --delete feature'],
    hint: ['Маленькая d — безопасное удаление.'],
    solution: 'git branch -d feature',
    explain: '<b>-d</b> удалит только слитую ветку. Если в ней есть уникальные коммиты, Git откажется — тогда либо сначала merge, либо осознанный <b>-D</b>.'
  },

  /* ================= LEVEL 2 ================= */
  {
    id: 'git-10', level: 2, type: 'input', xp: 15,
    title: 'Исправить последний коммит',
    prompt: 'Измени сообщение последнего коммита на <code>feat: login</code>, не создавая новый коммит.',
    pattern: /^git\s+commit\s+--amend\s+(-m\s+["']?.+["']?|--message\s+["']?.+["']?)$/i,
    hint: ['amend переписывает последний коммит.', 'Сообщение задаётся через -m.'],
    solution: 'git commit --amend -m "feat: login"',
    explain: '<b>--amend</b> создаёт новый коммит на месте последнего. Хеш меняется. Если старый уже запушен в общую ветку — это переписывание общей истории.'
  },
  {
    id: 'git-11', level: 2, type: 'input', xp: 15, seminar: true,
    title: 'Слияние без fast-forward',
    prompt: 'Находясь на <code>main</code>, влей ветку <code>feature</code> так, чтобы <b>всегда</b> создавался коммит слияния.',
    answers: ['git merge --no-ff feature', 'git merge feature --no-ff', 'git merge --no-ff feature -m "merge feature"'],
    hint: ['Ключ буквально называется no-ff.'],
    solution: 'git merge --no-ff feature',
    explain: '<b>--no-ff</b> запрещает fast-forward: даже если main не двигался, появится merge-коммит с двумя родителями. Так в истории видно, что была ветка.'
  },
  {
    id: 'git-12', level: 2, type: 'input', xp: 15, seminar: true,
    title: 'Слияние без коммита',
    prompt: 'Влей <code>feature</code> в <code>main</code>, но <b>не создавай коммит слияния</b> — изменения должны оказаться в индексе, чтобы их можно было поправить.',
    answers: ['git merge --no-commit feature', 'git merge feature --no-commit', 'git merge --no-ff --no-commit feature'],
    hint: ['Ключ no-commit.'],
    solution: 'git merge --no-commit feature',
    explain: 'Git выполнит слияние и остановится перед коммитом. Можно проверить <b>git diff --staged</b>, поправить файлы, сделать <b>git add</b> и закоммитить вручную. Отменить — <b>git merge --abort</b>.'
  },
  {
    id: 'git-13', level: 2, type: 'input', xp: 15, seminar: true,
    title: 'Слияние с правками до коммита',
    prompt: 'Расставь шаги: слить feature без коммита, внести правки, добавить их и создать коммит слияния. (Задание с семинара.)',
    type: 'order',
    steps: ['git merge --no-commit feature', '# внести изменения в файлы', 'git add .', 'git commit -m "merge: feature with fixes"'],
    hint: ['Сначала merge --no-commit, правки — уже после слияния.'],
    solution: 'git merge --no-commit feature\n# правки\ngit add .\ngit commit -m "merge: feature with fixes"',
    explain: 'Именно для этого нужен <b>--no-commit</b>: слияние уже применено, но точка коммита ещё не поставлена. Можно дописать недостающее и только потом зафиксировать.'
  },
  {
    id: 'git-14', level: 2, type: 'input', xp: 15,
    title: 'Мягкий откат',
    prompt: 'Отмени последний коммит, но оставь все его изменения <b>в индексе</b> (готовыми к новому коммиту).',
    answers: ['git reset --soft head~1', 'git reset --soft head^', 'git reset --soft @~1'],
    hint: ['soft — самый осторожный режим reset.'],
    solution: 'git reset --soft HEAD~1',
    explain: 'После <b>--soft</b> ветка сдвинулась на коммит назад, а файлы числятся как staged. Удобно, чтобы переписать сообщение или объединить коммиты.'
  },
  {
    id: 'git-15', level: 2, type: 'input', xp: 15,
    title: 'Жёсткий откат',
    prompt: 'Полностью верни ветку и рабочую папку к состоянию <b>на один коммит назад</b>. Незакоммиченные правки должны исчезнуть.',
    answers: ['git reset --hard head~1', 'git reset --hard head^', 'git reset --hard @~1'],
    hint: ['hard стирает и индекс, и рабочую папку.'],
    solution: 'git reset --hard HEAD~1',
    explain: '<b>--hard</b> — единственный режим, который реально удаляет незакоммиченную работу. Если коммит был, его можно найти в <b>git reflog</b>.'
  },
  {
    id: 'git-16', level: 2, type: 'input', xp: 15,
    title: 'Безопасная отмена публичного коммита',
    prompt: 'Отмени последний коммит <b>новым</b> коммитом, не переписывая историю.',
    answers: ['git revert head', 'git revert head --no-edit', 'git revert head~0'],
    hint: ['Команда создаёт «противоположный» коммит.'],
    solution: 'git revert HEAD',
    explain: '<b>revert</b> вычисляет diff коммита и применяет обратный, создавая новый коммит. История остаётся неизменной — безопасно для общих веток.'
  },
  {
    id: 'git-17', level: 2, type: 'input', xp: 15,
    title: 'Перенести один коммит',
    prompt: 'Скопируй коммит <code>a1b2c3d</code> в текущую ветку и добавь в сообщение источник (ключ <code>-x</code>).',
    pattern: /^git\s+cherry-pick\s+(-x\s+[0-9a-f]{4,40}|[0-9a-f]{4,40}\s+-x)$/i,
    hint: ['Команда называется cherry-pick, флаг -x.'],
    solution: 'git cherry-pick -x a1b2c3d',
    explain: 'cherry-pick создаёт новый коммит с тем же diff. <b>-x</b> дописывает «(cherry picked from commit a1b2c3d)» — след для аудита.'
  },
  {
    id: 'git-18', level: 2, type: 'input', xp: 15,
    title: 'Перебазировать ветку',
    prompt: 'Находясь на <code>feature</code>, перенеси её коммиты на актуальную ветку <code>main</code>.',
    answers: ['git rebase main', 'git rebase main feature'],
    hint: ['rebase принимает ветку-базу.'],
    solution: 'git rebase main',
    explain: 'Rebase найдёт общего предка, отложит коммиты feature и применит их заново поверх main. История станет линейной, но хеши изменятся.'
  },
  {
    id: 'git-19', level: 2, type: 'input', xp: 15,
    title: 'Интерактивная история',
    prompt: 'Открой интерактивный rebase для <b>последних трёх</b> коммитов.',
    answers: ['git rebase -i head~3', 'git rebase --interactive head~3', 'git rebase -i head~3 --autosquash'],
    hint: ['Ключ -i и диапазон HEAD~3.'],
    solution: 'git rebase -i HEAD~3',
    explain: 'Откроется редактор со списком коммитов. Можно менять порядок, <b>reword</b> — сообщение, <b>squash</b> — объединить, <b>fixup</b> — объединить без сообщения, <b>drop</b> — удалить.'
  },
  {
    id: 'git-20', level: 2, type: 'input', xp: 15,
    title: 'Спрятать работу',
    prompt: 'Спрячь все незакоммиченные изменения, <b>включая новые файлы</b>, с сообщением <code>wip login</code>.',
    pattern: /^git\s+stash\s+(push\s+)?(-u|--include-untracked)\s+(-m\s+["']?.+["']?|--message\s+["']?.+["']?)$|^git\s+stash\s+(-m\s+["']?.+["']?|--message\s+["']?.+["']?)\s+(-u|--include-untracked)$/i,
    hint: ['stash push, флаг -u, сообщение -m.'],
    solution: 'git stash push -u -m "wip login"',
    explain: '<b>-u</b> добавляет untracked файлы, иначе они останутся в рабочей папке. Вернуть: <b>git stash pop</b>, посмотреть: <b>git stash list</b>.'
  },
  {
    id: 'git-21', level: 2, type: 'order', xp: 15, seminar: true,
    title: 'Удалить мусор безопасно',
    prompt: 'Сначала покажи, что будет удалено, включая игнорируемые файлы и папки, затем удали. (Задание из конспекта 06.10.)',
    steps: ['git clean -ndx', 'git clean -fdx'],
    hint: ['Сначала dry-run с -n, потом force с -f. Ключи d и x сохраняются.'],
    solution: 'git clean -ndx\ngit clean -fdx',
    explain: '<b>-n</b> — dry run. <b>-d</b> — папки, <b>-x</b> — игнорируемые файлы. Без <b>-x</b> .env и node_modules останутся.'
  },
  {
    id: 'git-22', level: 2, type: 'input', xp: 15,
    title: 'Забыть файл',
    prompt: 'Убери <code>.env</code> из-под контроля Git, но <b>оставь файл на диске</b>.',
    answers: ['git rm --cached .env', 'git rm --cached ".env"', 'git rm --cached -- .env'],
    hint: ['rm с ключом cached.'],
    solution: 'git rm --cached .env',
    explain: 'Файл станет untracked, а на диске останется. Не забудь добавить его в <b>.gitignore</b> и закоммитить удаление из индекса.'
  },
  {
    id: 'git-23', level: 2, type: 'input', xp: 15,
    title: 'Первый push ветки',
    prompt: 'Отправь ветку <code>feature</code> на <code>origin</code> и свяжи её с удалённой (upstream).',
    answers: ['git push -u origin feature', 'git push --set-upstream origin feature'],
    hint: ['Ключ -u = --set-upstream.'],
    solution: 'git push -u origin feature',
    explain: 'После <b>-u</b> достаточно <b>git push</b> и <b>git pull</b> без аргументов. Связь хранится в конфиге ветки.'
  },
  {
    id: 'git-24', level: 2, type: 'input', xp: 15,
    title: 'Обновить без слияния',
    prompt: 'Скачай все изменения со всех удалённых репозиториев и удали ссылки на исчезнувшие ветки, <b>не меняя рабочую папку</b>.',
    answers: ['git fetch --all --prune', 'git fetch --all -p', 'git fetch -p --all', 'git fetch --prune --all'],
    hint: ['fetch не сливает. all — все remote, prune — чистка.'],
    solution: 'git fetch --all --prune',
    explain: 'fetch обновляет origin/*, не трогая локальные ветки. <b>--prune</b> убирает ссылки на ветки, удалённые на сервере.'
  },
  {
    id: 'git-25', level: 2, type: 'input', xp: 15,
    title: 'Релизный тег',
    prompt: 'Поставь аннотированный тег <code>v1.0</code> с сообщением <code>Release 1.0</code> на текущий коммит.',
    pattern: /^git\s+tag\s+-a\s+v1\.0\s+(-m\s+["']?.+["']?|--message\s+["']?.+["']?)$|^git\s+tag\s+(-m\s+["']?.+["']?)\s+-a\s+v1\.0$/i,
    hint: ['Аннотированный тег: tag -a имя -m сообщение.'],
    solution: 'git tag -a v1.0 -m "Release 1.0"',
    explain: 'Аннотированный тег — отдельный объект с автором и датой, в отличие от лёгкого. Отправляется отдельно: <b>git push origin v1.0</b> или <b>git push --tags</b>.'
  },

  /* ================= LEVEL 3 ================= */
  {
    id: 'git-26', level: 3, type: 'choice', multi: true, xp: 25, seminar: true,
    title: 'Четыре способа вернуться на первый коммит',
    prompt: 'В ветке два коммита: первый <code>A</code>, второй <code>B</code> (HEAD на B). Какие команды вернут <b>рабочую папку</b> к состоянию A? Выбери все корректные способы.',
    options: [
      'git reset --hard HEAD~1',
      'git checkout HEAD~1',
      'git revert HEAD',
      'git switch --detach HEAD~1',
      'git reset --soft HEAD~1',
      'git clean -fd'
    ],
    correct: [0, 1, 3],
    hint: ['reset --soft не трогает файлы. revert создаёт новый коммит, но состояние файлов — как в A.', 'В вопросе про состояние рабочей папки, а не про историю.'],
    solution: 'git reset --hard HEAD~1\ngit checkout HEAD~1\ngit switch --detach HEAD~1\ngit revert HEAD',
    explain: '<b>reset --hard</b> стирает B и его правки, ветка остаётся на A. <b>checkout/switch --detach HEAD~1</b> оставляет историю, но переключает рабочую папку на A (detached HEAD). <b>revert HEAD</b> создаёт коммит C, отменяющий B: файлы как в A, история из трёх коммитов. Формально способов четыре, и revert тоже возвращает содержимое — но добавляет коммит. <b>reset --soft</b> оставляет правки B в индексе, а clean вообще не про коммиты.'
  },
  {
    id: 'git-27', level: 3, type: 'order', xp: 20,
    title: 'Разреши конфликт',
    prompt: 'Расставь шаги разрешения конфликта после <code>git merge feature</code>.',
    steps: ['git status', '# открыть конфликтный файл и убрать маркеры <<<<<<< ======= >>>>>>>', 'git add resolved.txt', 'git commit'],
    hint: ['Сначала понять, какие файлы конфликтуют, потом править, потом add, потом commit.'],
    solution: 'git status\n# правим файл\ngit add resolved.txt\ngit commit',
    explain: 'Merge завершается коммитом. Для rebase вместо commit — <b>git rebase --continue</b>. Передумать: <b>git merge --abort</b> / <b>git rebase --abort</b>.'
  },
  {
    id: 'git-28', level: 3, type: 'choice', xp: 20,
    title: 'Спасти после reset --hard',
    prompt: 'Ты сделал <code>git reset --hard HEAD~1</code> и потерял нужный коммит. Что делать?',
    options: [
      'git reflog → найти хеш → git reset --hard <хеш>',
      'git log → найти коммит в обычной истории',
      'git clean -fdx → восстановить',
      'git clone заново — иначе никак'
    ],
    correct: [0],
    hint: ['Обычный log не покажет коммит, на который больше не ссылается ветка.'],
    solution: 'git reflog\ngit reset --hard HEAD@{1}',
    explain: 'Reflog хранит все перемещения HEAD локально (обычно 90 дней). Потерянный коммит там будет. Если он был без ветки — можно создать ветку: <b>git branch rescue &lt;хеш&gt;</b>.'
  },
  {
    id: 'git-29', level: 3, type: 'choice', multi: true, xp: 20,
    title: 'Что попадёт в .gitignore',
    prompt: 'Какие строки корректно исключат <b>все</b> файлы <code>.env</code> и папку <code>node_modules</code>? Выбери все подходящие.',
    options: [
      '.env',
      'node_modules/',
      '**/node_modules/',
      '!node_modules/',
      '*.env'
    ],
    correct: [0, 1, 2],
    hint: ['! — это отрицание, а *.env не совпадёт с файлом .env (точка в начале).'],
    solution: '.env\nnode_modules/\n**/node_modules/',
    explain: 'Строка <b>.env</b> исключает файл в любом каталоге. <b>node_modules/</b> — папку в любом месте, <b>**/node_modules/</b> — то же явно. <b>!node_modules/</b> наоборот возвращает папку, а <b>*.env</b> требует хотя бы один символ перед .env.'
  },
  {
    id: 'git-30', level: 3, type: 'choice', xp: 20,
    title: 'Merge или rebase?',
    prompt: 'Ты работаешь один в ветке <code>feature</code>, которая ещё никому не запушена. Хочешь линейную историю. Что выбрать?',
    options: [
      'git switch feature && git rebase main',
      'git switch main && git merge feature',
      'git push --force origin main',
      'git reset --hard main'
    ],
    correct: [0],
    hint: ['Линейная история без merge-коммитов — это rebase.'],
    solution: 'git switch feature\ngit rebase main',
    explain: 'Свои локальные коммиты ребейзить безопасно. После rebase хеши меняются, поэтому если ветка уже у других — нужен force-with-lease и согласование.'
  },
  {
    id: 'git-31', level: 3, type: 'input', xp: 20,
    title: 'Безопасный force push',
    prompt: 'После rebase нужно обновить <b>свою</b> ветку <code>feature</code> на сервере, не затирая чужие изменения. Напиши команду.',
    answers: ['git push --force-with-lease origin feature', 'git push --force-with-lease', 'git push -f --force-with-lease origin feature'],
    hint: ['Не --force, а более безопасный вариант.'],
    solution: 'git push --force-with-lease origin feature',
    explain: '<b>--force-with-lease</b> отправит force только если удалённая ветка не изменилась с момента твоего последнего fetch. Если кто-то успел запушить — команда откажется.'
  },
  {
    id: 'git-32', level: 3, type: 'input',
    xp: 20,
    title: 'Спасти detached HEAD',
    prompt: 'Ты переключился на старый коммит и сделал там новый коммит. Как сохранить его в новую ветку <code>experiment</code>?',
    answers: ['git switch -c experiment', 'git checkout -b experiment', 'git switch --create experiment', 'git branch experiment'],
    hint: ['Создание ветки на текущем коммите не двигает HEAD, но фиксирует его.'],
    solution: 'git switch -c experiment',
    explain: 'Ветка создаётся на текущем коммите и HEAD перестаёт быть detached. Если сделать <b>git branch experiment</b>, коммит тоже сохранится, но HEAD останется отцепленным.'
  },
  {
    id: 'git-33', level: 3, type: 'match', xp: 20,
    title: 'Режимы reset',
    prompt: 'Сопоставь режим reset с тем, что происходит с индексом и рабочей папкой.',
    pairs: [
      ['--soft', 'двигает ветку, изменения остаются в индексе'],
      ['--mixed', 'двигает ветку и чистит индекс, файлы не трогает'],
      ['--hard', 'двигает ветку и стирает изменения везде'],
      ['reset HEAD file', 'убирает файл из индекса']
    ],
    hint: ['soft — самый мягкий, hard — самый радикальный.'],
    solution: '--soft → ветка; --mixed → ветка + индекс; --hard → всё; reset HEAD file → файл из индекса',
    explain: 'Запомни лесенку: <b>soft</b> трогает только указатель, <b>mixed</b> — указатель и индекс, <b>hard</b> — ещё и рабочую папку.'
  },
  {
    id: 'git-34', level: 3, type: 'choice',
    xp: 20,
    title: 'Squash vs no-ff',
    prompt: 'В ветке feature 5 коммитов. Нужно, чтобы в main появился <b>ровно один</b> коммит с итоговыми изменениями. Что использовать?',
    options: [
      'git merge --squash feature, затем git commit',
      'git merge --no-ff feature',
      'git merge feature',
      'git rebase main'
    ],
    correct: [0],
    hint: ['--squash складывает изменения в индекс, но не коммитит.'],
    solution: 'git merge --squash feature\ngit commit -m "feature: squashed"',
    explain: '<b>--squash</b> применяет изменения, но не создаёт merge-коммит и не связывает коммиты feature с main. Нужен ручной commit. История main получает один коммит.'
  },
  {
    id: 'git-35', level: 3, type: 'choice',
    xp: 20,
    title: 'Порядок после rebase',
    prompt: 'Rebase остановился на конфликте. Ты исправил файл. Какая команда продолжит операцию?',
    options: [
      'git add . && git rebase --continue',
      'git commit && git rebase --continue',
      'git merge --continue',
      'git rebase --skip'
    ],
    correct: [0],
    hint: ['Сначала отметить конфликт решённым через add, потом продолжить.'],
    solution: 'git add .\ngit rebase --continue',
    explain: 'Rebase сам создаёт коммиты, поэтому commit не нужен — только <b>add</b> и <b>--continue</b>. <b>--skip</b> выбросит текущий коммит, <b>--abort</b> вернёт всё назад.'
  }
];
