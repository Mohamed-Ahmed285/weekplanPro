import { escapeHtml, safeColor } from '../utils/dom.js';

export function renderTaskPool(el, countEl, { tasks }) {
  countEl.textContent = tasks.length;

  if (tasks.length === 0) {
    el.innerHTML = `<p class="empty">No tasks yet. Create one above.</p>`;
    return;
  }

  el.innerHTML = tasks
    .map((task) => {
      const title = escapeHtml(task.title);
      return `
        <div class="task" draggable="true" data-task-id="${escapeHtml(task.id)}">
          <span class="task__dot" style="--dot: ${safeColor(task.color)}"></span>
          <div class="task__body">
            <p class="task__title">${title}</p>
            <p class="task__cat">${escapeHtml(task.category)}</p>
          </div>
          <button type="button" class="task__del" data-delete-task="${escapeHtml(task.id)}"
                  aria-label="Delete ${title}">×</button>
        </div>`;
    })
    .join('');
}
