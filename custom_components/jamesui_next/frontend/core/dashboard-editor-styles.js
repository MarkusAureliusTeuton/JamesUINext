export const DASHBOARD_EDITOR_STYLES = `
[data-jui-dashboard-empty]:not([hidden]) {
  position: absolute; inset: 16px 16px 92px;
  display: grid; place-items: center; text-align: center;
  pointer-events: none;
}
[data-jui-dashboard-empty-card] {
  width: min(100%, 470px); padding: clamp(20px, 3vw, 36px);
  border: 1px dashed var(--jui-color-border-strong); border-radius: 22px;
  background: rgba(20,22,24,.86); box-shadow: 0 14px 42px rgba(0,0,0,.2);
  pointer-events: auto;
}
[data-jui-dashboard-empty] h2 { margin: 0 0 10px; font-size: clamp(20px,2.1vw,27px); }
[data-jui-dashboard-empty] p { margin: 0 0 22px; line-height: 1.5; font-size: clamp(14px,1.3vw,17px); color: var(--jui-color-text-secondary); }
[data-jui-dashboard-empty] button,[data-jui-open-editor] {
  min-height: 48px; min-width: 145px; padding: 10px 19px;
  border: 1px solid var(--jui-color-border-strong); border-radius: 13px;
  background: var(--jui-color-accent-soft); color: var(--jui-color-text-primary);
  font: inherit; font-size: 15px; font-weight: 600; cursor: pointer;
}
[data-jui-open-editor] { position: absolute; top: 16px; right: 80px; z-index: 22; }
[data-jui-editor-toolbar]:not([hidden]) {
  position: absolute; bottom: 18px; left: 50%; right: auto;
  transform: translateX(-50%); z-index: 25;
  width: max-content; max-width: calc(100% - 32px);
  display: flex; justify-content: center; align-items: center;
  flex-wrap: wrap; gap: 10px; padding: 12px;
  border: 1px solid var(--jui-color-border-strong); border-radius: 18px;
  background: rgba(19,21,23,.96); box-shadow: 0 18px 38px rgba(0,0,0,.42);
  backdrop-filter: blur(14px);
}
[data-jui-editor-toolbar] button {
  min-height: 48px; padding: 10px 18px;
  border: 1px solid var(--jui-color-border-strong); border-radius: 12px;
  background: var(--jui-color-surface-soft); color: var(--jui-color-text-primary);
  font: inherit; font-size: 15px; font-weight: 550; cursor: pointer;
}
[data-jui-editor-toolbar] button:first-child,
[data-jui-editor-toolbar] button:nth-child(3) { background: var(--jui-color-accent-soft); }
[data-jui-editor-toolbar] button:disabled { opacity: .42; cursor: default; }
[data-jui-editor-error-message]:not([hidden]) { flex-basis: 100%; color: #f5abab; margin: 2px 8px; }
[data-jui-editor-dialog][hidden], [data-jui-dashboard-empty][hidden] { display: none !important; }
[data-jui-editor-dialog]:not([hidden]) {
  position: absolute; inset: 16px; z-index: 35;
  display: block; overflow-y: auto; overscroll-behavior: contain;
  margin: 0 auto; max-width: 760px; max-height: calc(100% - 32px);
  padding: clamp(18px,3vw,34px);
  border: 1px solid var(--jui-color-border-strong); border-radius: 22px;
  background: rgba(24,26,29,.98); color: var(--jui-color-text-primary);
  box-shadow: 0 18px 80px rgba(0,0,0,.72);
}
[data-jui-editor-dialog] h3 { margin: 0 0 19px; font-size: clamp(21px,2vw,27px); font-weight: 550; }
[data-jui-editor-dialog] label { display: block; margin: 13px 0; font-size: 14px; color: var(--jui-color-text-secondary); }
[data-jui-editor-dialog] input,[data-jui-editor-dialog] select,[data-jui-editor-dialog] textarea {
  display: block; width: 100%; min-height: 46px; margin-top: 7px;
  padding: 10px 12px; border: 1px solid var(--jui-color-border-strong);
  border-radius: 10px; background: rgba(255,255,255,.06);
  color: var(--jui-color-text-primary); font: inherit; font-size: 15px;
}
[data-jui-editor-dialog] textarea { min-height: 96px; resize: vertical; }
[data-jui-editor-dialog] button {
  min-height: 46px; padding: 10px 16px; margin: 5px 8px 5px 0;
  border: 1px solid var(--jui-color-border-strong); border-radius: 11px;
  background: var(--jui-color-accent-soft); color: var(--jui-color-text-primary);
  font: inherit; font-size: 15px; cursor: pointer;
}
[data-jui-editor-dialog] [role="alert"]:not(:empty) { display: block; padding: 10px; color: #f5abab; }
[data-jui-dashboard-catalog] [data-jui-catalog-module] {
  display: block; width: 100%; text-align: left;
  min-height: 58px; padding: 14px 18px; font-size: 17px;
  margin: 12px 0 8px; background: rgba(255,255,255,.06);
}
[data-jui-dashboard-catalog] [data-jui-catalog-module]:hover { border-color: var(--jui-color-accent-strong); }
[data-jui-dashboard-catalog] [data-jui-catalog-intro] {
  margin: 0 0 22px; color: var(--jui-color-text-secondary); line-height: 1.5;
}
[data-jui-editor-resize],[data-jui-editor-remove],[data-jui-editor-settings] {
  min-width: 40px; min-height: 40px;
  border: 1px solid var(--jui-color-border-strong); border-radius: 10px;
  background: rgba(24,26,28,.94); color: #fff; font-size: 19px;
}
@media (max-width:720px) {
  [data-jui-editor-toolbar]:not([hidden]) {
    left: 8px; right: 8px; bottom: 8px; transform: none;
    width: auto; max-width: none; gap: 6px; padding: 9px;
  }
  [data-jui-editor-toolbar] button { min-height: 46px; padding: 8px 11px; font-size: 14px; }
  [data-jui-editor-dialog]:not([hidden]) { inset: 8px; max-height: calc(100% - 16px); }
  [data-jui-dashboard-empty]:not([hidden]) { inset: 12px 12px 105px; }
}
`;