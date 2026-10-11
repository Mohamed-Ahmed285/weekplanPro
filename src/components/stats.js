import { getHours } from '../settings.js';
import { escapeHtml, safeColor } from '../utils/dom.js';

/** Counts only the hours currently visible in the grid. */
export function renderStats(el, { tasks, schedule, settings }) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const visible = new Set(getHours(settings));
  const hours = {};

  for (const [key, taskId] of Object.entries(schedule)) {
    // Slot keys look like "Monday-27"; the hour is after the last dash.
    if (!visible.has(Number(key.slice(key.lastIndexOf('-') + 1)))) continue;
    const task = byId.get(taskId);
    if (task) hours[task.category] = (hours[task.category] || 0) + 1;
  }

  el.style.setProperty('--cats', settings.categories.length);
  el.innerHTML = settings.categories
    .map(
      (cat) => `
      <div class="stat">
        <span class="chip" style="--chip: ${safeColor(cat.color)}">${escapeHtml(cat.label)}</span>
        <p class="stat__value">${hours[cat.id] || 0}<span class="stat__unit">hrs</span></p>
      </div>`,
    )
    .join('');
}
