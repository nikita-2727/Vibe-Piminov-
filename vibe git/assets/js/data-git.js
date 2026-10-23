/* Git — theory data */
window.GIT_DATA = {
  title: 'Git',
  tagline: 'Ветки, коммиты и отмена действий без паники.',
  concepts: [
    {
      tag: '01',
      title: 'Три области, через которые идёт изменение',
      text: 'Рабочая папка — то, что ты видишь в редакторе. Индекс (staging) — «корзина» следующего коммита. Репозиторий — сохранённые снимки. <b>git add</b> переносит из рабочей папки в индекс, <b>git commit</b> — из индекса в историю.',
      flow: ['Working dir', 'git add', 'Index', 'git commit', 'Repository']
    },
    {
      tag: '02',
      title: 'Коммит — это снимок, а не diff',
      text: 'Коммит хранит полное состояние проекта, ссылку на родителя (или двух при слиянии), автора, дату и сообщение. Его имя — SHA-1/SHA-256 хеш, поэтому история неизменяема: изменил прошлое — получил новые хеши. Ветка — просто подвижная наклейка на коммит.',
      code: 'git cat-file -p HEAD'
    },
    {
      tag: '03',
      title: 'HEAD и как читать ссылки',
      text: '<b>HEAD</b> — «где я сейчас»: обычно указывает на ветку, а ветка — на коммит. <b>main~1</b> — на одного родителя назад, <b>main~3</b> — на три, <b>main^2</b> — второй родитель merge-коммита. <b>@</b> — сокращение для HEAD.',
      code: 'git log --oneline HEAD~3..HEAD\ngit show HEAD^\ngit reset --soft @~1'
    },
    {
      tag: '04',
      title: 'Fast-forward или merge-коммит',
      text: 'Если main не двигался с момента создания ветки, Git может просто передвинуть указатель — это <b>fast-forward</b>, нового коммита нет. <b>--no-ff</b> заставляет создать коммит слияния с двумя родителями, чтобы в истории была видна ветка.',
      code: 'git merge feature          # ff, если возможно\ngit merge --no-ff feature  # всегда merge-коммит'
    },
    {
      tag: '05',
      title: 'Три режима reset',
      text: '<b>--soft</b> двигает только ветку: изменения остаются в индексе. <b>--mixed</b> (по умолчанию) двигает ветку и чистит индекс: изменения остаются в рабочей папке. <b>--hard</b> двигает ветку и стирает изменения из индекса и рабочей папки. Опасно, но предсказуемо.',
      code: 'git reset --soft HEAD~1   # переделать коммит\ngit reset HEAD~1          # разобрать на файлы\ngit reset --hard HEAD~1   # выбросить всё'
    },
    {
      tag: '06',
      title: 'Конфликт — это не поломка',
      text: 'Конфликт возникает, когда две ветки изменили одни и те же строки. Git вставляет маркеры <b>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</b>, <b>=======</b>, <b>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</b> и ждёт решения. Оставь нужный текст, удали маркеры, сделай <b>git add</b> и заверши merge/rebase.',
      code: 'git status\ngit add resolved.txt\ngit commit            # для merge\ngit rebase --continue # для rebase'
    },
    {
      tag: '07',
      title: 'Merge или rebase?',
      text: 'Merge сохраняет реальную историю и создаёт коммит слияния. Rebase переписывает коммиты поверх другой ветки — история становится линейной, но хеши меняются. Правило: <b>ребейзить свои локальные коммиты можно, чужие опубликованные — нельзя</b>.',
      code: 'git switch feature\ngit rebase main'
    },
    {
      tag: '08',
      title: 'Detached HEAD',
      text: 'Если переключиться на коммит, а не на ветку, HEAD отцепится. Новые коммиты будут никому не видны и потеряются при переключении. Если нужно сохранить — создай ветку: <b>git switch -c fix</b>.',
      code: 'git checkout a1b2c3d\ngit switch -c experiment'
    }
  ],

  groups: [
    {
      id: 'start',
      title: 'Старт и настройка',
      desc: 'Первый запуск, клонирование, статус',
      items: [
        {
          id: 'config',
          name: 'git config',
          syntax: 'git config --global user.name "Имя"\ngit config --global user.email "mail"\ngit config --list',
          desc: 'Настройка Git. Имя и email попадают в каждый коммит, поэтому это первое, что делают после установки.',
          examples: [
            { code: 'git config --global user.name "Nikita"', note: 'Имя автора' },
            { code: 'git config --global user.email "me@mail.com"', note: 'Email' },
            { code: 'git config --global init.defaultBranch main', note: 'Ветка по умолчанию' },
            { code: 'git config --global core.editor "code --wait"', note: 'Редактор для сообщений' },
            { code: 'git config --list --show-origin', note: 'Все настройки и откуда они' }
          ],
          tip: '<b>--global</b> — для пользователя, без него — только для текущего репозитория, <b>--system</b> — для всей машины.'
        },
        {
          id: 'init',
          name: 'git init',
          syntax: 'git init [папка]',
          desc: 'Создаёт новый репозиторий: появляется скрытая папка .git со всей историей.',
          examples: [
            { code: 'git init', note: 'Репозиторий в текущей папке' },
            { code: 'git init my-project', note: 'Создать папку и репозиторий' },
            { code: 'git init --bare server.git', note: 'Голый репозиторий для сервера' }
          ],
          tip: '<b>.git</b> — и есть репозиторий. Удалил .git — удалил всю историю, файлы останутся.'
        },
        {
          id: 'clone',
          name: 'git clone',
          syntax: 'git clone [url] [папка]',
          desc: 'Копирует удалённый репозиторий со всей историей и настраивает origin.',
          examples: [
            { code: 'git clone https://github.com/user/repo.git', note: 'Клонировать' },
            { code: 'git clone repo.git my-folder', note: 'В свою папку' },
            { code: 'git clone --depth 1 url', note: 'Только последний коммит, быстрее' },
            { code: 'git clone -b dev url', note: 'Сразу нужная ветка' }
          ],
          tip: '<b>--depth 1</b> экономит время и место, но история будет неполной — reflog и старые коммиты недоступны.'
        },
        {
          id: 'status',
          name: 'git status',
          syntax: 'git status\ngit status -s',
          desc: 'Показывает ветку, staged/unstaged/untracked файлы и подсказки, что делать дальше. Самая частая команда.',
          examples: [
            { code: 'git status', note: 'Подробно' },
            { code: 'git status -s', note: 'Коротко: M, A, ??, D' },
            { code: 'git status --short --branch', note: 'Плюс ветка и ahead/behind' }
          ],
          tip: 'Читай статус сверху вниз: ветка → что в индексе → что изменено → что не отслеживается. Git сам пишет следующую команду.'
        },
        {
          id: 'help',
          name: 'git help',
          syntax: 'git help [команда]\ngit [команда] --help',
          desc: 'Локальная документация. Работает без интернета и всегда соответствует твоей версии Git.',
          examples: [
            { code: 'git help commit', note: 'Полная справка' },
            { code: 'git commit -h', note: 'Краткая справка' },
            { code: 'git help -a', note: 'Список всех команд' }
          ],
          tip: '<b>git help -g</b> покажет гайды, например <b>git help revisions</b> — про HEAD~, ^ и диапазоны.'
        }
      ]
    },
    {
      id: 'commit',
      title: 'Изменения и коммиты',
      desc: 'add, commit, amend, ignore',
      items: [
        {
          id: 'add',
          name: 'git add',
          syntax: 'git add [файл|папка|.]\ngit add -p',
          desc: 'Добавляет изменения в индекс — то, что попадёт в следующий коммит.',
          examples: [
            { code: 'git add .', note: 'Всё из текущей папки' },
            { code: 'git add src/app.js', note: 'Один файл' },
            { code: 'git add -A', note: 'Все изменения во всём репозитории' },
            { code: 'git add -p', note: 'Выбрать куски изменений интерактивно' },
            { code: 'git add -u', note: 'Только уже отслеживаемые файлы' }
          ],
          tip: '<b>git add -p</b> — суперсила: можно закоммитить половину файла и оставить эксперименты на потом.'
        },
        {
          id: 'commit',
          name: 'git commit',
          syntax: 'git commit -m "сообщение"\ngit commit -am "сообщение"',
          desc: 'Создаёт коммит из индекса. -a автоматически добавляет изменения отслеживаемых файлов.',
          examples: [
            { code: 'git commit -m "feat: add login"', note: 'Обычный коммит' },
            { code: 'git commit -am "fix: typo"', note: 'add + commit для tracked файлов' },
            { code: 'git commit', note: 'Откроет редактор для длинного сообщения' },
            { code: 'git commit -m "msg" --no-verify', note: 'Пропустить hooks' }
          ],
          tip: '<b>-a</b> не добавит новые (untracked) файлы — для них нужен <b>git add</b>. Сообщение — в императиве: «add», «fix», а не «added».'
        },
        {
          id: 'amend',
          name: 'git commit --amend',
          syntax: 'git commit --amend -m "новое сообщение"\ngit commit --amend --no-edit',
          desc: 'Переписывает последний коммит: добавляет забытые файлы или меняет сообщение. Создаёт новый хеш.',
          examples: [
            { code: 'git add forgotten.js\ngit commit --amend --no-edit', note: 'Добавить файл в последний коммит' },
            { code: 'git commit --amend -m "fix: correct message"', note: 'Исправить сообщение' },
            { code: 'git commit --amend --author="Name <mail>"', note: 'Исправить автора' }
          ],
          warn: 'Если коммит уже запушен в общую ветку, amend меняет историю у всех. Тогда лучше обычный коммит или <b>--force-with-lease</b> в своей ветке.'
        },
        {
          id: 'ignore',
          name: '.gitignore',
          syntax: 'node_modules/\n*.log\n!important.log\nbuild/',
          desc: 'Файл со списком того, что Git не должен отслеживать. Папки — со слэшем, отрицание — с !.',
          examples: [
            { code: 'node_modules/', note: 'Папка целиком' },
            { code: '*.log', note: 'Все логи' },
            { code: '!keep.log', note: 'Исключение из правила' },
            { code: '/dist', note: 'Только в корне' },
            { code: '**/temp', note: 'На любой глубине' }
          ],
          tip: '.gitignore не удаляет уже отслеживаемые файлы. Убрать из индекса: <b>git rm --cached file</b>.'
        },
        {
          id: 'rm-cached',
          name: 'git rm --cached',
          syntax: 'git rm --cached [файл]\ngit rm -r --cached [папка]',
          desc: 'Убирает файл из-под контроля Git, но оставляет его на диске. Классика после неудачного commit -A.',
          examples: [
            { code: 'git rm --cached .env', note: 'Файл остался, Git забыл' },
            { code: 'git rm -r --cached node_modules', note: 'Папка целиком' },
            { code: 'git rm --cached -r .', note: 'Забыть всё, затем добавить заново' }
          ],
          tip: 'После этого добавь файл в .gitignore и закоммить удаление из индекса.'
        },
        {
          id: 'restore',
          name: 'git restore',
          syntax: 'git restore [файл]\ngit restore --staged [файл]',
          desc: 'Современный способ отменить изменения: в рабочей папке или убрать из индекса.',
          examples: [
            { code: 'git restore app.js', note: 'Вернуть файл из HEAD' },
            { code: 'git restore --staged app.js', note: 'Убрать из индекса, изменения оставить' },
            { code: 'git restore --source=HEAD~2 file.txt', note: 'Вернуть версию из старого коммита' },
            { code: 'git restore .', note: 'Отменить все правки в папке' }
          ],
          warn: '<b>git restore file</b> без <b>--staged</b> стирает несохранённые правки. Отменить это нельзя.'
        }
      ]
    },
    {
      id: 'history',
      title: 'История',
      desc: 'log, diff, show, reflog, blame',
      items: [
        {
          id: 'log',
          name: 'git log',
          syntax: 'git log [--oneline] [--graph] [--all] [-n]',
          desc: 'История коммитов. По умолчанию — подробно, с автором и датой.',
          examples: [
            { code: 'git log --oneline', note: 'Хеш + сообщение' },
            { code: 'git log --oneline --graph --all --decorate', note: 'Граф всех веток' },
            { code: 'git log -n 5', note: 'Последние 5' },
            { code: 'git log --author="Nikita"', note: 'Коммиты автора' },
            { code: 'git log --since="2 weeks ago" --stat', note: 'За период со статистикой' },
            { code: 'git log main..feature', note: 'Что есть в feature, но нет в main' }
          ],
          tip: 'Псевдоним: <b>git config --global alias.lg "log --oneline --graph --all --decorate"</b>, дальше <b>git lg</b>.'
        },
        {
          id: 'diff',
          name: 'git diff',
          syntax: 'git diff\ngit diff --staged\ngit diff HEAD',
          desc: 'Показывает разницу между областями. Без аргументов — рабочая папка против индекса.',
          examples: [
            { code: 'git diff', note: 'Не добавлено в индекс' },
            { code: 'git diff --staged', note: 'Индекс против HEAD' },
            { code: 'git diff HEAD', note: 'Всё вместе против HEAD' },
            { code: 'git diff main feature', note: 'Разница веток' },
            { code: 'git diff --stat', note: 'Только сводка' }
          ],
          tip: 'Перед коммитом смотри <b>git diff --staged</b> — это ровно то, что уйдёт в историю.'
        },
        {
          id: 'show',
          name: 'git show',
          syntax: 'git show [ссылка]',
          desc: 'Показывает коммит: сообщение, автора и diff. Для тега — аннотацию, для файла — содержимое.',
          examples: [
            { code: 'git show HEAD', note: 'Последний коммит' },
            { code: 'git show a1b2c3d --stat', note: 'Статистика' },
            { code: 'git show HEAD:README.md', note: 'Файл на момент коммита' },
            { code: 'git show v1.0', note: 'Аннотированный тег' }
          ],
          tip: '<b>git show HEAD:path/file</b> — способ посмотреть старую версию файла, не переключаясь.'
        },
        {
          id: 'reflog',
          name: 'git reflog',
          syntax: 'git reflog [show] [--all]',
          desc: 'Журнал перемещений HEAD и веток. Локальная «машина времени»: даже после reset и rebase коммиты здесь.',
          examples: [
            { code: 'git reflog', note: 'Куда двигался HEAD' },
            { code: 'git reflog show main', note: 'История ветки main' },
            { code: 'git reset --hard HEAD@{2}', note: 'Вернуться на два шага назад' },
            { code: 'git branch rescue a1b2c3d', note: 'Спасти коммит в новую ветку' }
          ],
          tip: 'Reflog живёт около 90 дней и только локально. Это первое, что смотрят после «я случайно всё сбросил».'
        },
        {
          id: 'blame',
          name: 'git blame',
          syntax: 'git blame [файл]',
          desc: 'Показывает, какой коммит и автор добавил каждую строку. Полезно для расследований.',
          examples: [
            { code: 'git blame app.js', note: 'Автор каждой строки' },
            { code: 'git blame -L 10,30 app.js', note: 'Только строки 10–30' },
            { code: 'git blame -w app.js', note: 'Игнорировать пробелы' }
          ],
          tip: 'Blame — про контекст, а не про поиск виноватых. Смотри <b>git show</b> найденного коммита.'
        }
      ]
    },
    {
      id: 'branch',
      title: 'Ветки и слияния',
      desc: 'branch, switch, merge, конфликты',
      items: [
        {
          id: 'branch',
          name: 'git branch',
          syntax: 'git branch\ngit branch [имя]\ngit branch -d|-D [имя]',
          desc: 'Список, создание и удаление веток. Ветка — просто указатель на коммит.',
          examples: [
            { code: 'git branch', note: 'Локальные ветки, * — текущая' },
            { code: 'git branch feature', note: 'Создать на текущем коммите' },
            { code: 'git branch -a', note: 'Локальные и удалённые' },
            { code: 'git branch -d feature', note: 'Удалить слитую' },
            { code: 'git branch -D feature', note: 'Удалить принудительно' },
            { code: 'git branch -m old new', note: 'Переименовать' },
            { code: 'git branch -vv', note: 'С upstream и ahead/behind' }
          ],
          tip: '<b>-d</b> не даст удалить ветку с неслитыми коммитами. Если они точно не нужны — <b>-D</b>.'
        },
        {
          id: 'switch',
          name: 'git switch / checkout',
          syntax: 'git switch [ветка]\ngit switch -c [новая]\ngit checkout [ветка]',
          desc: 'Переключение веток. switch — новый, более безопасный синтаксис; checkout — старый и умеет ещё много всего.',
          examples: [
            { code: 'git switch main', note: 'Перейти на main' },
            { code: 'git switch -c feature', note: 'Создать и перейти' },
            { code: 'git switch -', note: 'Вернуться на предыдущую' },
            { code: 'git checkout main', note: 'Старый способ' },
            { code: 'git checkout -b feature', note: 'Старое создание ветки' },
            { code: 'git checkout -- file.txt', note: 'Отменить правки (старый способ)' }
          ],
          tip: 'Современный Git разделил обязанности: <b>switch</b> — ветки, <b>restore</b> — файлы. checkout остался для совместимости.'
        },
        {
          id: 'merge',
          name: 'git merge',
          syntax: 'git merge [ветка] [--no-ff] [--no-commit] [--squash]',
          desc: 'Вливает указанную ветку в текущую. Если возможно — fast-forward, иначе создаёт merge-коммит.',
          examples: [
            { code: 'git switch main\ngit merge feature', note: 'Обычное слияние' },
            { code: 'git merge --no-ff feature', note: 'Всегда merge-коммит' },
            { code: 'git merge --no-commit feature', note: 'Остановиться до коммита' },
            { code: 'git merge --squash feature', note: 'Сложить всё в один коммит' },
            { code: 'git merge --abort', note: 'Отменить слияние при конфликте' }
          ],
          demo: 'ff',
          tip: 'Перед merge посмотри <b>git log --oneline --graph --all</b>: сразу видно, будет ли ff.'
        },
        {
          id: 'merge-ff',
          name: 'Fast-forward и --no-ff',
          syntax: 'git merge feature\ngit merge --no-ff feature',
          desc: 'Fast-forward просто двигает указатель — истории ветки не видно. --no-ff создаёт коммит слияния с двумя родителями.',
          examples: [
            { code: 'git merge feature', note: 'FF, если main не менялся' },
            { code: 'git merge --no-ff feature -m "merge feature"', note: 'Явный merge-коммит' },
            { code: 'git log --graph --oneline', note: 'Увидеть разницу' }
          ],
          demo: 'noff',
          tip: 'В командах часто требуют <b>--no-ff</b>, чтобы по истории было видно, где была фича.'
        },
        {
          id: 'merge-nocommit',
          name: 'git merge --no-commit',
          syntax: 'git merge [ветка] --no-commit',
          desc: 'Выполняет слияние, но не создаёт коммит: можно проверить, поправить файлы и закоммитить вручную.',
          examples: [
            { code: 'git merge feature --no-commit', note: 'Изменения в индексе, коммита нет' },
            { code: 'git diff --staged', note: 'Проверить результат' },
            { code: 'git commit -m "merge: feature with fixes"', note: 'Свой коммит слияния' },
            { code: 'git merge --abort', note: 'Передумать' }
          ],
          demo: 'squash',
          tip: 'Именно этот приём просят на семинарах: «объединить ветки, перед созданием коммита слияния внести изменения».'
        },
        {
          id: 'conflicts',
          name: 'Конфликты и их разрешение',
          syntax: 'git status\ngit add [файл]\ngit commit\n# или\ngit merge --abort',
          desc: 'При конфликте Git останавливается и помечает файлы. Нужно выбрать итоговый текст, убрать маркеры и завершить операцию.',
          examples: [
            { code: 'git status', note: 'Какие файлы конфликтуют' },
            { code: 'git diff --name-only --diff-filter=U', note: 'Только конфликтующие' },
            { code: 'git add resolved.txt', note: 'Отметить решённым' },
            { code: 'git commit', note: 'Завершить merge' },
            { code: 'git merge --abort', note: 'Всё отменить' }
          ],
          tip: 'Хочешь взять одну сторону целиком: <b>git checkout --ours file</b> или <b>--theirs file</b>, затем <b>git add</b>.'
        },
        {
          id: 'detached',
          name: 'Detached HEAD',
          syntax: 'git checkout [хеш]\ngit switch --detach [хеш]',
          desc: 'Переключение не на ветку, а на коммит. HEAD отцепляется, новые коммиты теряются при уходе.',
          examples: [
            { code: 'git switch --detach a1b2c3d', note: 'Осмотреться в старом коммите' },
            { code: 'git switch -c fix-from-old', note: 'Сохранить эксперимент в ветку' },
            { code: 'git switch main', note: 'Вернуться, коммиты без ветки пропадут' }
          ],
          demo: 'detached',
          tip: 'Detached HEAD не ошибка. Ошибка — сделать там коммиты и уйти, не создав ветку.'
        }
      ]
    },
    {
      id: 'undo',
      title: 'Отмена действий',
      desc: 'reset, revert, clean, restore',
      items: [
        {
          id: 'reset-soft',
          name: 'git reset --soft',
          syntax: 'git reset --soft [коммит]',
          desc: 'Двигает ветку назад, но оставляет все изменения в индексе. Идеально, чтобы переделать последний коммит.',
          examples: [
            { code: 'git reset --soft HEAD~1', note: 'Отменить коммит, файлы остались staged' },
            { code: 'git commit -m "better message"', note: 'Сделать коммит заново' },
            { code: 'git reset --soft a1b2c3d', note: 'Схлопнуть несколько коммитов' }
          ],
          demo: 'reset',
          tip: 'После soft <b>git status</b> покажет «Changes to be committed» — ничего не потеряно.'
        },
        {
          id: 'reset-mixed',
          name: 'git reset --mixed (по умолчанию)',
          syntax: 'git reset [коммит]\ngit reset --mixed [коммит]',
          desc: 'Двигает ветку и очищает индекс, но оставляет изменения в рабочей папке. Разбирает коммит на неуложенные файлы.',
          examples: [
            { code: 'git reset HEAD~1', note: 'Коммит исчез, правки на месте' },
            { code: 'git reset HEAD file.txt', note: 'Убрать файл из индекса' },
            { code: 'git status', note: 'Проверить, что стало' }
          ],
          tip: '<b>git reset HEAD file</b> — старый способ сделать то же, что <b>git restore --staged file</b>.'
        },
        {
          id: 'reset-hard',
          name: 'git reset --hard',
          syntax: 'git reset --hard [коммит]',
          desc: 'Двигает ветку и стирает изменения в индексе и рабочей папке. Состояние ровно как в выбранном коммите.',
          examples: [
            { code: 'git reset --hard HEAD', note: 'Выбросить все незакоммиченные правки' },
            { code: 'git reset --hard HEAD~1', note: 'Удалить последний коммит и его изменения' },
            { code: 'git reset --hard origin/main', note: 'Синхронизироваться с удалённой веткой' }
          ],
          demo: 'reset',
          warn: 'Это единственная команда, которая реально удаляет работу. Спасение — только <b>git reflog</b>, и то если коммит был.'
        },
        {
          id: 'revert',
          name: 'git revert',
          syntax: 'git revert [коммит]',
          desc: 'Создаёт новый коммит, который отменяет изменения указанного. История сохраняется — безопасно для общих веток.',
          examples: [
            { code: 'git revert HEAD', note: 'Отменить последний' },
            { code: 'git revert a1b2c3d', note: 'Отменить конкретный' },
            { code: 'git revert --no-edit HEAD', note: 'Без редактора' },
            { code: 'git revert -m 1 [merge-hash]', note: 'Отменить merge-коммит' }
          ],
          demo: 'revert',
          tip: 'Правило: <b>reset</b> — для локальной истории, <b>revert</b> — для того, что уже у других.'
        },
        {
          id: 'clean',
          name: 'git clean',
          syntax: 'git clean -n\ngit clean -f\ngit clean -fd\ngit clean -fdx',
          desc: 'Удаляет неотслеживаемые файлы. Сначала всегда с -n — это dry run.',
          examples: [
            { code: 'git clean -n', note: 'Показать, что будет удалено' },
            { code: 'git clean -f', note: 'Удалить неотслеживаемые файлы' },
            { code: 'git clean -fd', note: 'Плюс неотслеживаемые папки' },
            { code: 'git clean -fdx', note: 'Плюс игнорируемые (node_modules и пр.)' }
          ],
          warn: '<b>-x</b> удаляет и то, что в .gitignore — например, <b>.env</b> и локальные базы. Всегда сначала <b>-n</b>.'
        }
      ]
    },
    {
      id: 'transplant',
      title: 'Перенос коммитов',
      desc: 'cherry-pick и rebase',
      items: [
        {
          id: 'cherry',
          name: 'git cherry-pick',
          syntax: 'git cherry-pick [хеш] [-x]\ngit cherry-pick [A..B]',
          desc: 'Копирует коммит (или несколько) в текущую ветку как новый коммит. Хеш будет другим.',
          examples: [
            { code: 'git switch main\ngit cherry-pick a1b2c3d', note: 'Один коммит' },
            { code: 'git cherry-pick a1b2c3d..f4e5d6c', note: 'Диапазон' },
            { code: 'git cherry-pick -x a1b2c3d', note: 'Добавить ссылку на источник' },
            { code: 'git cherry-pick --abort', note: 'Отменить при конфликте' }
          ],
          demo: 'cherry',
          tip: '<b>-x</b> дописывает в сообщение «(cherry picked from commit ...)» — удобно для аудита.'
        },
        {
          id: 'rebase',
          name: 'git rebase',
          syntax: 'git rebase [ветка]',
          desc: 'Переносит твои коммиты на актуальную базу. История становится линейной, хеши меняются.',
          examples: [
            { code: 'git switch feature\ngit rebase main', note: 'Перебазировать feature на main' },
            { code: 'git rebase --continue', note: 'После разрешения конфликта' },
            { code: 'git rebase --abort', note: 'Вернуть как было' },
            { code: 'git rebase --skip', note: 'Пропустить проблемный коммит' }
          ],
          demo: 'rebase',
          warn: 'Не ребейзь ветки, которые уже у других: их история разойдётся с твоей. Для своих локальных — можно и полезно.'
        },
        {
          id: 'rebase-i',
          name: 'git rebase -i',
          syntax: 'git rebase -i HEAD~3',
          desc: 'Интерактивное редактирование истории: переставлять, объединять, переименовывать и удалять коммиты.',
          examples: [
            { code: 'git rebase -i HEAD~3', note: 'Последние 3 коммита' },
            { code: 'git rebase -i --root', note: 'Вся история с первого коммита' }
          ],
          demo: 'rebase',
          tip: 'В открывшемся файле: <b>pick</b> — оставить, <b>reword</b> — сообщение, <b>edit</b> — остановиться, <b>squash</b> — объединить с предыдущим, <b>fixup</b> — объединить без сообщения, <b>drop</b> — удалить.'
        },
        {
          id: 'rebase-onto',
          name: 'git rebase --onto',
          syntax: 'git rebase --onto [новая база] [старая база] [ветка]',
          desc: 'Точечно переносит диапазон коммитов на другую базу. Мощно и опасно.',
          examples: [
            { code: 'git rebase --onto main old-base feature', note: 'Коммиты после old-base → на main' },
            { code: 'git rebase --onto main HEAD~3', note: 'Последние 3 коммита на main' }
          ],
          warn: 'Сначала потренируйся на копии ветки: <b>git branch backup</b>. Ошибка здесь переписывает историю.'
        }
      ]
    },
    {
      id: 'remote',
      title: 'Удалённые репозитории',
      desc: 'remote, fetch, pull, push, теги',
      items: [
        {
          id: 'remote',
          name: 'git remote',
          syntax: 'git remote -v\ngit remote add origin [url]',
          desc: 'Управление удалёнными репозиториями. origin — просто имя по умолчанию, не магия.',
          examples: [
            { code: 'git remote -v', note: 'Показать URL' },
            { code: 'git remote add origin https://github.com/u/r.git', note: 'Добавить' },
            { code: 'git remote set-url origin git@github.com:u/r.git', note: 'Сменить URL' },
            { code: 'git remote remove origin', note: 'Удалить' }
          ],
          tip: 'HTTPS просит пароль/токен, SSH — ключ. Для работы удобнее SSH, для быстрого клона — HTTPS.'
        },
        {
          id: 'fetch',
          name: 'git fetch',
          syntax: 'git fetch [remote] [--prune]',
          desc: 'Скачивает новые коммиты и ветки, но не меняет рабочую папку. Безопасное обновление.',
          examples: [
            { code: 'git fetch origin', note: 'Обновить данные об origin' },
            { code: 'git fetch --all --prune', note: 'Все remote + убрать исчезнувшие ветки' },
            { code: 'git log HEAD..origin/main --oneline', note: 'Что нового' }
          ],
          tip: '<b>fetch</b> + <b>git merge</b> = <b>pull</b>, но с контролем: сначала посмотрел, потом слил.'
        },
        {
          id: 'pull',
          name: 'git pull',
          syntax: 'git pull [remote] [ветка] [--rebase|--ff-only]',
          desc: 'fetch + merge (или rebase) одной командой. Может неожиданно создать merge-коммит.',
          examples: [
            { code: 'git pull', note: 'Из upstream текущей ветки' },
            { code: 'git pull --rebase', note: 'Линейная история' },
            { code: 'git pull --ff-only', note: 'Только fast-forward, иначе ошибка' }
          ],
          tip: 'Если не любишь случайные merge-коммиты: <b>git config --global pull.rebase true</b>.'
        },
        {
          id: 'push',
          name: 'git push',
          syntax: 'git push [remote] [ветка]\ngit push -u origin [ветка]',
          desc: 'Отправляет коммиты на сервер. -u связывает локальную ветку с удалённой.',
          examples: [
            { code: 'git push -u origin feature', note: 'Первый push новой ветки' },
            { code: 'git push', note: 'Дальше достаточно этого' },
            { code: 'git push --tags', note: 'Отправить теги' },
            { code: 'git push origin --delete old', note: 'Удалить ветку на сервере' }
          ],
          tip: 'Отклонённый push чаще всего значит, что на сервере есть новые коммиты: сделай <b>git pull --rebase</b>, потом push.'
        },
        {
          id: 'force',
          name: 'git push --force-with-lease',
          syntax: 'git push --force-with-lease',
          desc: 'Перезаписывает удалённую ветку, но только если её не менял кто-то другой. Безопасная альтернатива --force.',
          examples: [
            { code: 'git push --force-with-lease origin feature', note: 'После rebase/amend' },
            { code: 'git push --force', note: 'Опасно: перезапишет чужие изменения' }
          ],
          warn: '<b>--force</b> может стереть работу коллег. В общей ветке force недопустим; в личной — только <b>--force-with-lease</b>.'
        },
        {
          id: 'tag',
          name: 'git tag',
          syntax: 'git tag\ngit tag -a v1.0 -m "release"\ngit push --tags',
          desc: 'Метки на коммитах: релизы, версии. Аннотированные теги хранят автора, дату и сообщение.',
          examples: [
            { code: 'git tag', note: 'Список тегов' },
            { code: 'git tag -a v1.0 -m "Release 1.0"', note: 'Аннотированный тег' },
            { code: 'git tag v1.0 a1b2c3d', note: 'Тег на старый коммит' },
            { code: 'git push origin v1.0', note: 'Отправить один тег' },
            { code: 'git tag -d v1.0', note: 'Удалить локально' }
          ],
          tip: 'Тег не переезжает за веткой — он навсегда прибит к коммиту. Это точка релиза.'
        }
      ]
    },
    {
      id: 'extra',
      title: 'Продвинутое',
      desc: 'stash, rerere, bisect, worktree',
      items: [
        {
          id: 'stash',
          name: 'git stash',
          syntax: 'git stash push [-u] [-m "текст"]\ngit stash pop\ngit stash list',
          desc: 'Прячет незакоммиченные изменения во временное хранилище. Быстро переключиться, не коммитя мусор.',
          examples: [
            { code: 'git stash push -u -m "wip login"', note: 'Спрятать, включая новые файлы' },
            { code: 'git stash list', note: 'Что в stash' },
            { code: 'git stash pop', note: 'Вернуть и удалить из stash' },
            { code: 'git stash apply stash@{1}', note: 'Вернуть, оставив в stash' },
            { code: 'git stash drop stash@{0}', note: 'Удалить запись' }
          ],
          tip: '<b>stash</b> — не архив: записи легко потерять. Для долгой работы лучше ветка.'
        },
        {
          id: 'rerere',
          name: 'git rerere',
          syntax: 'git config --global rerere.enabled true\ngit rerere',
          desc: 'Reuse Recorded Resolution: запоминает, как ты решил конфликт, и повторяет это при rebase/merge.',
          examples: [
            { code: 'git config --global rerere.enabled true', note: 'Включить один раз' },
            { code: 'git rerere status', note: 'Что запомнено' },
            { code: 'git rerere diff', note: 'Показать решение' }
          ],
          tip: 'Особенно полезно при частых rebase одной и той же ветки: конфликты решаются один раз.'
        },
        {
          id: 'bisect',
          name: 'git bisect',
          syntax: 'git bisect start\ngit bisect bad\ngit bisect good [хеш]\ngit bisect reset',
          desc: 'Бинарный поиск коммита, который сломал код. Вместо ручного перебора — log2(N) проверок.',
          examples: [
            { code: 'git bisect start', note: 'Начать' },
            { code: 'git bisect bad', note: 'Текущий коммит плохой' },
            { code: 'git bisect good a1b2c3d', note: 'Этот ещё хороший' },
            { code: 'git bisect good  # или bad', note: 'Отвечать на каждом шаге' },
            { code: 'git bisect reset', note: 'Закончить и вернуться' }
          ],
          tip: 'Можно автоматизировать: <b>git bisect run npm test</b> — Git сам найдёт первый падающий коммит.'
        },
        {
          id: 'worktree',
          name: 'git worktree',
          syntax: 'git worktree add [папка] [ветка]\ngit worktree list\ngit worktree remove [папка]',
          desc: 'Несколько рабочих папок из одного репозитория. Удобно срочно пофиксить баг, не трогая текущую работу.',
          examples: [
            { code: 'git worktree add ../hotfix main', note: 'Отдельная папка на main' },
            { code: 'git worktree add ../feat -b feature', note: 'С новой веткой' },
            { code: 'git worktree list', note: 'Все worktree' },
            { code: 'git worktree remove ../hotfix', note: 'Удалить' }
          ],
          tip: 'Это не копия репозитория: история и объекты общие, а рабочая папка своя. Идеально для параллельных задач.'
        }
      ]
    }
  ],

  cheats: [
    {
      title: 'Старт',
      rows: [
        ['git config --global user.name "..."', 'имя автора'],
        ['git init', 'новый репозиторий'],
        ['git clone url', 'склонировать'],
        ['git status -s', 'короткий статус'],
        ['git help commit', 'справка']
      ]
    },
    {
      title: 'Коммиты',
      rows: [
        ['git add .', 'всё в индекс'],
        ['git add -p', 'частично'],
        ['git commit -m "msg"', 'коммит'],
        ['git commit -am "msg"', 'tracked + коммит'],
        ['git commit --amend', 'переписать последний'],
        ['git rm --cached file', 'забыть файл'],
        ['git restore file', 'отменить правки']
      ]
    },
    {
      title: 'История',
      rows: [
        ['git log --oneline --graph --all', 'граф истории'],
        ['git diff --staged', 'что уйдёт в коммит'],
        ['git show HEAD', 'последний коммит'],
        ['git reflog', 'журнал HEAD'],
        ['git blame file', 'автор строк']
      ]
    },
    {
      title: 'Ветки',
      rows: [
        ['git branch feature', 'создать'],
        ['git switch -c feature', 'создать + перейти'],
        ['git switch main', 'перейти'],
        ['git merge --no-ff feature', 'слияние с коммитом'],
        ['git merge --no-commit feature', 'слияние без коммита'],
        ['git merge --squash feature', 'в один коммит'],
        ['git merge --abort', 'отменить']
      ]
    },
    {
      title: 'Отмена',
      rows: [
        ['git reset --soft HEAD~1', 'снять коммит, оставить индекс'],
        ['git reset HEAD~1', 'снять коммит, оставить файлы'],
        ['git reset --hard HEAD~1', 'удалить коммит и правки'],
        ['git revert HEAD', 'отменить новым коммитом'],
        ['git clean -ndx', 'показать мусор'],
        ['git clean -fdx', 'удалить мусор'],
        ['git reflog', 'найти потерянное']
      ]
    },
    {
      title: 'Перенос',
      rows: [
        ['git cherry-pick hash', 'скопировать коммит'],
        ['git cherry-pick -x hash', 'с указанием источника'],
        ['git rebase main', 'перебазировать'],
        ['git rebase -i HEAD~3', 'переписать историю'],
        ['git rebase --continue', 'продолжить'],
        ['git rebase --abort', 'отменить']
      ]
    },
    {
      title: 'Прятки',
      rows: [
        ['git stash push -u -m "wip"', 'спрятать изменения'],
        ['git stash list', 'список stash'],
        ['git stash pop', 'вернуть и удалить'],
        ['git stash apply', 'вернуть, оставить в stash'],
        ['git stash drop', 'удалить запись']
      ]
    },
    {
      title: 'Метки',
      rows: [
        ['git tag v1.0', 'лёгкая метка'],
        ['git tag -a v1.0 -m "release"', 'аннотированная'],
        ['git tag', 'список меток'],
        ['git push --tags', 'отправить метки']
      ]
    },
    {
      title: 'Удалёнка',
      rows: [
        ['git remote -v', 'URL remote'],
        ['git fetch --all --prune', 'обновить без слияния'],
        ['git pull --rebase', 'забрать линейно'],
        ['git push -u origin feature', 'первый push'],
        ['git push --force-with-lease', 'безопасный force'],
        ['git push --tags', 'отправить теги']
      ]
    },
    {
      title: 'Ссылки',
      rows: [
        ['HEAD~1', 'на одного родителя назад'],
        ['HEAD^2', 'второй родитель merge'],
        ['main..feature', 'есть в feature, нет в main'],
        ['@', 'сокращение HEAD'],
        ['origin/main', 'состояние удалённой ветки']
      ]
    }
  ]
};
