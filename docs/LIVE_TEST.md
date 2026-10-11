# JamesUINext – Live- und Tablet-Test

**Testversion:** [v1.0.0b2](https://github.com/MarkusAureliusTeuton/JamesUINext/releases/tag/v1.0.0b2). **Status:** Noch nicht praktisch abgenommen.

## 1. Home Assistant / PC – einmal installieren

1. Home Assistant Backup erstellen.
2. In HACS → Benutzerdefinierte Repositories `https://github.com/MarkusAureliusTeuton/JamesUINext` als **Integration** hinzufügen.
3. In HACS **JamesUI Next → Erneut herunterladen** → Beta-Versionen anzeigen → `v1.0.0b2` auswählen.
4. Home Assistant neu starten. Unter Einstellungen → Geräte & Dienste → Integration hinzufügen **JamesUI Next** einrichten.
5. Im PC-Browser `http://<HA-IP>:8123/jamesui-next` öffnen (oder dieselbe HA-Basisadresse wie gewohnt verwenden).

**Erwartet:** Eine Startseite mit Wetter-Hero, zunächst leerem Widget-Raster und sichtbarem Editor. Der Startbereich der unteren Navigation ist aktiv; die übrigen Bereiche sind deaktiviert. Der erste Start sollte ohne Fehlermeldung gelingen.

## 2. Daten und Bedienelemente testen

| Prüfschritt | Erwartete Beobachtung |
| --- | --- |
| Wetter-Datenquelle → reale `weather.*`-Entität wählen | Temperatur/Zustand/Prognose und passende lokale Hintergrundgrafik |
| Kalender & Aufgaben hinzufügen und Entitäten eingeben | Tatsächliche Termine und Aufgaben aus Home Assistant |
| Aufgabe erledigen/ändern und Undo | Änderung beim zugehörigen Home-Assistant-Todo-Dienst |
| Hausstatus konfigurieren | Tatsächliche Licht-, Heizungs-, Geräte- und Energiewerte |
| Dynamischen Button konfigurieren | Schalten/Auslösen über Home Assistant und richtiges Zustandsfeedback |
| Widget hinzufügen, verschieben, Größe ändern, Undo, Fertig | Änderungen werden gespeichert und bleiben nach Reload erhalten |
| Zwei Browser parallel | Konflikt wird angezeigt; bereits gespeicherte Änderungen werden nicht überschrieben |

**Sicherheit:** Schaltfunktionen zuerst an einem ungefährlichen Testaktor prüfen. Bei fehlenden Entitäten/Funktionen nicht wahllos neue Konfigurationen speichern, sondern Entitäts-ID und HA-Fehlermeldung dokumentieren.

## 3. OnePlus Pad 2 / Fully Kiosk

- Im Hochformat dieselbe Adresse `/jamesui-next` öffnen.
- Wetterbild, Schriftgrößen, alle Widgetkarten und den unteren Menübereich prüfen.
- Editieren: Long-Press, Drag & Drop, Resize, Abbrechen/Undo, Speichern, Einstellungen.
- Sicherstellen, dass nichts abgeschnitten wird, keine Leiste Buttons verdeckt und kein unbeabsichtigtes Seitenscrolling stattfindet.
- Reload, Screen-Off/On, Home-Assistant-Neustart sowie Netzwerkunterbrechung und Wiederverbindung beobachten.

## 4. Fehler zurückmelden

Bitte **nur die erste reproduzierbare Fehlfunktion** zusammen mit diesen Angaben melden: PC/Tablet, genutzte Seite/Widget, genaue Schritte, erwartetes und tatsächliches Ergebnis, gegebenenfalls Screenshot und Home-Assistant-Protokoll. Erst diesen Fehler beheben und automatisiert absichern, dann fortfahren.

**Abnahmestatus:** Alle oben genannten Live- und Tablet-Prüfungen offen. Automatisierte Chromium-Tests mit simulierten HA-Daten sind bereits grün, ersetzen aber keinen dieser Schritte.
