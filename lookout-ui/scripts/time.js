const greetingSelector = ".greeting";
const greetingTimeSelector = ".greeting .mono";
const moduleTimeSelector = ".module-time .time";

const getPeriod = (hours) => {
  if (hours >= 5 && hours < 12) {
    return "Morning";
  }
  if (hours >= 12 && hours < 17) {
    return "Afternoon";
  }
  return "Evening";
};

const formatTime = (date) =>
  date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const updateGreeting = (date) => {
  const greetingEl = document.querySelector(greetingSelector);
  if (!greetingEl) {
    return;
  }

  const period = getPeriod(date.getHours());
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
    timeEl.textContent = formatTime(date);
  }
};

const updateModuleTime = (date) => {
  const timeEl = document.querySelector(moduleTimeSelector);
  if (!timeEl) {
    return;
  }
  timeEl.textContent = formatTime(date);
};

const updateTime = () => {
  const now = new Date();
  updateGreeting(now);
  updateModuleTime(now);
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

updateTime();
scheduleNextTick();
