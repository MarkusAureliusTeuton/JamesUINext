"""Transactional JamesUI configuration service."""

from __future__ import annotations

import asyncio
import hashlib
import json
from collections.abc import Callable, Mapping
from typing import Any, Protocol

from .config_schema import validate_config


class ConfigStorageBackend(Protocol):
    """Minimal async persistence contract used by the config service."""

    async def async_load(self) -> Mapping[str, Any] | None:
        """Load persisted configuration, or None when no store exists."""

    async def async_save(self, data: Mapping[str, Any]) -> None:
        """Persist a complete configuration snapshot."""


class ConfigConflictError(RuntimeError):
    """An editor attempted to overwrite a newer persisted configuration."""


class JamesUIConfigService:
    """Own one validated in-memory snapshot backed by transactional storage."""

    def __init__(self, storage: ConfigStorageBackend) -> None:
        self._storage = storage
        self._config: dict[str, Any] | None = None
        self._write_lock = asyncio.Lock()

    async def async_initialize(self, initial_config: Mapping[str, Any]) -> bool:
        """Load existing config or create storage from the supplied initial config."""
        async with self._write_lock:
            if self._config is not None:
                return False
            stored = await self._storage.async_load()
            if stored is not None:
                self._config = validate_config(stored)
                return False
            validated = validate_config(initial_config)
            await self._storage.async_save(validated)
            self._config = validated
            return True

    def snapshot(self) -> dict[str, Any]:
        """Return a detached copy of the current configuration."""
        if self._config is None:
            raise RuntimeError("JamesUI Config Service is not initialized")
        return validate_config(self._config)

    @property
    def revision(self) -> str:
        """Stable content-addressed revision across Home Assistant restarts."""
        payload = json.dumps(self.snapshot(), ensure_ascii=True, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    async def async_replace(
        self, config: Mapping[str, Any], *, expected_revision: str | None = None
    ) -> dict[str, Any]:
        """Atomically replace only the configuration revision seen by the editor."""
        validated = validate_config(config)
        async with self._write_lock:
            self._require_initialized()
            if expected_revision is not None and expected_revision != self.revision:
                raise ConfigConflictError("Konfiguration wurde andernorts geändert; bitte neu laden")
            await self._storage.async_save(validated)
            self._config = validated
            return self.snapshot()

    async def async_update(
        self,
        transform: Callable[[dict[str, Any]], Mapping[str, Any]],
    ) -> dict[str, Any]:
        """Serialize a synchronous transform against the latest committed snapshot."""
        if not callable(transform):
            raise TypeError("transform must be callable")
        async with self._write_lock:
            self._require_initialized()
            current = self.snapshot()
            candidate = transform(current)
            validated = validate_config(candidate)
            await self._storage.async_save(validated)
            self._config = validated
            return self.snapshot()

    def _require_initialized(self) -> None:
        if self._config is None:
            raise RuntimeError("JamesUI Config Service is not initialized")
