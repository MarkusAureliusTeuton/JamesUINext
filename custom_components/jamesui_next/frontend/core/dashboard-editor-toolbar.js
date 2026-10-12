// Minimal page-local edit toolbar. Gesture-driven drag/resize are attached
// separately; this layer never invokes Home Assistant directly.
export function createDashboardEditorToolbar({ document, session, onChange, onAdd, onCommitted = null, onFinished = null } = {}) {
  if (!document || typeof document.createElement !== "function") throw new TypeError("editor toolbar requires document");
  if (!session || typeof session.enter !== "function" || typeof session.finish !== "function") {
    throw new TypeError("editor toolbar requires edit session");
  }
  if (typeof onChange !== "function" || typeof onAdd !== "function") {
    throw new TypeError("editor toolbar requires onChange and onAdd callbacks");
  }
  const root = document.createElement("div");
  root.setAttribute("data-jui-editor-toolbar", "");
  root.hidden = true;
  const createAction = (label, action) => {
    const node = document.createElement("button");
    node.setAttribute("type", "button");
    node.textContent = label;
    node.addEventListener("click", action);
    root.appendChild(node);
    return node;
  };
  const add = createAction("+ Hinzufügen", () => onAdd());
  const undo = createAction("Rückgängig", () => {
    const page = session.undo();
    if (page) onChange(page);
    refresh();
  });
  const failure = document.createElement("p");
  failure.setAttribute("data-jui-editor-error-message", "");
  failure.setAttribute("role", "alert");
  failure.hidden = true;
  const finish = createAction("Fertig", async () => {
    if (saving) return;
    saving = true;
    refresh();
    try {
      const page = await session.save();
      if (page) {
        if (onCommitted) await onCommitted(page);
        onChange(page);
      }
      session.finish();
      onFinished?.();
      failure.textContent = "";
      failure.hidden = true;
      root.removeAttribute("data-jui-editor-save-error");
      root.hidden = true;
    } catch (error) {
      // Keep unsaved edits intact, surface conflict/permissions/connection errors.
      failure.textContent = String(error?.message || "Speichern fehlgeschlagen");
      failure.hidden = false;
      root.setAttribute("data-jui-editor-save-error", "");
    } finally {
      saving = false;
      refresh();
    }
  });
  root.appendChild(failure);
  let saving = false;
  const refresh = () => {
    root.hidden = !session.active;
    // The composer styles this bar with display:flex. An explicit inline
    // display:none is necessary because that style can override [hidden].
    root.style.display = session.active ? "flex" : "none";
    undo.disabled = saving || !session.canUndo;
    add.disabled = saving;
    finish.disabled = saving;
  };
  return Object.freeze({
    root,
    open() { session.enter(); root.removeAttribute("data-jui-editor-save-error"); failure.hidden = true; failure.textContent = ""; refresh(); onChange(session.snapshot()); },
    refresh,
  });
}
