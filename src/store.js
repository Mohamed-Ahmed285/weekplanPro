import { DEFAULT_TASKS } from './constants.js';
import { DEFAULT_SETTINGS, normalizeSettings, normalizeTasks } from './settings.js';

/**
 * Schedule key for a slot starting `minute` minutes after midnight.
 * On-the-hour slots keep the original "Monday-6" format, so everything saved
 * before custom slot lengths still resolves; others look like "Monday-6:30".
 */
export const slotKey = (day, minute) =>
  minute % 60 === 0
    ? `${day}-${minute / 60}`
    : `${day}-${Math.floor(minute / 60)}:${String(minute % 60).padStart(2, '0')}`;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Tiny observable store. State is treated as immutable:
 * every action builds a new object and notifies subscribers.
 */
export function createStore(initial, onChange = () => {}) {
  const settings = normalizeSettings(initial?.settings ?? DEFAULT_SETTINGS);
  let state = {
    tasks: normalizeTasks(Array.isArray(initial?.tasks) ? initial.tasks : DEFAULT_TASKS, settings.categories),
    schedule: isObject(initial?.schedule) ? initial.schedule : {},
    settings,
  };
  const listeners = new Set();

  const commit = (next) => {
    state = next;
    onChange(state);
    listeners.forEach((fn) => fn(state));
  };

  return {
    getState: () => state,

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    addTask({ title, category, color }) {
      const task = { id: `task_${Date.now()}`, title, category, color };
      commit({ ...state, tasks: [...state.tasks, task] });
    },

    deleteTask(taskId) {
      const schedule = Object.fromEntries(
        Object.entries(state.schedule).filter(([, id]) => id !== taskId),
      );
      commit({ ...state, tasks: state.tasks.filter((t) => t.id !== taskId), schedule });
    },

    /** Pass `null` as taskId to empty the slot. */
    assign(day, minute, taskId) {
      const schedule = { ...state.schedule };
      if (taskId == null) delete schedule[slotKey(day, minute)];
      else schedule[slotKey(day, minute)] = taskId;
      commit({ ...state, schedule });
    },

    clearSchedule() {
      commit({ ...state, schedule: {} });
    },

    /** `settings` is optional so older export files (tasks + schedule only) still import. */
    replaceAll({ tasks, schedule, settings }) {
      const next = normalizeSettings(settings ?? state.settings);
      commit({ tasks: normalizeTasks(tasks, next.categories), schedule, settings: next });
    },

    /** Hours range, slot length + categories. Tasks of removed categories move to the first category. */
    updateSettings(settings) {
      const next = normalizeSettings(settings);
      commit({ ...state, settings: next, tasks: normalizeTasks(state.tasks, next.categories) });
    },
  };
}
