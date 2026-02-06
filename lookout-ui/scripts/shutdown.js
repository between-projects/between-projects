import { GOOGLE_CLIENT_ID } from "./config.js";

const STORAGE_KEY = "lookout:v1";
const CALENDAR_CACHE_KEY = "lookout:calendar:cache:v1";
const WEATHER_CACHE_KEY = "lookout:weather:v1";
const SHUTDOWN_TOKEN_KEY = "lookout:shutdown:token:v1";

const SHUTDOWN_TRIGGER_SELECTOR = ".shutdown-trigger";
const TASKS_LIST_SELECTOR = ".module-tasks .list";
const NOTES_LIST_SELECTOR = ".module-notes .list";
const LINKS_LIST_SELECTOR = ".module-links .list";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DOCS_SCOPE = "https://www.googleapis.com/auth/documents";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";

let overlayEl = null;
let suppressClose = false;
let gisPromise = null;

const loadState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { tasks: [], notes: "", links: [], location: null };
    }
    const parsed = JSON.parse(raw);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      notes: parsed.notes ?? "",
      links: Array.isArray(parsed.links) ? parsed.links : [],
      location: parsed.location ?? null,
    };
  } catch (error) {
    return { tasks: [], notes: "", links: [], location: null };
  }
};

const saveState = (state) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Silent failure preserves calm.
  }
};

const loadCalendarCache = () => {
  try {
    const raw = window.localStorage.getItem(CALENDAR_CACHE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch (error) {
    return [];
  }
};

const loadWeatherCache = () => {
  try {
    const raw = window.localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const formatDate = (date, timeZone) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timeZone || undefined,
  }).format(date);

const formatTimestamp = (date, timeZone) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timeZone || undefined,
  }).format(date);

const formatTime = (date, timeZone) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timeZone || undefined,
  }).format(date);

const normalizeTasks = (tasks) =>
  tasks
    .map((task) => {
      if (typeof task === "string") {
        return { text: task, completed: false };
      }
      if (task && typeof task.text === "string") {
        return { text: task.text, completed: Boolean(task.completed) };
      }
      return null;
    })
    .filter(Boolean);

const normalizeLinks = (links) =>
  links
    .map((link) => (typeof link === "string" ? link.trim() : ""))
    .filter((link) => link.length > 0);

const loadToken = () => {
  try {
    const raw = window.sessionStorage.getItem(SHUTDOWN_TOKEN_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const saveToken = (token) => {
  try {
    window.sessionStorage.setItem(SHUTDOWN_TOKEN_KEY, JSON.stringify(token));
  } catch (error) {
    // Silent failure preserves calm.
  }
};

const tokenExpired = (token) =>
  !token || typeof token.expires_at !== "number" || Date.now() >= token.expires_at;

const loadGis = () => {
  if (gisPromise) {
    return gisPromise;
  }
  gisPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("GIS load failed"));
    document.head.appendChild(script);
  });
  return gisPromise;
};

const requestToken = async () => {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "PASTE_CLIENT_ID_HERE") {
    return null;
  }
  await loadGis();
  const scope = `${DRIVE_SCOPE} ${DOCS_SCOPE} ${GMAIL_SCOPE}`;
  return new Promise((resolve) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope,
      prompt: "consent",
      callback: (response) => resolve(response),
    });
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
};

const getOrCreateFolder = async (token, name, parentId = null) => {
  const qParts = [
    `name = '${name.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
  ];
  if (parentId) {
    qParts.push(`'${parentId}' in parents`);
  } else {
    qParts.push("'root' in parents");
  }
  const query = encodeURIComponent(qParts.join(" and "));
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (listRes.ok) {
    const data = await listRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  const body = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    body.parents = [parentId];
  }
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!createRes.ok) {
    return null;
  }
  const created = await createRes.json();
  return created.id || null;
};

const createDocument = async (token, title, parentId, content) => {
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: title,
      mimeType: "application/vnd.google-apps.document",
      parents: [parentId],
    }),
  });
  if (!createRes.ok) {
    return null;
  }
  const created = await createRes.json();
  if (!created.id) {
    return null;
  }

  const updateRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${created.id}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    return null;
  }

  return created.id;
};

const base64UrlEncode = (input) =>
  btoa(String.fromCharCode(...input))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const sendEmail = async (token, subject, body) => {
  const raw = `To: jonah@between-projects.com\nSubject: ${subject}\nContent-Type: text/plain; charset=\"UTF-8\"\n\n${body}`;
  const encoded = base64UrlEncode(new TextEncoder().encode(raw));
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encoded }),
  });
  return res.ok;
};

