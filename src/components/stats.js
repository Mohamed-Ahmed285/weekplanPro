import { CATEGORIES } from '../constants.js';

export function renderStats(el, { tasks, schedule }) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const hours = {};

  for (const taskId of Object.values(schedule)) {
    const task = byId.get(taskId);
    if (task) hours[task.category] = (hours[task.category] || 0) + 1;
  }

  el.innerHTML = CATEGORIES.map(
    (cat) => `
      <div class="stat">
        <span class="chip" style="--chip: ${cat.color}">${cat.id}</span>
        <p class="stat__value">${hours[cat.id] || 0}<span class="stat__unit">hrs</span></p>
      </div>`,
  ).join('');
}
