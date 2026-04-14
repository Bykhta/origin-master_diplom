// Предустановленные задачи (шаги настройки HTTPS)
const DEFAULT_TASKS = [
  { id: 1, title: "Приобрести домен и настроить A-запись на IP сервера", description: "Домен должен указывать на ваш VPS. Проверьте через ping или nslookup.", command: "", completed: false, trouble: "Убедитесь, что домен не заблокирован, NS-записи корректны. Распространение DNS может занять до 24 часов." },
  { id: 2, title: "Установить Nginx", description: "Базовый веб-сервер для обработки HTTP/HTTPS запросов.", command: "sudo apt update && sudo apt install nginx -y", completed: false, trouble: "Если порт 80 уже занят, остановите другой сервер. Убедитесь, что нет конфликта с Apache." },
  { id: 3, title: "Создать конфигурацию сайта", description: "Файл в /etc/nginx/sites-available/ваш-сайт с server_name и root.", command: "server {\n    listen 80;\n    server_name your-domain.com;\n    root /var/www/html;\n}", completed: false, trouble: "Проверьте права на чтение корневой директории. Имя сервера должно точно совпадать с доменом." },
  { id: 4, title: "Включить сайт и проверить конфигурацию", description: "Создать симлинк и перезагрузить Nginx.", command: "sudo ln -s /etc/nginx/sites-available/ваш-сайт /etc/nginx/sites-enabled/\nsudo nginx -t\nsudo systemctl reload nginx", completed: false, trouble: "Ошибка 'nginx: [emerg]' указывает на синтаксическую ошибку в конфиге. Проверьте точку с запятой." },
  { id: 5, title: "Установить Certbot и плагин для Nginx", description: "Certbot — клиент Let's Encrypt для автоматического получения сертификатов.", command: "sudo apt install certbot python3-certbot-nginx -y", completed: false, trouble: "Если репозиторий устарел, выполните sudo apt update. Для Ubuntu 20.04+ всё работает из коробки." },
  { id: 6, title: "Получить SSL-сертификат", description: "Запустите Certbot в интерактивном режиме для вашего домена.", command: "sudo certbot --nginx -d ваш-домен.com", completed: false, trouble: "Убедитесь, что домен смотрит на IP сервера. Certbot не сможет подтвердить владение, если DNS не настроен." },
  { id: 7, title: "Проверить автоматическое обновление сертификата", description: "Сертификаты Let's Encrypt действуют 90 дней, обновление должно быть автоматическим.", command: "sudo certbot renew --dry-run", completed: false, trouble: "Если dry-run не сработал, проверьте, что certbot.timer активен: systemctl status certbot.timer" },
  { id: 8, title: "Настроить HTTP → HTTPS редирект", description: "Certbot обычно делает это автоматически. Проверьте, чтобы все запросы шли на HTTPS.", command: "", completed: false, trouble: "Вручную можно добавить в конфиг: return 301 https://$server_name$request_uri;" },
  { id: 9, title: "Перезагрузить Nginx и проверить работу сайта по HTTPS", description: "Зайдите на https://ваш-домен, убедитесь в наличии зелёного замка.", command: "sudo systemctl reload nginx", completed: false, trouble: "Если замок красный, проверьте, что сертификат привязан к нужному домену, и что нет смешанного контента." },
  { id: 10, title: "Проверить сайт на SSL Labs (рейтинг A+)", description: "Бесплатный онлайн-тест качества SSL/TLS конфигурации.", command: "https://www.ssllabs.com/ssltest/analyze.html?d=ваш-домен", completed: false, trouble: "Если рейтинг ниже A+, отключите старые протоколы (TLS 1.0, 1.1) в конфиге Nginx." }
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

// Модальное окно для проблем
const troubleModal = document.getElementById("troubleModal");
const troubleText = document.getElementById("troubleText");
const troubleModalClose = document.querySelector("#troubleModal .modal-close");

// Модальное окно для сброса
const resetModal = document.getElementById("resetModal");
const resetModalClose = document.getElementById("resetModalClose");
const resetProgressBtn = document.getElementById("resetProgressBtn");
const clearAllTasksBtn = document.getElementById("clearAllTasksBtn");
const restoreDefaultBtn = document.getElementById("restoreDefaultBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");

// ========== Работа с данными ==========
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
        if (total > 0 && completed === total) {
            congratsBlock.style.display = "block";
        } else {
            congratsBlock.style.display = "none";
        }
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
        tasksContainer.innerHTML = '<div class="task-card" style="text-align:center;">✨ Нет задач. Добавьте первую задачу!</div>';
        updateStats();
        return;
    }
    const firstIncompleteIdx = getFirstIncompleteIndex();
    let html = "";
    tasks.forEach((task, idx) => {
        const isLocked = firstIncompleteIdx !== -1 && idx > firstIncompleteIdx;
        const isCurrent = idx === firstIncompleteIdx;
        const statusClass = task.completed ? "completed" : "pending";
        const statusText = task.completed ? "Выполнено" : "В процессе";
        const checkedAttr = task.completed ? "checked" : "";
        let cardClasses = "task-card";
        if (isLocked) cardClasses += " locked";
        if (isCurrent) cardClasses += " current-task";
        
        html += `
            <div class="${cardClasses}" data-id="${task.id}">
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
    
    document.querySelectorAll(".task-checkbox").forEach(cb => {
        cb.addEventListener("change", (e) => {
            const id = parseInt(e.target.dataset.id);
            toggleTaskCompletion(id);
        });
    });
    document.querySelectorAll(".delete-task").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(btn.dataset.id);
            deleteTaskById(id);
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
    renderTasks();
}

function deleteTaskById(id) {
    const task = tasks.find(t => t.id === id);
    if (task && confirm(`Удалить задачу "${task.title}"?`)) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    }
}

function startEdit(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const card = document.querySelector(`.task-card[data-id='${taskId}']`);
    if (card.querySelector(".edit-area")) return;
    const editHtml = `
        <div class="edit-area" style="margin: 16px 0;">
            <textarea class="edit-textarea" rows="2" style="width:100%; padding:8px; border-radius:12px; border:1px solid #CBD5E1;">${escapeHtml(task.description || "")}</textarea>
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
    if (task && task.trouble) {
        troubleText.textContent = task.trouble;
        troubleModal.style.display = "flex";
    } else {
        troubleText.textContent = "Нет информации о возможных проблемах для этой задачи.";
        troubleModal.style.display = "flex";
    }
}
function closeTroubleModal() {
    troubleModal.style.display = "none";
}
if (troubleModalClose) troubleModalClose.onclick = closeTroubleModal;

// ========== Функции для модального окна сброса ==========
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

// Обработчики кнопок в модальном окне сброса
if (resetProgressBtn) resetProgressBtn.addEventListener("click", resetProgress);
if (clearAllTasksBtn) clearAllTasksBtn.addEventListener("click", clearAllTasks);
if (restoreDefaultBtn) restoreDefaultBtn.addEventListener("click", restoreDefaultTasks);
if (cancelResetBtn) cancelResetBtn.addEventListener("click", closeResetModal);
if (resetModalClose) resetModalClose.addEventListener("click", closeResetModal);

// Закрытие модалки при клике вне её
window.onclick = function(e) {
    if (e.target === troubleModal) closeTroubleModal();
    if (e.target === resetModal) closeResetModal();
};

function addNewTask() {
    const title = newTaskTitle.value.trim();
    if (!title) {
        alert("Введите название задачи");
        return;
    }
    const description = newTaskDesc.value.trim();
    const maxId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) : 0;
    const newId = maxId + 1;
    const newTask = {
        id: newId,
        title: title,
        description: description,
        command: "",
        completed: false,
        trouble: "Информация о проблемах не добавлена."
    };
    tasks.push(newTask);
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

// Обработчики
if (showBtn) showBtn.addEventListener("click", showChecklist);
if (resetBtn) resetBtn.addEventListener("click", openResetModal);
if (addTaskBtn) addTaskBtn.addEventListener("click", addNewTask);

// Если в URL есть якорь #todo-list, показываем чек-лист
if (window.location.hash === "#todo-list") {
    showChecklist();
}

// Если секция уже видна, подгружаем задачи
if (checklistSection && !checklistSection.classList.contains("hidden-checklist") && !checklistRendered) {
    showChecklist();
}