const greetingSelector = ".greeting";
const greetingTimeSelector = "[data-lookout-time]";
const moduleTimeSelector = ".module-time .time";
const STORAGE_KEY = "lookout:v1";

const loadTimezone = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed?.location?.timezone || null;
  } catch (error) {
    return null;
  }
};

const getTimeParts = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timeZone || undefined,
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value || "";
  return { hour, dayPeriod, formatted: formatter.format(date) };
};

const getPeriod = (hour24) => {
  if (hour24 >= 5 && hour24 < 12) {
    return "Morning";
  }
  if (hour24 >= 12 && hour24 < 17) {
    return "Afternoon";
  }
  return "Evening";
};

const getHour24 = (date, timeZone) => {
  if (!timeZone) {
    return date.getHours();
  }
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone,
  });
  const hour = Number(formatter.format(date));
  return Number.isFinite(hour) ? hour : date.getHours();
};

const updateGreeting = (date, timeZone) => {
  const greetingEl = document.querySelector(greetingSelector);
  if (!greetingEl) {
    return;
  }

  const hour24 = getHour24(date, timeZone);
  const period = getPeriod(hour24);
  const textNodes = Array.from(greetingEl.childNodes).filter(
    (node) => node.nodeType === Node.TEXT_NODE
  );
  const leadingNode = textNodes.find((node) =>
    node.nodeValue?.includes("Good ")
  );

  if (leadingNode) {
    leadingNode.nodeValue = `Good ${period}, Jonah. It's `;
  }

  const timeEl = document.querySelector(greetingTimeSelector);
  if (timeEl) {
    timeEl.textContent = getTimeParts(date, timeZone).formatted;
  }
};

const updateModuleTime = (date, timeZone) => {
  const timeEl = document.querySelector(moduleTimeSelector);
  if (!timeEl) {
    return;
  }
  timeEl.textContent = getTimeParts(date, timeZone).formatted;
};

const updateTime = () => {
  const now = new Date();
  const timeZone = loadTimezone();
  updateGreeting(now, timeZone);
  updateModuleTime(now, timeZone);
};

const scheduleNextTick = () => {
  const now = new Date();
  const msToNextMinute =
    (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  window.setTimeout(() => {
    updateTime();
    scheduleNextTick();
  }, Math.max(msToNextMinute, 0));
};

window.addEventListener("lookout:location-updated", updateTime);

updateTime();
scheduleNextTick();
