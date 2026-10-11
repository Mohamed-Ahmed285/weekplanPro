import { CATEGORIES } from './constants.js';
import { safeColor } from './utils/dom.js';

export const MAX_CATEGORIES = 4;
export const MAX_LABEL_LENGTH = 30;

/** startHour / endHour are clock hours 0-23. endHour is INCLUDED in the grid. */
export const DEFAULT_SETTINGS = {
  startHour: 6,
  endHour: 5,
  categories: CATEGORIES,
};

const isHour = (n) => Number.isInteger(n) && n >= 0 && n <= 23;

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
    categories: categories.length ? categories : DEFAULT_SETTINGS.categories,
  };
}

/**
 * Hour numbers shown in the grid. Hours after midnight continue past 23
 * (24 = 12 AM next day) so slot keys stay unique and in order.
 * End before start wraps past midnight; same hour = a single row.
 */
export function getHours({ startHour, endHour }) {
  const last = endHour >= startHour ? endHour : endHour + 24;
  return Array.from({ length: last - startHour + 1 }, (_, i) => startHour + i);
}

/** Tasks pointing at a deleted/unknown category move to the first category. */
export function normalizeTasks(tasks, categories) {
  const ids = new Set(categories.map((c) => c.id));
  return tasks.map((t) => (ids.has(t.category) ? t : { ...t, category: categories[0].id }));
}

export const categoryMap = (categories) => new Map(categories.map((c) => [c.id, c]));
