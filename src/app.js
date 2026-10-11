import { createStore } from './store.js';
import { renderStats } from './components/stats.js';
import { renderGrid } from './components/grid.js';
import { renderTaskPool } from './components/taskPool.js';
import { initTaskForm } from './components/taskForm.js';
import { initSettingsDialog } from './components/settingsDialog.js';
import { shortRange } from './utils/time.js';
import { openAssignModal, closeModal } from './components/modal.js';
import { showToast } from './components/toast.js';
import { downloadJson, readJsonFile } from './utils/file.js';
import { slotKey } from './store.js';
import { createSaver } from './cloud.js';

/**
 * Boots the planner for a signed-in user.
 * `initial` is { plan, fromLegacy } from loadPlan(); `onLogout` signs the user out.
 */
export function startApp({ user, initial, onLogout }) {
  const statusEl = document.getElementById('save-status');
  const STATUS_TEXT = { saving: 'Saving…', saved: 'Saved ✓', error: 'Not saved. Click to retry' };
  const saver = createSaver(user.id, (status) => {
    statusEl.textContent = STATUS_TEXT[status];
    statusEl.dataset.status = status;
  });

  document.getElementById('user-email').textContent = user.email ?? '';
  statusEl.addEventListener('click', () => saver.retry());
  window.addEventListener('beforeunload', (e) => {
    if (saver.hasUnsaved()) e.preventDefault(); // warn instead of silently losing the last edit
  });
  document.querySelector('[data-action="logout"]').addEventListener('click', async () => {
    await saver.flush();
    if (saver.hasUnsaved() && !confirm('Your latest changes could not be saved. Log out anyway?')) return;
    onLogout();
  });

  const store = createStore(initial.plan, saver.save);

  const $ = (id) => document.getElementById(id);
  const els = {
    stats: $('stats'),
    grid: $('grid'),
    pool: $('task-pool'),
    count: $('task-count'),
    form: $('task-form'),
    dialog: $('assign-dialog'),
    importFile: $('import-file'),
    rangeLabel: $('range-label'),
    settingsDialog: $('settings-dialog'),
  };

  /* ---------- Rendering ---------- */

  function render(state) {
    taskForm.setCategories(state.settings.categories);
    els.rangeLabel.textContent = shortRange(state.settings.startHour, state.settings.endHour);
    renderStats(els.stats, state);
    renderGrid(els.grid, state);
    renderTaskPool(els.pool, els.count, state);
  }

  const taskForm = initTaskForm(els.form, (task) => {
    store.addTask(task);
    showToast('Task created');
  });

  store.subscribe(render);
  render(store.getState());

  /* ---------- Actions ---------- */

  function assign(day, hour, taskId) {
    store.assign(day, hour, taskId);
    showToast(taskId ? 'Schedule updated' : 'Slot cleared');
  }

  function openSlot(slot) {
    const { day, hour } = slot.dataset;
    const { tasks, schedule } = store.getState();
    openAssignModal({
      day,
      hour: Number(hour),
      tasks,
      categories: store.getState().settings.categories,
      currentTaskId: schedule[slotKey(day, Number(hour))],
    });
  }

  /* ---------- Settings ---------- */

  const settings = initSettingsDialog({
    dialog: els.settingsDialog,
    getState: store.getState,
    onSave: (next) => {
      store.updateSettings(next);
      showToast('Settings saved');
    },
  });

  document.querySelector('[data-action="settings"]').addEventListener('click', () => settings.open());
  document
    .querySelector('[data-action="edit-hours"]')
    .addEventListener('click', () => settings.open('hours'));

  els.settingsDialog.addEventListener('click', (e) => {
    if (e.target === els.settingsDialog || e.target.closest('[data-close]')) els.settingsDialog.close();
  });

  /* ---------- Task pool: delete + drag source ---------- */

  els.pool.addEventListener('click', (e) => {
    const button = e.target.closest('[data-delete-task]');
    if (!button) return;
    store.deleteTask(button.dataset.deleteTask);
    showToast('Task deleted');
  });

  els.pool.addEventListener('dragstart', (e) => {
    const card = e.target.closest('[data-task-id]');
    if (!card) return;
    e.dataTransfer.setData('text/plain', card.dataset.taskId);
    e.dataTransfer.effectAllowed = 'copy';
    card.classList.add('is-dragging');
  });

  els.pool.addEventListener('dragend', (e) => {
    e.target.closest('[data-task-id]')?.classList.remove('is-dragging');
  });

  /* ---------- Grid: click, keyboard, drop target ---------- */

  els.grid.addEventListener('click', (e) => {
    const slot = e.target.closest('.slot');
    if (!slot) return;

    if (e.target.closest('[data-clear]')) {
      assign(slot.dataset.day, Number(slot.dataset.hour), null);
      return;
    }
    openSlot(slot);
  });

  els.grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    // Ignore keys pressed on the inner "remove" button.
    if (!e.target.classList.contains('slot')) return;
    e.preventDefault();
    openSlot(e.target);
  });

  els.grid.addEventListener('dragover', (e) => {
    const slot = e.target.closest('.slot');
    if (!slot) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    slot.classList.add('is-over');
  });

  els.grid.addEventListener('dragleave', (e) => {
    const slot = e.target.closest('.slot');
    if (slot && !slot.contains(e.relatedTarget)) slot.classList.remove('is-over');
  });

  els.grid.addEventListener('drop', (e) => {
    const slot = e.target.closest('.slot');
    if (!slot) return;
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) assign(slot.dataset.day, Number(slot.dataset.hour), taskId);
  });

  /* ---------- Assignment dialog ---------- */

  els.dialog.addEventListener('click', (e) => {
    // Click on the backdrop (the <dialog> element itself) or a close button.
    if (e.target === els.dialog || e.target.closest('[data-close]')) {
      closeModal();
      return;
    }

    const { day, hour } = els.dialog.dataset;
    const pick = e.target.closest('[data-pick]');

    if (pick) {
      assign(day, Number(hour), pick.dataset.pick);
      closeModal();
    } else if (e.target.closest('[data-clear-slot]')) {
      assign(day, Number(hour), null);
      closeModal();
    }
  });

  /* ---------- Header actions ---------- */

  document.querySelector('[data-action="clear-week"]').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your entire weekly schedule?')) {
      store.clearSchedule();
      showToast('Weekly schedule cleared');
    }
  });

  document.querySelector('[data-action="export"]').addEventListener('click', () => {
    const { tasks, schedule, settings } = store.getState();
    downloadJson({ tasks, schedule, settings }, `weekly-schedule-${new Date().toISOString().slice(0, 10)}.json`);
    showToast('Schedule exported');
  });

  els.importFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await readJsonFile(file);
      const valid =
        data && Array.isArray(data.tasks) && data.schedule && typeof data.schedule === 'object';
      if (!valid) {
        alert('Invalid file format.');
      } else {
        store.replaceAll({ tasks: data.tasks, schedule: data.schedule, settings: data.settings });
        showToast('Schedule imported');
      }
    } catch {
      alert('Failed to parse JSON file.');
    }
    e.target.value = '';
  });

  // A migrated pre-login schedule is uploaded right away.
  if (initial.fromLegacy) saver.save(store.getState());
}
