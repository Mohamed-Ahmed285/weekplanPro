import { STORAGE_KEYS } from './constants.js';
import { supabase } from './supabase.js';

const SAVE_DELAY_MS = 500;

function readLegacy() {
  try {
    const parse = (key) => JSON.parse(localStorage.getItem(key) || 'null');
    const tasks = parse(STORAGE_KEYS.tasks);
    const schedule = parse(STORAGE_KEYS.schedule);
    const settings = parse(STORAGE_KEYS.settings);
    if (!tasks && !schedule && !settings) return null;
    return { tasks, schedule, settings };
  } catch {
    return null;
  }
}

function clearLegacy() {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

/**
 * Loads the user's plan. A brand-new account with data from the pre-login
 * version of the app (localStorage) adopts that data once; it is uploaded and
 * then removed from the browser so the next account on this device starts fresh.
 * Returns { plan, fromLegacy } where plan is null for a brand-new account.
 */
export async function loadPlan(userId) {
  const { data, error } = await supabase
    .from('plans')
    .select('tasks, schedule, settings')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return { plan: data, fromLegacy: false };

  const legacy = readLegacy();
  return { plan: legacy, fromLegacy: Boolean(legacy) };
}

/** Debounced, serialized saver. onStatus gets 'saving' | 'saved' | 'error'. */
export function createSaver(userId, onStatus) {
  let timer = null;
  let pending = null;
  let current = null;

  async function drain() {
    while (pending) {
      const snapshot = pending;
      pending = null;
      onStatus('saving');
      let failed = false;
      try {
        const { error } = await supabase.from('plans').upsert({
          user_id: userId,
          tasks: snapshot.tasks,
          schedule: snapshot.schedule,
          settings: snapshot.settings,
          updated_at: new Date().toISOString(),
        });
        failed = Boolean(error);
      } catch {
        failed = true;
      }
      if (failed) {
        pending ??= snapshot; // keep the newest unsaved state for the retry
        onStatus('error');
        return;
      }
      clearLegacy();
    }
    onStatus('saved');
  }

  async function run() {
    if (!current) {
      current = drain().finally(() => {
        current = null;
      });
    }
    return current;
  }

  window.addEventListener('online', () => pending && run());

  return {
    save(state) {
      pending = state;
      onStatus('saving');
      clearTimeout(timer);
      timer = setTimeout(run, SAVE_DELAY_MS);
    },
    /** Resolves once everything queued so far has been written (or has failed). */
    flush() {
      clearTimeout(timer);
      return run();
    },
    retry() {
      return pending ? this.flush() : Promise.resolve();
    },
    hasUnsaved: () => Boolean(pending || current),
  };
}
