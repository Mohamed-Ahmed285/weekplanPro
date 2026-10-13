import { DAYS, DAY_SHORT } from '../constants.js';
import { categoryMap, getSlots } from '../settings.js';
import { slotKey } from '../store.js';
import { escapeHtml, safeColor } from '../utils/dom.js';
import { formatTime, todayIndex } from '../utils/time.js';

function renderBlock(task, categoryLabel) {
  const title = escapeHtml(task.title);
  return `
    <div class="block" style="--block: ${safeColor(task.color)}">
      <span class="block__title">${title}</span>
      <span class="block__cat">${escapeHtml(categoryLabel)}</span>
      <button type="button" class="block__x" data-clear aria-label="Remove ${title}">×</button>
    </div>`;
}

export function renderGrid(el, { tasks, schedule, settings }) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const cats = categoryMap(settings.categories);
  const today = todayIndex();

  const header =
    `<div class="grid__corner">Time</div>` +
    DAYS.map(
      (_, i) => `
        <div class="grid__day${i === today ? ' is-today' : ''}">
          ${DAY_SHORT[i]}${i === today ? '<span class="badge">Today</span>' : ''}
        </div>`,
    ).join('');

  const rows = getSlots(settings).map(({ minute }) => {
    const cells = DAYS.map((day, i) => {
      const task = byId.get(schedule[slotKey(day, minute)]);
      const label = `${day} ${formatTime(minute)}${task ? `: ${escapeHtml(task.title)}` : ', empty'}`;
      return `
        <div class="slot${i === today ? ' is-today' : ''}" role="button" tabindex="0"
             data-day="${day}" data-minute="${minute}" aria-label="${label}">
          ${task ? renderBlock(task, cats.get(task.category)?.label) : '<span class="slot__plus" aria-hidden="true">+</span>'}
        </div>`;
    }).join('');

    return `<div class="grid__time">${formatTime(minute)}</div>${cells}`;
  }).join('');

  el.innerHTML = header + rows;
}
