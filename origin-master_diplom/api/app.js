// Предустановленные задачи (шаги настройки HTTPS)
const DEFAULT_TASKS = [
  {
    id: 1,
    title: "Приобрести домен и настроить A-запись на IP сервера",
    description:
      "Домен должен указывать на ваш VPS. Проверьте через ping или nslookup.",
    command: "",
    completed: false,
  },
  {
    id: 2,
    title: "Установить Nginx",
    description: "Базовый веб-сервер для обработки HTTP/HTTPS запросов.",
    command: "sudo apt update && sudo apt install nginx -y",
    completed: false,
  },
  {
    id: 3,
    title: "Создать конфигурацию сайта",
    description:
      "Файл в /etc/nginx/sites-available/ваш-сайт с server_name и root.",
    command:
      "server {\n    listen 80;\n    server_name your-domain.com;\n    root /var/www/html;\n}",
    completed: false,
  },
  {
    id: 4,
    title: "Включить сайт и проверить конфигурацию",
    description: "Создать симлинк и перезагрузить Nginx.",
    command:
      "sudo ln -s /etc/nginx/sites-available/ваш-сайт /etc/nginx/sites-enabled/\nsudo nginx -t\nsudo systemctl reload nginx",
    completed: false,
  },
  {
    id: 5,
    title: "Установить Certbot и плагин для Nginx",
    description:
      "Certbot — клиент Let's Encrypt для автоматического получения сертификатов.",
    command: "sudo apt install certbot python3-certbot-nginx -y",
    completed: false,
  },
  {
    id: 6,
    title: "Получить SSL-сертификат",
    description: "Запустите Certbot в интерактивном режиме для вашего домена.",
    command: "sudo certbot --nginx -d ваш-домен.com",
    completed: false,
  },
  {
    id: 7,
    title: "Проверить автоматическое обновление сертификата",
    description:
      "Сертификаты Let's Encrypt действуют 90 дней, обновление должно быть автоматическим.",
    command: "sudo certbot renew --dry-run",
    completed: false,
  },
  {
    id: 8,
    title: "Настроить HTTP → HTTPS редирект",
    description:
      "Certbot обычно делает это автоматически. Проверьте, чтобы все запросы шли на HTTPS.",
    command: "",
    completed: false,
  },
  {
    id: 9,
    title: "Перезагрузить Nginx и проверить работу сайта по HTTPS",
    description:
      "Зайдите на https://ваш-домен, убедитесь в наличии зелёного замка.",
    command: "sudo systemctl reload nginx",
    completed: false,
  },
  {
    id: 10,
    title: "Проверить сайт на SSL Labs (рейтинг A+)",
    description: "Бесплатный онлайн-тест качества SSL/TLS конфигурации.",
    command: "https://www.ssllabs.com/ssltest/analyze.html?d=ваш-домен",
    completed: false,
  },
];

// Ключ для localStorage
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
const congratsBlock = document.getElementById("congratsBlock");

// Текущий массив задач
let tasks = [];

// --- Вспомогательные функции ---
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    tasks = JSON.parse(stored);
  } else {
    tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS)); // глубокое копирование
  }
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  completedSpan.textContent = completed;
  totalSpan.textContent = total;
  const percent = total === 0 ? 0 : (completed / total) * 100;
  progressFill.style.width = `${percent}%`;

  // Показать поздравление, если все задачи выполнены и есть хотя бы одна задача
  if (total > 0 && completed === total) {
    congratsBlock.style.display = "block";
  } else {
    congratsBlock.style.display = "none";
  }
}

// Экранирование HTML для защиты от XSS
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Рендер всех задач
function renderTasks() {
  if (!tasksContainer) return;
  if (tasks.length === 0) {
    tasksContainer.innerHTML =
      '<div class="task-card" style="text-align:center;">✨ Нет задач. Добавьте первую задачу!</div>';
    updateStats();
    return;
  }

  let html = "";
  tasks.forEach((task) => {
    const statusClass = task.completed ? "completed" : "pending";
    const statusText = task.completed ? "Выполнено" : "В процессе";
    const checkedAttr = task.completed ? "checked" : "";

    html += `
            <div class="task-card" data-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">
                        <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${checkedAttr}>
                        <span>${escapeHtml(task.title)}</span>
                    </div>
                    <div class="task-status-badge ${statusClass}">${statusText}</div>
                </div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ""}
                ${task.command ? `<div class="task-commands">${escapeHtml(task.command)}</div>` : ""}
                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;">
                    <button class="btn-secondary delete-task" data-id="${task.id}" style="background:#EF4444; padding: 6px 16px;">Удалить</button>
                </div>
            </div>
        `;
  });
  tasksContainer.innerHTML = html;

  // Навешиваем обработчики на чекбоксы
  document.querySelectorAll(".task-checkbox").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const id = parseInt(e.target.dataset.id);
      toggleTaskCompletion(id);
    });
  });

  // Навешиваем обработчики на кнопки удаления
  document.querySelectorAll(".delete-task").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(btn.dataset.id);
      deleteTaskById(id);
    });
  });

  updateStats();
}

// Переключение статуса задачи
function toggleTaskCompletion(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }
}

// Удаление задачи
function deleteTaskById(id) {
  const task = tasks.find((t) => t.id === id);
  if (task && confirm(`Удалить задачу "${task.title}"?`)) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
  }
}

// Добавление новой задачи
function addNewTask() {
  const title = newTaskTitle.value.trim();
  if (!title) {
    alert("Введите название задачи");
    return;
  }
  const description = newTaskDesc.value.trim();
  // Генерация уникального id (макс id + 1 или Date.now)
  const maxId = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) : 0;
  const newId = maxId + 1;
  const newTask = {
    id: newId,
    title: title,
    description: description,
    command: "",
    completed: false,
  };
  tasks.push(newTask);
  saveTasks();
  renderTasks();
  // Очистить форму
  newTaskTitle.value = "";
  newTaskDesc.value = "";
}

// Сброс всех задач до начального списка (удаляет добавленные пользователем)
function resetToDefault() {
  if (
    confirm(
      "Сбросить все задачи до начального списка? Все добавленные вами задачи будут удалены.",
    )
  ) {
    tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
    saveTasks();
    renderTasks();
  }
}

// --- Инициализация приложения ---
function init() {
  loadTasks();
  renderTasks();

  // Обработчики кнопок
  if (addTaskBtn) addTaskBtn.addEventListener("click", addNewTask);
  if (resetBtn) resetBtn.addEventListener("click", resetToDefault);
}

// Запуск после полной загрузки DOM
document.addEventListener("DOMContentLoaded", init);
