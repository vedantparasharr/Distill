export const formatDate = (value, options = {}) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: options.withTime ? "short" : undefined,
  }).format(new Date(value));
};

export const formatBytes = (value = 0) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const size = value / 1024 ** unitIndex;

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const sentenceCase = (value = "") => {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const truncate = (value = "", length = 180) => {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length).trim()}...`;
};