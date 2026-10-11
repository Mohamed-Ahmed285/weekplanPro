/** 6 -> "6:00 AM", 13 -> "1:00 PM" */
export function formatHour(hour24) {
  const normalizedHour = hour24 % 24;
  const h = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  const suffix = normalizedHour >= 12 ? 'PM' : 'AM';
  return `${h}:00 ${suffix}`;
}

/** Index of today in a Monday-first week (Mon = 0 ... Sun = 6). */
export function todayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}
