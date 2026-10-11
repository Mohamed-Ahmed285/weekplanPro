import { SWATCHES } from '../constants.js';
import { escapeHtml } from '../utils/dom.js';

/** Fills the category select + color swatches and wires up submit. */
export function initTaskForm(form, onCreate) {
  const select = form.querySelector('#task-category');
  const swatches = form.querySelector('#swatches');

  swatches.innerHTML = SWATCHES.map(
    (color, i) => `
      <label class="swatch" style="--swatch: ${color}">
        <input type="radio" name="color" value="${color}" ${i === 0 ? 'checked' : ''} aria-label="${color}" />
        <span></span>
      </label>`,
  ).join('');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const title = String(data.get('title')).trim();
    if (!title) return;

    onCreate({
      title,
      category: String(data.get('category')),
      color: String(data.get('color')),
    });

    form.elements.title.value = '';
    form.elements.title.focus();
  });

  return {
    /** Rebuilds the category options, keeping the current pick when it still exists. */
    setCategories(categories) {
      const previous = select.value;
      select.innerHTML = categories
        .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.label)}</option>`)
        .join('');
      if (categories.some((c) => c.id === previous)) select.value = previous;
    },
  };
}
