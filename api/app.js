// Предустановленные задачи
const DEFAULT_TASKS = [
  {
    id: 1,
    title: "Подключиться к VPS через консоль хостинг-провайдера",
    description: "Для первичного доступа используйте веб-консоль арендодателя (DNS-администратор или панель управления). Введите логин и пароль, выданные после создания сервера.",
    command: "логин: <выданный логин>\nпароль: <выданный пароль>",
    completed: false,
    trouble: "При неверном вводе учётных данных доступ будет отклонён. Обратите внимание: поле пароля при вводе может оставаться пустым — это нормально, ввод всё равно происходит. Используйте данные именно от панели VPS, а не от личного кабинета."
  },
  {
    id: 2,
    title: "Подключиться к серверу по SSH с публичным IP",
    description: "Выполните вход на сервер с вашего локального терминала, используя публичный IP-адрес, который вы получили или приобрели отдельно у провайдера.",
    command: "ssh root@<публичный_IP>",
    completed: false,
    trouble: "При первом подключении может появиться предупреждение: «The authenticity of host ... can't be established». Это нормально, введите yes. Если подключение не удаётся, проверьте, что используется публичный, а не приватный IP. Для корректной работы домена в дальнейшем везде должен фигурировать именно публичный IP; при правильной настройке записей A-записи могут создаться автоматически."
  },
  {
    id: 3,
    title: "Установить веб-сервер Nginx",
    description: "Обновите списки пакетов и установите Nginx. Сервер будет обрабатывать HTTP- и HTTPS-запросы.",
    command: "sudo apt update && sudo apt install nginx -y",
    completed: false,
    trouble: "Ошибки вида «Invalid syntax» или «Permission denied» возникают при неправильном написании команд или отсутствии прав суперпользователя. Убедитесь, что вы выполняете команды от root или с sudo."
  },
  {
    id: 4,
    title: "Создать корневую директорию для сайта",
    description: "Создайте папку, в которой будут храниться файлы вашего сайта. Имя можно выбрать любое.",
    command: "sudo mkdir -p /var/www/имя_сайта",
    completed: false,
    trouble: "Ошибка может возникнуть при недостаточности прав на запись в /var/www — используйте sudo. Если директория уже существует, команда не выдаст ошибки благодаря флагу -p."
  },
  {
    id: 5,
    title: "Создать тестовую HTML-страницу",
    description: "Поместите в директорию сайта простой index.html, чтобы проверить работу веб-сервера.",
    command: `cat > /var/www/имя_сайта/index.html <<EOF
<!DOCTYPE html>
<html>
<head><title>My Site</title></head>
<body><h1>Всё работает!</h1></body>
</html>
EOF`,
    completed: false,
    trouble: "Если сайт отображается некорректно, проверьте синтаксис HTML-документа: все теги должны быть закрыты, а содержимое — валидным. Для проверки откройте файл в браузере или выполните cat /var/www/имя_сайта/index.html."
  },
  {
    id: 6,
    title: "Настроить конфигурацию Nginx для сайта",
    description: "Создайте файл конфигурации в /etc/nginx/sites-available/. Опишите в нём виртуальный хост, который будет отдавать ваш сайт по порту 80.",
    command: `sudo nano /etc/nginx/sites-available/имя_сайта

# В открывшемся редакторе вставьте:
server {
    listen 80;
    server_name <публичный_IP или ваш_домен>;
    root /var/www/имя_сайта;
    index index.html;
}
# Сохраните: Ctrl+O, Enter, Ctrl+X`,
    completed: false,
    trouble: "Если директория /etc/nginx/sites-available/ отсутствует, создайте её командой sudo mkdir -p /etc/nginx/sites-available/. Также проверьте, что путь root указан верно и существует."
  },
  {
    id: 7,
    title: "Активировать сайт и перезапустить Nginx",
    description: "Создайте символическую ссылку на конфигурацию в sites-enabled, удалите стандартную заглушку, проверьте корректность конфигурации и перезагрузите сервер.",
    command: `sudo ln -s /etc/nginx/sites-available/имя_сайта /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx`,
    completed: false,
    trouble: "Если сайт не открывается, выполните диагностику:\n1. nslookup ваш_домен — убедитесь, что возвращается ваш публичный IP.\n2. sudo nginx -t — проверьте синтаксис конфигурации.\n3. ss -tlnp | grep :80 — порт 80 должен слушаться Nginx (0.0.0.0:80).\n4. ufw status — файрвол должен быть неактивен или разрешать порт 80.\n5. Возможно, включён только default — удалите его и создайте симлинк, как указано выше.\n6. Если домен добавлен недавно, подождите до 24 часов — DNS может ещё не распространиться."
  },
  {
    id: 8,
    title: "Настроить DNS A-запись для домена",
    description: "В панели управления доменом создайте (или отредактируйте) A-запись, указывающую на ваш публичный IP-адрес. TTL можно оставить по умолчанию (3600).",
    command: "Имя: ваш_домен (или @)\nЗначение: <публичный_IP>\nТип: A\nTTL: 3600",
    completed: false,
    trouble: "После добавления записи сайт может оставаться недоступным от нескольких минут до часа (реже — до суток) из-за кэширования DNS. Проверить можно командой nslookup ваш_домен: в ответе должен быть ваш IP."
  },
  {
    id: 9,
    title: "Загрузить файлы сайта на сервер",
    description: "Перенесите готовые файлы вашего проекта в корневую директорию сайта на VPS. Используйте rsync или scp.",
    command: "rsync -avz /путь/к/локальной/папке/ root@<публичный_IP>:/var/www/имя_сайта/\n# или\nscp -r /путь/к/локальной/папке root@<публичный_IP>:/var/www/имя_сайта",
    completed: false,
    trouble: "Ошибка может возникнуть при неверном пути, отсутствии прав на локальные файлы или если сервер не принимает подключение по SSH. Убедитесь, что вы используете публичный IP и правильные учётные данные."
  },
  {
    id: 10,
    title: "Обновить конфигурацию Nginx для HTTPS",
    description: "Замените прежний блок server на два: один для редиректа с HTTP на HTTPS, второй для обслуживания HTTPS с указанием путей к сертификатам (они появятся после установки Certbot). Предварительно можно подготовить шаблон.",
    command: `# Было:
server {
    listen 80;
    server_name ваш_домен www.ваш_домен;
    root /var/www/имя_сайта;
    index index.html;
}

# Стало:
server {
    listen 80;
    server_name ваш_домен www.ваш_домен;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name ваш_домен www.ваш_домен;
    ssl_certificate /etc/letsencrypt/live/ваш_домен/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ваш_домен/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    root /var/www/имя_сайта;
    index index.html;
}`,
    completed: false,
    trouble: "Пути к сертификатам будут созданы после запуска Certbot. Если вы редактируете конфиг вручную до получения сертификатов, укажите временные заглушки или закомментируйте ssl-строки до выполнения 12-го шага."
  },
  {
    id: 11,
    title: "Установить Certbot и плагин для Nginx",
    description: "Certbot — клиент Let's Encrypt, который автоматически выпускает и обновляет SSL-сертификаты.",
    command: "sudo apt install certbot python3-certbot-nginx -y",
    completed: false,
    trouble: "Если пакет не найден, выполните sudo apt update. Для Ubuntu 20.04 и новее пакеты доступны из официальных репозиториев."
  },
  {
    id: 12,
    title: "Запустить Certbot и получить SSL-сертификаты",
    description: "Запустите интерактивный мастер Certbot, указав ваш домен с www и без. Он автоматически изменит конфигурацию Nginx, добавив редирект и SSL-строки.",
    command: "sudo certbot --nginx -d ваш_домен -d www.ваш_домен",
    completed: false,
    trouble: "Иногда редирект не прописывается автоматически. После выполнения проверьте конфигурацию Nginx и убедитесь, что в ней появились нужные блоки. Список полученных сертификатов можно посмотреть командой sudo certbot certificates."
  },
  {
    id: 13,
    title: "Проверить автоматическое обновление сертификатов",
    description: "Сертификаты Let's Encrypt действуют 90 дней, но Certbot устанавливает таймер для автообновления. Проверьте его работу в тестовом режиме.",
    command: "sudo certbot renew --dry-run",
    completed: false,
    trouble: "Если dry-run завершился с ошибкой, убедитесь, что служба certbot.timer активна: systemctl status certbot.timer. При необходимости запустите её: sudo systemctl enable --now certbot.timer."
  },
  {
    id: 14,
    title: "Перезагрузить Nginx и убедиться в работе HTTPS",
    description: "Примените все изменения конфигурации и проверьте, что сайт открывается по https:// с зелёным замком.",
    command: "sudo systemctl reload nginx",
    completed: false,
    trouble: "Если замок красный или страница не загружается, проверьте, что сертификат привязан к правильному домену, в конфигурации нет смешанного контента, а порт 443 открыт. Также перепроверьте шаги 10 и 12: возможно, блок server для 443 порта не был записан."
  }
];