const buildContextSnapshot = () => {
  const state = loadState();
  const tasks = normalizeTasks(state.tasks);
  const notesText = typeof state.notes === "string" ? state.notes : "";
  const links = normalizeLinks(state.links);
  const calendar = loadCalendarCache();
  const weather = loadWeatherCache();
  const timeZone = state.location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const timestamp = formatTimestamp(now, timeZone);
  const time = formatTime(now, timeZone);

  const completedTasks = tasks.filter((task) => task.completed).map((task) => task.text);
  const openTasks = tasks.filter((task) => !task.completed).map((task) => task.text);

  const weatherLine = weather
    ? `${Math.round(Number(weather.temperature))}°F, ${weather.description || ""}`
    : "";

  const calendarLines = calendar.map((event) => `${event.time} — ${event.title}`);

  return {
    header: { date: formatDate(now, timeZone), timestamp, time, timeZone },
    location: state.location?.label || "",
    weather: weatherLine,
    tasks: { completed: completedTasks, open: openTasks },
    notes: notesText,
    links,
    calendar: calendarLines,
  };
};

const formatSnapshotText = (snapshot, reflections) => {
  const lines = [];
  lines.push(`Date: ${snapshot.header.date}`);
  lines.push(`Timestamp: ${snapshot.header.timestamp}`);
  lines.push(`Time: ${snapshot.header.time}`);
  if (snapshot.location) {
    lines.push(`Location: ${snapshot.location}`);
  }
  if (snapshot.header.timeZone) {
    lines.push(`Timezone: ${snapshot.header.timeZone}`);
  }
  if (snapshot.weather) {
    lines.push(`Weather: ${snapshot.weather}`);
  }
  lines.push("");
  lines.push("Reflection — What went well today?");
  lines.push(reflections.wentWell || "");
  lines.push("");
  lines.push("Reflection — What didn’t go as expected?");
  lines.push(reflections.didntGo || "");
  lines.push("");
  lines.push("Reflection — Tasks remaining for tomorrow");
  lines.push(reflections.remaining || "");
  lines.push("");
  lines.push("Tasks (Open):");
  if (snapshot.tasks.open.length === 0) {
    lines.push("—");
  } else {
    snapshot.tasks.open.forEach((task) => lines.push(`- ${task}`));
  }
  lines.push("");
  lines.push("Tasks (Completed):");
  if (snapshot.tasks.completed.length === 0) {
    lines.push("—");
  } else {
    snapshot.tasks.completed.forEach((task) => lines.push(`- ${task}`));
  }
  lines.push("");
  lines.push("Notes:");
  lines.push(snapshot.notes || "");
  lines.push("");
  lines.push("Links:");
  if (snapshot.links.length === 0) {
    lines.push("—");
  } else {
    snapshot.links.forEach((link) => lines.push(`- ${link}`));
  }
  lines.push("");
  lines.push("Calendar (Today):");
  if (snapshot.calendar.length === 0) {
    lines.push("—");
  } else {
    snapshot.calendar.forEach((line) => lines.push(`- ${line}`));
  }
  return lines.join("\n");
};

const renderContext = (snapshot) => {
  const lines = [];
  lines.push(`Date: ${snapshot.header.date}`);
  lines.push(`Time: ${snapshot.header.time}`);
  if (snapshot.location) {
    lines.push(`Location: ${snapshot.location}`);
  }
  if (snapshot.weather) {
    lines.push(`Weather: ${snapshot.weather}`);
  }
  if (snapshot.calendar.length) {
    lines.push("Calendar:");
    snapshot.calendar.forEach((line) => lines.push(`• ${line}`));
  }
  if (snapshot.tasks.open.length) {
    lines.push("Open tasks:");
    snapshot.tasks.open.forEach((task) => lines.push(`• ${task}`));
  }
  if (snapshot.tasks.completed.length) {
    lines.push("Completed tasks:");
    snapshot.tasks.completed.forEach((task) => lines.push(`• ${task}`));
  }
  if (snapshot.notes) {
    lines.push("Notes:");
    lines.push(snapshot.notes);
  }
  if (snapshot.links.length) {
    lines.push("Links:");
    snapshot.links.forEach((link) => lines.push(`• ${link}`));
  }
  return lines.join("\n");
};

const updateListsAfterClear = () => {
  const tasksList = document.querySelector(TASKS_LIST_SELECTOR);
  if (tasksList) {
    tasksList.innerHTML = "";
    const item = document.createElement("li");
    item.textContent = "Nothing pressing.";
    tasksList.appendChild(item);
  }

  const notesList = document.querySelector(NOTES_LIST_SELECTOR);
  if (notesList) {
    notesList.innerHTML = "";
  }

  const linksList = document.querySelector(LINKS_LIST_SELECTOR);
  if (linksList) {
    linksList.innerHTML = "";
    const item = document.createElement("li");
    item.textContent = "—";
    linksList.appendChild(item);
  }
};

