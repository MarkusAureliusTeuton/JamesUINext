# JamesUINext – Dashboard 1.0: verbindlicher Freigabeumfang

Status: **NICHT FREIGEGEBEN**. Ziel ist **ein vollständig nutzbares Dashboard (Startseite)**, nicht die Implementierung weiterer Funktionsseiten.

## Umfang der Freigabe

1. **Eigenständige HA-Integration:** HACS-Installation neben r11, ConfigFlow, eigenes Panel, Storage, WebSocket-API, Rechte, Upgrade, Restore und Fehlerbehandlung. Kein Zugriff auf r11-Speicher, r11-URLs oder r11-Quellcode.
2. **App-Core:** Modul-Registry, Loader, Capability- und Action-Registry, Provider-Lifecycle, Health/Fehlerstatus, Shell, Overlay, zentralisierte Konfiguration, Instanzisolation, Teardown.
3. **Startseitenlayout:** vereinbartes Hero-/Grid-System (12 Spalten), feste untere Navigation, Skalierung, Portrait-Tablet; die nicht fertigen Seiten werden nicht als funktionstüchtige Anwendungen dargestellt.
4. **Wetter & Hintergrund:** Datum/Uhr, aktuelle Wetterdaten, Vorhersagen, Tageszeit/Nacht, Wetterzustände, Mondinformationen, alle notwendigen lokalen Grafiken inklusive Hintergrundbildern sowie sinnvolle Fehler-/Offline-Anzeige.
5. **Kalender und Aufgaben:** beliebig mehrere Widget-Instanzen, getrennte Kalender-/Aufgabenquellen und Einstellungen, Anzeige, Bearbeitung und Speicherverhalten entsprechend den freigegebenen Blöcken.
6. **Haus-Quickinfos:** alle in Block 12 festgelegten Statussignale, Schwellen, Farben und Interaktionen über passende Provider, ohne spezielle Licht- oder Heizungs-Unterseiten.
7. **Dynamische Buttons:** Block-13-Konfiguration, Zustandsfarben, KNX/HA-Aktionsauslösung über die vorgesehenen Registries, Warn-/Fehlerzustände, Anzeige, Mehrfachinstanzen und Interaktionsschutz beim Verschieben.
8. **Editor & Konfiguration:** Hinzufügen/Bearbeiten/Löschen, Drag-and-Drop durch Long-Press, Resize, Grid-Snapping, Undo, Persistenz, Instanzkonfiguration, Datenquellenverwaltung, Validierung, Migrations- und Wiederherstellungsstrategie.
9. **UX:** konsistente Design-Tokens und Icons, Lesbarkeit, Touch-Flächen, fixed Layout ohne ungewolltes Scrollen, Performance, Recovery nach HA-Neustart und Verbindungsverlust.

## Nicht im Umfang

Eigenständige Unterseiten für Heizung/Klima, Licht/Geräte, Medien, Tür, Kameras. Diese dürfen weder durch Dummy-Funktionen als fertig ausgegeben noch zur Voraussetzung der Dashboard-Freigabe werden. Erforderliche Anbieter, Aktionen und Einstellungen **für die Dashboard-Funktionen** sind enthalten.

## Freigabekriterien (alle verpflichtend)

- **Quellcode-Audit:** Jeder produktiv genutzte Dateipfad und Import nachvollzogen, kein Legacy-Code, keine Abhängigkeit zu r11-Ressourcen, keine unerreichbaren Platzhalter; klare Modulverantwortung.
- **Funktion:** Alle oben genannten sichtbaren Dashboard-Elemente mit realen Home-Assistant-Entitäten nachprüfbar funktionsfähig; Konfiguration vollständig aus der UI möglich.
- **Testautomatisierung:** Modul- und Schnittstellentests, Config-/Storage-/HA-API-Tests, Montage/Teardown, Echtzeit-Updates, Fehlerszenarien, Datenintegrität; CI grün.
- **Installation:** Eigenständige HACS-Installation und Aktivierung getestet, alter r11-Bestand unverändert; Rückrollverfahren dokumentiert.
- **Tablet-Abnahme:** OnePlus Pad 2 in Fully Kiosk, Portrait, Touch/Long-Press, Skalierung, Hintergrundbilder, Reload, Neustart, Offline-/Reconnect-Fälle getestet.
- **Dokumentation:** Soll-/Ist-Matrix mit bestanden/nicht bestanden je Funktion, reproduzierbaren Tests und bekannten Einschränkungen. Keine Freigabe bei offenen Pflichtfunktionen.

## Bereits bekannte Blocker

- **Erledigt:** Alle acht lokalen WebP-Hintergründe sind im Next-Repository und werden über SHA-256 in CI geprüft; keine Nutzung von `/jamesui_static`.
- Vollständige Dashboard-Konfigurationsoberfläche für Wetter-, Haus- und Button-Funktionen noch nicht bestätigt.
- Korrekte Registrierung und Laufzeitprüfung aller benötigten Aktionsmodule, Datenprovider und Widget-Instanzen offen.
- Echte Home-Assistant-Integrationstests und die Bedien-/Darstellungsprüfung auf dem Tablet offen.
- Die aktuelle `main`-CI ist ein Modul-/Syntax-/Regressionscheck, **keine Dashboard-Freigabe**.

Aktuelle, quellenbasierte Soll-/Ist- und Blocker-Matrix: [DASHBOARD_1_0_ACTUAL_STATUS_AUDIT.md](DASHBOARD_1_0_ACTUAL_STATUS_AUDIT.md).

## Reihenfolge

1. Bestandsaufnahme aller Dashboard-Abhängigkeiten, Datenflüsse, UX- und HA-Schnittstellen; fehlende Funktionen dokumentieren.
2. Core/Bootstrap/HA-API/Storage/Modul-Lifecycle bereinigen und absichern.
3. Wetter-/Hintergrund-/Kalender-/Hausstatus-/Buttonmodule einschließlich Konfiguration vollständig schließen.
4. Grid, Editor, Touch, Skalierung und Persistenz umfassend testen.
5. End-to-End-Tests, HACS-Installation, Tablet-Abnahme; **erst danach** eine testbare Freigabe kennzeichnen.

Die r11-Installation und das bestehende Repository `JamesUI` werden währenddessen nicht verändert.
