/** 360 -> "6:00 AM", 810 -> "1:30 PM". Minutes past 1440 wrap to the next day. */
export function formatTime(totalMinutes) {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(m / 60);
  const h = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  return `${h}:${String(m % 60).padStart(2, '0')} ${suffix}`;
}

/** 6 -> "6:00 AM", 13 -> "1:00 PM" */
export const formatHour = (hour24) => formatTime(hour24 * 60);

/** 30 -> "30 min", 60 -> "1 hr", 90 -> "1 hr 30 min" */
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** Index of today in a Monday-first week (Mon = 0 ... Sun = 6). */
export function todayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

/** "48 rows · 30 min each · 6:00 AM today → 5:00 AM next day" */
export function describeRange(startHour, endHour, rowCount, slotMinutes = 60) {
  const size = slotMinutes === 60 ? '' : ` · ${formatDuration(slotMinutes)} each`;
  if (startHour === endHour && slotMinutes >= 60) return `1 row · ${formatHour(startHour)}`;
  const wraps = endHour < startHour;
  return `${rowCount} rows${size} · ${formatHour(startHour)}${wraps ? ' today' : ''} → ${formatHour(endHour)}${wraps ? ' next day' : ''}`;
}

/** Short label for the pill above the grid: "6:00 AM → 5:00 AM (+1) · 30 min" */
export function shortRange(startHour, endHour, slotMinutes = 60) {
  const range =
    startHour === endHour
      ? formatHour(startHour)
      : `${formatHour(startHour)} → ${formatHour(endHour)}${endHour < startHour ? ' (+1)' : ''}`;
  return slotMinutes === 60 ? range : `${range} · ${formatDuration(slotMinutes)}`;
}
