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

/** "24 rows · 6:00 AM today → 5:00 AM next day" */
export function describeRange(startHour, endHour, rowCount) {
  if (rowCount === 1) return `1 row · ${formatHour(startHour)}`;
  const wraps = endHour < startHour;
  return `${rowCount} rows · ${formatHour(startHour)}${wraps ? ' today' : ''} → ${formatHour(endHour)}${wraps ? ' next day' : ''}`;
}

/** Short label for the pill above the grid: "6:00 AM → 5:00 AM (+1)" */
export function shortRange(startHour, endHour) {
  if (startHour === endHour) return formatHour(startHour);
  return `${formatHour(startHour)} → ${formatHour(endHour)}${endHour < startHour ? ' (+1)' : ''}`;
}
