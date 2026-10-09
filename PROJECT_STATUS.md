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

## Widget-Konfiguration – laufender Block

- Kalender- und Aufgabenquellen können beim Hinzufügen einer Agenda-Widgetinstanz unabhängig eingegeben werden. Eingaben werden mit der kanonischen Agenda-Konfigurationsvalidierung geprüft.
- Das Editiermodell unterstützt unabhängige Widget-Konfigurationsänderungen mit Undo, einem transaktionalen Speichervorgang und Erkennung konkurrierender Änderungen.
- Gemeinsame Kalender-/Aufgabenprovider verwenden die deduplizierte Vereinigung der konfigurierten Quellen aller Agenda-Instanzen.
- Regressionstests für Datenquellen, unabhängige Instanzen, Undo und Konflikte erfolgreich.
- Noch offen: Bearbeitungsdialog für bereits vorhandene Widgets, Aktualisierung laufender Provider nach Konfigurationsänderungen, vollständige Datenquellenverwaltung sowie Live-Abnahme in Home Assistant.

## Block: Widget-Einstellungsdialog

- Agenda-Widget erhält im Dashboard-Bearbeitungsmodus ein Einstellungs-Zahnrad.
- Dialog erlaubt Änderung der Kalender- und Aufgabenquellen einer vorhandenen Widgetinstanz.
- Eingaben werden validiert; nicht bearbeitete Darstellungseinstellungen bleiben erhalten; Abbrechen speichert nichts.
- Änderungen werden über die bereits vorhandene transaktionale Editor-Sitzung/Undo an „Fertig“ übergeben.
- Neue Dialogtests und die erweiterte CI sind erfolgreich.
- Noch offen: zuverlässige Live-Aktualisierung gemounteter Widgetinstanzen und Provider nach Speichern, ausführliche Design-/Accessibility-Prüfung, andere Widgettypen.

## Live-Aktualisierung nach Widget-Speicherung

- Nach erfolgreichem Speichern werden aktive Kalender-/Aufgabenprovider mit der neu berechneten, deduplizierten Quellenliste aktualisiert, ohne Dashboard-Neustart.
- Das Dashboard-Raster verwendet einen Konfigurations-Fingerprint und erstellt nur tatsächlich geänderte Widget-Hosts neu; unveränderte bleiben bestehen.
- Editiergriffe und Einstellungsbuttons verschwinden nach Abschluss des Bearbeitungsmodus.
- Erweiterte Provider- und Grid-Regressionstests in CI erfolgreich.
- Noch offen: dynamisches Starten bisher inaktiver Hausprovider, Hintergrundbilder, vollständige Modulkonfiguration sowie Tablet-/HA-End-to-End-Abnahme.

## Provider-Lebenszyklus – dynamischer Start und Stopp

- Der Provider-Updater gleicht konfigurierte und tatsächlich geladene Module nach Speichern ab: neue optionale Provider werden asynchron geladen und gemountet, geänderte Instanzen aktualisiert, entfernte Provider zerstört.
- Aufeinanderfolgende Änderungen sind serialisiert; fehlgeschlagene Starts werden bereinigt. Beim Entladen der Next-Oberfläche werden dynamisch gestartete Provider ebenfalls abgebaut.
- Regressionstests für Live-Updates, Start, Stopp und fehlgeschlagene Mounts erfolgreich; GitHub Actions grün.
- Offen: Bearbeitungsoberflächen für Haus-Provider, transparente Laufzeitfehler/Retry, umfassende Home-Assistant- und Tablet-Abnahme.

## Verbindliche Freigabeentscheidung – Dashboard 1.0

**Freigabe ausstehend, noch keine Tablet-Testversion.** Vor Weiterentwicklung anderer Funktionsseiten werden ausschließlich die Blöcke 1–13, die notwendige Block-14-Konfiguration und bereits vorgezogene Grundlagen zu einer abgeschlossenen Startseite konsolidiert. Pflichtumfang: kompletter HA-Core, Background-Anwendung, Wetter und lokale Szenengrafiken, Kalender/Aufgaben, Haus-Quickinfos, Dynamic Buttons, Grid, Editieroberfläche, Geräteeinstellungen und Modul-/Aktionsschnittstellen. Zusätzliche Licht-/Klima-/Tür-/Kamera-/Medien-Unterseiten sind explizit nicht Teil dieser Abnahme. Details und testbare Freigabekriterien: [docs/DASHBOARD_1_0_RELEASE_GATE.md](docs/DASHBOARD_1_0_RELEASE_GATE.md).
