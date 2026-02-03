const STORAGE_KEY = "lookout:v1";

const DEFAULT_STATE = {
  tasks: [],
  notes: [],
  links: [],
};

const selectors = {
  tasks: ".module-tasks .list",
  notes: ".module-notes .list",
  links: ".module-links .list",
};

const emptyStates = {
  tasks: "Nothing pressing.",
  notes: "",
  links: "—",
};

const normalize = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

const loadState = () => {
  let shouldPersist = false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      shouldPersist = true;
      return { state: { ...DEFAULT_STATE }, shouldPersist };
    }
    const parsed = JSON.parse(raw);
    const state = {
      tasks: normalize(parsed.tasks),
      notes: normalize(parsed.notes),
      links: normalize(parsed.links),
    };
    return { state, shouldPersist };
  } catch (error) {
    shouldPersist = true;
    return { state: { ...DEFAULT_STATE }, shouldPersist };
  }
};

const saveState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Silently ignore storage failures to preserve calm.
  }
};

const setListItems = (element, items, emptyText) => {
  if (!element) {
    return;
  }

  element.innerHTML = "";

  if (items.length === 0) {
    if (emptyText.length === 0) {
      return;
    }

    const emptyItem = document.createElement("li");
    emptyItem.textContent = emptyText;
    element.appendChild(emptyItem);
    return;
  }

  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    element.appendChild(listItem);
  });
};

const hydrate = () => {
  const { state, shouldPersist } = loadState();
  if (shouldPersist) {
    saveState(state);
  }
  setListItems(document.querySelector(selectors.tasks), state.tasks, emptyStates.tasks);
  setListItems(document.querySelector(selectors.notes), state.notes, emptyStates.notes);
  setListItems(document.querySelector(selectors.links), state.links, emptyStates.links);
};

hydrate();
