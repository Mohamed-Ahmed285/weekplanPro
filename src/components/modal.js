import { categoryMap } from '../settings.js';
import { escapeHtml, safeColor } from '../utils/dom.js';
import { formatHour } from '../utils/time.js';

const dialog = () => document.getElementById('assign-dialog');

export function openAssignModal({ day, hour, tasks, categories, currentTaskId }) {
  const cats = categoryMap(categories);
  const el = dialog();
  el.dataset.day = day;
  el.dataset.hour = hour;
  el.querySelector('[data-modal-title]').textContent = `${day} · ${formatHour(hour)}`;

  const clearButton = currentTaskId
    ? `<button type="button" class="pick pick--clear" data-clear-slot>Clear this slot</button>`
    : '';

  const options = tasks.length
    ? tasks
        .map(
          (task) => `
            <button type="button" class="pick" data-pick="${escapeHtml(task.id)}">
              <span class="task__dot" style="--dot: ${safeColor(task.color)}"></span>
              <span class="task__body">
                <span class="task__title">${escapeHtml(task.title)}</span>
                <span class="task__cat">${escapeHtml(cats.get(task.category)?.label)}</span>
              </span>
            </button>`,
        )
        .join('')
    : `<p class="empty">No tasks yet. Create one in the toolbox first.</p>`;

  el.querySelector('[data-modal-list]').innerHTML = clearButton + options;
  el.showModal();
}

export function closeModal() {
  dialog().close();
}
