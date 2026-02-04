import { GOOGLE_CLIENT_ID } from "./config.js";

const CALENDAR_TOKEN_KEY = "lookout:calendar:token:v1";
const CALENDAR_CACHE_KEY = "lookout:calendar:cache:v1";
const CACHE_TTL_MS = 7 * 60 * 1000;

const CLIENT_ID = GOOGLE_CLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

const APPOINTMENTS_LIST_SELECTOR = ".module-appointments .list";

const getRedirectUri = () =>
  `${window.location.origin}${window.location.pathname}`;

const generateCodeVerifier = () => {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const base64UrlEncode = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const createCodeChallenge = async (verifier) => {
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
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

const startAuth = async () => {
  if (!CLIENT_ID || CLIENT_ID === "PASTE_CLIENT_ID_HERE") {
    return;
  }
  const verifier = generateCodeVerifier();
  const challenge = await createCodeChallenge(verifier);
  window.sessionStorage.setItem("lookout:calendar:verifier", verifier);
  const state = generateCodeVerifier();
  window.sessionStorage.setItem("lookout:calendar:state", state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });

  window.location.assign(`${AUTH_ENDPOINT}?${params.toString()}`);
};

const exchangeCodeForToken = async (code) => {
  const verifier = window.sessionStorage.getItem("lookout:calendar:verifier");
  if (!verifier) {
    return null;
  }
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 0) * 1000,
  };
};

const clearAuthParams = () => {
  if (window.location.search.includes("code=")) {
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

const initCalendar = async () => {
  if (shouldStartAuth()) {
    await startAuth();
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");

  if (code) {
    const expectedState = window.sessionStorage.getItem("lookout:calendar:state");
    if (state && expectedState && state !== expectedState) {
      return;
    }
    const token = await exchangeCodeForToken(code);
    clearAuthParams();
    if (token) {
      saveToken(token);
    }
  }

  if (!CLIENT_ID || CLIENT_ID === "PASTE_CLIENT_ID_HERE") {
    return;
  }

  let token = loadToken();
  if (!token || tokenExpired(token)) {
    return;
  }

  if (hydrateFromCache()) {
    return;
  }

  await hydrateFromApi(token);
};

initCalendar();
