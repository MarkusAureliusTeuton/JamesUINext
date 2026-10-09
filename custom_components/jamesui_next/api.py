"""Standalone WebSocket API for the JamesUI Next configuration."""

from __future__ import annotations

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .config_schema import ConfigValidationError
from .config_service import JamesUIConfigService
from .const import DOMAIN


def _service(hass: HomeAssistant) -> JamesUIConfigService | None:
    data = hass.data.get(DOMAIN, {})
    for entry in hass.config_entries.async_entries(DOMAIN):
        service = data.get(entry.entry_id, {}).get("config")
        if service is not None:
            return service
    return None


@websocket_api.websocket_command({vol.Required("type"): "jamesui_next/config/get"})
@callback
def websocket_get_config(hass, connection, msg):
    service = _service(hass)
    if service is None:
        connection.send_error(msg["id"], "not_configured", "JamesUI Next is not configured")
        return
    connection.send_result(msg["id"], {"config": service.snapshot()})


@websocket_api.require_admin
@websocket_api.websocket_command({
    vol.Required("type"): "jamesui_next/config/replace",
    vol.Required("config"): dict,
})
async def websocket_replace_config(hass, connection, msg):
    service = _service(hass)
    if service is None:
        connection.send_error(msg["id"], "not_configured", "JamesUI Next is not configured")
        return
    try:
        next_config = await service.async_replace(msg["config"])
    except ConfigValidationError as error:
        connection.send_error(msg["id"], "invalid_config", str(error))
        return
    connection.send_result(msg["id"], {"config": next_config})


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, websocket_get_config)
    websocket_api.async_register_command(hass, websocket_replace_config)
