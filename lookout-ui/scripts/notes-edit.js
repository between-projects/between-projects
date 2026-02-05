const STORAGE_KEY = "lookout:v1";
const NOTES_MODULE_SELECTOR = ".module-notes";
const NOTES_LIST_SELECTOR = ".module-notes .list";

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
      notes: parsed.notes ?? [],
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

const getNotesText = (value) => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.join("\n");
  }
  return "";
};

const normalizeNotesForStorage = (value) => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.join("\n");
  }
  return "";
};

const buildTextarea = (value) => {
  const textarea = document.createElement("textarea");
  textarea.className = "notes-editor";
  textarea.value = value;
  textarea.spellcheck = false;
  return textarea;
};

const renderReadOnly = (moduleEl, text) => {
  if (!moduleEl) {
    return;
  }
  const listEl = moduleEl.querySelector(NOTES_LIST_SELECTOR);
  if (!listEl) {
    return;
  }
  listEl.innerHTML = "";
  if (!text.trim()) {
    return;
  }
  text.split("\n").forEach((line) => {
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
  editing = true;
  moduleEl.classList.add("notes-editing");

  const state = loadState();
  const text = getNotesText(state.notes);
  textareaEl = buildTextarea(text);
  moduleEl.appendChild(textareaEl);
  textareaEl.focus();
  textareaEl.setSelectionRange(textareaEl.value.length, textareaEl.value.length);
};

const exitEditMode = () => {
  if (!editing) {
    return;
  }
  const moduleEl = document.querySelector(NOTES_MODULE_SELECTOR);
  if (!moduleEl) {
    editing = false;
    return;
  }

  const state = loadState();
  const text = textareaEl ? textareaEl.value : "";
  const notes = normalizeNotesForStorage(text);
  saveState({ ...state, notes });

  if (textareaEl) {
    textareaEl.remove();
  }
  textareaEl = null;
  moduleEl.classList.remove("notes-editing");
  editing = false;

  renderReadOnly(moduleEl, notes);
};

const handleDocumentClick = (event) => {
  const moduleEl = document.querySelector(NOTES_MODULE_SELECTOR);
  if (!moduleEl) {
    return;
  }

  if (moduleEl.contains(event.target)) {
    if (!editing) {
      enterEditMode(moduleEl);
    }
    return;
  }

  if (editing) {
    exitEditMode();
  }
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

const initNotesEdit = () => {
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleKeydown);
};

initNotesEdit();
