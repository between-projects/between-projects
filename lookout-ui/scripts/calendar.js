import { GOOGLE_CLIENT_ID } from "./config.js";

const CALENDAR_TOKEN_KEY = "lookout:calendar:token:v1";
const CALENDAR_CACHE_KEY = "lookout:calendar:cache:v1";
const CACHE_TTL_MS = 7 * 60 * 1000;

const CLIENT_ID = GOOGLE_CLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";

const APPOINTMENTS_LIST_SELECTOR = ".module-appointments .list";

let gisScriptPromise;

const loadGisScript = () => {
  if (gisScriptPromise) {
    return gisScriptPromise;
  }

  gisScriptPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load GIS"));
    document.head.appendChild(script);
  });

  return gisScriptPromise;
};

const saveToken = (token) => {
  try {
    window.sessionStorage.setItem(CALENDAR_TOKEN_KEY, JSON.stringify(token));
  } catch (error) {
    // Silent failure preserves calm.
  }
};

const loadToken = () => {
  try {
    const raw = window.sessionStorage.getItem(CALENDAR_TOKEN_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const tokenExpired = (token) =>
  !token || typeof token.expires_at !== "number" || Date.now() >= token.expires_at;

const saveCache = (payload) => {
  try {
    window.localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Silent failure preserves calm.
  }
};

const loadCache = () => {
  try {
    const raw = window.localStorage.getItem(CALENDAR_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const shouldStartAuth = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("calendar_auth") === "1";
};

const clearAuthParams = () => {
  if (window.location.search.includes("calendar_auth") || window.location.search.includes("code=")) {
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    url.searchParams.delete("scope");
    url.searchParams.delete("calendar_auth");
    window.history.replaceState({}, "", url.toString());
  }
};

const formatEventTime = (dateTime) =>
  new Date(dateTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const setAppointments = (events) => {
  const listEl = document.querySelector(APPOINTMENTS_LIST_SELECTOR);
  if (!listEl) {
    return;
  }

  listEl.innerHTML = "";

  if (events.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "Your day is open.";
    listEl.appendChild(emptyItem);
    return;
  }

  events.forEach((event) => {
    const listItem = document.createElement("li");
    const timeSpan = document.createElement("span");
    timeSpan.className = "mono";
    timeSpan.textContent = event.time;
    listItem.appendChild(timeSpan);
    listItem.append(` ${event.title}`);
    listEl.appendChild(listItem);
  });
};

const getTodayWindow = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  };
};

const fetchEvents = async (accessToken) => {
  const { timeMin, timeMax } = getTodayWindow();
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "10",
  });
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.items)) {
    return null;
  }

  return data.items
    .filter((event) => event.start && event.start.dateTime)
    .map((event) => ({
      time: formatEventTime(event.start.dateTime),
      title: event.summary || "Untitled",
    }));
};

const hydrateFromCache = () => {
  const cached = loadCache();
  if (!cached || typeof cached.fetchedAt !== "number") {
    return false;
  }
  if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    return false;
  }
  if (!Array.isArray(cached.items)) {
    return false;
  }
  setAppointments(cached.items);
  return true;
};

const hydrateFromApi = async (token) => {
  const events = await fetchEvents(token.access_token);
  if (!events) {
    return;
  }
  saveCache({ items: events, fetchedAt: Date.now() });
  setAppointments(events);
};

const requestToken = async (prompt) => {
  if (!CLIENT_ID || CLIENT_ID === "PASTE_CLIENT_ID_HERE") {
    return null;
  }

  await loadGisScript();

  return new Promise((resolve) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      prompt,
      callback: (response) => resolve(response),
    });

    tokenClient.requestAccessToken({ prompt });
  });
};

const initCalendar = async () => {
  const wantsAuth = shouldStartAuth();

  if (!CLIENT_ID || CLIENT_ID === "PASTE_CLIENT_ID_HERE") {
    return;
  }

  if (wantsAuth) {
    const response = await requestToken("consent");
    if (response && response.access_token) {
      const token = {
        access_token: response.access_token,
        expires_at: Date.now() + (response.expires_in || 0) * 1000,
      };
      saveToken(token);
      clearAuthParams();
      await hydrateFromApi(token);
    }
    return;
  }

  const token = loadToken();
  if (!token || tokenExpired(token)) {
    return;
  }

  if (hydrateFromCache()) {
    return;
  }

  await hydrateFromApi(token);
};

initCalendar();
