import { DAYS } from '../constants.js';
import { getSlots } from '../settings.js';
import { slotKey } from '../store.js';
import { escapeHtml, safeColor } from '../utils/dom.js';

/** Hours per category, counting only the slots currently visible in the grid. */
export function renderStats(el, { tasks, schedule, settings }) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const minutes = {};

  for (const { minute, duration } of getSlots(settings)) {
    for (const day of DAYS) {
      const task = byId.get(schedule[slotKey(day, minute)]);
      if (task) minutes[task.category] = (minutes[task.category] || 0) + duration;
    }
  }

  // 90 minutes -> "1.5"; whole hours stay "2".
  const hours = (cat) => Number(((minutes[cat] || 0) / 60).toFixed(1));

  el.style.setProperty('--cats', settings.categories.length);
  el.innerHTML = settings.categories
    .map(
      (cat) => `
      <div class="stat">
        <span class="chip" style="--chip: ${safeColor(cat.color)}">${escapeHtml(cat.label)}</span>
        <p class="stat__value">${hours(cat.id)}<span class="stat__unit">hrs</span></p>
      </div>`,
    )
    .join('');
}
