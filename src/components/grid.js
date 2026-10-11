import { DAYS, DAY_SHORT, HOURS } from '../constants.js';
import { slotKey } from '../store.js';
import { escapeHtml, safeColor } from '../utils/dom.js';
import { formatHour, todayIndex } from '../utils/time.js';

function renderBlock(task) {
  const title = escapeHtml(task.title);
  return `
    <div class="block" style="--block: ${safeColor(task.color)}">
      <span class="block__title">${title}</span>
      <span class="block__cat">${escapeHtml(task.category)}</span>
      <button type="button" class="block__x" data-clear aria-label="Remove ${title}">×</button>
    </div>`;
}

export function renderGrid(el, { tasks, schedule }) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const today = todayIndex();

  const header =
    `<div class="grid__corner">Time</div>` +
    DAYS.map(
      (_, i) => `
        <div class="grid__day${i === today ? ' is-today' : ''}">
          ${DAY_SHORT[i]}${i === today ? '<span class="badge">Today</span>' : ''}
        </div>`,
    ).join('');

  const rows = HOURS.map((hour) => {
    const cells = DAYS.map((day, i) => {
      const task = byId.get(schedule[slotKey(day, hour)]);
      const label = `${day} ${formatHour(hour)}${task ? `: ${escapeHtml(task.title)}` : ', empty'}`;
      return `
        <div class="slot${i === today ? ' is-today' : ''}" role="button" tabindex="0"
             data-day="${day}" data-hour="${hour}" aria-label="${label}">
          ${task ? renderBlock(task) : '<span class="slot__plus" aria-hidden="true">+</span>'}
        </div>`;
    }).join('');

    return `<div class="grid__time">${formatHour(hour)}</div>${cells}`;
  }).join('');

  el.innerHTML = header + rows;
}
