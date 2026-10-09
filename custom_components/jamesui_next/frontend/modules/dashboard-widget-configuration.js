import { validateCalendarAgendaConfig } from "./widget.calendar-agenda/config.js";

export function buildAgendaInstanceConfig(instanceId, { calendars = "", tasks = "" } = {}) {
  if (typeof instanceId !== "string" || !instanceId.trim()) throw new TypeError("Instance ID required");
  const parse = (input, prefix) => {
    if (typeof input !== "string") throw new TypeError(prefix + " sources must be text");
    const ids = input.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
    if (!ids.every(id => new RegExp("^" + prefix + "\\.[a-z0-9_]+$").test(id))) {
      throw new TypeError("Invalid " + prefix + " entity ID");
    }
    if (new Set(ids).size !== ids.length) throw new TypeError("Duplicate " + prefix + " entity");
    return ids.map(entity_id => ({ entity_id }));
  };
  const calendarList = parse(calendars, "calendar");
  const taskList = parse(tasks, "todo");
  if (calendarList.length === 0 && taskList.length === 0) {
    throw new TypeError("Select at least one calendar or task list");
  }
  const config = {
    instance_id: instanceId,
    calendar_enabled: calendarList.length > 0,
    tasks_enabled: taskList.length > 0,
    calendars: calendarList,
    task_lists: taskList,
  };
  validateCalendarAgendaConfig(config);
  return config;
}

export function agendaConfigAsText(config = {}) {
  return {
    calendars: (config.calendars ?? []).map(v => v.entity_id).join(", "),
    tasks: (config.task_lists ?? []).map(v => v.entity_id).join(", "),
  };
}
