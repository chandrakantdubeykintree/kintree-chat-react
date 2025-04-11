import { format } from "date-fns";

export function capitalizeName(name) {
  if (!name) return "";
  return name?.[0]?.toUpperCase() + name?.substring(1);
}

export function formatTimeAgo(dateString) {
  // Parse the incoming date string (assuming it's in 'YYYY-MM-DD HH:mm:ss' format)
  const date = new Date(dateString?.replace(" ", "T")); // Convert to ISO format
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

  // Seconds ago
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  // Minutes ago
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  // Hours ago
  const diffInHours = Math.floor(diffInSeconds / 3600);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  // Days ago
  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  // Weeks ago
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 52) return `${diffInWeeks}w ago`;

  // Years ago
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

export function formatTimeAgoBirthDay(dateString) {
  const date = new Date(dateString?.replace(" ", "T"));
  const now = new Date();

  // Create date for this year's birthday
  const thisYearBirthday = new Date(date);
  thisYearBirthday.setFullYear(now.getFullYear());

  // Create date for next year's birthday
  const nextYearBirthday = new Date(date);
  nextYearBirthday.setFullYear(now.getFullYear() + 1);

  // Calculate differences
  const diffToThisYear = Math.floor((thisYearBirthday - now) / (1000 * 86400));
  const diffToNextYear = Math.floor((nextYearBirthday - now) / (1000 * 86400));

  // If this year's birthday has passed, use next year's
  if (diffToThisYear < 0) {
    return `Birthday in ${diffToNextYear} days`;
  }
  // If birthday is today
  else if (diffToThisYear === 0) {
    return "Birthday is today!";
  }
  // If this year's birthday hasn't happened yet
  else {
    return `Birthday in ${diffToThisYear} days`;
  }
}

export const replaceUrlParams = (url, params) => {
  let finalUrl = url;
  Object.keys(params).forEach((key) => {
    finalUrl = finalUrl.replace(`:${key}`, params[key]);
  });
  return finalUrl;
};

export function formatPercentage(val, tot, dec = 0) {
  if (!val || !tot || isNaN(Number(val)) || isNaN(Number(tot))) {
    return "0";
  }
  const numVal = Number(val);
  const numTot = Number(tot);
  if (numTot === 0) {
    return "0";
  }
  const per = ((numVal / numTot) * 100).toFixed(dec);
  return per;
}

export function formatCounts(text, count, width) {
  const formattedCount = Math.max(0, count);
  if (width < 420) {
    return `${formattedCount}`;
  }
  return `${formattedCount} ${text}${formattedCount !== 1 ? "s" : ""}`;
}

export const detectIdentifierType = (value) => {
  if (!value) return null;
  if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) return "email";
  if (/^\d{10}$/.test(value)) return "phone";
  if (value.includes("@") || value.includes(".")) return null;
  return "username";
};

export const getInitials = (value) => {
  if (!value) return "";
  return value?.[0]?.toUpperCase();
};

export const formatDateForAPI = (date) => {
  if (!date) return "";
  return format(new Date(date), "yyyy-MM-dd HH:mm:ss");
};
