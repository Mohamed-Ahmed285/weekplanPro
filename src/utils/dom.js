const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape user-provided text before putting it in an innerHTML template. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

/** Only allow plain hex colors so imported data can't inject CSS. */
export function safeColor(value, fallback = '#FFE600') {
  return /^#[0-9a-f]{3,8}$/i.test(value) ? value : fallback;
}
