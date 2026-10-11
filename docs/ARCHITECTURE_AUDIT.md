# JamesUINext – technische Architekturübersicht

**Aktive Implementierung:** `MarkusAureliusTeuton/JamesUINext`, Branch `main`. Diese Datei beschreibt ausschließlich den aktuellen Source-Tree.

## Home Assistant

- Python: `custom_components/jamesui_next/`
- Integration `jamesui_next`, Panel `/jamesui-next`, statische Dateien `/jamesui_next_static`
- ConfigFlow für eine Konfigurationsinstanz; eigener Store `jamesui_next.config`
- API `jamesui_next/config/get` liefert Snapshot und Revision; `jamesui_next/config/replace` verlangt `expected_revision`.
- API-Replace ist nur für Administratoren erlaubt. Backend validiert das Schema, vergleicht Revisionen und speichert atomar.

## Frontend

- Panel-Entry: `frontend/jamesui-next-entry.js`
- App/Komposition: `frontend/jamesui-next-preview.js`; dort Registrierung/Mount der Module und Datenprovider.
- Module/Widgets: `frontend/modules/`; Core `frontend/core/`; HA-Adapter `frontend/ha/`; Design und Icons separat.
- `dashboard-route-host` verwaltet Dashboard-Mount/Teardown; `dashboard-page-composer` Layout, Widget-Hosts und Editor.
- Initiale Home-Konfiguration: Wetter-Hero, leeres Raster, das im Editiermodus startet.
- Weitere Navigationsbereiche sind deaktiviert, bis sie wirklich implementiert werden.
- Eingebundene Bilder stammen ausschließlich aus `frontend/assets/`.

## Automatisierung

- `.github/workflows/validate.yml`: Modul-, Backend- und Konfigurationstests sowie Chromium-Portrait-Smoke.
- `scripts/check_frontend_boundaries.py`: erlaubte Modulimporte.
- `scripts/verify_alpine_assets.py`: Integrität der Bilddateien.

## Bewusste Grenzen vor der Praxisabnahme

- Hausstatus-Einstellungen sind noch technische JSON-Felder.
- Ein grüner Browsertest arbeitet mit simuliertem HA; Live-Berechtigungen, KNX, echte Wetter-/Todo-Daten sowie Fully-Kiosk-Eigenheiten sind noch nicht abgenommen.
- Priorität: echte Installation und nur bestätigte Fehler beheben; keine zusätzlichen Unterseiten.

Aktueller Arbeitsstand und Freigabegrenze: `PROJECT_STATUS.md`, `docs/DASHBOARD_1_0_RELEASE_GATE.md`.
