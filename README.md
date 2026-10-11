# JamesUINext

Eigenständige, modulare Tablet-Oberfläche für Home Assistant, entwickelt für das **OnePlus Pad 2 im Hochformat**. Aktuell umfasst die Testversion den Core und das Startdashboard: Wetter, Kalender/Aufgaben, Hausstatus, dynamische Buttons sowie den Dashboard-Editor.

## Installation über HACS

1. Vor einer Testinstallation ein Home-Assistant-Backup erstellen.
2. In **HACS → Drei Punkte → Benutzerdefinierte Repositories** die Adresse \`https://github.com/MarkusAureliusTeuton/JamesUINext\` mit Typ **Integration** hinzufügen.
3. **JamesUI Next** in HACS herunterladen (für die Testversion gegebenenfalls „Beta-Versionen anzeigen“ auswählen).
4. **Home Assistant neu starten.**
5. Unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** nach **JamesUI Next** suchen und die Integration hinzufügen.
6. Im Browser das eigene Panel über \`/jamesui-next\` öffnen.

Die installierte Integration heißt \`jamesui_next\`, liegt unter \`/config/custom_components/jamesui_next\`, verwaltet ihre Konfiguration unter \`.storage/jamesui_next.config\` und nutzt eigene WebSocket-Kommandos.

## Erste Einrichtung

- Der Erststart erzeugt eine Startseite mit Wetter-Hero und einem zunächst leeren Widget-Raster, das direkt in den Editiermodus wechselt.
- Unter **Wetter-Datenquelle** die reale \`weather.*\`-Entität und optional Temperatur-, Mond- und Helligkeitssensoren auswählen.
- Über **+ Hinzufügen** Agenda, Hausstatus und dynamische Buttons anlegen. Kalender und Todo-Listen werden je Agenda-Instanz konfiguriert.
- Die Hausstatus-Datenquellen sind momentan über einen validierten technischen JSON-Dialog einstellbar; hier ist vor der Tablet-Abnahme auf Lesbarkeit und praktische Bedienung zu achten.
- Mit **Fertig** speichern. Bei einem Konflikt zwischen Clients wird das Speichern abgelehnt und eine Fehlermeldung angezeigt.

Erst im PC-Browser mit echten HA-Entitäten prüfen, danach auf dem OnePlus Pad 2 über Fully Kiosk. Nur Start ist aktuell ausführbar; die übrigen Navigationsbereiche sind deaktiviert.

## Stand und Sicherheit

Automatisierte Python-/JavaScript-Modultests, Asset-Prüfungen, Konfigurations-Konflikttests und ein Chromium-Browsertest mit simuliertem HA sind eingerichtet. **Echte HA-/KNX- und Tablet-Tests stehen noch aus.** Eine Betaversion ist ausdrücklich keine Produktivabnahme.

Weiterarbeiten: [PROJECT_STATUS.md](PROJECT_STATUS.md), [Freigabeumfang](docs/DASHBOARD_1_0_RELEASE_GATE.md), [neuer Chat](docs/NEXT_CHAT.md).
