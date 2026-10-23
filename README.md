# JamesUINext

Eigenständige, modulare Tablet-Oberfläche für Home Assistant, entwickelt für das **OnePlus Pad 2 im Hochformat**. Aktuell umfasst die Testversion den Core und das Startdashboard: Wetter, Kalender/Aufgaben, Hausstatus, dynamische Buttons sowie den Dashboard-Editor.

## Installation über HACS

1. Vor einer Testinstallation ein Home-Assistant-Backup erstellen.
2. In **HACS → Drei Punkte → Benutzerdefinierte Repositories** die Adresse `https://github.com/MarkusAureliusTeuton/JamesUINext` mit Typ **Integration** hinzufügen.
3. **JamesUI Next** öffnen, gegebenenfalls **Beta-Versionen anzeigen** aktivieren und die geprüfte **v1.0.0b4** herunterladen.
4. **Home Assistant neu starten.**
5. Unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** nach **JamesUI Next** suchen und die Integration hinzufügen.
6. Im Browser das eigene Panel über `/jamesui-next` öffnen.

Die installierte Integration heißt `jamesui_next`, liegt unter `/config/custom_components/jamesui_next`, verwaltet ihre Konfiguration unter `.storage/jamesui_next.config` und nutzt eigene WebSocket-Kommandos.

## Erste Einrichtung

- Der Erststart erzeugt einen Wetter-Hero mit einer verständlichen Schaltfläche **„Erstes Widget hinzufügen“** und öffnet den Dashboard-Editor. Die neue Navigation bleibt am unteren Rand sichtbar.
- Unter **Wetter-Datenquelle** die reale `weather.*`-Entität und optional Temperatur-, Mond- und Helligkeitssensoren auswählen.
- Über **+ Hinzufügen** Agenda, Hausstatus und dynamische Buttons anlegen. Die Widgets erhalten passende Ausgangsgrößen und füllen freie Spalten. Kalender und Todo-Listen werden je Agenda-Instanz konfiguriert. Dynamische Buttons werden über **Bearbeiten → Zahnrad → Button übernehmen** mit einer HA-Entität eingerichtet.
- Die Hausstatus-Datenquellen sind momentan über einen validierten technischen JSON-Dialog einstellbar; hier ist vor der Tablet-Abnahme auf Lesbarkeit und praktische Bedienung zu achten.
- Mit **Fertig** speichern. Bei einem Konflikt zwischen Clients wird das Speichern abgelehnt und eine Fehlermeldung angezeigt.

Erst im PC-Browser mit echten HA-Entitäten prüfen, danach auf dem OnePlus Pad 2 über Fully Kiosk. Beim ersten Start existiert die Startseite; weitere frei konfigurierbare Dashboard-Seiten können über das globale Zahnrad angelegt werden. Spezielle Funktionsseiten für Haus, Klima, Medien und Tür werden erst in späteren Modulen umgesetzt.


## Seiten verwalten

Das Zahnrad rechts oben öffnet die globalen **Einstellungen**. Unter **Seiten** lässt sich eine neue Seite anlegen (normales Dashboard oder Wetter-Hero), öffnen, in den Papierkorb verschieben und wiederherstellen. Zum **endgültigen Löschen** ist eine zusätzliche Bestätigung erforderlich. Die Startseite bleibt geschützt. Die Navigation verteilt aktive Seiten automatisch; bei vielen Seiten wird daraus eine horizontale Wischleiste. Andere globale Einstellungen können später dort ergänzt werden.

Kalender-/Agenda-Widgets dürfen zunächst ohne Entitäts-ID hinzugefügt werden: anschließend über **Bearbeiten → Zahnrad** die Kalender und Aufgabenlisten eintragen. Neue Hausstatus- und dynamische Button-Widgets zeigen bis zur Konfiguration einen Hinweis an. Die Hausstatus-Einstellungen sind teilweise weiterhin technische JSON-Felder und noch nicht komfortabel genug für die abschließende Tablet-Abnahme.

## Stand und Sicherheit

Automatisierte Python-/JavaScript-Modultests, Asset-Prüfungen, Konfigurations-Konflikttests und ein Chromium-Browsertest mit simuliertem HA sind eingerichtet. **Echte HA-/KNX- und Tablet-Tests stehen noch aus.** Eine Betaversion ist ausdrücklich keine Produktivabnahme.

Weiterarbeiten: [PROJECT_STATUS.md](PROJECT_STATUS.md), [Freigabeumfang](docs/DASHBOARD_1_0_RELEASE_GATE.md), [neuer Chat](docs/NEXT_CHAT.md).
