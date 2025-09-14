document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const homePage = document.getElementById("homePage");
  const appPage = document.getElementById("appPage");
  const getStartedBtn = document.getElementById("getStartedBtn");
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const themeToggle = document.getElementById("themeToggle");
  const appThemeToggle = document.getElementById("appThemeToggle");
  const body = document.body;

  // App functionality variables
  const taskInput = document.getElementById("taskInput");
  const dueDate = document.getElementById("dueDate");
  const prioritySelect = document.getElementById("prioritySelect");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const voiceInputBtn = document.getElementById("voiceInputBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const taskList = document.getElementById("taskList");
  const completedList = document.getElementById("completedList");
  const emptyState = document.getElementById("emptyState");
  const completedSection = document.getElementById("completedSection");
  const totalTasksElement = document
    .getElementById("totalTasks")
    .querySelector("span");
  const completedTasksElement = document
    .getElementById("completedTasks")
    .querySelector("span");
  const activeTasksElement = document
    .getElementById("activeTasks")
    .querySelector("span");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const sortButtons = document.querySelectorAll(".sort-btn");

  let tasks = [];
  let taskId = 0;
  let currentFilter = "all";
  let currentSort = "priority";
  let recognition = null;

  // Load tasks from localStorage
  function loadTasksFromStorage() {
    const storedTasks = localStorage.getItem("priorityTasks");
    if (storedTasks) {
      tasks = JSON.parse(storedTasks);
      // Find the highest ID to continue from there
      if (tasks.length > 0) {
        taskId = Math.max(...tasks.map((task) => task.id)) + 1;
      }
    }
  }

  // Save tasks to localStorage
  function saveTasksToStorage() {
    localStorage.setItem("priorityTasks", JSON.stringify(tasks));
  }

  // Check for saved theme preference or respect OS preference
  const savedTheme = localStorage.getItem("theme");
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

  // Set initial theme
  if (savedTheme === "dark" || (!savedTheme && prefersDarkScheme.matches)) {
    body.classList.add("dark-mode");
    updateThemeIcons("dark");
    appPage.className = "app-container dark-mode-bg";
    document.documentElement.classList.add("dark");
  } else {
    body.classList.remove("dark-mode");
    updateThemeIcons("light");
    appPage.className = "app-container light-mode-bg";
    document.documentElement.classList.remove("dark");
  }

  // Theme toggle functionality
  function toggleTheme() {
    if (body.classList.contains("dark-mode")) {
      body.classList.remove("dark-mode");
      appPage.className = "app-container light-mode-bg";
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      updateThemeIcons("light");
    } else {
      body.classList.add("dark-mode");
      appPage.className = "app-container dark-mode-bg";
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      updateThemeIcons("dark");
    }
  }

  // Update theme toggle icons
  function updateThemeIcons(theme) {
    const icons = document.querySelectorAll(".theme-toggle i");
    const appIcons = document.querySelectorAll(".app-theme-toggle i");

    if (theme === "dark") {
      icons.forEach((icon) => {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
      });
      appIcons.forEach((icon) => {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
      });
    } else {
      icons.forEach((icon) => {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
      });
      appIcons.forEach((icon) => {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
      });
    }
  }

  // Event listeners for theme toggles
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  if (appThemeToggle) {
    appThemeToggle.addEventListener("click", toggleTheme);
  }

  // Mobile Navigation
  hamburger.addEventListener("click", function () {
    navMenu.classList.toggle("active");
    hamburger.classList.toggle("active");
  });

  // Close mobile menu when clicking on links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      hamburger.classList.remove("active");
    });
  });

  // Get Started Button - Navigate to App Page
  getStartedBtn.addEventListener("click", function (e) {
    e.preventDefault();
    homePage.style.display = "none";
    appPage.style.display = "block";
    // Initialize the app if it's the first time
    if (tasks.length === 0) {
      initApp();
    }
  });

  // Home link in navigation
  document.querySelector(".home-link").addEventListener("click", function (e) {
    e.preventDefault();
    homePage.style.display = "block";
    appPage.style.display = "none";
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });

  // Initialize the app functionality
  function initApp() {
    // Load tasks from localStorage
    loadTasksFromStorage();

    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate.valueAsDate = tomorrow;

    // Initialize voice recognition if available
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        taskInput.value = transcript;
        voiceInputBtn.classList.remove("listening");
      };

      recognition.onerror = function (event) {
        console.error("Speech recognition error", event.error);
        voiceInputBtn.classList.remove("listening");
        alert("Voice input failed. Please try again.");
      };

      recognition.onend = function () {
        voiceInputBtn.classList.remove("listening");
      };
    } else {
      voiceInputBtn.style.display = "none";
    }

    // Render tasks from storage
    renderTasks();

    // Check if empty state should be shown
    checkEmptyState();
  }

  // Check if empty state should be shown
  function checkEmptyState() {
    const activeTasks = tasks.filter((task) => !task.completed);

    if (tasks.length === 0) {
      emptyState.style.display = "block";
      taskList.style.display = "none";
    } else {
      emptyState.style.display = "none";
      taskList.style.display = "block";
    }

    if (tasks.filter((task) => task.completed).length > 0) {
      completedSection.style.display = "block";
    } else {
      completedSection.style.display = "none";
    }

    updateStats();
  }

  // Update task statistics
  function updateStats() {
    totalTasksElement.textContent = tasks.length;
    const completedCount = tasks.filter((task) => task.completed).length;
    completedTasksElement.textContent = completedCount;
    activeTasksElement.textContent = tasks.length - completedCount;
  }

  // Save tasks to localStorage
  function saveTasks() {
    saveTasksToStorage();
  }

  // Add new task
  function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "") return;

    const task = {
      id: taskId++,
      text: taskText,
      completed: false,
      priority: prioritySelect.value,
      dueDate: dueDate.value,
      addedDate: new Date().toISOString(),
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    taskInput.value = "";
    taskInput.focus();
  }

  // Toggle task completion
  function toggleTask(id) {
    tasks = tasks.map((task) => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    saveTasks();
    renderTasks();
  }

  // Edit task text
  function editTask(id, newText) {
    if (newText.trim() === "") return;

    tasks = tasks.map((task) => {
      if (task.id === id) {
        return { ...task, text: newText };
      }
      return task;
    });
    saveTasks();
    renderTasks();
  }

  // Change task priority
  function changePriority(id, newPriority) {
    tasks = tasks.map((task) => {
      if (task.id === id) {
        return { ...task, priority: newPriority };
      }
      return task;
    });
    saveTasks();
    renderTasks();
  }

  // Delete task
  function deleteTask(id) {
    // Add animation before removing
    const taskElement = document.getElementById(`task-${id}`);
    if (taskElement) {
      taskElement.style.opacity = "0";
      taskElement.style.transform = "translateX(40px)";
      taskElement.style.transition = "all 0.3s";
    }

    setTimeout(() => {
      tasks = tasks.filter((task) => task.id !== id);
      saveTasks();
      renderTasks();
    }, 300);
  }

  // Filter tasks
  function filterTasks(filter) {
    currentFilter = filter;
    renderTasks();

    // Update active filter button
    filterButtons.forEach((btn) => {
      if (btn.dataset.filter === filter) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // Sort tasks
  function sortTasks(sortBy) {
    currentSort = sortBy;
    renderTasks();

    // Update active sort button
    sortButtons.forEach((btn) => {
      if (btn.dataset.sort === sortBy) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // Download tasks as JSON
  function downloadTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "tasks.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }

  // Render all tasks based on current filter and sort
  function renderTasks() {
    taskList.innerHTML = "";
    completedList.innerHTML = "";

    // Filter tasks
    let filteredTasks = [];
    if (currentFilter === "all") {
      filteredTasks = tasks;
    } else if (currentFilter === "active") {
      filteredTasks = tasks.filter((task) => !task.completed);
    } else if (currentFilter === "completed") {
      filteredTasks = tasks.filter((task) => task.completed);
    }

    // Sort tasks
    filteredTasks.sort((a, b) => {
      if (currentSort === "priority") {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (currentSort === "date") {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (currentSort === "added") {
        return new Date(a.addedDate) - new Date(b.addedDate);
      }
      return 0;
    });

    // Render tasks
    filteredTasks.forEach((task) => {
      const li = document.createElement("li");
      li.id = `task-${task.id}`;
      li.className = `task-item priority-${task.priority}-border ${
        task.completed ? "task-completed" : ""
      }`;

      // Format date for display
      const dueDate = new Date(task.dueDate);
      const formattedDate = dueDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          dueDate.getFullYear() !== new Date().getFullYear()
            ? "numeric"
            : undefined,
      });

      li.innerHTML = `
                <div class="task-content">
                    <button class="task-checkbox" onclick="toggleTask(${
                      task.id
                    })">
                        <i class="${
                          task.completed
                            ? "fas fa-check-circle"
                            : "far fa-circle"
                        }"></i>
                    </button>
                    <div class="task-info">
                        <div class="task-text">${task.text}</div>
                        <div class="task-meta">
                            <span class="priority-badge priority-${
                              task.priority
                            }">${
        task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
      }</span>
                            <span class="task-date"><i class="far fa-calendar"></i> ${formattedDate}</span>
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <select onchange="changePriority(${
                      task.id
                    }, this.value)" class="priority-select-small">
                        <option value="high" ${
                          task.priority === "high" ? "selected" : ""
                        }>High</option>
                        <option value="medium" ${
                          task.priority === "medium" ? "selected" : ""
                        }>Medium</option>
                        <option value="low" ${
                          task.priority === "low" ? "selected" : ""
                        }>Low</option>
                    </select>
                    <button onclick="startEdit(${
                      task.id
                    })" class="action-btn edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTask(${
                      task.id
                    })" class="action-btn delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

      // Apply appropriate colors for light/dark mode
      const checkboxIcon = li.querySelector(".task-checkbox i");
      if (task.completed) {
        checkboxIcon.style.color = "#10b981";
      } else {
        checkboxIcon.style.color = document.documentElement.classList.contains(
          "dark"
        )
          ? "#94a3b8"
          : "#64748b";
      }

      if (task.completed) {
        completedList.appendChild(li);
      } else {
        taskList.appendChild(li);
      }
    });

    checkEmptyState();
  }

  // Start editing a task
  function startEdit(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const taskElement = document.getElementById(`task-${id}`);
    const taskTextElement = taskElement.querySelector(".task-text");

    const currentText = task.text;
    taskTextElement.innerHTML = `
            <input type="text" value="${currentText}" class="edit-input" style="background: inherit; color: inherit; border: none; padding: 0.25rem; width: 100%;">
        `;

    const input = taskTextElement.querySelector("input");
    input.focus();

    const saveEdit = () => {
      editTask(id, input.value);
    };

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        saveEdit();
      }
    });
  }

  // Voice input functionality
  function startVoiceInput() {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    try {
      voiceInputBtn.classList.add("listening");
      recognition.start();
    } catch (error) {
      console.error("Speech recognition error:", error);
      voiceInputBtn.classList.remove("listening");
    }
  }

  // Event listeners for app functionality
  addTaskBtn.addEventListener("click", addTask);

  taskInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      addTask();
    }
  });

  voiceInputBtn.addEventListener("click", startVoiceInput);

  downloadBtn.addEventListener("click", downloadTasks);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterTasks(button.dataset.filter);
    });
  });

  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      sortTasks(button.dataset.sort);
    });
  });

  // Make functions global for onclick attributes
  window.toggleTask = toggleTask;
  window.deleteTask = deleteTask;
  window.startEdit = startEdit;
  window.changePriority = changePriority;

  // Initial render if we're on the app page
  if (window.location.hash === "#app") {
    homePage.style.display = "none";
    appPage.style.display = "block";
    initApp();
  }
});
