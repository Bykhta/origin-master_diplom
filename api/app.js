// Предустановленные задачи (шаги настройки HTTPS)
const DEFAULT_TASKS = [
  { id: 1, title: "Приобрести домен и настроить A-запись на IP сервера", description: "Домен должен указывать на ваш VPS. Проверьте через ping или nslookup.", command: "", completed: false, image: null },
  { id: 2, title: "Установить Nginx", description: "Базовый веб-сервер для обработки HTTP/HTTPS запросов.", command: "sudo apt update && sudo apt install nginx -y", completed: false, image: null },
  { id: 3, title: "Создать конфигурацию сайта", description: "Файл в /etc/nginx/sites-available/ваш-сайт с server_name и root.", command: "server {\n    listen 80;\n    server_name your-domain.com;\n    root /var/www/html;\n}", completed: false, image: null },
  { id: 4, title: "Включить сайт и проверить конфигурацию", description: "Создать симлинк и перезагрузить Nginx.", command: "sudo ln -s /etc/nginx/sites-available/ваш-сайт /etc/nginx/sites-enabled/\nsudo nginx -t\nsudo systemctl reload nginx", completed: false, image: null },
  { id: 5, title: "Установить Certbot и плагин для Nginx", description: "Certbot — клиент Let's Encrypt для автоматического получения сертификатов.", command: "sudo apt install certbot python3-certbot-nginx -y", completed: false, image: null },
  { id: 6, title: "Получить SSL-сертификат", description: "Запустите Certbot в интерактивном режиме для вашего домена.", command: "sudo certbot --nginx -d ваш-домен.com", completed: false, image: null },
  { id: 7, title: "Проверить автоматическое обновление сертификата", description: "Сертификаты Let's Encrypt действуют 90 дней, обновление должно быть автоматическим.", command: "sudo certbot renew --dry-run", completed: false, image: null },
  { id: 8, title: "Настроить HTTP → HTTPS редирект", description: "Certbot обычно делает это автоматически. Проверьте, чтобы все запросы шли на HTTPS.", command: "", completed: false, image: null },
  { id: 9, title: "Перезагрузить Nginx и проверить работу сайта по HTTPS", description: "Зайдите на https://ваш-домен, убедитесь в наличии зелёного замка.", command: "sudo systemctl reload nginx", completed: false, image: null },
  { id: 10, title: "Проверить сайт на SSL Labs (рейтинг A+)", description: "Бесплатный онлайн-тест качества SSL/TLS конфигурации.", command: "https://www.ssllabs.com/ssltest/analyze.html?d=ваш-домен", completed: false, image: null }
];

const STORAGE_KEY = "https_checklist_tasks";

// DOM элементы
const tasksContainer = document.getElementById("tasksContainer");
const completedSpan = document.getElementById("completedCount");
const totalSpan = document.getElementById("totalCount");
const progressFill = document.getElementById("progressFill");
const resetBtn = document.getElementById("resetBtn");
const addTaskBtn = document.getElementById("addTaskBtn");
const newTaskTitle = document.getElementById("newTaskTitle");
const newTaskDesc = document.getElementById("newTaskDesc");
const newTaskImage = document.getElementById("newTaskImage");
const congratsBlock = document.getElementById("congratsBlock");

let tasks = [];

// --- Сохранение и загрузка ---
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

