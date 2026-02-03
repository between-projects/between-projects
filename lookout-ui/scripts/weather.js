const WEATHER_STORAGE_KEY = "lookout:weather:v1";
const WEATHER_TTL_MS = 30 * 60 * 1000;

const MODULE_WEATHER_SELECTOR = ".module-time .weather";

const getGreetingTempElement = () => {
  const greetingEl = document.querySelector(".greeting");
  if (!greetingEl) {
    return null;
  }
  const spans = greetingEl.querySelectorAll("span.mono");
  if (spans.length === 0) {
    return null;
  }
  const timeEl = greetingEl.querySelector("[data-lookout-time]");
  if (timeEl) {
    return Array.from(spans).find((span) => span !== timeEl) || null;
  }
  return spans[spans.length - 1] || null;
};

const weatherCodeDescriptions = new Map([
  [0, "Clear sky"],
  [1, "Mainly clear"],
  [2, "Partly cloudy"],
  [3, "Overcast"],
  [45, "Fog"],
  [48, "Rime fog"],
  [51, "Light drizzle"],
  [53, "Drizzle"],
  [55, "Dense drizzle"],
  [56, "Light freezing drizzle"],
  [57, "Freezing drizzle"],
  [61, "Light rain"],
  [63, "Rain"],
  [65, "Heavy rain"],
  [66, "Light freezing rain"],
  [67, "Freezing rain"],
  [71, "Light snow"],
  [73, "Snow"],
  [75, "Heavy snow"],
  [77, "Snow grains"],
  [80, "Light rain showers"],
  [81, "Rain showers"],
  [82, "Violent rain showers"],
  [85, "Light snow showers"],
  [86, "Snow showers"],
  [95, "Thunderstorm"],
  [96, "Thunderstorm with hail"],
  [99, "Thunderstorm with heavy hail"],
]);

const buildWeatherUrl = () => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", "29.9511");
  url.searchParams.set("longitude", "-90.0715");
  url.searchParams.set("current_weather", "true");
  url.searchParams.set("temperature_unit", "fahrenheit");
  return url.toString();
};

const loadCachedWeather = () => {
  try {
    const raw = window.localStorage.getItem(WEATHER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.fetchedAt !== "number") {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
};

const saveCachedWeather = (payload) => {
  try {
    window.localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Silent failure preserves calm.
  }
};

const updateWeatherText = (temperature, description) => {
  const moduleWeatherEl = document.querySelector(MODULE_WEATHER_SELECTOR);
  const greetingTempEl = getGreetingTempElement();

  if (moduleWeatherEl) {
    moduleWeatherEl.textContent = `${temperature}°F, ${description}`;
  }

  if (greetingTempEl) {
    greetingTempEl.textContent = `${temperature}°F`;
  }
};

const applyWeather = (payload) => {
  if (!payload) {
    return;
  }
  const temperature = Number(payload.temperature);
  if (!Number.isFinite(temperature)) {
    return;
  }
  const roundedTemp = Math.round(temperature);
  const description = payload.description || "Clear";
  updateWeatherText(roundedTemp, description);
};

const fetchWeather = async () => {
  const response = await fetch(buildWeatherUrl());
  if (!response.ok) {
    throw new Error("Weather fetch failed");
  }
  const data = await response.json();
  const current = data && data.current_weather;
  if (!current) {
    throw new Error("Weather payload missing current_weather");
  }
  const weathercode = Number(current.weathercode);
  const description = weatherCodeDescriptions.get(weathercode) || "Clear";
  return {
    temperature: current.temperature,
    weathercode,
    description,
    fetchedAt: Date.now(),
  };
};

const scheduleRefresh = (delayMs) => {
  window.setTimeout(() => {
    refreshWeather();
  }, delayMs);
};

const refreshWeather = async () => {
  try {
    const payload = await fetchWeather();
    saveCachedWeather(payload);
    applyWeather(payload);
  } catch (error) {
    // If fetch fails, keep the placeholder text.
  } finally {
    scheduleRefresh(WEATHER_TTL_MS);
  }
};

const initWeather = () => {
  const cached = loadCachedWeather();
  if (cached) {
    applyWeather(cached);
    const age = Date.now() - cached.fetchedAt;
    if (age < WEATHER_TTL_MS) {
      scheduleRefresh(WEATHER_TTL_MS - age);
      return;
    }
  }
  refreshWeather();
};

initWeather();
