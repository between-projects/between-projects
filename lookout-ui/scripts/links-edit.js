const STORAGE_KEY = "lookout:v1";
const LINKS_MODULE_SELECTOR = ".module-links";
const LINKS_LIST_SELECTOR = ".module-links .list";

let editing = false;
let textareaEl = null;
let suppressClose = false;

const loadState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { tasks: [], notes: "", links: [] };
    }
    const parsed = JSON.parse(raw);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      notes: parsed.notes ?? "",
      links: Array.isArray(parsed.links) ? parsed.links : [],
    };
  } catch (error) {
    return { tasks: [], notes: "", links: [] };
  }
};

const saveState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Silent failure preserves calm.
  }
};

const buildTextarea = (value) => {
  const textarea = document.createElement("textarea");
  textarea.className = "links-editor";
  textarea.value = value;
  textarea.spellcheck = false;
  return textarea;
};

const renderReadOnly = (moduleEl, links) => {
  if (!moduleEl) {
    return;
  }
  const listEl = moduleEl.querySelector(LINKS_LIST_SELECTOR);
  if (!listEl) {
    return;
  }
  listEl.innerHTML = "";
  if (!links.length) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "—";
    listEl.appendChild(emptyItem);
    return;
  }
  links.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    listEl.appendChild(item);
  });
};

const enterEditMode = (moduleEl) => {
  if (editing) {
    return;
  }
  if (!moduleEl) {
    return;
  }

  const state = loadState();
  const lines = Array.isArray(state.links) ? state.links : [];

  editing = true;
  moduleEl.classList.add("links-editing");
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
  const moduleEl = document.querySelector(LINKS_MODULE_SELECTOR);
  if (!moduleEl) {
    editing = false;
    return;
  }

  const state = loadState();
  const text = textareaEl ? textareaEl.value : "";
  const links = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  saveState({ ...state, links });

  if (textareaEl) {
    textareaEl.remove();
  }
  textareaEl = null;
  moduleEl.classList.remove("links-editing");
  editing = false;

  renderReadOnly(moduleEl, links);
};

const handleModuleClick = (event) => {
  if (editing) {
    return;
  }
  const moduleEl = event.target.closest(LINKS_MODULE_SELECTOR);
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
  if (event.target.closest(LINKS_MODULE_SELECTOR)) {
    return;
  }
  exitEditMode();
};

const handleKeydown = (event) => {
  if (!editing) {
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    exitEditMode();
  }
};

const initLinksEdit = () => {
  const moduleEl = document.querySelector(LINKS_MODULE_SELECTOR);
  if (moduleEl) {
    moduleEl.addEventListener("click", handleModuleClick);
  }
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleKeydown);
};

initLinksEdit();
