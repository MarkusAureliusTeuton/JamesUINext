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
    buttonId: id,
    stateSource: mode === "toggle" ? {
      id, entity_id: entityId, active_values: ["on"], inactive_values: ["off"],
    } : null,
  };
}

export function removeDashboardButtonUse(instanceConfig, buttonId) {
  const config = validateDynamicButtonInstanceConfig(instanceConfig);
  if (!config.buttons.some(button => button.button_id === buttonId)) throw new TypeError("Button nicht im Widget");
  return validateDynamicButtonInstanceConfig({
    buttons: config.buttons.filter(button => button.button_id !== buttonId),
  });
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
  const picker = document.createElement("select");
  picker.setAttribute("aria-label", "Vorhandenen Button auswählen");
  root.appendChild(picker);
  const remove = document.createElement("button");
  remove.setAttribute("type", "button");
  remove.textContent = "Button aus Widget entfernen";
  root.appendChild(remove);
  const createNew = document.createElement("button");
  createNew.setAttribute("type", "button");
  createNew.textContent = "Neuen Button hinzufügen";
  createNew.addEventListener("click", () => {
    picker.value = "";
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
  function selectButton(id) {
    const definition = context?.definitions[id];
    fields.id.value = id;
    fields.name.value = definition?.name ?? "";
    fields.entityId.value = definition?.mode === "trigger"
      ? definition.action?.entity_id ?? "" : definition?.activate_action?.target?.entity_id ?? "";
    mode.value = definition?.mode ?? "trigger";
  }
  picker.addEventListener("change", () => selectButton(picker.value));
  remove.addEventListener("click", async () => {
    if (!context || saving || !picker.value) return;
    saving = true;
    remove.disabled = true;
    try {
      const next = removeDashboardButtonUse(context.instanceConfig, picker.value);
      await onSave(context.instanceId, { instanceConfig: next });
      close();
    } catch (cause) {
      error.textContent = String(cause?.message ?? cause);
    } finally {
      saving = false;
      remove.disabled = false;
    }
  });
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
      picker.replaceChildren();
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "Neuen Button anlegen";
      picker.appendChild(blank);
      for (const use of instanceConfig?.buttons ?? []) {
        const option = document.createElement("option");
        option.value = use.button_id;
        option.textContent = definitions[use.button_id]?.name ?? use.button_id;
        picker.appendChild(option);
      }
      picker.value = instanceConfig?.buttons?.[0]?.button_id ?? "";
      selectButton(picker.value);
      error.textContent = "";
      root.hidden = false;
    },
  });
}
