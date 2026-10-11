import { googleEnabled, isConfigured, supabase } from '../supabase.js';
import { escapeHtml } from '../utils/dom.js';

const COPY = {
  login: { title: 'Welcome back', submit: 'Log in', busy: 'Logging in…' },
  signup: { title: 'Create your account', submit: 'Sign up', busy: 'Creating account…' },
  forgot: { title: 'Reset password', submit: 'Send reset link', busy: 'Sending…' },
  recovery: { title: 'Choose a new password', submit: 'Save password', busy: 'Saving…' },
};

/**
 * Login / sign-up / forgot-password / set-new-password screen.
 * `onRecovered` runs after a password reset is completed (the user is then signed in).
 */
export function initAuthScreen(root, { onRecovered }) {
  let mode = 'login';
  let message = null; // { kind: 'error' | 'ok', text }
  let busy = false;

  const needsPassword = () => mode === 'login' || mode === 'signup' || mode === 'recovery';

  function render() {
    const c = COPY[mode];
    const tabs = mode === 'login' || mode === 'signup';
    root.innerHTML = `
      <div class="auth__card panel">
        <div class="auth__brand">
          <img src="/images/icon.png" alt="" class="auth__icon" />
          <div>
            <img src="/images/weekplan.png" alt="WeekPlan" class="auth__logo" />
            <p class="muted">Organize your hours, optimize your week.</p>
          </div>
        </div>

        ${
          tabs
            ? `<div class="auth__tabs" role="tablist">
                 <button type="button" role="tab" class="auth__tab${mode === 'login' ? ' is-active' : ''}"
                         aria-selected="${mode === 'login'}" data-mode="login">Log in</button>
                 <button type="button" role="tab" class="auth__tab${mode === 'signup' ? ' is-active' : ''}"
                         aria-selected="${mode === 'signup'}" data-mode="signup">Sign up</button>
               </div>`
            : ''
        }

        <h2 class="auth__title">${c.title}</h2>
        ${
          isConfigured
            ? ''
            : `<p class="auth__msg is-error" role="alert">Login isn't set up yet. Add <code>VITE_SUPABASE_URL</code>
               and <code>VITE_SUPABASE_ANON_KEY</code> to your environment (see README).</p>`
        }

        <form class="form auth__form">
          ${
            mode === 'recovery'
              ? ''
              : `<div class="field">
                   <label for="auth-email">Email</label>
                   <input class="input" id="auth-email" name="email" type="email" required
                          autocomplete="email" placeholder="you@example.com" />
                 </div>`
          }
          ${
            needsPassword()
              ? `<div class="field">
                   <label for="auth-password">${mode === 'recovery' ? 'New password' : 'Password'}</label>
                   <input class="input" id="auth-password" name="password" type="password" required minlength="8"
                          autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}"
                          placeholder="${mode === 'login' ? 'Your password' : 'At least 8 characters'}" />
                 </div>
                 <label class="auth__show"><input type="checkbox" data-show-password /> Show password</label>`
              : ''
          }
          <p class="auth__msg${message ? ` is-${message.kind}` : ''}" role="alert" ${message ? '' : 'hidden'}>${
            message ? escapeHtml(message.text) : ''
          }</p>
          <button type="submit" class="btn btn--green btn--block" ${busy || !isConfigured ? 'disabled' : ''}>
            ${busy ? c.busy : c.submit}
          </button>
        </form>

        ${
          googleEnabled && tabs && isConfigured
            ? `<div class="auth__or"><span>or</span></div>
               <button type="button" class="btn btn--white btn--block" data-google ${busy ? 'disabled' : ''}>
                 Continue with Google
               </button>`
            : ''
        }

        <div class="auth__links">
          ${mode === 'login' ? `<button type="button" class="link-btn" data-mode="forgot">Forgot password?</button>` : ''}
          ${mode === 'forgot' ? `<button type="button" class="link-btn" data-mode="login">← Back to log in</button>` : ''}
        </div>
      </div>`;
  }

  function setMode(next) {
    mode = next;
    message = null;
    render();
    root.querySelector('input')?.focus();
  }

  function show(kind, text) {
    message = { kind, text };
    busy = false;
    render();
  }

  async function submit(form) {
    const data = new FormData(form);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    busy = true;
    message = null;
    render();

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return show('error', error.message);
        // Success: main.js reacts to the auth state change and opens the app.
      } else if (mode === 'signup') {
        const { data: res, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) return show('error', error.message);
        // With email confirmation on, there is no session yet.
        if (!res.session) {
          mode = 'login';
          return show('ok', 'Almost there! Check your email and click the confirmation link, then log in.');
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) return show('error', error.message);
        return show('ok', 'If that email has an account, a reset link is on its way.');
      } else if (mode === 'recovery') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return show('error', error.message);
        mode = 'login';
        onRecovered();
      }
    } catch {
      return show('error', 'Network problem. Check your connection and try again.');
    }
  }

  root.addEventListener('click', async (e) => {
    const modeBtn = e.target.closest('[data-mode]');
    if (modeBtn) return setMode(modeBtn.dataset.mode);

    if (e.target.closest('[data-google]')) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) show('error', error.message);
    }
  });

  root.addEventListener('change', (e) => {
    if (e.target.matches('[data-show-password]')) {
      root.querySelector('#auth-password').type = e.target.checked ? 'text' : 'password';
    }
  });

  root.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!busy) submit(e.target);
  });

  render();

  return {
    startRecovery() {
      setMode('recovery');
    },
  };
}
