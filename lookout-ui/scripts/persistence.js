import "./time.js";
import "./weather.js";

import "./calendar.js";
import "./task-edit.js";
import "./notes-edit.js";
import "./links-edit.js";
import "./location.js";
import "./shutdown.js";

const STORAGE_KEY = "lookout:v1";

const DEFAULT_STATE = {
  tasks: [],
  notes: [],
  links: [],
};

let taskState = [];

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

const normalizeTasks = (value) => {
  if (!Array.isArray(value)) {
    return { tasks: [], migrated: false };
  }

  let migrated = false;
  const tasks = value
    .map((item) => {
      if (typeof item === "string") {
        migrated = true;
        return { text: item.trim(), completed: false };
      }
      if (item && typeof item.text === "string") {
        const completed = Boolean(item.completed);
        if (item.completed !== completed) {
          migrated = true;
        }
        return { text: item.text.trim(), completed };
      }
      migrated = true;
      return { text: "", completed: false };
    })
    .filter((item) => item.text.length > 0);

  return { tasks, migrated };
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
    const normalizedTasks = normalizeTasks(parsed.tasks);
    const notesValue =
      typeof parsed.notes === "string" ? parsed.notes : normalize(parsed.notes);
    const state = {
      tasks: normalizedTasks.tasks,
      notes: notesValue,
      links: normalize(parsed.links),
    };
    if (normalizedTasks.migrated) {
      shouldPersist = true;
    }
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

const setTaskItems = (element, tasks, emptyText) => {
  if (!element) {
    return;
  }

  element.innerHTML = "";

  if (tasks.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = emptyText;
    element.appendChild(emptyItem);
    return;
  }

  tasks.forEach((task, index) => {
    const listItem = document.createElement("li");
    listItem.dataset.taskIndex = String(index);
    if (task.completed) {
      listItem.classList.add("task-completed");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = Boolean(task.completed);
    checkbox.setAttribute("aria-label", "Mark task complete");

    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = task.text;

    listItem.appendChild(checkbox);
    listItem.appendChild(textSpan);
    element.appendChild(listItem);
  });
};

const handleTaskToggle = (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  if (!target.classList.contains("task-checkbox")) {
    return;
  }
  const listItem = target.closest("li");
  const index = listItem ? Number(listItem.dataset.taskIndex) : NaN;
  if (!Number.isInteger(index)) {
    return;
  }

  const nextTasks = taskState.map((task, taskIndex) =>
    taskIndex === index ? { ...task, completed: target.checked } : task
  );
  taskState = nextTasks;
  const { state } = loadState();
  saveState({ ...state, tasks: nextTasks });

  if (listItem) {
    listItem.classList.toggle("task-completed", target.checked);
  }
};

const wireTaskToggle = (element) => {
  if (!element || element.dataset.taskToggleBound === "true") {
    return;
  }
  element.addEventListener("change", handleTaskToggle);
  element.dataset.taskToggleBound = "true";
};

const hydrateTasks = () => {
  const { state, shouldPersist } = loadState();
  if (shouldPersist) {
    saveState(state);
  }
  taskState = state.tasks;
  const taskList = document.querySelector(selectors.tasks);
  setTaskItems(taskList, state.tasks, emptyStates.tasks);
  wireTaskToggle(taskList);
};

const hydrate = () => {
  const { state, shouldPersist } = loadState();
  if (shouldPersist) {
    saveState(state);
  }
  taskState = state.tasks;
  const taskList = document.querySelector(selectors.tasks);
  setTaskItems(taskList, state.tasks, emptyStates.tasks);
  wireTaskToggle(taskList);
  if (typeof state.notes === "string") {
    const listEl = document.querySelector(selectors.notes);
    if (listEl) {
      listEl.innerHTML = "";
      const lines = state.notes.split("\n").filter((line) => line.length > 0);
      if (lines.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = emptyStates.notes;
        listEl.appendChild(emptyItem);
      } else {
        lines.forEach((line) => {
          const item = document.createElement("li");
          item.textContent = line;
          listEl.appendChild(item);
        });
      }
    }
  } else {
    setListItems(document.querySelector(selectors.notes), state.notes, emptyStates.notes);
  }
  setListItems(document.querySelector(selectors.links), state.links, emptyStates.links);
};

window.addEventListener("lookout:tasks-updated", hydrateTasks);

hydrate();
