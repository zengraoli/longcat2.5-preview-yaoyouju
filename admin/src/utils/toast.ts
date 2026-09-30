/** 轻提示：不阻塞，2s 后自动消失 */
export function toast(message: string) {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText =
    'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#1B2230;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}
