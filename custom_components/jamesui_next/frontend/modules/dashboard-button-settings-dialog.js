import { validateDynamicButtonDefinitions, validateDynamicButtonInstanceConfig } from "./widget.dynamic-buttons/config.js";

const ENTITY = /^[a-z0-9_]+\.[a-z0-9_]+$/;
const ID = /^[a-z0-9_-]+$/;

export function buildDashboardButtonChange({ instanceId, instanceConfig, definitions, id, name, mode, entityId, size = "normal" }) {
  if (!ID.test(id ?? "")) throw new TypeError("Button-ID muss aus Kleinbuchstaben, Zahlen, _ oder - bestehen");
  if (typeof name !== "string" || !name.trim()) throw new TypeError("Buttonname fehlt");
  if (!ENTITY.test(entityId ?? "")) throw new TypeError("Ungültige Home-Assistant-Entität");
  if (!["trigger", "toggle"].includes(mode)) throw new TypeError("Unbekannter Button-Modus");
  const action = { type: "entity.toggle", entity_id: entityId };
  const definition = mode === "trigger"
    ? { name: name.trim(), mode, action }
    : {
      name: name.trim(), mode, state_source_id: id,
      activate_action: { type: "ha.service", domain: "homeassistant", service: "turn_on", target: { entity_id: entityId } },
      deactivate_action: { type: "ha.service", domain: "homeassistant", service: "turn_off", target: { entity_id: entityId } },
    };
  const nextDefinitions = { ...definitions, [id]: definition };
  validateDynamicButtonDefinitions(nextDefinitions);
  const existing = instanceConfig?.buttons ?? [];
  const nextInstance = { buttons: existing.some(item => item.button_id === id)
    ? existing.map(item => item.button_id === id ? { ...item, size } : item)
    : [...existing, { id: `${instanceId}-${id}`, button_id: id, size }] };
  validateDynamicButtonInstanceConfig(nextInstance);
  return {
    definitions: nextDefinitions,
    instanceConfig: nextInstance,
    stateSource: mode === "toggle" ? {
      id, entity_id: entityId, active_values: ["on"], inactive_values: ["off"],
    } : null,
  };
}

export function createDashboardButtonSettingsDialog({ document, onSave } = {}) {
  if (!document?.createElement || typeof onSave !== "function") throw new TypeError("Button settings require document and onSave");
  const root = document.createElement("section");
  root.setAttribute("data-jui-button-settings", "");
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Dynamic Buttons konfigurieren");
  root.hidden = true;
  const heading = document.createElement("h3");
  heading.textContent = "Dynamic Buttons";
  root.appendChild(heading);
  const fields = {};
  for (const [key, title] of [["id","Button-ID"],["name","Bezeichnung"],["entityId","HA-Entität"]]) {
    const label = document.createElement("label");
    label.textContent = title;
    const input = document.createElement("input");
    input.setAttribute("type","text");
    input.setAttribute("aria-label",title);
    label.appendChild(input);
    root.appendChild(label);
    fields[key] = input;
  }
  const mode = document.createElement("select");
  mode.setAttribute("aria-label","Button-Modus");
  for (const [value,label] of [["trigger","Auslösen"],["toggle","Ein/Aus mit Status"]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    mode.appendChild(option);
  }
  root.appendChild(mode);
  const createNew = document.createElement("button");
  createNew.setAttribute("type", "button");
  createNew.textContent = "Neuen Button hinzufügen";
  createNew.addEventListener("click", () => {
    fields.id.value = "";
    fields.name.value = "";
    fields.entityId.value = "";
    mode.value = "trigger";
    error.textContent = "";
  });
  root.appendChild(createNew);
  const error = document.createElement("p");
  error.setAttribute("role","alert");
  root.appendChild(error);
  let context = null, saving = false;
  const cancel = document.createElement("button");
  cancel.setAttribute("type","button");
  cancel.textContent = "Abbrechen";
  cancel.addEventListener("click",()=>{if (!saving) close();});
  root.appendChild(cancel);
  const save = document.createElement("button");
  save.setAttribute("type","button");
  save.textContent = "Button übernehmen";
  save.addEventListener("click", async () => {
    if (!context || saving) return;
    try {
      const change = buildDashboardButtonChange({
        ...context, id: fields.id.value.trim(), name: fields.name.value,
        entityId: fields.entityId.value.trim(), mode: mode.value,
      });
      saving = true;
      save.disabled = true;
      await onSave(context.instanceId, change);
      close();
    } catch (cause) {
      error.textContent = String(cause?.message ?? cause);
    } finally {
      saving = false;
      save.disabled = false;
    }
  });
  root.appendChild(save);
  function close() { context = null; root.hidden = true; error.textContent = ""; }
  return Object.freeze({
    root, close,
    open({ instanceId, instanceConfig, definitions }) {
      context = { instanceId, instanceConfig: structuredClone(instanceConfig), definitions: structuredClone(definitions) };
      const first = instanceConfig?.buttons?.[0]?.button_id;
      const existing = first ? definitions[first] : null;
      fields.id.value = first ?? "";
      fields.name.value = existing?.name ?? "";
      fields.entityId.value = existing?.mode === "trigger"
        ? existing.action?.entity_id ?? ""
        : existing?.activate_action?.target?.entity_id ?? "";
      mode.value = existing?.mode ?? "trigger";
      error.textContent = "";
      root.hidden = false;
    },
  });
}
