/* Windows CMD — practice tasks */
window.CMD_TASKS = [
  /* ================= LEVEL 1 ================= */
  {
    id: 'cmd-01', level: 1, type: 'input', xp: 10,
    title: 'Перейти на другой диск',
    prompt: 'Нужно попасть в папку <code>D:\\projects</code>, но текущий диск — <b>C:</b>. Напиши <b>одну</b> команду, которая сразу переключит диск и папку.',
    answers: ['cd /d d:\\projects', 'cd /d "d:\\projects"', 'chdir /d d:\\projects'],
    hint: ['Обычный cd не сменит диск, нужен ключ.', 'Ключ называется /d и ставится после cd.'],
    solution: 'cd /d D:\\projects',
    explain: 'Без /d команда cd попытается найти папку на текущем диске. <b>cd /d</b> меняет и диск, и каталог. Альтернатива — две команды: <code>D:</code> и <code>cd \\projects</code>.'
  },
  {
    id: 'cmd-02', level: 1, type: 'input', xp: 10,
    title: 'Цепочка папок',
    prompt: 'Создай в текущей папке структуру <code>backup\\2026\\october</code> одной командой. Промежуточных папок ещё нет.',
    answers: ['md backup\\2026\\october', 'mkdir backup\\2026\\october', 'md backup/2026/october', 'mkdir backup/2026/october'],
    hint: ['md умеет создавать всю цепочку сразу, если указать путь через \\\\ .'],
    solution: 'md backup\\2026\\october',
    explain: '<b>md</b> (mkdir) создаёт все недостающие уровни. Отдельные команды для backup и 2026 не нужны.'
  },
  {
    id: 'cmd-03', level: 1, type: 'input', xp: 10,
    title: 'Скрытые файлы',
    prompt: 'Покажи содержимое текущей папки <b>вместе со скрытыми и системными</b> файлами.',
    answers: ['dir /a', 'dir /a:h', 'dir /ah'],
    hint: ['Ключ «все атрибуты» — это /a.'],
    solution: 'dir /a',
    explain: '<b>dir /a</b> показывает файлы со всеми атрибутами, включая hidden и system. Обычный <b>dir</b> скрытые не выводит.'
  },
  {
    id: 'cmd-04', level: 1, type: 'input', xp: 10,
    title: 'Копировать все .txt',
    prompt: 'Скопируй <b>все</b> файлы <code>.txt</code> из текущей папки в существующую папку <code>backup</code>.',
    answers: ['copy *.txt backup', 'copy *.txt backup\\', 'copy *.txt "backup"', 'copy *.txt backup/'],
    hint: ['copy понимает маски * и ?.', 'Второй аргумент — папка назначения.'],
    solution: 'copy *.txt backup\\',
    explain: 'Маска <b>*.txt</b> разворачивается во все подходящие файлы. Если папки backup нет, copy создаст файл с таким именем — поэтому сначала <b>md backup</b>.'
  },
  {
    id: 'cmd-05', level: 1, type: 'input', xp: 10,
    title: 'Переименование',
    prompt: 'Переименуй файл <code>old.txt</code> в <code>new.txt</code>. Файл должен остаться в той же папке.',
    answers: ['ren old.txt new.txt', 'rename old.txt new.txt', 'move old.txt new.txt'],
    hint: ['Для переименования есть короткая команда из трёх букв.'],
    solution: 'ren old.txt new.txt',
    explain: '<b>ren</b> меняет только имя, путь у нового имени указывать нельзя. <b>move old.txt new.txt</b> тоже сработает, но move — это перемещение, а не специализированное переименование.'
  },
  {
    id: 'cmd-06', level: 1, type: 'input', xp: 10,
    title: 'Удалить папку с содержимым',
    prompt: 'Удали папку <code>temp</code> вместе со всем содержимым <b>без вопроса о подтверждении</b>.',
    answers: ['rd /s /q temp', 'rmdir /s /q temp', 'rd temp /s /q', 'rmdir temp /s /q'],
    hint: ['/s — рекурсивно, /q — без подтверждения.'],
    solution: 'rd /s /q temp',
    explain: '<b>/s</b> разрешает удаление непустой папки, <b>/q</b> отключает вопрос. Без /s непустая папка не удалится. Без /q придётся подтверждать.'
  },
  {
    id: 'cmd-07', level: 1, type: 'input', xp: 10,
    title: 'Дерево проекта',
    prompt: 'Выведи дерево текущей папки <b>вместе с файлами</b>.',
    answers: ['tree /f', 'tree . /f', 'tree /f .'],
    hint: ['У tree есть ключ для файлов — /f.'],
    solution: 'tree /f',
    explain: '<b>tree</b> без ключей рисует только каталоги, <b>/f</b> добавляет файлы. Для сохранения в файл: <code>tree /f &gt; structure.txt</code>.'
  },
  {
    id: 'cmd-08', level: 1, type: 'input', xp: 10,
    title: 'Прочитать файл',
    prompt: 'Выведи в консоль содержимое файла <code>readme.txt</code> (не открывая редактор).',
    answers: ['type readme.txt', 'more readme.txt'],
    hint: ['Команда называется как английское «печатать».'],
    solution: 'type readme.txt',
    explain: '<b>type</b> — аналог cat: печатает файл в stdout. Для длинных файлов удобнее <b>type readme.txt | more</b>.'
  },
  {
    id: 'cmd-09', level: 1, type: 'input', xp: 10,
    title: 'Где Git?',
    prompt: 'Проверь, какой именно <code>git.exe</code> запустится из командной строки, и покажи его полный путь.',
    answers: ['where git', 'where git.exe', 'where.exe git'],
    hint: ['Команда ищет программу в PATH.'],
    solution: 'where git',
    explain: '<b>where</b> ищет исполняемый файл по PATH. Если вывод пуст — Git не в PATH, и cmd его не видит.'
  },
  {
    id: 'cmd-10', level: 1, type: 'match', xp: 15,
    title: 'Сопоставь команды и действия',
    prompt: 'Соедини команду с тем, что она делает. Это база, которая должна отскакивать от зубов.',
    pairs: [
      ['dir', 'показать содержимое папки'],
      ['del', 'удалить файл'],
      ['rd', 'удалить папку'],
      ['copy', 'скопировать файл'],
      ['move', 'переместить или переименовать'],
      ['type', 'вывести текст файла']
    ],
    hint: ['rd — remove directory, del — delete.'], 
    solution: 'dir → показать, del → файл, rd → папка, copy → копия, move → перенос, type → текст',
    explain: 'Запомни пары: <b>rd</b> = remove directory (папка), <b>del</b> = delete (файл), <b>ren</b> = rename, <b>md</b> = make directory.'
  },

  /* ================= LEVEL 2 ================= */
  {
    id: 'cmd-11', level: 2, type: 'input', xp: 15,
    title: 'Рекурсивное копирование',
    prompt: 'Скопируй папку <code>src</code> со всем содержимым в папку <code>backup\\src</code>. Нужно сохранить и <b>пустые</b> подпапки. Используй xcopy.',
    answers: ['xcopy src backup\\src /e /i', 'xcopy src backup\\src /e /i /y', 'xcopy src "backup\\src" /e /i', 'xcopy src backup/src /e /i'],
    hint: ['/e — все подкаталоги, включая пустые.', '/i — если цель не существует, считать её папкой.'],
    solution: 'xcopy src backup\\src /E /I',
    explain: '<b>xcopy src backup</b> без /I может спросить «это файл или папка?». <b>/E</b> копирует пустые каталоги, <b>/I</b> сразу трактует цель как каталог. Современная альтернатива — <b>robocopy src backup\\src /E</b>.'
  },
  {
    id: 'cmd-12', level: 2, type: 'input', xp: 15,
    title: 'Склеить два файла',
    prompt: 'Объедини содержимое <code>1.txt</code> и <code>2.txt</code> в новый файл <code>all.txt</code> (сначала 1, затем 2).',
    answers: ['copy 1.txt+2.txt all.txt', 'copy 1.txt + 2.txt all.txt', 'copy 1.txt+2.txt "all.txt"'],
    hint: ['copy умеет принимать несколько источников через +.'],
    solution: 'copy 1.txt+2.txt all.txt',
    explain: 'При объединении copy читает файлы по порядку и пишет результат в третий. Это старый способ, но он работает и в BAT-файлах.'
  },
  {
    id: 'cmd-13', level: 2, type: 'input', xp: 15,
    title: 'Список процессов в файл',
    prompt: 'Запиши вывод <code>tasklist</code> в файл <code>processes.txt</code>. Если файл уже есть — <b>перезапиши</b> его.',
    answers: ['tasklist > processes.txt', 'tasklist > "processes.txt"', 'tasklist>processes.txt'],
    hint: ['Один символ > означает перезапись.'],
    solution: 'tasklist > processes.txt',
    explain: '<b>&gt;</b> перенаправляет stdout в файл и очищает его. Если нужно дописывать — используй <b>&gt;&gt;</b>.'
  },
  {
    id: 'cmd-14', level: 2, type: 'input', xp: 15,
    title: 'Дописать в лог',
    prompt: 'Добавь строку <code>done</code> в конец файла <code>log.txt</code>, не стирая предыдущее содержимое.',
    answers: ['echo done >> log.txt', 'echo done>>log.txt', 'echo "done" >> log.txt'],
    hint: ['Нужен двойной символ перенаправления.'],
    solution: 'echo done >> log.txt',
    explain: '<b>&gt;&gt;</b> открывает файл на дозапись. Если перепутать с <b>&gt;</b>, весь лог будет уничтожен.'
  },
  {
    id: 'cmd-15', level: 2, type: 'input', xp: 15,
    title: 'Сортировка в новый файл',
    prompt: 'Отсортируй строки файла <code>names.txt</code> и запиши результат в <code>sorted.txt</code>, используя ключ <code>/o</code>.',
    answers: ['sort names.txt /o sorted.txt', 'sort names.txt /o "sorted.txt"', 'sort /o sorted.txt names.txt'],
    hint: ['/o задаёт выходной файл прямо в команде sort.'],
    solution: 'sort names.txt /o sorted.txt',
    explain: '<b>/o</b> безопаснее, чем <b>sort names.txt &gt; names.txt</b>: команда не пытается одновременно читать и перезаписывать один файл.'
  },
  {
    id: 'cmd-16', level: 2, type: 'input', xp: 15,
    title: 'Поиск ошибок в логе',
    prompt: 'Найди в <code>app.log</code> все строки со словом <code>error</code> <b>без учёта регистра</b>.',
    answers: ['findstr /i "error" app.log', 'findstr /i error app.log', 'findstr /i "error" "app.log"'],
    hint: ['/i — ignore case.'],
    solution: 'findstr /i "error" app.log',
    explain: '<b>findstr</b> чувствителен к регистру по умолчанию, <b>/i</b> это отключает. Для нескольких слов: <code>findstr /i "error warn" app.log</code>.'
  },
  {
    id: 'cmd-17', level: 2, type: 'input', xp: 15,
    title: 'Дополнить PATH',
    prompt: 'Добавь папку <code>C:\\Tools</code> в PATH <b>только для текущего окна</b> командной строки.',
    answers: ['set path=%path%;c:\\tools', 'set path=%path%;c:\\tools\\', 'set PATH=%PATH%;C:\\Tools'],
    hint: ['Новое значение PATH = старое значение + ; + новая папка.'],
    solution: 'set PATH=%PATH%;C:\\Tools',
    explain: 'Разделитель в PATH — точка с запятой. <b>set</b> меняет только текущую сессию; чтобы навсегда — <b>setx PATH "%PATH%;C:\\Tools"</b>, но это опасно для длинного PATH.'
  },
  {
    id: 'cmd-18', level: 2, type: 'input', xp: 15,
    title: 'Переменная',
    prompt: 'Создай переменную окружения <code>NAME</code> со значением <code>Petya</code> (без лишних пробелов вокруг =).',
    answers: ['set name=petya', 'set NAME=Petya', 'set name="petya"'],
    hint: ['set ИМЯ=значение, без пробелов вокруг равно.'],
    solution: 'set NAME=Petya',
    explain: 'Пробелы вокруг <b>=</b> станут частью имени или значения. Проверить: <code>echo %NAME%</code>. Удалить: <code>set NAME=</code>.'
  },
  {
    id: 'cmd-19', level: 2, type: 'input', xp: 15,
    title: 'Ввод с клавиатуры',
    prompt: 'Запроси у пользователя имя с подсказкой <code>Введите имя: </code> и сохрани ответ в переменную <code>NAME</code>.',
    pattern: /^set\s+\/p\s+name\s*=\s*.+$/i,
    hint: ['set с ключом /p читает строку от пользователя.'],
    solution: 'set /p NAME=Введите имя: ',
    explain: '<b>set /p</b> печатает подсказку и ждёт ввод. Если пользователь нажмёт Ctrl+Z, errorlevel станет 1. Значение — всегда строка.'
  },
  {
    id: 'cmd-20', level: 2, type: 'input', xp: 15,
    title: 'Фильтр процессов',
    prompt: 'Покажи только процессы, в имени которых есть <code>chrome</code> (без учёта регистра), используя конвейер.',
    answers: ['tasklist | findstr /i chrome', 'tasklist | findstr /i "chrome"', 'tasklist|findstr /i chrome'],
    hint: ['Сначала tasklist, потом | findstr.'],
    solution: 'tasklist | findstr /i chrome',
    explain: 'Конвейер передаёт stdout tasklist на вход findstr. Так можно фильтровать любой вывод, не сохраняя его в файл.'
  },
  {
    id: 'cmd-21', level: 2, type: 'choice', xp: 15,
    title: 'Куда уходят ошибки?',
    prompt: 'Нужно записать <b>и обычный вывод, и сообщения об ошибках</b> в <code>build.log</code>. Какой вариант правильный?',
    options: [
      'build.bat > build.log 2>&1',
      'build.bat 2>&1 > build.log',
      'build.bat > build.log 2> build.log',
      'build.bat | build.log'
    ],
    correct: [0],
    hint: ['Порядок перенаправлений имеет значение: сначала stdout в файл, потом stderr туда же.'],
    solution: 'build.bat > build.log 2>&1',
    explain: 'В первом варианте stdout уходит в файл, затем stderr направляется туда, куда сейчас указывает stdout — в файл. Во втором stderr подключается к экрану, а потом stdout уходит в файл, и ошибки остаются на экране. <b>2&gt; build.log</b> и <b>&gt; build.log</b> — два разных открытия файла, они будут перезаписывать друг друга.'
  },
  {
    id: 'cmd-22', level: 2, type: 'input', xp: 15,
    title: 'Процессы одной строкой',
    prompt: 'Выведи процессы так, чтобы <b>каждый занимал ровно одну строку</b>, в формате CSV и без заголовка (из семинара).',
    answers: ['tasklist /fo csv /nh', 'tasklist /fo:csv /nh', 'tasklist /fo csv /nh > processes.txt', 'tasklist /fo csv /nh | more'],
    hint: ['/fo задаёт формат, /nh убирает заголовок.'],
    solution: 'tasklist /fo csv /nh',
    explain: '<b>/FO CSV</b> печатает каждый процесс одной CSV-строкой, <b>/NH</b> убирает строку заголовка. Такой вывод удобно сортировать и открывать в Excel.'
  },
  {
    id: 'cmd-23', level: 2, type: 'input', xp: 15,
    title: 'Убить зависший процесс',
    prompt: 'Принудительно заверши <b>все</b> процессы <code>notepad.exe</code>.',
    answers: ['taskkill /im notepad.exe /f', 'taskkill /f /im notepad.exe', 'taskkill /IM notepad.exe /F /T'],
    hint: ['/IM — по имени образа, /F — принудительно.'],
    solution: 'taskkill /IM notepad.exe /F',
    explain: '<b>/IM</b> ищет по имени, <b>/F</b> завершает без сохранения данных, <b>/T</b> добавляет дочерние процессы. По PID: <code>taskkill /PID 1234 /F</code>.'
  },

  /* ================= LEVEL 3 ================= */
  {
    id: 'cmd-24', level: 3, type: 'input', xp: 20, seminar: true,
    title: 'Условие в одну строку',
    prompt: 'Если файл <code>1.txt</code> существует — создай папку <code>1</code>. Напиши это одной командой (как на семинаре).',
    answers: ['if exist 1.txt md 1', 'if exist 1.txt mkdir 1', 'if exist 1.txt md 1 2>nul', 'if exist "1.txt" md 1'],
    hint: ['Синтаксис: if exist файл команда.'],
    solution: 'if exist 1.txt md 1',
    explain: '<b>if exist</b> проверяет путь. Если файла нет, команда просто ничего не сделает. Обратная проверка — <b>if not exist backup md backup</b>.'
  },
  {
    id: 'cmd-25', level: 3, type: 'order', xp: 20, seminar: true,
    title: 'Собери батник',
    prompt: 'Расставь строки минимального бат-файла в правильном порядке: скрыть эхо → вывести приветствие → дождаться клавиши.',
    steps: ['@echo off', 'echo Привет!', 'pause'],
    hint: ['@echo off всегда первая строка, pause — последняя.'],
    solution: '@echo off\necho Привет!\npause',
    explain: 'Порядок: сначала отключаем вывод команд, потом полезная работа, в конце — пауза, чтобы окно не закрылось. <b>@</b> скрывает и саму команду echo off.'
  },
  {
    id: 'cmd-26', level: 3, type: 'input', xp: 20, seminar: true,
    title: 'Создать файл и скопировать .txt',
    prompt: 'Две задачи из семинара: 1) создай пустой файл <code>report.docx</code> без редактора; 2) скопируй все <code>.txt</code> в папку <code>backup</code>. Напиши <b>две команды</b> через новую строку.',
    multiline: true,
    answers: [
      'type nul > report.docx\ncopy *.txt backup',
      'type nul > report.docx\ncopy *.txt backup\\',
      'copy nul report.docx\ncopy *.txt backup\\',
      'echo. > report.docx\ncopy *.txt backup\\',
      'fsutil file createnew report.docx 0\ncopy *.txt backup\\'
    ],
    hint: ['Пустой файл: type nul > имя или copy nul имя.', 'Для копирования по маске: copy *.txt backup\\'],
    solution: 'type nul > report.docx\ncopy *.txt backup\\',
    explain: 'Расширение .docx не делает файл документом Word — это просто пустой файл с таким именем. <b>type nul &gt; file</b> создаёт пустой файл, потому что nul — пустое устройство. Папка backup должна существовать.'
  },
  {
    id: 'cmd-27', level: 3, type: 'input', xp: 20, seminar: true,
    title: 'tasklist → файл → сортировка',
    prompt: 'Создай файл <code>processes.txt</code> с выводом <code>tasklist</code>, затем отсортируй его и сохрани результат в <code>sorted.txt</code>. Напиши две команды через новую строку (для второй используй <b>/o</b>).',
    multiline: true,
    answers: [
      'tasklist > processes.txt\nsort processes.txt /o sorted.txt',
      'tasklist>processes.txt\nsort processes.txt /o sorted.txt',
      'tasklist /fo csv /nh > processes.txt\nsort processes.txt /o sorted.txt',
      'tasklist > processes.txt\nsort /o sorted.txt processes.txt'
    ],
    hint: ['Первая команда — перенаправление >.', 'Вторая — sort файл /o новый_файл.'],
    solution: 'tasklist > processes.txt\nsort processes.txt /o sorted.txt',
    explain: 'Именно так задача сформулирована на семинаре. <b>/o</b> не даёт sort перезаписывать исходный файл во время чтения. Если нужен «однострочный» формат — добавь <b>/fo csv /nh</b>.'
  },
  {
    id: 'cmd-28', level: 3, type: 'choice', xp: 20,
    title: 'Порядок перенаправлений',
    prompt: 'В каком порядке выполняются части команды <code>build.bat &gt; all.log 2&gt;&amp;1</code>?',
    options: [
      'Сначала stdout → all.log, затем stderr → туда же, где stdout',
      'Сначала stderr → stdout, затем stdout → all.log',
      'Оба потока пишутся в all.log независимо',
      'Команда невалидна: 2>&1 должно идти первым'
    ],
    correct: [0],
    hint: ['2>&1 означает «туда же, куда указывает stdout сейчас».'],
    solution: 'build.bat > all.log 2>&1',
    explain: 'Перенаправления применяются слева направо. <b>&gt; all.log</b> переключает stdout на файл, <b>2&gt;&amp;1</b> копирует текущее назначение stdout в stderr. Оба потока идут в файл.'
  },
  {
    id: 'cmd-29', level: 3, type: 'order', xp: 20,
    title: 'Собери конвейер',
    prompt: 'Составь конвейер, который выводит только имена <code>.txt</code>-файлов и сортирует их по убыванию.',
    steps: ['dir /b', 'findstr /i ".txt"', 'sort /r'],
    hint: ['Каждая команда делает одно: список → фильтр → сортировка.'],
    solution: 'dir /b | findstr /i ".txt" | sort /r',
    explain: '<b>/b</b> даёт только имена, findstr фильтрует, sort /r переворачивает порядок. Конвейер читается слева направо, как поток данных.'
  },
  {
    id: 'cmd-30', level: 3, type: 'input', xp: 20,
    title: 'Цикл по файлам',
    prompt: 'Напиши строку для <b>bat-файла</b>, которая выводит имена всех <code>.txt</code> файлов текущей папки через цикл for.',
    answers: ['for %%f in (*.txt) do echo %%f', 'for %%i in (*.txt) do echo %%i', 'for %%f in (*.txt) do @echo %%f', 'for %%F in (*.txt) do echo %%F'],
    hint: ['В файле — двойные проценты. Переменная цикла — любая буква.'],
    solution: 'for %%f in (*.txt) do echo %%f',
    explain: 'В консоли пишут <b>%f</b>, в bat-файле — <b>%%f</b>. Это историческое отличие, из-за которого циклы из интернета не работают при копировании.'
  },
  {
    id: 'cmd-31', level: 3, type: 'input', xp: 20,
    title: 'PATH навсегда',
    prompt: 'Добавь <code>C:\\Tools</code> в PATH <b>навсегда</b>, чтобы новые окна cmd видели эту папку.',
    answers: ['setx path "%path%;c:\\tools"', 'setx path "%path%;c:\\tools\\"', 'setx PATH "%PATH%;C:\\Tools"'],
    hint: ['Для постоянного изменения используется setx, а не set.'],
    solution: 'setx PATH "%PATH%;C:\\Tools"',
    explain: 'setx пишет в реестр пользователя и действует для новых процессов. Важно: он не меняет текущее окно и может обрезать PATH длиннее 1024 символов. Надёжнее править PATH через «Переменные среды» Windows.'
  },
  {
    id: 'cmd-32', level: 3, type: 'order', xp: 20,
    title: 'Проверка и создание',
    prompt: 'Расставь команды так, чтобы батник создавал папку backup только при её отсутствии и сообщал об успехе.',
    steps: ['if not exist backup md backup', 'if errorlevel 1 (echo Ошибка) else (echo Готово)', 'pause'],
    hint: ['Сначала действие, затем проверка его кода возврата, в конце пауза.'],
    solution: 'if not exist backup md backup\nif errorlevel 1 (echo Ошибка) else (echo Готово)\npause',
    explain: '<b>if errorlevel 1</b> истинно при коде ≥ 1. В блоке со скобками <b>%errorlevel%</b> может подставиться слишком рано — надёжнее конструкция с <b>if errorlevel</b> или delayed expansion.'
  },
  {
    id: 'cmd-33', level: 3, type: 'input', xp: 20,
    title: 'Аргументы и путь скрипта',
    prompt: 'В bat-файле нужно скопировать файл <code>config.ini</code> из папки, где лежит сам скрипт, в подпапку <code>backup</code>. Напиши команду, используя <code>%~dp0</code>.',
    answers: ['copy "%~dp0config.ini" "%~dp0backup\\"', 'copy "%~dp0config.ini" "%~dp0backup"', 'copy "%~dp0\\config.ini" "%~dp0backup\\"'],
    hint: ['%~dp0 уже заканчивается обратным слэшем.', 'Пути с пробелами лучше брать в кавычки.'],
    solution: 'copy "%~dp0config.ini" "%~dp0backup\\"',
    explain: '<b>%~dp0</b> разворачивается в «диск + путь» папки скрипта и уже содержит <b>\\</b> в конце. Поэтому <code>"%~dp0config.ini"</code> — корректный путь, даже если проект лежит в «C:\\Мои проекты».'
  },
  {
    id: 'cmd-34', level: 3, type: 'choice', xp: 20,
    title: 'Точная фраза в findstr',
    prompt: 'Нужно найти в <code>app.log</code> строки с <b>точной фразой</b> <code>connection refused</code>. Какой вариант правильный?',
    options: [
      'findstr /c:"connection refused" app.log',
      'findstr "connection refused" app.log',
      'findstr /v "connection refused" app.log',
      'findstr /i connection refused app.log'
    ],
    correct: [0],
    hint: ['Пробел в обычном шаблоне findstr означает «ИЛИ»: строка подойдёт, если в ней есть любое из слов.', 'Ключ /c: заставляет искать всю строку целиком.'],
    solution: 'findstr /c:"connection refused" app.log',
    explain: 'Без <b>/c:</b> findstr ищет <b>connection</b> ИЛИ <b>refused</b> и найдёт лишнее. <b>/c:"текст"</b> требует точного вхождения фразы. <b>/v</b> наоборот исключает строки, а лишний аргумент после шаблона трактуется как имя файла.'
  },
  {
    id: 'cmd-35', level: 3, type: 'match', xp: 20,
    title: 'Спецсимволы',
    prompt: 'Сопоставь символы перенаправления с их смыслом.',
    pairs: [
      ['>', 'перезаписать файл'],
      ['>>', 'дописать в конец'],
      ['2>', 'перенаправить ошибки'],
      ['|', 'передать вывод следующей команде'],
      ['&&', 'выполнить при успехе'],
      ['||', 'выполнить при ошибке']
    ],
    hint: ['Двойной символ — всегда «добавить», а не «заменить».'],
    solution: '> перезапись, >> дозапись, 2> ошибки, | конвейер, && успех, || ошибка',
    explain: 'Эти шесть символов покрывают 90% однострочников в CMD. Их полезно довести до автоматизма.'
  }
];
