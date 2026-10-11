# JamesUINext – Dashboard 1.0: Freigabekriterien

**Status: kontrollierte Beta-Testvorbereitung. Nicht produktiv abgenommen.**

## Pflichtumfang

- Home-Assistant-Integration \`jamesui_next\`: ConfigFlow, eigener Speicher und WebSocket, HACS-Installation, Rollen/Berechtigungen, Upgrade und Wiederherstellung.
- Modul/Core: Registry, Provider-Lebenszyklen, HA-Adapter, Actions, Overlay/Health und sauberes Teardown.
- Startseite: Wetter-Hero (Uhr, Datum, Wetter, Prognose, Tages-/Nachtzustände, Mond, lokale Bilder), 12-Spalten-Raster, feste untere Navigation.
- Agenda: unterschiedliche Kalender-/Todo-Quellen je Instanz, Erledigen/Bearbeiten, Rückgängig und Fehlerdarstellung.
- Hausstatus: Licht, Heizung, Geräte und Energie; definierte Status- und Warnschwellen; Konfiguration echter HA-Entitäten.
- Dynamische Buttons: Zustandsabbildung, Warn-/Fehlerstatus und Aktionen über den HA-Adapter.
- Editor: Hinzufügen, Bearbeiten, Entfernen, Long-Press-Verschieben, Resize, Undo, Save, Wiederherstellung und kollisionssichere Speicherung.
- Tablet-UX: OnePlus Pad 2 / Fully Kiosk Hochformat, Lesbarkeit, Touchtargets, Fixed/Scroll, Offline/Reconnect und Neustart.

## Bewusst nicht Teil dieses Tests

Vollständige eigene Unterseiten für Haus, Klima, Medien und Tür. Diese erscheinen in der Navigation deaktiviert, bis sie implementiert und separat abgenommen sind.

## Aktuelle Nachweislage (11.10.2026)

- **Codeprüfung:** Python und JavaScript, Backend-Speichertransaktionen, HA-Konfigurations-API, Asset-SHA-Prüfung und wichtige Modulregressionen.
- **Chromium:** Ein gemeinsamer Browser-Smoke startet den echten Frontend-Einstieg im Tablet-Hochformat und prüft Layout, Navigation sowie Hinzufügen/Speichern.
- **Live:** Bislang **keine** abgeschlossene Prüfung auf echtem HA/KNX oder dem OnePlus Pad 2.
- **Bedienung:** Hausstatus-Datenquellen noch technisch als JSON-Felder; Eignung für normale Einrichtung ist im Live-Test zu bewerten.

## Testabnahme: kurz und verbindlich

| Schritt | Erfolgskriterium | Status |
| --- | --- | --- |
| Installation | HACS installiert Next, Integration startet, Panel lädt, keine Backendfehler | Offen |
| Wetter | Reale Entität, Prognose und passendes lokales Hintergrundbild | Offen |
| Agenda | Kalender und Todo aus HA, Erledigen/Bearbeiten und Undo | Offen |
| Haus/Buttons | Echte KNX-/HA-Zustände, Aktionen und Fehlermeldungen | Offen |
| Editor | Mehrere Instanzen, Long-Press, Resize, Speichern, Reload, Clientkonflikt | Offen |
| Tablet | Portrait/Fully, gute Darstellung, keine verdeckten Bedienelemente | Offen |
| Ausdauer | HA-Neustart, Browserreload, Verbindungsverlust/Erholung | Offen |

Erst nach Bestehen dieser Praxisabnahme wird Dashboard 1.0 freigegeben. Tests mit simulierten Daten sind eine Voraussetzung, ersetzen die reale Abnahme aber nicht. Maßgebliche Kurzfassung: \`PROJECT_STATUS.md\`.
