import { initAuthScreen } from './components/authScreen.js';
import { startApp } from './app.js';
import { loadPlan } from './cloud.js';
import { isConfigured, supabase } from './supabase.js';

const $ = (id) => document.getElementById(id);
const screens = { boot: $('boot'), auth: $('auth-screen'), app: $('app') };

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

function showBootError(text) {
  show('boot');
  screens.boot.classList.add('boot--error');
  screens.boot.removeAttribute('aria-busy');
  screens.boot.innerHTML = `
    <div class="panel boot__card">
      <p>${text}</p>
      <div class="boot__actions">
        <button type="button" class="btn btn--green" data-retry>Retry</button>
        <button type="button" class="btn btn--white" data-signout>Log out</button>
      </div>
    </div>`;
  screens.boot.querySelector('[data-retry]').onclick = () => location.reload();
  screens.boot.querySelector('[data-signout]').onclick = () => supabase.auth.signOut();
}

let startedFor = null;
let recovering = location.hash.includes('type=recovery'); // reset-password link opened

async function enter(session) {
  if (startedFor === session.user.id) return;
  startedFor = session.user.id;
  try {
    const initial = await loadPlan(session.user.id);
    show('app');
    startApp({
      user: session.user,
      initial,
      onLogout: () => supabase.auth.signOut(),
    });
  } catch {
    startedFor = null;
    showBootError("We couldn't load your schedule. Check your connection and try again.");
  }
}

const authScreen = initAuthScreen(screens.auth, {
  onRecovered: async () => {
    recovering = false;
    history.replaceState(null, '', location.pathname);
    const { data } = await supabase.auth.getSession();
    if (data.session) enter(data.session);
  },
});

if (!isConfigured) {
  show('auth'); // the auth screen explains what is missing
} else {
  supabase.auth.onAuthStateChange((event, session) => {
    // Don't call other Supabase methods synchronously inside this callback.
    setTimeout(() => {
      if (event === 'PASSWORD_RECOVERY') {
        recovering = true;
        show('auth');
        authScreen.startRecovery();
      } else if (event === 'SIGNED_OUT') {
        if (startedFor) location.reload(); // drop all in-memory state of the previous user
        else show('auth');
      } else if (session && recovering) {
        show('auth');
        authScreen.startRecovery();
      } else if (session) {
        enter(session);
      } else {
        show('auth');
      }
    }, 0);
  });
}