const closeOverlay = () => {
  if (overlayEl) {
    overlayEl.remove();
  }
  overlayEl = null;
};

const openOverlay = () => {
  if (overlayEl && document.body.contains(overlayEl)) {
    return;
  }

  const snapshot = buildContextSnapshot();

  const overlay = document.createElement("div");
  overlay.className = "shutdown-overlay";

  const panel = document.createElement("div");
  panel.className = "shutdown-panel";

  const title = document.createElement("h3");
  title.textContent = "Schedule shutdown";

  const promptLabel1 = document.createElement("p");
  promptLabel1.className = "shutdown-prompt";
  promptLabel1.textContent = "What went well today?";
  const prompt1 = document.createElement("textarea");

  const promptLabel2 = document.createElement("p");
  promptLabel2.className = "shutdown-prompt";
  promptLabel2.textContent = "What didn’t go as expected?";
  const prompt2 = document.createElement("textarea");

  const promptLabel3 = document.createElement("p");
  promptLabel3.className = "shutdown-prompt";
  promptLabel3.textContent = "What, if any, tasks from today remain for tomorrow?";
  const prompt3 = document.createElement("textarea");

  const context = document.createElement("div");
  context.className = "shutdown-context";
  context.textContent = renderContext(snapshot);

  const action = document.createElement("button");
  action.type = "button";
  action.className = "shutdown-action";
  action.textContent = "Close the day";

  panel.appendChild(title);
  panel.appendChild(promptLabel1);
  panel.appendChild(prompt1);
  panel.appendChild(promptLabel2);
  panel.appendChild(prompt2);
  panel.appendChild(promptLabel3);
  panel.appendChild(prompt3);
  panel.appendChild(context);
  panel.appendChild(action);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  overlayEl = overlay;

  suppressClose = true;
  queueMicrotask(() => {
    suppressClose = false;
  });

  action.addEventListener("click", async () => {
    const reflections = {
      wentWell: prompt1.value,
      didntGo: prompt2.value,
      remaining: prompt3.value,
    };

    const token = loadToken();
    let accessToken = token && !tokenExpired(token) ? token.access_token : null;
    if (!accessToken) {
      const response = await requestToken();
      if (!response || !response.access_token) {
        return;
      }
      accessToken = response.access_token;
      saveToken({
        access_token: response.access_token,
        expires_at: Date.now() + (response.expires_in || 0) * 1000,
      });
    }

    const snapshotNow = buildContextSnapshot();
    const dateLabel = snapshotNow.header.date;
    const titleText = `Lookout Shutdown — ${dateLabel}`;
    const content = formatSnapshotText(snapshotNow, reflections);

    try {
      const lookoutFolder = await getOrCreateFolder(accessToken, "Lookout");
      if (!lookoutFolder) {
        return;
      }
      const shutdownFolder = await getOrCreateFolder(
        accessToken,
        "Shutdowns",
        lookoutFolder
      );
      if (!shutdownFolder) {
        return;
      }
      const docId = await createDocument(accessToken, titleText, shutdownFolder, content);
      if (!docId) {
        return;
      }
      const emailSent = await sendEmail(
        accessToken,
        `End of Day — ${dateLabel}`,
        content
      );
      if (!emailSent) {
        return;
      }

      const state = loadState();
      saveState({ ...state, tasks: [], notes: "", links: [] });
      updateListsAfterClear();
      window.dispatchEvent(new Event("lookout:tasks-updated"));
      closeOverlay();
    } catch (error) {
      // Silent failure preserves calm.
    }
  });
};

const handleTriggerClick = (event) => {
  const trigger = event.target.closest(SHUTDOWN_TRIGGER_SELECTOR);
  if (!trigger) {
    return;
  }
  openOverlay();
};

const handleDocumentClick = (event) => {
  if (!overlayEl) {
    return;
  }
  if (suppressClose) {
    return;
  }
  if (event.target.closest(".shutdown-panel")) {
    return;
  }
  closeOverlay();
};

const handleKeydown = (event) => {
  if (!overlayEl) {
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closeOverlay();
  }
};

const initShutdown = () => {
  const trigger = document.querySelector(SHUTDOWN_TRIGGER_SELECTOR);
  if (trigger) {
    trigger.addEventListener("click", handleTriggerClick);
  }
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleKeydown);
};

initShutdown();
