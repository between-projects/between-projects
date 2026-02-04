const STORAGE_KEY = "lookout:v1";
const TASK_LIST_SELECTOR = ".module-tasks .list";
const TASK_MODULE_SELECTOR = ".module-tasks";

let editing = false;
let textareaEl = null;

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

const enterEditMode = () => {
  if (editing) {
    return;
  }

  const moduleEl = document.querySelector(TASK_MODULE_SELECTOR);
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
    const completed = typeof previous === "object" && previous ? Boolean(previous.completed) : false;
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

const handleDocumentKeydown = (event) => {
  if (event.defaultPrevented) {
    return;
  }
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  if (editing) {
    if (event.key === "Escape") {
      event.preventDefault();
      exitEditMode();
    }
    return;
  }

  if (event.key.toLowerCase() === "e") {
    event.preventDefault();
    enterEditMode();
  }
};

const initTaskEdit = () => {
  document.addEventListener("keydown", handleDocumentKeydown);
};

initTaskEdit();
