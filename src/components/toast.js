let timer;

export function showToast(message) {
  const el = document.getElementById('toast');
  el.querySelector('[data-toast-msg]').textContent = message;
  el.classList.add('is-visible');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('is-visible'), 2500);
}