const STORAGE_KEY = "https_checklist_tasks";
let tasks = [];
let checklistRendered = false;

// DOM элементы
const checklistSection = document.getElementById("todo-list");
const tasksContainer = document.getElementById("tasksContainer");
const completedSpan = document.getElementById("completedCount");
const totalSpan = document.getElementById("totalCount");
const progressFill = document.getElementById("progressFill");
const resetBtn = document.getElementById("resetBtn");
const addTaskBtn = document.getElementById("addTaskBtn");
const newTaskTitle = document.getElementById("newTaskTitle");
const newTaskDesc = document.getElementById("newTaskDesc");
const congratsBlock = document.getElementById("congratsBlock");
const showBtn = document.getElementById("showChecklistBtn");

// Модальные окна
const troubleModal = document.getElementById("troubleModal");
const troubleText = document.getElementById("troubleText");
const troubleModalClose = document.querySelector("#troubleModal .modal-close");

const resetModal = document.getElementById("resetModal");
const resetModalClose = document.getElementById("resetModalClose");
const resetProgressBtn = document.getElementById("resetProgressBtn");
const clearAllTasksBtn = document.getElementById("clearAllTasksBtn");
const restoreDefaultBtn = document.getElementById("restoreDefaultBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");

const deleteModal = document.getElementById("deleteModal");
const deleteModalClose = document.getElementById("deleteModalClose");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const deleteTaskTitleSpan = document.getElementById("deleteTaskTitle");
let deletingTaskId = null;

