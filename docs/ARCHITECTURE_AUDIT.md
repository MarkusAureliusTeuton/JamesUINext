# JamesUINext – Architektur- und Qualitätsaudit

Stand: 2026-10-09. Dies ist eine **Zwischenprüfung**, keine Produktivfreigabe.

## Bestätigt
- Eigenständiger Integrationsordner `custom_components/jamesui_next`; Home-Assistant-Domain `jamesui_next`.
- Separater Konfigurationsspeicher `jamesui_next.config`, separate API `jamesui_next/config/*`, Panel `/jamesui-next`.
- Keine r11-Paneleinstiegsdateien im Repository.
- Die Kernmodule, das Dashboard und die Block-14-Tests wurden übernommen. Die vorhandene CI prüft Python/JS-Syntax, wesentliche Trennmerkmale und Block-14-Regressionen.
- Relativer Modulimport im HA-Panel korrigiert zu `/jamesui_next_static/jamesui-next-preview.js`.
- 28 Wettersymbol-SVGs im Next-Namensraum ergänzt, wetterbezogener Asset-Root von der alten Integration getrennt.

## Offene Abnahmekriterien (blockierend)
1. **Provider-Bootstrap (teilweise behoben):** Provider-Registrierung und Start sind jetzt zentral umgesetzt. Wetter, Kalender und Aufgaben starten mit sicherer Standardkonfiguration; weitere Provider nur bei explizit gesetzten Moduleinstellungen. Start-/Rollback-Tests laufen in CI. Noch offen: vollständige Live-HA-Funktion, Action-Module, Provider-Konfigurationsoberfläche und dynamische Updates.
2. **Layout/Navigation:** Der Preview-Composer mountet in die Core-Shell, aber die Shell ersetzt den Seiteninhalt beim Routenwechsel. Eine saubere Page-Lifecycle-Anbindung und die übrigen konfigurierten Seiten fehlen.
3. **Grafiken:** Acht binäre WebP-Hintergründe aus dem Altrepository fehlen. Direkter GitHub-Binärdownload ist in der aktuellen Anbindung nicht verfügbar. Keine Abhängigkeit zur alten `/jamesui_static`-Route mehr zulassen; Assets entweder gesondert übertragen oder Funktion auf eine vollständig lokale, geprüfte Alternative umstellen.
4. **Modulkonfiguration:** Ein neues Dashboard beginnt leer. Der Widget-Katalog erzeugt Standardinstanzen, aber konfigurierbare Datenquellen/Entitäten und Anbieter müssen in der Oberfläche anlegbar sein, bevor reale Widgets verlässlich Daten anzeigen.
5. **Trennung prüfen:** Alle Module und Imports auf alte URLs, globale Namen, ungenutzte Dateien sowie verborgene Abhängigkeiten prüfen; unbenutzte `config_migrations.py` ist noch vorhanden, führt aber keinen Legacy-Migrationscode mehr aus.
6. **Interaktion und Sicherheit:** Long-Press-Drag darf keine Home-Assistant-Schaltaktion auslösen; Pointer-Abbruch, Save/Undo, mehrfach genutzte Widgetinstanzen und Update/Rollback sind im Browser mit echten HA-Daten zu testen.
7. **Tests:** Sämtliche Provider und Widgets, API, ConfigFlow und Shell-Lifecycle brauchen eigene automatisierte Integrations-/Regressionstests. Syntax und Block-14-Tests sind keine vollständige Qualitätsabnahme.
8. **Tablet:** Portrait-Modus OnePlus Pad 2, Fully Kiosk, Fixed-/Scroll-Seiten, Raster-Breiten und Touch-Ziele real prüfen.

## Vorgehensweise
1. Startpfad, Navigation und Provider-Lifecycle vervollständigen, ohne Core-Module unkontrolliert zu koppeln.
2. Assets und Modulkonfiguration abschließen.
3. Kernarchitektur und Modulgrenzen systematisch auditieren, ungenutzte Kompatibilität entfernen.
4. Automatische End-to-End-/Integrationstests ergänzen und vollständig grüne CI erreichen.
5. Test in einer separaten Home-Assistant-Installation; erst danach „vorzeigbar“ bzw. „abgenommen“.

**Freigabe:** nicht erteilt. Die bestehende r11-Integration bleibt unverändert.
