import { CATEGORIES, SWATCHES } from '../constants.js';

/** Fills the category select + color swatches and wires up submit. */
export function initTaskForm(form, onCreate) {
  const select = form.querySelector('#task-category');
  const swatches = form.querySelector('#swatches');

  select.innerHTML = CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join('');

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
}