//  Работа с данными 
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        tasks = JSON.parse(stored);
    } else {
        tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
    }
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    if (completedSpan) completedSpan.textContent = completed;
    if (totalSpan) totalSpan.textContent = total;
    const percent = total === 0 ? 0 : (completed / total) * 100;
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (congratsBlock) {
        congratsBlock.style.display = (total > 0 && completed === total) ? "block" : "none";
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function getFirstIncompleteIndex() {
    return tasks.findIndex(t => !t.completed);
}

function renderTasks() {
    if (!tasksContainer) return;
    if (tasks.length === 0) {
        tasksContainer.innerHTML = '<div class="task-card" style="text-align:center; animation: none; opacity:1; transform:none;">✨ Нет задач. Добавьте первую задачу!</div>';
        updateStats();
        return;
    }

    const firstIncompleteIdx = getFirstIncompleteIndex();
    let html = "";

    tasks.forEach((task, idx) => {
        const isLocked = firstIncompleteIdx !== -1 && idx > firstIncompleteIdx;
        const isCurrent = idx === firstIncompleteIdx;
        const completedClass = task.completed ? "completed" : "";
        const statusClass = task.completed ? "completed" : "pending";
        const statusText = task.completed ? "Выполнено" : "В процессе";
        const checkedAttr = task.completed ? "checked" : "";

        let cardClasses = "task-card";
        if (isLocked) cardClasses += " locked";
        if (isCurrent) cardClasses += " current-task";
        if (task.completed) cardClasses += " completed";

        html += `
            <div class="${cardClasses}" data-id="${task.id}" style="animation-delay: ${idx * 0.05}s">
                <div class="task-number">${idx + 1}</div>
                <div class="task-header">
                    <div class="task-title">
                        <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${checkedAttr} ${isLocked ? "disabled" : ""}>
                        <span>${escapeHtml(task.title)}</span>
                    </div>
                    <div class="task-status-badge ${statusClass}">${statusText}</div>
                </div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : '<div class="task-description" style="color:#A0AEC0;">(нет описания)</div>'}
                ${task.command ? `<div class="task-commands">${escapeHtml(task.command)}</div>` : ''}
                <div class="card-actions">
                    <button class="edit-toggle-btn" data-id="${task.id}">✏️ Редактировать описание</button>
                    <button class="trouble-btn" data-id="${task.id}">⚠️ Проблемы</button>
                    <button class="btn-secondary delete-task" data-id="${task.id}" style="background:#EF4444;">Удалить</button>
                </div>
            </div>
        `;
    });

    tasksContainer.innerHTML = html;
    
    // Навешиваем обработчики
    document.querySelectorAll(".task-checkbox").forEach(cb => {
        cb.addEventListener("change", (e) => {
            const id = parseInt(e.target.dataset.id);
            toggleTaskCompletion(id);
        });
    });
    document.querySelectorAll(".delete-task").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(btn.dataset.id);
            confirmDeleteTask(id);
        });
    });
    document.querySelectorAll(".edit-toggle-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(btn.dataset.id);
            startEdit(id);
        });
    });
    document.querySelectorAll(".trouble-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(btn.dataset.id);
            showTroubleModal(id);
        });
    });

    updateStats();
}

