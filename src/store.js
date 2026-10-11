import { DEFAULT_TASKS, STORAGE_KEYS } from './constants.js';

export const slotKey = (day, hour) => `${day}-${hour}`;

function load(key, fallback, isValid) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    return isValid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function persist({ tasks, schedule }) {
  try {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(schedule));
  } catch {
    // Storage can be unavailable (private mode, quota). The app still works in memory.
  }
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Tiny observable store. State is treated as immutable:
 * every action builds a new object and notifies subscribers.
 */
export function createStore() {
  let state = {
    tasks: load(STORAGE_KEYS.tasks, DEFAULT_TASKS, Array.isArray),
    schedule: load(STORAGE_KEYS.schedule, {}, isObject),
  };
  const listeners = new Set();

  const commit = (next) => {
    state = next;
    persist(state);
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
      commit({ tasks: state.tasks.filter((t) => t.id !== taskId), schedule });
    },

    /** Pass `null` as taskId to empty the slot. */
    assign(day, hour, taskId) {
      const schedule = { ...state.schedule };
      if (taskId == null) delete schedule[slotKey(day, hour)];
      else schedule[slotKey(day, hour)] = taskId;
      commit({ ...state, schedule });
    },

    clearSchedule() {
      commit({ ...state, schedule: {} });
    },

    replaceAll({ tasks, schedule }) {
      commit({ tasks, schedule });
    },
  };
}