// --- Статистика и прогресс ---
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  completedSpan.textContent = completed;
  totalSpan.textContent = total;
  const percent = total === 0 ? 0 : (completed / total) * 100;
  progressFill.style.width = `${percent}%`;
  if (total > 0 && completed === total) {
    congratsBlock.style.display = "block";
  } else {
    congratsBlock.style.display = "none";
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// --- Редактирование задачи ---
function startEdit(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  const card = document.querySelector(`.task-card[data-id='${taskId}']`);
  const editDiv = card.querySelector(".edit-area");
  if (editDiv) {
    editDiv.remove();
    return;
  }
  const editHtml = `
    <div class="edit-area">
      <textarea class="edit-textarea" rows="2" placeholder="Новое описание...">${escapeHtml(task.description || "")}</textarea>
      <div style="margin: 12px 0;">
        <label style="font-size:14px;">📸 Заменить фото: </label>
        <input type="file" class="edit-image-input" accept="image/*">
      </div>
      <div class="edit-actions">
        <button class="btn-primary btn-sm save-edit-btn">Сохранить</button>
        <button class="btn-secondary btn-sm cancel-edit-btn">Отмена</button>
      </div>
    </div>
  `;
  const target = card.querySelector(".task-description")?.parentNode || card;
  const insertPos = card.querySelector(".task-description") ? card.querySelector(".task-description") : card.querySelector(".task-commands");
  if (insertPos) {
    insertPos.insertAdjacentHTML("afterend", editHtml);
  } else {
    card.querySelector(".task-header").insertAdjacentHTML("afterend", editHtml);
  }
  const editBlock = card.querySelector(".edit-area");
  const textarea = editBlock.querySelector(".edit-textarea");
  const fileInput = editBlock.querySelector(".edit-image-input");
  const saveBtn = editBlock.querySelector(".save-edit-btn");
  const cancelBtn = editBlock.querySelector(".cancel-edit-btn");

  saveBtn.onclick = () => {
    const newDesc = textarea.value.trim();
    task.description = newDesc;
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        task.image = e.target.result;
        saveTasks();
        renderTasks();
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      saveTasks();
      renderTasks();
    }
  };
  cancelBtn.onclick = () => editBlock.remove();
}

function deleteImage(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.image = null;
    saveTasks();
    renderTasks();
  }
}

function toggleTaskCompletion(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }
}

function deleteTaskById(id) {
  const task = tasks.find(t => t.id === id);
  if (task && confirm(`Удалить задачу "${task.title}"?`)) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }
}

// --- Рендер одной задачи (с поддержкой фото и редактирования) ---
function renderTasks() {
  if (!tasksContainer) return;
  if (tasks.length === 0) {
    tasksContainer.innerHTML = '<div class="task-card" style="text-align:center;">✨ Нет задач. Добавьте первую задачу!</div>';
    updateStats();
    return;
  }
  let html = "";
  tasks.forEach(task => {
    const statusClass = task.completed ? "completed" : "pending";
    const statusText = task.completed ? "Выполнено" : "В процессе";
    const checkedAttr = task.completed ? "checked" : "";
    const imageHtml = task.image ? `
      <div class="task-image">
        <img src="${task.image}" alt="Фото к задаче">
        <div class="image-actions">
          <button class="btn-icon delete-image-btn" data-id="${task.id}" title="Удалить фото">🗑️ Удалить фото</button>
        </div>
      </div>
    ` : '';

    html += `
      <div class="task-card" data-id="${task.id}">
        <div class="task-header">
          <div class="task-title">
            <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${checkedAttr}>
            <span>${escapeHtml(task.title)}</span>
          </div>
          <div class="task-status-badge ${statusClass}">${statusText}</div>
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : '<div class="task-description" style="color:#A0AEC0;">(нет описания)</div>'}
        ${imageHtml}
        ${task.command ? `<div class="task-commands">${escapeHtml(task.command)}</div>` : ''}
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;">
          <button class="edit-toggle-btn" data-id="${task.id}">✏️ Редактировать описание</button>
          <button class="btn-secondary delete-task" data-id="${task.id}" style="background:#EF4444; padding: 6px 16px;">Удалить</button>
        </div>
      </div>
    `;
  });
  tasksContainer.innerHTML = html;

  // Обработчики
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
  document.querySelectorAll(".delete-image-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(btn.dataset.id);
      deleteImage(id);
    });
  });
  updateStats();
}

// --- Добавление новой задачи с фото ---
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
    image: null
  };
  if (newTaskImage.files && newTaskImage.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      newTask.image = e.target.result;
      tasks.push(newTask);
      saveTasks();
      renderTasks();
    };
    reader.readAsDataURL(newTaskImage.files[0]);
  } else {
    tasks.push(newTask);
    saveTasks();
    renderTasks();
  }
  // Очистка формы
  newTaskTitle.value = "";
  newTaskDesc.value = "";
  newTaskImage.value = "";
}

function resetToDefault() {
  if (confirm("Сбросить все задачи до начального списка? Все добавленные вами задачи и фото будут удалены.")) {
    tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
    saveTasks();
    renderTasks();
  }
}

function init() {
  loadTasks();
  renderTasks();
  if (addTaskBtn) addTaskBtn.addEventListener("click", addNewTask);
  if (resetBtn) resetBtn.addEventListener("click", resetToDefault);
}

document.addEventListener("DOMContentLoaded", init);