# JamesUINext – Status

- Independent Home Assistant integration: `jamesui_next`
- Existing `jamesui` r11 is not modified.
- Frontend architecture: 124 modular JS files transferred from the approved JamesUI 1.0 Block 14 development branch.
- Backend: separate integration directory, config storage `jamesui_next.config`, and canonical WebSocket endpoints `jamesui_next/config/get`, `jamesui_next/config/replace`.
- Frontend panel: `/jamesui-next`. The initial home dashboard is empty and enters edit mode.
- HACS: own custom integration repository and metadata.
- Tests: JavaScript/Python syntax, isolation checks, preview smoke import, and Block 14 regression tests run via GitHub Actions.
- Known limitations: no live Home Assistant / OnePlus Pad 2 acceptance yet; module integrations, dynamic-button actions and widget configuration need real-world validation.
- Legacy r11 panel files are not present in this repository.

Next: install JamesUINext independently through HACS, test the panel, then fix confirmed browser and runtime issues. Never change the r11 integration during this process.

## Architekturprüfung – 2026-10-09

- Next-Panelimport auf eigene Static-Route korrigiert.
- 28 Wettersymbol-SVGs im Next-Verzeichnis vorhanden; acht WebP-Hintergrundbilder bleiben offen.
- Datenprovider zentral registriert; Wetter/Kalender/Aufgaben laden standardmäßig, Hausprovider nur bei expliziter Konfiguration.
- Dashboard-Navigation nutzt isolierten Route-Host mit Teardown beim Seitenwechsel; Regressionstests ergänzt.
- Freigabe weiter ausstehend: konfigurierbare Module und Datenquellen, echte HA-Integration, Hintergrundbilder, asynchrones Routing und Tablet-Abnahme.
- Details: docs/ARCHITECTURE_AUDIT.md.
