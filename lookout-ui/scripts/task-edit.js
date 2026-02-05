const STORAGE_KEY = "lookout:v1";
const TASK_LIST_SELECTOR = ".module-tasks .list";
const TASK_MODULE_SELECTOR = ".module-tasks";

let editing = false;
let textareaEl = null;
let suppressClose = false;

const loadState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { tasks: [], notes: [], links: [] };
    }
    const parsed = JSON.parse(raw);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      links: Array.isArray(parsed.links) ? parsed.links : [],
    };
  } catch (error) {
    return { tasks: [], notes: [], links: [] };
  }
};

const saveState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Silent failure preserves calm.
  }
};

const sanitizeText = (value) => (typeof value === "string" ? value.trim() : "");

const sanitizeTasks = (items) =>
  items
    .map((item) => sanitizeText(item))
    .filter((item) => item.length > 0);

const buildTextarea = (value) => {
  const textarea = document.createElement("textarea");
  textarea.className = "tasks-editor";
  textarea.value = value;
  textarea.spellcheck = false;
  return textarea;
};

const enterEditMode = (moduleEl) => {
  if (editing) {
    return;
  }
  if (!moduleEl) {
    return;
  }

  const state = loadState();
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  const lines = tasks.map((task) => {
    if (typeof task === "string") {
      return task;
    }
    return typeof task?.text === "string" ? task.text : "";
  });

  editing = true;
  moduleEl.classList.add("tasks-editing");
  textareaEl = buildTextarea(lines.join("\n"));
  moduleEl.appendChild(textareaEl);
  textareaEl.focus();
  textareaEl.setSelectionRange(textareaEl.value.length, textareaEl.value.length);

  suppressClose = true;
  queueMicrotask(() => {
    suppressClose = false;
  });
};

const exitEditMode = () => {
  if (!editing) {
    return;
  }

  const moduleEl = document.querySelector(TASK_MODULE_SELECTOR);
  if (!moduleEl) {
    editing = false;
    return;
  }

  const state = loadState();
  const previousTasks = Array.isArray(state.tasks) ? state.tasks : [];
  const lines = textareaEl ? textareaEl.value.split("\n") : [];
  const texts = sanitizeTasks(lines);

  const tasks = texts.map((text, index) => {
    const previous = previousTasks[index];
    const completed =
      typeof previous === "object" && previous ? Boolean(previous.completed) : false;
    return { text, completed };
  });

  saveState({ ...state, tasks });

  if (textareaEl) {
    textareaEl.remove();
  }
  textareaEl = null;
  moduleEl.classList.remove("tasks-editing");
  editing = false;
  window.dispatchEvent(new Event("lookout:tasks-updated"));
};

const handleModuleClick = (event) => {
  if (editing) {
    return;
  }
  if (event.target instanceof HTMLInputElement) {
    return;
  }
  const moduleEl = event.target.closest(TASK_MODULE_SELECTOR);
  if (!moduleEl) {
    return;
  }
  enterEditMode(moduleEl);
};

const handleDocumentClick = (event) => {
  if (!editing) {
    return;
  }
  if (suppressClose) {
    return;
  }
  if (event.target.closest(TASK_MODULE_SELECTOR)) {
    return;
  }
  exitEditMode();
};

const handleDocumentKeydown = (event) => {
  if (!editing) {
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    exitEditMode();
  }
};

const initTaskEdit = () => {
  const moduleEl = document.querySelector(TASK_MODULE_SELECTOR);
  if (moduleEl) {
    moduleEl.addEventListener("click", handleModuleClick);
  }
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);
};

initTaskEdit();
