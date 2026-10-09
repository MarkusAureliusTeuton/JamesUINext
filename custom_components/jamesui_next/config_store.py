"""Home Assistant storage wrapper for JamesUI configuration."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .config_schema import CONFIG_SCHEMA_VERSION


CONFIG_STORE_KEY = "jamesui_next.config"


class JamesUIConfigStore(Store[dict[str, Any]]):
    """Versioned atomic Home Assistant store for canonical JamesUI config."""

    def __init__(self, hass: HomeAssistant) -> None:
        super().__init__(
            hass,
            CONFIG_SCHEMA_VERSION,
            CONFIG_STORE_KEY,
            atomic_writes=True,
        )

    async def _async_migrate_func(
        self,
        old_major_version: int,
        old_minor_version: int,
        old_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Fresh Next namespace has no legacy storage schema to migrate."""
        raise ValueError(f"Unsupported JamesUI Next storage version: {old_major_version}")
