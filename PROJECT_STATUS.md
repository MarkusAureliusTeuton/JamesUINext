# JamesUINext – Projektstatus

**Stand: 11.10.2026 · Aktives Repository: [MarkusAureliusTeuton/JamesUINext](https://github.com/MarkusAureliusTeuton/JamesUINext) · Hauptbranch: main**

Dieses Dokument ist die verbindliche Übergabe für die Fortsetzung. Es wird nach jeder zusammengehörigen Änderung fortgeschrieben. Maßgeblich sind immer GitHub-HEAD, Quellcode und der aktuelle CI-Lauf.

## Ziel / Scope

Eigenständige Home-Assistant-Integration und Tablet-Oberfläche, zugeschnitten auf das **OnePlus Pad 2 im Hochformat / Fully Kiosk**. Zunächst werden **Core und Startdashboard** technisch vollständig und praktisch testbar gemacht. Die Zielbereiche Haus, Klima, Medien und Tür sind sichtbar, aber derzeit bewusst deaktiviert. Keine vorgezogene Entwicklung dieser Seiten.

## Verbindliche Projektidentität

- Repository: `MarkusAureliusTeuton/JamesUINext` – nur dieses Repository bearbeiten.
- HA-Domain/Ordner: `jamesui_next` / `custom_components/jamesui_next`
- Panel: `/jamesui-next`; Assets: `/jamesui_next_static`
- Speicherung: `.storage/jamesui_next.config`
- Konfigurations-API: `jamesui_next/config/get` und `jamesui_next/config/replace`
- Hauptdateien: `frontend/jamesui-next-entry.js`, `frontend/jamesui-next-preview.js`, modularer Core und Widget-/Provider-Module.
- Alle acht lokalen Alpine-WebP-Hintergründe und die Wettersymbol-SVGs liegen bereits hier und werden in CI geprüft.
- Keine externen Asset-Importe, keine zusätzlichen Repositories und keine Branchwechsel ohne sachlichen Grund.

## Implementierter und automatisiert geprüfter Stand

| Bereich | Implementierter Stand | Noch praxisoffen |
| --- | --- | --- |
| HA-Einbindung | Eigener ConfigFlow, eigener Speicher und WS-API, Panel-Start | Installations-/Neustart-/Berechtigungstest in echtem HA |
| Start-Layout | Hero-Deck, 12-Spalten-Grid, Navigation mit reserviertem unteren Bereich, Hochformat | OnePlus-/Fully-Layout und Touch |
| Wetter | Wetter-Hero mit Datum/Uhr, Vorhersage, Mond, lokale Hintergründe und Datenquellen-Dialog | Echte Wetter-/Forecast-Entitäten und grafische Sichtprüfung |
| Kalender & Aufgaben | Agenda-Widget, Quellen je Instanz, Task-Action am Bootstrap, Editieren/Undo-Pfade | Live-Kalender-/Todo-Service und Berechtigungen |
| Haus-Quickinfos | Vier Provider sowie Einstellungsdialog für Widget und Provider (aktuell technische JSON-Felder) | Echte Sensorbindungen und komfortable Bedienbarkeit |
| Dynamische Buttons | Konfiguration, Statusprovider, HA-Aktionen, Widget-Instanzen | Echte Schaltvorgänge/KNX und Zustandsfeedback |
| Dashboard-Editor | Hinzufügen, Entfernen, Verschieben/Resize, Undo und Persistenz | Touch/Long-Press/Drag auf Tablet |
| Konfigurationssicherheit | Serverseitige Revision, compare-and-swap, atomare Speicherung, sichtbare Speicherfehler | Konfliktversuch mit zwei echten Browsern |
| Qualitätsprüfungen | Python-/JS-Tests, SHA-Assetcheck, Importgrenzen, Chromium-Hochformat-Browser-Smoketest mit simuliertem HA | Reale Home-Assistant- und Langzeitprüfung |

**Letzter vollständig grüner Integrations- und Veröffentlichungsstand:** GitHub Actions **[38160643782](https://github.com/MarkusAureliusTeuton/JamesUINext/actions/runs/38160643782)**: `verify / validate`, `verify / browser-smoke` und `publish` erfolgreich. Die [HACS-Testversion v1.0.0b2](https://github.com/MarkusAureliusTeuton/JamesUINext/releases/tag/v1.0.0b2) wurde am 11.10.2026 aus dem verifizierten Code-Commit `d42cc1025f6ee708576bc1eed7c545d8510d4d75` veröffentlicht. Die grüne CI umfasst simulierte HA-Daten; keine Behauptung einer echten Hardwareabnahme.

Ein realer Browserfehler (untere Navigation blockierte Editor-Schaltfläche) wurde anhand des Chromium-Tests entdeckt und behoben. Zusätzlich sind neue Tests für konkurrierende Speichervorgänge vorhanden.

## Installationsbereite HACS-Testversion

**Bereit:** `v1.0.0b2` im [eigenen GitHub-Repository](https://github.com/MarkusAureliusTeuton/JamesUINext/releases/tag/v1.0.0b2).

1. Home Assistant sichern. In HACS das Custom-Repository `https://github.com/MarkusAureliusTeuton/JamesUINext` als **Integration** hinzufügen.
2. **JamesUI Next → Erneut herunterladen**: Beta-Versionen anzeigen und `v1.0.0b2` auswählen.
3. Home Assistant neu starten und unter **Einstellungen → Geräte & Dienste** die Integration **JamesUI Next** hinzufügen.
4. Am PC `/jamesui-next` öffnen, Wetter-Entität zuweisen, weitere Widgets einrichten, speichern, Browser neu laden und die Live-Aktionen prüfen.
5. Erst danach das OnePlus Pad 2 mit Fully Kiosk im Hochformat prüfen.

**Noch nicht durch Nutzer bestätigt:** Die tatsächliche HA-Installation, reale KNX-/Todo-Aktionen, visuelle Tablet-Abnahme, Offline- und Neustart-Stabilität. Siehe `docs/LIVE_TEST.md`.

## Erster echter Installationsbefund – 11.10.2026

**Anwenderbefund:** Nach Installation/Öffnen von `v1.0.0b2` wird die Seite schwarz dargestellt. Ursache **nicht verifiziert**; die simulierten HA-Browsertests deckten die reale Initialisierung nicht ab.

**Im Quellcode bereits verbessert (noch nicht als HACS-Version veröffentlicht):** Das Next-Panel zeigt nun explizit lesbaren Warte- und Fehlertext, protokolliert Startfehler in der Browserkonsole, meldet einen WebSocket-/Initialisierungstimeout nach 15 Sekunden und behandelt eine nicht erfolgreich gemountete Startseite als Fehler. Dazu Regressionstests. [Prüfung 38161583712](https://github.com/MarkusAureliusTeuton/JamesUINext/actions/runs/38161583712) vollständig grün.

**Vor dem nächsten Release:** Fehler aus der echten Browserkonsole nach Reload der bestehenden Beta einholen; prüfen, ob `JamesUI Next` in HA als Integration eingerichtet ist. Keine weiteren Installationen nach Vermutung. Erst die identifizierte Ursache beheben, dann neue Beta mit Nachweis veröffentlichen.

## Noch zu tun – keine neue Feature-Roadmap

1. **Erledigt:** Eigene HACS-Testversion `v1.0.0b2` nach vollständiger CI veröffentlicht.
2. Installation unter Home Assistant mit Backup, Integration und Panel `/jamesui-next` prüfen. Im PC-Browser vier Widgets mit realen HA-Entitäten konfigurieren und Aktionen prüfen.
3. Auf dem OnePlus Pad 2 in Fully Kiosk Hochformat, Wetterbilder, Navigation, Long-Press, Layout, Dialoge, Reload, Offline/Reconnect und Neustart praktisch testen.
4. **Nur tatsächlich reproduzierbare Probleme** beheben und Tests dazu ergänzen. Erst nach erfolgreicher Praxis-Abnahme Dashboard 1.0 freigeben.

## Arbeitsweise in Folgechats

1. Zuerst `PROJECT_STATUS.md`, `README.md`, `docs/DASHBOARD_1_0_RELEASE_GATE.md` und die relevanten Quellcodedateien im aktuellen GitHub-HEAD lesen.
2. Kurz technische Ergebnisse und konkrete Restpunkte nennen; GitHub direkt bearbeiten, CI prüfen, Projektstatus aktualisieren.
3. Keine endlosen Fragebögen, keine Wiederholung abgeschlossener Blöcke, keine Erweiterung der Seiten außerhalb der Startseite.
4. Behandle Simulation und Live-HA-/Tablet-Abnahme als **verschiedene Nachweise**; keine Behauptungen ohne Test.

Weitere Details: [Dashboard-Freigabekriterien](docs/DASHBOARD_1_0_RELEASE_GATE.md), [aktueller Soll-/Ist-Abgleich](docs/DASHBOARD_1_0_ACTUAL_STATUS_AUDIT.md), [Startprompt](docs/NEXT_CHAT.md).
