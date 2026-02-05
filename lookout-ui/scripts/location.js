const STORAGE_KEY = "lookout:v1";
const LOCATION_SELECTOR = ".module-time .location";

let panelEl = null;
let suppressClose = false;

const loadState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { tasks: [], notes: "", links: [] };
    }
    return JSON.parse(raw);
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

const setLocationLabel = (label) => {
  const locationEl = document.querySelector(LOCATION_SELECTOR);
  if (!locationEl) {
    return;
  }
  locationEl.textContent = label;
};

const buildPanel = () => {
  const panel = document.createElement("div");
  panel.className = "location-panel";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "location-action";
  button.textContent = "Use current location";

  panel.appendChild(button);
  return { panel, button };
};

const closePanel = () => {
  if (panelEl) {
    panelEl.remove();
  }
  panelEl = null;
};

const openPanel = (locationEl) => {
  if (panelEl) {
    return;
  }
  const { panel, button } = buildPanel();
  panelEl = panel;
  locationEl.parentElement?.appendChild(panel);

  suppressClose = true;
  queueMicrotask(() => {
    suppressClose = false;
  });

  button.addEventListener("click", async () => {
    closePanel();
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        const nextLocation = {
          label: "Current location",
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          timezone,
        };
        const state = loadState();
        saveState({ ...state, location: nextLocation });
        setLocationLabel(nextLocation.label);
        window.dispatchEvent(new Event("lookout:location-updated"));
      },
      () => {
        // Silent failure preserves calm.
      }
    );
  });
};

const handleLocationClick = (event) => {
  const locationEl = event.target.closest(LOCATION_SELECTOR);
  if (!locationEl) {
    return;
  }
  openPanel(locationEl);
};

const handleDocumentClick = (event) => {
  if (!panelEl) {
    return;
  }
  if (suppressClose) {
    return;
  }
  if (event.target.closest(".location-panel")) {
    return;
  }
  const locationEl = event.target.closest(LOCATION_SELECTOR);
  if (locationEl) {
    return;
  }
  closePanel();
};

const hydrateLocationLabel = () => {
  const state = loadState();
  if (state && state.location && state.location.label) {
    setLocationLabel(state.location.label);
  }
};

const initLocation = () => {
  const locationEl = document.querySelector(LOCATION_SELECTOR);
  if (locationEl) {
    locationEl.addEventListener("click", handleLocationClick);
  }
  document.addEventListener("click", handleDocumentClick);
  hydrateLocationLabel();
};

initLocation();