function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const firstIncompleteIdx = getFirstIncompleteIndex();
    const taskIdx = tasks.findIndex(t => t.id === id);
    if (firstIncompleteIdx !== -1 && taskIdx > firstIncompleteIdx) return;
    
    task.completed = !task.completed;
    saveTasks();
    refreshAllCardsState();  
}

function confirmDeleteTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    deleteTaskTitleSpan.textContent = `«${task.title}»`;
    deletingTaskId = id;
    deleteModal.style.display = "flex";
}

function refreshAllCardsState() {
    if (!tasksContainer) return;
    const firstIncompleteIdx = getFirstIncompleteIndex();
    const cards = tasksContainer.querySelectorAll('.task-card');
    cards.forEach(card => {
        const id = parseInt(card.dataset.id);
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const idx = tasks.findIndex(t => t.id === id);

        // Обновляем чекбокс и его disabled-состояние
        const checkbox = card.querySelector('.task-checkbox');
        if (checkbox) {
            checkbox.checked = task.completed;
            checkbox.disabled = (firstIncompleteIdx !== -1 && idx > firstIncompleteIdx);
        }

        // Обновляем бейдж статуса
        const badge = card.querySelector('.task-status-badge');
        if (badge) {
            badge.textContent = task.completed ? 'Выполнено' : 'В процессе';
            badge.className = 'task-status-badge ' + (task.completed ? 'completed' : 'pending');
        }

        // Обновляем классы карточки
        card.classList.toggle('completed', task.completed);
        card.classList.toggle('current-task', idx === firstIncompleteIdx);
        card.classList.toggle('locked', firstIncompleteIdx !== -1 && idx > firstIncompleteIdx);
    });
    updateStats();
}

function deleteTaskConfirmed() {
    if (deletingTaskId === null) return;
    tasks = tasks.filter(t => t.id !== deletingTaskId);
    saveTasks();
    renderTasks();
    closeDeleteModal();
}

function closeDeleteModal() {
    deleteModal.style.display = "none";
    deletingTaskId = null;
}

