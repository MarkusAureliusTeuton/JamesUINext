# JamesUINext – aktueller Soll-/Ist-Abgleich

**Stand: 12.10.2026.** Verbindliches Testziel: die Startseite. Der genaue GitHub-HEAD und die letzte grüne Prüfung stehen in `PROJECT_STATUS.md`.

| Modul | Tatsächlich implementiert und verdrahtet | Einschränkung / nächster realer Test |
| --- | --- | --- |
| Integration | Eigene Domain, Panel `/jamesui-next`, WS, ConfigFlow, getrennte Persistenz | Installation und HA-Neustart |
| Startansicht | Hero, 12-Spalten-Grid, reservierte Navigation, Editor-Overlay | Tablet-Hochformat im Fully Kiosk |
| Wetter | Wetterprovider, Prognose, Sonne/Mond, acht lokale WebP-Hintergründe und SVG-Icons, Datenquellen-Dialog | Echte HA-Daten und Bildwechsel |
| Kalender/Aufgaben | Agenda-Widget, Quellen je Instanz, Task-Update-Aktion registriert/gemountet | Reale Kalender/Todo-Rechte, Undo |
| Hausstatus | Licht-, Heizungs-, Geräte- und Energieprovider, validierte Einstellungen | JSON-Dialog, Sensorzuordnung und Grenzwerte |
| Buttons | Definitionen, Statusprovider, Service-/Szenenaktionen, Editor | Echte Aktoren und Rückmeldung |
| Editor | Katalog, Einstellungen, Entfernen/Undo, Speichern, Touch-Handler | Long-Press/Resize/Reload am Tablet |
| Konfigurationsdaten | Schema v1, atomarer Store, Revision/Conflict Guard, Recovery-Test | Konflikt mit zwei echten Clients |
| Navigation | Start aktiv, weitere Zielbereiche sichtbar aber deaktiviert | Andere Seiten außerhalb des Umfangs |
| CI | Python-/Node-Tests sowie Chromium mit simuliertem HA | Hardware-E2E bleibt offen |

**Zuletzt konkret behoben:** Editor-Buttons werden nicht mehr durch die untere Navigation verdeckt; Einordnung in separate Layout-Zeilen, editor-lokale Dialoge und Browserregression. Zusätzlich verhindern Backend-Revisionsprüfungen verlustbehaftete Mehrclient-Updates. Kein neuer großer Plan nötig – ab hier nur echte Live-Befunde beheben.

**Nicht erneut entwickeln:** Core, Grid, Assets, Wetter-, Kalender-, Hausstatus- und Button-Provider existieren. Vorhandene Funktionen im Live-Test verifizieren und zielgerichtet korrigieren.

**Neuer geprüfter UI-Stand (12.10.2026):** Beta `v1.0.0b3`: nutzbare Standardgrößen/64–84px-Rasterzeilen, nebeneinander angeordnete Widgets, verständlicher Empty State und leere Widget-Hinweise, größere Editor-/Dialog- und Nav-Touchflächen. Chromium prüft Agenda und dynamische Buttons inklusive nachträglicher Konfiguration, Speicherung, DOM-Darstellung und Reload mit PC-/Tablet-Größen. Screenshots im GitHub-Action-Artefakt. Live- und Hardware-Einschränkungen gelten unverändert.
