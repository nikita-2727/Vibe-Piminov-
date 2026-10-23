/* Windows CMD — theory data */
window.CMD_DATA = {
  title: 'Windows CMD',
  tagline: 'Командная строка, которую спрашивают на всех лабах и на работе.',
  concepts: [
    {
      tag: '01',
      title: 'Как читать синтаксис',
      text: 'В документации <b>[ ]</b> — необязательная часть, <b>...</b> — можно повторять, <b>/ключ</b> — модификатор команды. Регистр в CMD не важен: <b>DIR</b> = <b>dir</b>. А вот пробелы важны — <b>copy a b</b> и <b>copy a  b</b> почти всегда одно и то же, но в именах с пробелами нужны кавычки.',
      code: 'copy "Мои файлы\\отчёт.docx" D:\\backup\\'
    },
    {
      tag: '02',
      title: 'Пути: абсолютный и относительный',
      text: 'Абсолютный путь начинается с диска: <b>C:\\dev\\project</b>. Относительный считается от текущей папки. <b>.</b> — это текущая папка, <b>..</b> — родительская, <b>\\</b> — корень текущего диска. Чтобы перейти на другой диск, нужен ключ <b>/d</b>.',
      code: 'cd /d D:\\projects\ncd ..\\..\ncopy report.txt ..\\backup\\'
    },
    {
      tag: '03',
      title: 'Три стандартных потока',
      text: 'У каждой программы есть вход и два выхода. <b>0 / stdin</b> — ввод, <b>1 / stdout</b> — обычный вывод, <b>2 / stderr</b> — ошибки. Их можно перенаправлять в файлы и друг в друга, а stdout — в другую команду через конвейер <b>|</b>.',
      code: 'tasklist > processes.txt\ntasklist 2> errors.txt\ntasklist 2>&1 > all.txt\ntasklist | findstr chrome'
    },
    {
      tag: '04',
      title: 'Переменные окружения',
      text: 'Переменная — это имя в <b>%процентах%</b>. <b>set</b> меняет её только в текущем окне, <b>setx</b> — навсегда для новых окон. <b>PATH</b> — список папок, где Windows ищет программы. Именно поэтому <b>git</b> работает из любой папки, хотя лежит в <b>C:\\Program Files\\Git\\cmd</b>.',
      code: 'set NAME=Петя\necho %NAME%\nset PATH=%PATH%;C:\\Tools\nsetx PATH "%PATH%;C:\\Tools"'
    },
    {
      tag: '05',
      title: 'Батник: минимальный каркас',
      text: 'Скрипт — обычный текстовый файл с расширением <b>.bat</b> или <b>.cmd</b>. <b>@echo off</b> прячет сами команды, <b>echo</b> печатает текст, <b>pause</b> не даёт окну закрыться, <b>%1...%9</b> — аргументы, <b>%~dp0</b> — папка, где лежит сам скрипт.',
      code: '@echo off\nchcp 65001 >nul\necho Привет, %1!\necho Скрипт лежит в %~dp0\npause'
    },
    {
      tag: '06',
      title: 'Коды возврата и && / ||',
      text: 'Команда возвращает <b>errorlevel</b>: 0 — успех, не 0 — ошибка. <b>&&</b> выполнит вторую команду только при успехе, <b>||</b> — только при ошибке, <b>&</b> — всегда. Это готовый <b>if</b> в одну строку.',
      code: 'git status && echo OK || echo FAIL\nmd backup && copy *.txt backup\\'
    }
  ],

  groups: [
    {
      id: 'nav',
      title: 'Навигация и справка',
      desc: 'Осмотреться, перейти, найти',
      items: [
        {
          id: 'help',
          name: 'help / команда /?',
          syntax: 'help [команда]\nкоманда /?',
          desc: 'Встроенная справка по любой команде. Лучше гугла, потому что всегда под рукой.',
          examples: [
            { code: 'help', note: 'Список всех встроенных команд' },
            { code: 'dir /?', note: 'Все ключи dir с пояснениями' },
            { code: 'help copy', note: 'Справка по copy' }
          ],
          tip: 'Не помнишь ключ — набери <b>/?</b>. Это быстрее, чем открывать браузер.'
        },
        {
          id: 'cd',
          name: 'cd / chdir',
          syntax: 'cd [путь]\ncd /d [диск:путь]\ncd ..',
          desc: 'Смена текущей папки. Без аргументов печатает текущий путь. /d нужен для перехода на другой диск.',
          examples: [
            { code: 'cd C:\\dev\\project', note: 'Абсолютный путь' },
            { code: 'cd ..\\backup', note: 'На уровень выше и в backup' },
            { code: 'cd /d D:\\projects', note: 'Перейти на диск D' },
            { code: 'cd', note: 'Показать, где я' }
          ],
          tip: 'Просто <b>D:</b> тоже переключает диск, но не папку. <b>cd /d D:\\projects</b> делает сразу оба действия.'
        },
        {
          id: 'dir',
          name: 'dir',
          syntax: 'dir [путь] [/a] [/b] [/s] [/o] [/w]',
          desc: 'Список файлов и папок. Главная команда «что здесь есть».',
          examples: [
            { code: 'dir', note: 'Содержимое текущей папки' },
            { code: 'dir /a', note: 'Показать скрытые и системные' },
            { code: 'dir /b', note: 'Только имена, без таблицы' },
            { code: 'dir *.txt /s', note: 'Все .txt рекурсивно по подпапкам' },
            { code: 'dir /o:s', note: 'Сортировка по размеру' }
          ],
          tip: 'Ключи можно комбинировать: <b>dir /a /s /b</b> — все файлы, включая скрытые, только именами.'
        },
        {
          id: 'cls',
          name: 'cls',
          syntax: 'cls',
          desc: 'Очищает экран. Не удаляет файлы, просто убирает старый вывод.',
          examples: [{ code: 'cls', note: 'Чистый экран' }],
          tip: 'В длинном выводе <b>cls</b> + повтор команды часто быстрее, чем скроллить.'
        },
        {
          id: 'where',
          name: 'where',
          syntax: 'where [программа]',
          desc: 'Показывает полный путь к исполняемому файлу. Проверка, что программа есть в PATH.',
          examples: [
            { code: 'where git', note: 'Где лежит git.exe' },
            { code: 'where python', note: 'Какой Python запустится' }
          ],
          tip: 'Если <b>where git</b> ничего не нашёл — Git не добавлен в PATH, и cmd его не видит.'
        },
        {
          id: 'tree',
          name: 'tree',
          syntax: 'tree [путь] [/f] [/a]',
          desc: 'Рисует дерево папок. /f добавляет файлы, /a — ASCII-символы вместо псевдографики.',
          examples: [
            { code: 'tree', note: 'Только папки' },
            { code: 'tree /f', note: 'Папки и файлы' },
            { code: 'tree C:\\dev /f > structure.txt', note: 'Сохранить дерево в файл' }
          ],
          tip: 'Идеально, чтобы быстро показать структуру проекта в отчёте или чате.'
        },
        {
          id: 'chcp',
          name: 'chcp',
          syntax: 'chcp [кодовая страница]',
          desc: 'Меняет кодировку консоли. 65001 — UTF-8, 1251 — Windows-кириллица.',
          examples: [
            { code: 'chcp', note: 'Показать текущую кодировку' },
            { code: 'chcp 65001', note: 'Включить UTF-8' }
          ],
          tip: 'Кракозябры в батнике почти всегда лечатся <b>chcp 65001</b> и сохранением файла в UTF-8.'
        }
      ]
    },
    {
      id: 'files',
      title: 'Файлы и папки',
      desc: 'Создать, скопировать, удалить, прочитать',
      items: [
        {
          id: 'md',
          name: 'md / mkdir',
          syntax: 'md [путь]\\[вложенная]',
          desc: 'Создаёт папку. Умеет сразу создавать всю цепочку вложенных папок.',
          examples: [
            { code: 'md backup', note: 'Папка backup в текущей' },
            { code: 'md backup\\2026\\october', note: 'Сразу три уровня' },
            { code: 'md "My Projects"', note: 'Имя с пробелом — в кавычках' }
          ],
          tip: 'Если папка уже есть, <b>md</b> напишет ошибку, но цепочка всё равно создастся до неё. В батнике ошибку можно скрыть через <b>2>nul</b>.'
        },
        {
          id: 'rd',
          name: 'rd / rmdir',
          syntax: 'rd [папка] [/s] [/q]',
          desc: 'Удаляет папку. Пустую — сразу, с содержимым — только с /s.',
          examples: [
            { code: 'rd temp', note: 'Удалить пустую папку' },
            { code: 'rd temp /s /q', note: 'Удалить со всем содержимым без вопросов' },
            { code: 'rd "C:\\old project" /s', note: 'С подтверждением и пробелом в имени' }
          ],
          warn: '/q отключает подтверждение. <b>rd /s /q C:\\</b> — верный способ убить систему. Всегда проверяй путь.'
        },
        {
          id: 'del',
          name: 'del / erase',
          syntax: 'del [файл] [/f] [/s] [/q] [/a]',
          desc: 'Удаляет файлы (не папки). Поддерживает маски * и ?.',
          examples: [
            { code: 'del old.txt', note: 'Один файл' },
            { code: 'del *.tmp', note: 'Все .tmp в текущей папке' },
            { code: 'del /s /q *.log', note: 'Рекурсивно и без вопросов' },
            { code: 'del /f read-only.txt', note: 'Удалить read-only файл' }
          ],
          warn: 'Файл уходит мимо корзины. <b>del *.*</b> в чужой папке — классическая катастрофа. Используй <b>dir *.tmp</b> перед удалением.'
        },
        {
          id: 'copy',
          name: 'copy',
          syntax: 'copy [что] [куда] [/y]\ncopy a+b c',
          desc: 'Копирует файлы. Умеет склеивать несколько файлов в один.',
          examples: [
            { code: 'copy report.txt D:\\backup\\', note: 'Один файл в папку' },
            { code: 'copy *.txt backup\\', note: 'Все .txt в папку backup' },
            { code: 'copy 1.txt+2.txt all.txt', note: 'Склеить два файла в all.txt' },
            { code: 'copy /y report.txt backup\\', note: 'Без вопроса о перезаписи' }
          ],
          tip: 'Чтобы скопировать папку целиком, нужен <b>xcopy /e</b> или <b>robocopy</b>. <b>copy</b> папки не копирует.'
        },
        {
          id: 'move',
          name: 'move',
          syntax: 'move [что] [куда] [/y]',
          desc: 'Перемещает файл или папку. Внутри одной папки работает как переименование.',
          examples: [
            { code: 'move report.txt D:\\archive\\', note: 'Переместить файл' },
            { code: 'move old.txt new.txt', note: 'Переименовать' },
            { code: 'move project D:\\projects\\', note: 'Переместить папку со всем содержимым' },
            { code: 'move /y a.txt b\\', note: 'Перезаписать без вопроса' }
          ],
          tip: 'Между разными дисками move реально копирует и удаляет — это медленнее, чем кажется.'
        },
        {
          id: 'ren',
          name: 'ren / rename',
          syntax: 'ren [старое имя] [новое имя]',
          desc: 'Переименовывает файл или папку. Второй аргумент — только имя, без пути.',
          examples: [
            { code: 'ren old.txt new.txt', note: 'Переименовать файл' },
            { code: 'ren *.txt *.md', note: 'Сменить расширение всем .txt' },
            { code: 'ren "отчёт 1.docx" "отчёт финал.docx"', note: 'С пробелами' }
          ],
          warn: '<b>ren C:\\a\\1.txt C:\\b\\2.txt</b> не сработает: путь указывается только у старого имени. Для переноса — <b>move</b>.'
        },
        {
          id: 'xcopy',
          name: 'xcopy',
          syntax: 'xcopy [что] [куда] /E /I /S /H /Y',
          desc: 'Старое, но живучее рекурсивное копирование папок. /E — все пустые папки тоже, /I — считать цель папкой.',
          examples: [
            { code: 'xcopy src backup /E /I', note: 'Скопировать содержимое src в backup и создать её' },
            { code: 'xcopy src backup\\src /E /I /H', note: 'Вместе со скрытыми файлами' },
            { code: 'xcopy *.txt backup /Y', note: 'Файлы по маске, без вопросов' }
          ],
          tip: '<b>/E</b> копирует пустые каталоги, <b>/S</b> — только непустые. Если нужна точная копия — <b>/E /H /K /Y</b>.'
        },
        {
          id: 'robocopy',
          name: 'robocopy',
          syntax: 'robocopy [источник] [цель] [/E] [/MIR] [/MOV] [/XD папка]',
          desc: 'Современная замена xcopy: быстрее, умеет зеркалить, пропускать неизменённое и логировать.',
          examples: [
            { code: 'robocopy src backup /E', note: 'Копировать всё, включая пустые папки' },
            { code: 'robocopy src backup /MIR', note: 'Зеркало: удалит лишнее в цели' },
            { code: 'robocopy src backup /E /XD node_modules .git', note: 'Исключить папки' },
            { code: 'robocopy src backup /E /LOG:copy.log', note: 'Записать лог' }
          ],
          tip: 'Коды возврата robocopy не 0/1 — это не ошибка. 0 — нечего копировать, 1 — скопировано, 3 — были изменения. <b>&gt;= 8</b> — реальная ошибка.'
        },
        {
          id: 'type',
          name: 'type',
          syntax: 'type [файл]',
          desc: 'Печатает содержимое текстового файла в консоль. Аналог cat в Linux.',
          examples: [
            { code: 'type readme.txt', note: 'Показать файл' },
            { code: 'type a.txt b.txt', note: 'Показать несколько подряд' },
            { code: 'type log.txt | more', note: 'Постранично' }
          ],
          tip: '<b>type nul > file.txt</b> — быстрый способ создать пустой файл. Для бинарников type бесполезен.'
        },
        {
          id: 'more',
          name: 'more',
          syntax: 'more [файл]',
          desc: 'Выводит текст постранично. Работает и как фильтр в конвейере.',
          examples: [
            { code: 'more big.log', note: 'Читать с паузами' },
            { code: 'dir /s | more', note: 'Длинный вывод по частям' },
            { code: 'type big.log | more', note: 'То же самое' }
          ],
          tip: 'Пробел — следующая страница, Enter — строка, Q — выход.'
        },
        {
          id: 'sort',
          name: 'sort',
          syntax: 'sort [файл] [/r] [/o файл]',
          desc: 'Сортирует строки. Может читать файл, stdin или перенаправленный ввод и писать результат в /o.',
          examples: [
            { code: 'sort names.txt', note: 'Отсортировать и показать' },
            { code: 'sort names.txt /r', note: 'Обратный порядок' },
            { code: 'sort names.txt /o sorted.txt', note: 'Записать результат в файл' },
            { code: 'sort < names.txt > sorted.txt', note: 'То же через потоки' }
          ],
          tip: '<b>/o</b> лучше, чем <b>&gt;</b>: не конфликтует с чтением того же файла.'
        },
        {
          id: 'findstr',
          name: 'findstr',
          syntax: 'findstr [/i] [/n] [/s] [/v] [/c:"текст"] "что" [файл]',
          desc: 'Поиск строк по тексту или регулярному выражению. Главный фильтр для конвейеров.',
          examples: [
            { code: 'findstr "error" app.log', note: 'Строки с error' },
            { code: 'findstr /i "error warn" app.log', note: 'Без учёта регистра, несколько слов' },
            { code: 'findstr /n "TODO" *.js', note: 'С номерами строк' },
            { code: 'tasklist | findstr /i chrome', note: 'Отфильтровать процессы' },
            { code: 'findstr /v "^#" config.ini', note: 'Убрать комментарии' }
          ],
          tip: 'Пробел между словами в шаблоне — это ИЛИ. <b>/c:"error 500"</b> ищет точную фразу с пробелом.'
        },
        {
          id: 'attrib',
          name: 'attrib',
          syntax: 'attrib [+r|-r] [+h|-h] [+s|-s] [файл]',
          desc: 'Показывает и меняет атрибуты: read-only, hidden, system, archive.',
          examples: [
            { code: 'attrib file.txt', note: 'Показать атрибуты' },
            { code: 'attrib +h secret.txt', note: 'Скрыть файл' },
            { code: 'attrib -r file.txt', note: 'Снять read-only' },
            { code: 'attrib +r -h file.txt', note: 'Несколько атрибутов сразу' }
          ],
          tip: 'Скрытые файлы не видны в <b>dir</b> без <b>/a</b>, но это не защита — только косметика.'
        },
        {
          id: 'fc',
          name: 'fc',
          syntax: 'fc [файл1] [файл2] [/b]',
          desc: 'Сравнивает два файла и показывает различия. Текстовый diff из коробки.',
          examples: [
            { code: 'fc before.txt after.txt', note: 'Показать различия' },
            { code: 'fc /b a.bin b.bin', note: 'Бинарное сравнение' }
          ],
          tip: 'Для конфигов и логов удобнее <b>fc /n</b> — с номерами строк.'
        },
        {
          id: 'mklink',
          name: 'mklink',
          syntax: 'mklink [ссылка] [цель]\nmklink /D [ссылка] [цель]',
          desc: 'Создаёт символьную ссылку (или junction с /J). Нужны права администратора.',
          examples: [
            { code: 'mklink link.txt C:\\real\\file.txt', note: 'Ссылка на файл' },
            { code: 'mklink /D node_modules C:\\shared\\node_modules', note: 'Ссылка на папку' },
            { code: 'mklink /J build D:\\build', note: 'Junction без прав админа' }
          ],
          tip: 'Удобно, когда проект лежит на другом диске, а программа ищет папку рядом с собой.'
        }
      ]
    },
    {
      id: 'redirect',
      title: 'Потоки и конвейеры',
      desc: 'Куда уходит вывод и откуда берётся ввод',
      items: [
        {
          id: 'redirect-out',
          name: '> и >>',
          syntax: 'команда > файл\nкоманда >> файл',
          desc: '> перезаписывает файл, >> дописывает в конец. Если файла нет — создаёт.',
          examples: [
            { code: 'tasklist > processes.txt', note: 'Записать вывод в файл' },
            { code: 'echo start >> log.txt', note: 'Дописать строку' },
            { code: 'dir > nul', note: 'Выбросить вывод в никуда' }
          ],
          warn: '<b>&gt;</b> уничтожает старое содержимое без вопросов. Для логов почти всегда нужен <b>&gt;&gt;</b>.'
        },
        {
          id: 'redirect-in',
          name: '<',
          syntax: 'команда < файл',
          desc: 'Подаёт содержимое файла на стандартный вход программы.',
          examples: [
            { code: 'sort < names.txt', note: 'Отсортировать файл' },
            { code: 'sort < names.txt > sorted.txt', note: 'Вход и выход одновременно' },
            { code: 'findstr error < app.log', note: 'Искать в потоке' }
          ],
          tip: 'Многие команды CMD сами умеют читать файл, но <b>&lt;</b> полезен для программ без аргумента-файла.'
        },
        {
          id: 'redirect-err',
          name: '2> и 2>&1',
          syntax: 'команда 2> errors.txt\nкоманда > all.txt 2>&1',
          desc: '2> перенаправляет только ошибки. 2>&1 отправляет ошибки туда же, куда обычный вывод.',
          examples: [
            { code: 'del missing.txt 2>nul', note: 'Скрыть ошибку' },
            { code: 'build.bat > build.log 2>&1', note: 'Весь вывод и ошибки в один лог' },
            { code: 'tasklist 2>&1 | findstr chrome', note: 'В конвейер идут оба потока' }
          ],
          tip: 'Порядок важен: <b>&gt; log 2&gt;&amp;1</b> работает, <b>2&gt;&amp;1 &gt; log</b> — нет. Сначала подключаем stderr к stdout, потом stdout в файл.'
        },
        {
          id: 'pipe',
          name: '| (конвейер)',
          syntax: 'команда1 | команда2',
          desc: 'Передаёт stdout первой команды на stdin второй. Основа однострочных запросов.',
          examples: [
            { code: 'tasklist | findstr chrome', note: 'Найти процесс' },
            { code: 'dir /b | sort', note: 'Отсортировать имена' },
            { code: 'type big.log | more', note: 'Постраничный просмотр' },
            { code: 'tasklist /fo csv | findstr /v "Image"', note: 'CSV без заголовка' }
          ],
          tip: 'Конвейер можно продолжать: <b>dir /b | findstr .txt | sort /r</b>. Каждая команда делает одно действие.'
        },
        {
          id: 'and-or',
          name: '& && ||',
          syntax: 'a & b\na && b\na || b',
          desc: 'Управляют последовательностью команд через код возврата. & — всегда, && — при успехе, || — при ошибке.',
          examples: [
            { code: 'md backup & copy *.txt backup\\', note: 'Выполнить обе' },
            { code: 'git add . && git commit -m "update"', note: 'Коммит только если add успешен' },
            { code: 'git push || echo "push failed"', note: 'Сообщение при ошибке' }
          ],
          tip: 'Это самый короткий способ написать условие в одну строку, не открывая батник.'
        }
      ]
    },
    {
      id: 'env',
      title: 'Переменные и окружение',
      desc: 'set, setx, PATH, аргументы батника',
      items: [
        {
          id: 'set',
          name: 'set',
          syntax: 'set [имя]=[значение]\nset [имя]',
          desc: 'Показывает все переменные или задаёт/меняет одну. Действует только в текущем окне cmd.',
          examples: [
            { code: 'set', note: 'Все переменные окружения' },
            { code: 'set NAME=Петя', note: 'Создать переменную' },
            { code: 'set NAME=', note: 'Удалить переменную' },
            { code: 'echo %NAME%', note: 'Прочитать значение' }
          ],
          warn: 'Пробелы вокруг <b>=</b> входят в имя или значение: <b>set NAME = Петя</b> создаст переменную <b>"NAME "</b>. Пиши без пробелов.'
        },
        {
          id: 'set-a',
          name: 'set /a',
          syntax: 'set /a [переменная]=[выражение]',
          desc: 'Арифметика в CMD: + - * / % и скобки. Результат можно сразу положить в переменную.',
          examples: [
            { code: 'set /a x=2+3*4', note: 'x = 14' },
            { code: 'set /a x=(2+3)*4', note: 'x = 20' },
            { code: 'set /a count+=1', note: 'Инкремент' }
          ],
          tip: 'В батнике с <b>setlocal enabledelayedexpansion</b> результат читают как <b>!x!</b> внутри циклов.'
        },
        {
          id: 'set-p',
          name: 'set /p',
          syntax: 'set /p имя=[подсказка]',
          desc: 'Читает строку, введённую пользователем, в переменную. Ввод с терминала в батнике.',
          examples: [
            { code: 'set /p NAME=Введите имя: ', note: 'Ждёт ввод' },
            { code: 'set /p AGE=Возраст: ', note: 'Строка, не число' },
            { code: 'set /p CONFIRM=Продолжить? (y/n) ', note: 'Простое подтверждение' }
          ],
          tip: '<b>set /p</b> вернёт errorlevel 1, если пользователь нажал Ctrl+Z. Числа потом проверяй через <b>set /a</b>.'
        },
        {
          id: 'setx',
          name: 'setx',
          syntax: 'setx [имя] [значение] [/M]',
          desc: 'Записывает переменную навсегда — для будущих окон. /M — системная (нужен админ).',
          examples: [
            { code: 'setx EDITOR "code --wait"', note: 'Для текущего пользователя' },
            { code: 'setx PATH "%PATH%;C:\\Tools"', note: 'Дополнить PATH' },
            { code: 'setx JAVA_HOME "C:\\Java\\jdk21" /M', note: 'Системная переменная' }
          ],
          warn: 'setx не меняет уже открытые окна. И <b>setx PATH "%PATH%;..."</b> может обрезать PATH до 1024 символов — делай бэкап.'
        },
        {
          id: 'path',
          name: 'PATH',
          syntax: 'echo %PATH%\nset PATH=%PATH%;C:\\Tools',
          desc: 'Список папок через ;, где Windows ищет программы. Дополнение PATH — типовая задача после установки.',
          examples: [
            { code: 'echo %PATH%', note: 'Показать PATH' },
            { code: 'set PATH=%PATH%;C:\\Tools', note: 'Только текущая сессия' },
            { code: 'setx PATH "%PATH%;C:\\Tools"', note: 'Навсегда' },
            { code: 'where git', note: 'Проверить, что видно' }
          ],
          tip: 'Порядок папок = приоритет. Если в PATH два python, запустится первый.'
        },
        {
          id: 'var-expand',
          name: '%VAR% и %~dp0',
          syntax: '%ИМЯ%\n%~dp0',
          desc: '%ИМЯ% подставляет значение переменной. %~dp0 — диск и путь к текущему bat-файлу, всегда с обратным слэшем.',
          examples: [
            { code: 'echo %USERPROFILE%', note: 'Домашняя папка' },
            { code: 'echo %CD%', note: 'Текущая папка' },
            { code: 'copy data.txt "%~dp0backup\\"', note: 'Путь относительно скрипта' },
            { code: 'echo %DATE% %TIME%', note: 'Дата и время' }
          ],
          tip: 'В батнике <b>%~dp0</b> — единственный надёжный способ найти файлы рядом со скриптом, независимо от того, откуда его запустили.'
        },
        {
          id: 'setlocal',
          name: 'setlocal / endlocal',
          syntax: 'setlocal [enabledelayedexpansion]\nendlocal',
          desc: 'Создаёт локальную область переменных. Изменения внутри не вытекают наружу.',
          examples: [
            { code: 'setlocal enabledelayedexpansion', note: 'Включить !var! в циклах' },
            { code: 'setlocal\nset X=1\nendlocal', note: 'X исчезнет после endlocal' }
          ],
          tip: 'Delayed expansion нужен, когда переменная меняется внутри <b>for</b> или <b>if</b>: <b>!var!</b> читается в момент выполнения, а <b>%var%</b> — при разборе строки.'
        },
        {
          id: 'call',
          name: 'call',
          syntax: 'call script.bat [аргументы]\ncall :label [аргументы]',
          desc: 'Вызывает другой bat-файл и возвращается обратно. Без call управление уйдёт навсегда.',
          examples: [
            { code: 'call build.bat Release', note: 'Запустить и вернуться' },
            { code: 'call :log "готово"', note: 'Вызвать подпрограмму' },
            { code: 'call %~dp0tools\\clean.bat', note: 'Скрипт рядом' }
          ],
          tip: 'В подпрограмме аргументы всё те же <b>%1</b>, а после неё нужен <b>exit /b</b>, иначе выполнение «провалится» дальше.'
        }
      ]
    },
    {
      id: 'batch',
      title: 'Бат-файлы и логика',
      desc: 'Скрипты, условия, циклы, пауза',
      items: [
        {
          id: 'echo-off',
          name: '@echo off',
          syntax: '@echo off\necho on',
          desc: 'Отключает печать самих команд. @ перед командой скрывает и её саму.',
          examples: [
            { code: '@echo off', note: 'Первая строка почти любого батника' },
            { code: '@echo off & cls', note: 'Скрыть и очистить' },
            { code: 'echo on', note: 'Включить обратно для отладки' }
          ],
          tip: 'Без <b>@echo off</b> в консоли видно каждую команду скрипта — полезно при отладке, но не в финале.'
        },
        {
          id: 'echo',
          name: 'echo',
          syntax: 'echo [текст]\necho.\necho %VAR%',
          desc: 'Печатает текст или значение переменной. echo. выводит пустую строку.',
          examples: [
            { code: 'echo Hello, world!', note: 'Текст' },
            { code: 'echo.', note: 'Пустая строка' },
            { code: 'echo %USERNAME%', note: 'Значение переменной' },
            { code: 'echo text > file.txt', note: 'Записать текст в файл' }
          ],
          tip: '<b>echo</b> без аргументов покажет, включён ли режим эха. <b>echo off</b> и <b>echo.</b> — разные вещи.'
        },
        {
          id: 'pause',
          name: 'pause',
          syntax: 'pause',
          desc: 'Останавливает скрипт и ждёт нажатия любой клавиши. Окно не закроется, пока не прочитаешь вывод.',
          examples: [
            { code: 'pause', note: '«Для продолжения нажмите любую клавишу...»' },
            { code: 'pause >nul', note: 'Ждать, но без текста' },
            { code: 'timeout /t 5', note: 'Пауза 5 секунд без нажатия' }
          ],
          tip: 'В конце батника, запущенного двойным кликом, <b>pause</b> обязателен — иначе окно исчезнет вместе с ошибкой.'
        },
        {
          id: 'if-exist',
          name: 'if exist',
          syntax: 'if exist [путь] (команда) else (команда)',
          desc: 'Проверяет существование файла или папки. Основа безопасных скриптов.',
          examples: [
            { code: 'if exist 1.txt md backup', note: 'Папка только если файл есть' },
            { code: 'if not exist backup md backup', note: 'Создать, если нет' },
            { code: 'if exist "%~dp0config.ini" (echo found) else (echo no config)', note: 'С else' }
          ],
          tip: 'Скобки и пробелы важны: <b>if exist 1.txt(md 1)</b> может не сработать — ставь пробел перед <b>(</b>.'
        },
        {
          id: 'if-errorlevel',
          name: 'if errorlevel',
          syntax: 'if errorlevel 1 ...\nif %errorlevel% neq 0 ...',
          desc: 'Проверяет код возврата предыдущей команды. if errorlevel N истинно при коде >= N.',
          examples: [
            { code: 'git status\nif errorlevel 1 echo Не репозиторий', note: 'Проверка кода' },
            { code: 'if %errorlevel% neq 0 exit /b 1', note: 'Точное сравнение' },
            { code: 'fc a.txt b.txt >nul || echo Файлы разные', note: 'Короткая форма' }
          ],
          warn: 'Внутри блока <b>( ... )</b> используй <b>if errorlevel</b> или delayed expansion: <b>%errorlevel%</b> подставится один раз при разборе всего блока.'
        },
        {
          id: 'goto',
          name: 'goto / :label',
          syntax: 'goto [метка]\n:метка',
          desc: 'Переход к метке. Так делают циклы и меню в старом стиле.',
          examples: [
            { code: 'goto :end', note: 'Прыгнуть в конец' },
            { code: ':menu\necho 1 - start\ngoto :menu', note: 'Метка и возврат' },
            { code: ':end\nexit /b 0', note: 'Конец скрипта' }
          ],
          tip: 'Метка начинается с <b>:</b> и должна быть на отдельной строке. <b>goto :eof</b> — встроенный выход.'
        },
        {
          id: 'for',
          name: 'for %%i in (...) do',
          syntax: 'for %%i in (*.txt) do echo %%i\nfor /r %%i in (*) do ...\nfor /l %%i in (1,1,10) do ...',
          desc: 'Цикл по файлам, списку или диапазону чисел. В bat-файле двойные %%, в консоли — одинарные.',
          examples: [
            { code: 'for %%f in (*.txt) do echo %%f', note: 'Все .txt' },
            { code: 'for /r %%f in (*.log) do del "%%f"', note: 'Рекурсивно' },
            { code: 'for /l %%i in (1,1,5) do echo %%i', note: '1..5' },
            { code: 'for /d %%d in (*) do echo %%d', note: 'Только папки' }
          ],
          tip: 'В консоли пиши <b>%f</b>, в файле — <b>%%f</b>. Это самая частая ошибка при копировании цикла из интернета.'
        },
        {
          id: 'exit-b',
          name: 'exit /b',
          syntax: 'exit /b [код]',
          desc: 'Выходит из текущего bat-файла или подпрограммы, не закрывая окно. Код становится errorlevel.',
          examples: [
            { code: 'exit /b 0', note: 'Успех' },
            { code: 'if not exist file exit /b 1', note: 'Ошибка' },
            { code: 'exit /b', note: 'Просто выйти' }
          ],
          tip: 'Голый <b>exit</b> закроет всё окно cmd. В скриптах почти всегда нужен именно <b>exit /b</b>.'
        },
        {
          id: 'timeout',
          name: 'timeout / choice',
          syntax: 'timeout /t [сек] [/nobreak]\nchoice /c YN /m "текст"',
          desc: 'Пауза по времени или выбор варианта. Вежливая замена pause.',
          examples: [
            { code: 'timeout /t 5', note: 'Ждать 5 секунд' },
            { code: 'timeout /t 5 /nobreak >nul', note: 'Нельзя прервать клавишей' },
            { code: 'choice /c YN /m "Продолжить"', note: 'Y или N, код 1 или 2' }
          ],
          tip: 'После <b>choice</b> результат лежит в <b>%errorlevel%</b>: 1 — первый вариант, 2 — второй.'
        },
        {
          id: 'start',
          name: 'start',
          syntax: 'start [заголовок] [программа] [аргументы]',
          desc: 'Запускает программу в новом окне или открывает файл ассоциированным приложением.',
          examples: [
            { code: 'start notepad', note: 'Открыть блокнот' },
            { code: 'start "" "C:\\My App\\app.exe"', note: 'Пустой заголовок обязателен' },
            { code: 'start https://github.com', note: 'Открыть сайт' },
            { code: 'start /wait build.bat', note: 'Дождаться завершения' }
          ],
          tip: 'Первый аргумент start — заголовок окна. Если путь в кавычках, первым ставь <b>""</b>, иначе start примет путь за заголовок.'
        },
        {
          id: 'title-color',
          name: 'title / color',
          syntax: 'title [текст]\ncolor [фон][текст]',
          desc: 'Меняет заголовок окна и цвета консоли. Косметика, но помогает не перепутать окна.',
          examples: [
            { code: 'title Build server', note: 'Заголовок' },
            { code: 'color 0A', note: 'Чёрный фон, зелёный текст' },
            { code: 'color', note: 'Вернуть по умолчанию' }
          ],
          tip: 'Цвета — hex-цифры: 0 чёрный, A зелёный, C красный, F белый. Первая цифра фон, вторая текст.'
        }
      ]
    },
    {
      id: 'process',
      title: 'Процессы и система',
      desc: 'Что запущено и как это остановить',
      items: [
        {
          id: 'tasklist',
          name: 'tasklist',
          syntax: 'tasklist [/v] [/fi фильтр] [/fo table|csv|list] [/nh]',
          desc: 'Список запущенных процессов с PID и памятью. Диспетчер задач в текстовом виде.',
          examples: [
            { code: 'tasklist', note: 'Все процессы' },
            { code: 'tasklist | findstr /i chrome', note: 'Только Chrome' },
            { code: 'tasklist /fi "imagename eq notepad.exe"', note: 'Фильтр по имени' },
            { code: 'tasklist /fo csv /nh > procs.csv', note: 'CSV без заголовка в файл' },
            { code: 'tasklist /v /fo list', note: 'Подробно' }
          ],
          tip: 'В CSV-выводе каждая строка — один процесс. Удобно для сортировки и Excel.'
        },
        {
          id: 'taskkill',
          name: 'taskkill',
          syntax: 'taskkill /IM [имя] [/F] [/T]\ntaskkill /PID [pid] [/F]',
          desc: 'Завершает процесс по имени или PID. /F — принудительно, /T — вместе с дочерними.',
          examples: [
            { code: 'taskkill /IM notepad.exe', note: 'Вежливо закрыть' },
            { code: 'taskkill /IM chrome.exe /F /T', note: 'Убить всё дерево Chrome' },
            { code: 'taskkill /PID 1234 /F', note: 'По PID' },
            { code: 'taskkill /IM node.exe /F 2>nul', note: 'Без ошибки, если не запущен' }
          ],
          warn: 'Не убивай <b>explorer.exe</b> и системные процессы без понимания. /F не даёт программе сохранить данные.'
        }
      ]
    }
  ],

  cheats: [
    {
      title: 'Навигация',
      rows: [
        ['cd /d D:\\dev', 'перейти на диск и в папку'],
        ['cd ..', 'на уровень выше'],
        ['dir /a /b', 'все файлы, только имена'],
        ['tree /f', 'дерево с файлами'],
        ['where git', 'путь к программе']
      ]
    },
    {
      title: 'Файлы',
      rows: [
        ['md a\\b\\c', 'создать цепочку папок'],
        ['rd /s /q temp', 'удалить папку с содержимым'],
        ['del *.tmp', 'удалить по маске'],
        ['copy *.txt backup\\', 'копировать все .txt'],
        ['xcopy src dst /E /I', 'копировать папку целиком'],
        ['robocopy src dst /MIR', 'зеркальная копия'],
        ['ren old.txt new.txt', 'переименовать'],
        ['type file.txt', 'показать содержимое']
      ]
    },
    {
      title: 'Потоки',
      rows: [
        ['cmd > file', 'перезаписать файл'],
        ['cmd >> file', 'дописать в файл'],
        ['cmd 2> errors.txt', 'только ошибки'],
        ['cmd > all.log 2>&1', 'вывод и ошибки вместе'],
        ['cmd1 | cmd2', 'конвейер'],
        ['cmd1 && cmd2', 'вторая при успехе'],
        ['cmd1 || cmd2', 'вторая при ошибке']
      ]
    },
    {
      title: 'Переменные',
      rows: [
        ['set NAME=value', 'в текущей сессии'],
        ['set NAME=', 'удалить переменную'],
        ['set /a x=2+3', 'арифметика'],
        ['set /p X=Ввод: ', 'прочитать строку'],
        ['setx NAME value', 'навсегда'],
        ['%USERPROFILE%', 'домашняя папка'],
        ['%~dp0', 'папка bat-файла'],
        ['echo %PATH%', 'список путей поиска']
      ]
    },
    {
      title: 'Скрипты',
      rows: [
        ['@echo off', 'скрыть команды'],
        ['echo text', 'печать'],
        ['echo.', 'пустая строка'],
        ['pause', 'ждать клавишу'],
        ['if exist file ...', 'проверка файла'],
        ['if errorlevel 1 ...', 'проверка кода'],
        ['goto :label', 'переход'],
        ['for %%f in (*.txt) do ...', 'цикл по файлам'],
        ['exit /b 0', 'выход из скрипта']
      ]
    },
    {
      title: 'Процессы',
      rows: [
        ['tasklist', 'список процессов'],
        ['tasklist /fi "imagename eq X"', 'фильтр'],
        ['tasklist | findstr X', 'поиск по выводу'],
        ['taskkill /IM name /F', 'убить по имени'],
        ['taskkill /PID 123 /F', 'убить по PID'],
        ['start app.exe', 'запустить программу']
      ]
    }
  ]
};
