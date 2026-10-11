import { SWATCHES } from '../constants.js';
import { DEFAULT_SETTINGS, MAX_CATEGORIES, MAX_LABEL_LENGTH, getHours } from '../settings.js';
import { escapeHtml } from '../utils/dom.js';
import { describeRange, formatHour } from '../utils/time.js';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h);

const clone = (settings) => ({
  startHour: settings.startHour,
  endHour: settings.endHour,
  categories: settings.categories.map((c) => ({ ...c })),
});

const hourSelect = (name, label, value) => `
  <div class="field">
    <label for="set-${name}">${label}</label>
    <select class="input" id="set-${name}" data-hour="${name}">
      ${HOUR_OPTIONS.map(
        (h) => `<option value="${h}" ${h === value ? 'selected' : ''}>${formatHour(h)}</option>`,
      ).join('')}
    </select>
  </div>`;

const categoryRow = (cat, i, canDelete) => `
  <div class="cat-row" data-index="${i}">
    <input class="input" data-cat-name value="${escapeHtml(cat.label)}" required
           maxlength="${MAX_LABEL_LENGTH}" pattern=".*\\S.*" placeholder="Category name"
           aria-label="Category ${i + 1} name" />
    <button type="button" class="icon-btn" data-cat-del ${canDelete ? '' : 'disabled'}
            aria-label="Delete category ${escapeHtml(cat.label)}">×</button>
    <div class="swatches swatches--sm" role="radiogroup" aria-label="Category ${i + 1} color">
      ${SWATCHES.map(
        (color) => `
        <label class="swatch" style="--swatch: ${color}">
          <input type="radio" name="cat-color-${i}" value="${color}" data-cat-color
                 ${color.toLowerCase() === cat.color.toLowerCase() ? 'checked' : ''} aria-label="${color}" />
          <span></span>
        </label>`,
      ).join('')}
    </div>
  </div>`;

/**
 * Settings dialog: hours range + up to 4 categories.
 * Edits a draft copy; nothing is applied until Save.
 */
export function initSettingsDialog({ dialog, getState, onSave }) {
  const form = dialog.querySelector('form');
  const body = dialog.querySelector('[data-settings-body]');
  let draft = clone(getState().settings);

  const updateSummary = () => {
    const rows = getHours(draft).length;
    body.querySelector('[data-range-summary]').textContent = describeRange(
      draft.startHour,
      draft.endHour,
      rows,
    );
  };

  function render() {
    const canDelete = draft.categories.length > 1;
    body.innerHTML = `
      <section class="settings__section">
        <h4 class="settings__title">Day range</h4>
        <div class="range-row">
          ${hourSelect('start', 'From', draft.startHour)}
          <span class="range-row__arrow" aria-hidden="true">→</span>
          ${hourSelect('end', 'To (included)', draft.endHour)}
        </div>
        <p class="hint" data-range-summary></p>
      </section>

      <section class="settings__section">
        <h4 class="settings__title">
          Categories <span class="chip" style="--chip: var(--green)">${draft.categories.length} / ${MAX_CATEGORIES}</span>
        </h4>
        <div class="cat-list">
          ${draft.categories.map((c, i) => categoryRow(c, i, canDelete)).join('')}
        </div>
        <button type="button" class="btn btn--white" data-cat-add
                ${draft.categories.length >= MAX_CATEGORIES ? 'disabled' : ''}>+ Add category</button>
      </section>`;
    updateSummary();
  }

  const indexOf = (el) => Number(el.closest('[data-index]').dataset.index);

  body.addEventListener('change', (e) => {
    const hour = e.target.closest('[data-hour]');
    if (hour) {
      draft[hour.dataset.hour === 'start' ? 'startHour' : 'endHour'] = Number(hour.value);
      updateSummary();
    } else if (e.target.matches('[data-cat-color]')) {
      draft.categories[indexOf(e.target)].color = e.target.value;
    }
  });

  body.addEventListener('input', (e) => {
    if (e.target.matches('[data-cat-name]')) draft.categories[indexOf(e.target)].label = e.target.value;
  });

  body.addEventListener('click', (e) => {
    if (e.target.closest('[data-cat-del]')) {
      if (draft.categories.length <= 1) return;
      draft.categories.splice(indexOf(e.target), 1);
      render();
    } else if (e.target.closest('[data-cat-add]')) {
      if (draft.categories.length >= MAX_CATEGORIES) return;
      const used = new Set(draft.categories.map((c) => c.color.toLowerCase()));
      draft.categories.push({
        id: `cat_${Date.now()}`,
        label: '',
        color: SWATCHES.find((c) => !used.has(c.toLowerCase())) ?? SWATCHES[0],
      });
      render();
      body.querySelector('.cat-row:last-child [data-cat-name]').focus();
    }
  });

  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-reset]')) {
      draft = clone(DEFAULT_SETTINGS);
      render();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { tasks } = getState();
    const kept = new Set(draft.categories.map((c) => c.id));
    const moving = tasks.filter((t) => !kept.has(t.category)).length;
    if (moving > 0) {
      const target = draft.categories[0].label.trim();
      if (!confirm(`${moving} task${moving === 1 ? '' : 's'} will move to "${target}". Continue?`)) return;
    }
    onSave({
      ...draft,
      categories: draft.categories.map((c) => ({ ...c, label: c.label.trim() })),
    });
    dialog.close();
  });

  return {
    /** `focus` is 'hours' to jump to the range selector (used by the pill above the grid). */
    open(focus) {
      draft = clone(getState().settings);
      render();
      dialog.showModal();
      if (focus === 'hours') body.querySelector('#set-start').focus();
    },
  };
}
