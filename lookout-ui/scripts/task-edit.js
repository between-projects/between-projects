const STORAGE_KEY = "lookout:v1";
const TASK_LIST_SELECTOR = ".module-tasks .list";

let editing = false;

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

const clearList = (listEl) => {
  listEl.innerHTML = "";
};

const focusEnd = (element) => {
  element.focus();
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

const makeEditableItem = (text = "") => {
  const item = document.createElement("li");
  item.contentEditable = "true";
  item.spellcheck = false;
  item.textContent = text;
  return item;
};

const enterEditMode = () => {
  if (editing) {
    return;
  }
  const listEl = document.querySelector(TASK_LIST_SELECTOR);
  if (!listEl) {
    return;
  }
  editing = true;
  const state = loadState();
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  clearList(listEl);

  if (tasks.length === 0) {
    const item = makeEditableItem("");
    listEl.appendChild(item);
    focusEnd(item);
    return;
  }

  tasks.forEach((task, index) => {
    const text = typeof task === "string" ? task : task?.text;
    const item = makeEditableItem(sanitizeText(text));
    listEl.appendChild(item);
    if (index === 0) {
      focusEnd(item);
    }
  });
};

const exitEditMode = () => {
  if (!editing) {
    return;
  }
  const listEl = document.querySelector(TASK_LIST_SELECTOR);
  if (!listEl) {
    editing = false;
    return;
  }

  const state = loadState();
  const previousTasks = Array.isArray(state.tasks) ? state.tasks : [];
  const items = Array.from(listEl.querySelectorAll("li"));
  const texts = sanitizeTasks(items.map((item) => item.textContent || ""));

  const tasks = texts.map((text, index) => {
    const previous = previousTasks[index];
    const completed = typeof previous === "object" && previous ? Boolean(previous.completed) : false;
    return { text, completed };
  });

  saveState({ ...state, tasks });
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

  const target = event.target;
  if (target instanceof HTMLElement && target.isContentEditable) {
    if (event.key === "Escape") {
      event.preventDefault();
      exitEditMode();
    }
    return;
  }

  if (event.key === "Escape" && editing) {
    event.preventDefault();
    exitEditMode();
    return;
  }

  if (!editing && event.key.toLowerCase() === "e") {
    event.preventDefault();
    enterEditMode();
  }
};

const handleListKeydown = (event) => {
  if (!editing) {
    return;
  }

  const listEl = document.querySelector(TASK_LIST_SELECTOR);
  if (!listEl) {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLElement) || target.tagName !== "LI") {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const newItem = makeEditableItem("");
    if (target.nextSibling) {
      listEl.insertBefore(newItem, target.nextSibling);
    } else {
      listEl.appendChild(newItem);
    }
    focusEnd(newItem);
    return;
  }

  if (event.key === "Backspace") {
    const text = sanitizeText(target.textContent || "");
    if (text.length > 0) {
      return;
    }
    const items = Array.from(listEl.querySelectorAll("li"));
    if (items.length <= 1) {
      return;
    }
    event.preventDefault();
    const index = items.indexOf(target);
    const nextFocus = items[index - 1] || items[index + 1];
    target.remove();
    if (nextFocus) {
      focusEnd(nextFocus);
    }
  }
};

const initTaskEdit = () => {
  document.addEventListener("keydown", handleDocumentKeydown);
  document.addEventListener("keydown", handleListKeydown);
};

initTaskEdit();