function startEdit(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const card = document.querySelector(`.task-card[data-id='${taskId}']`);
    if (card.querySelector(".edit-area")) return;
    const editHtml = `
        <div class="edit-area" style="margin: 16px 0;">
            <textarea class="edit-textarea" rows="2" style="width:100%; padding:8px; border-radius:12px; border:1px solid #CBD5E1; font-family: inherit;">${escapeHtml(task.description || "")}</textarea>
            <div style="display:flex; gap:12px; margin-top:12px; justify-content:flex-end;">
                <button class="save-edit-btn btn-primary" style="padding:6px 16px;">Сохранить</button>
                <button class="cancel-edit-btn btn-secondary" style="padding:6px 16px;">Отмена</button>
            </div>
        </div>
    `;
    const insertAfter = card.querySelector(".task-description") || card.querySelector(".task-commands") || card.querySelector(".task-header");
    insertAfter.insertAdjacentHTML("afterend", editHtml);
    const editBlock = card.querySelector(".edit-area");
    const textarea = editBlock.querySelector("textarea");
    const saveBtn = editBlock.querySelector(".save-edit-btn");
    const cancelBtn = editBlock.querySelector(".cancel-edit-btn");
    saveBtn.onclick = () => {
        task.description = textarea.value.trim();
        saveTasks();
        renderTasks();
    };
    cancelBtn.onclick = () => editBlock.remove();
}

function showTroubleModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    troubleText.textContent = task?.trouble || "Нет информации о возможных проблемах для этой задачи.";
    troubleModal.style.display = "flex";
}
function closeTroubleModal() {
    troubleModal.style.display = "none";
}
if (troubleModalClose) troubleModalClose.onclick = closeTroubleModal;

//  Сброс 
function openResetModal() {
    if (resetModal) resetModal.style.display = "flex";
}
function closeResetModal() {
    if (resetModal) resetModal.style.display = "none";
}
function resetProgress() {
    tasks.forEach(task => { task.completed = false; });
    saveTasks();
    renderTasks();
    closeResetModal();
}
function clearAllTasks() {
    tasks = [];
    saveTasks();
    renderTasks();
    closeResetModal();
}
function restoreDefaultTasks() {
    tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
    saveTasks();
    renderTasks();
    closeResetModal();
}

if (resetProgressBtn) resetProgressBtn.addEventListener("click", resetProgress);
if (clearAllTasksBtn) clearAllTasksBtn.addEventListener("click", clearAllTasks);
if (restoreDefaultBtn) restoreDefaultBtn.addEventListener("click", restoreDefaultTasks);
if (cancelResetBtn) cancelResetBtn.addEventListener("click", closeResetModal);
if (resetModalClose) resetModalClose.addEventListener("click", closeResetModal);

if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", deleteTaskConfirmed);
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
if (deleteModalClose) deleteModalClose.addEventListener("click", closeDeleteModal);

// Закрытие модалок по клику на фон
window.addEventListener("click", function(e) {
    if (e.target === troubleModal) closeTroubleModal();
    if (e.target === resetModal) closeResetModal();
    if (e.target === deleteModal) closeDeleteModal();
});

function addNewTask() {
    const title = newTaskTitle.value.trim();
    if (!title) {
        alert("Введите название задачи");
        return;
    }
    const description = newTaskDesc.value.trim();
    const maxId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) : 0;
    const newId = maxId + 1;
    tasks.push({
        id: newId,
        title: title,
        description: description,
        command: "",
        completed: false,
        trouble: "Информация о проблемах не добавлена."
    });
    saveTasks();
    renderTasks();
    newTaskTitle.value = "";
    newTaskDesc.value = "";
}

// ========== Показ чек-листа ==========
function showChecklist() {
    if (!checklistSection) return;
    if (checklistSection.classList.contains("hidden-checklist")) {
        checklistSection.classList.remove("hidden-checklist");
        checklistSection.classList.add("checklist-visible");
        if (!checklistRendered) {
            loadTasks();
            renderTasks();
            checklistRendered = true;
        }
        setTimeout(() => {
            checklistSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    } else {
        checklistSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

if (showBtn) showBtn.addEventListener("click", showChecklist);
if (resetBtn) resetBtn.addEventListener("click", openResetModal);
if (addTaskBtn) addTaskBtn.addEventListener("click", addNewTask);

if (window.location.hash === "#todo-list") {
    showChecklist();
}

if (checklistSection && !checklistSection.classList.contains("hidden-checklist") && !checklistRendered) {
    showChecklist();
}