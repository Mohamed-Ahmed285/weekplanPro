import { CATEGORIES } from './constants.js';
import { safeColor } from './utils/dom.js';

export const MAX_CATEGORIES = 4;
export const MAX_LABEL_LENGTH = 30;
export const MIN_SLOT_MINUTES = 5;
export const MAX_SLOT_MINUTES = 240;

/**
 * startHour / endHour are clock hours 0-23. endHour is INCLUDED in the grid.
 * slotMinutes is the length of one grid row. Plans saved before this setting
 * existed have no slotMinutes and fall back to 60, exactly as they behaved before.
 */
export const DEFAULT_SETTINGS = {
  startHour: 6,
  endHour: 5,
  slotMinutes: 60,
  categories: CATEGORIES,
};

const isHour = (n) => Number.isInteger(n) && n >= 0 && n <= 23;
export const isSlotMinutes = (n) =>
  Number.isInteger(n) && n >= MIN_SLOT_MINUTES && n <= MAX_SLOT_MINUTES;

/** Accepts anything (saved data, imports) and always returns a valid settings object. */
export function normalizeSettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const seen = new Set();
  const categories = (Array.isArray(src.categories) ? src.categories : [])
    .map((c) => ({
      id: String(c?.id ?? '').trim(),
      label: String(c?.label ?? '').trim().slice(0, MAX_LABEL_LENGTH),
      color: safeColor(c?.color),
    }))
    .filter((c) => c.id && c.label && !seen.has(c.id) && seen.add(c.id))
    .slice(0, MAX_CATEGORIES);

  return {
    startHour: isHour(src.startHour) ? src.startHour : DEFAULT_SETTINGS.startHour,
    endHour: isHour(src.endHour) ? src.endHour : DEFAULT_SETTINGS.endHour,
    slotMinutes: isSlotMinutes(src.slotMinutes) ? src.slotMinutes : DEFAULT_SETTINGS.slotMinutes,
    categories: categories.length ? categories : DEFAULT_SETTINGS.categories,
  };
}

/**
 * Rows shown in the grid, as { minute, duration }. `minute` is the start in minutes
 * from midnight of the first day; times after midnight continue past 1439
 * (1440 = 12 AM next day) so keys stay unique and in order.
 * The range runs from startHour:00 to the END of endHour (end before start wraps
 * past midnight). Rows are slotMinutes long; a final row that would overshoot is shortened.
 */
export function getSlots({ startHour, endHour, slotMinutes }) {
  const start = startHour * 60;
  const end = (endHour >= startHour ? endHour + 1 : endHour + 25) * 60;
  const slots = [];
  for (let minute = start; minute < end; minute += slotMinutes) {
    slots.push({ minute, duration: Math.min(slotMinutes, end - minute) });
  }
  return slots;
}

/** Tasks pointing at a deleted/unknown category move to the first category. */
export function normalizeTasks(tasks, categories) {
  const ids = new Set(categories.map((c) => c.id));
  return tasks.map((t) => (ids.has(t.category) ? t : { ...t, category: categories[0].id }));
}

export const categoryMap = (categories) => new Map(categories.map((c) => [c.id, c]));
