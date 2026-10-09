# JamesUINext – Soll-/Ist-Bestandsaufnahme Dashboard 1.0

Stand: 2026-10-09. Prüfung der tatsächlichen Dateien und ihrer Verdrahtung auf `main` gegen `docs/DASHBOARD_1_0_RELEASE_GATE.md`. **Keine Neuplanung und keine pauschale Wiedereröffnung der Blöcke 1–13.**

## Bewertung
- **Implementiert** = Quellcode und Einstiegspfad nachgewiesen.
- **Teilweise integriert** = Kern vorhanden, aber mindestens eine notwendige Verbindung/Einstellung fehlt.
- **Automatisiert geprüft** = passende Tests und grüne CI vorhanden, kein Ersatz für Live-Abnahme.
- **Praxis offen** = Home Assistant, Fully Kiosk und Tablet hier nicht erreichbar.

| Pflichtbereich | Ist im Repository | Status und echter Rest |
|---|---|---|
| Isolierte HA-Integration | Eigener `jamesui_next`-Ordner, ConfigFlow, Storage, WebSocket, Panel `/jamesui-next`, HACS-Metadaten, separate Static-Route | **Implementiert; HA-Installation/Restore/Rollback live offen** |
| Core und Provider-Lifecycle | Module-/Capability-/Action-Registry, Loader, Config Service, Provider-Updater, Shell, Health, Panel-Lifecycle | **Implementiert, automatisierte Teiltests grün; vollständige Lifecycles in HA offen** |
| Hero/Grid/Editieren | 12-Spalten-Grid, hero-deck, Touch-Editor, Resize, Undo, Konfigurationsspeicherung und Widget-Katalog | **Implementiert; Bedienbarkeit/Long-Press auf Tablet nicht geprüft** |
| Wetter | Wetterprovider, Forecast, Sonnen-/Mondwerte, Wetter-Dialog, acht WebP-Alpenszenen, 28 SVGs | **Implementiert; Bilder im Repository vorhanden und per SHA-256 geprüft; Live- und visuelle Abnahme offen** |
| Kalender/Aufgaben | Agenda-Widget, Kalender-/Todo-Provider, Mehrfachinstanzen und Quellen-Dialog, Aufgaben-Overlay, `action.task-update`-Modul | **Teilweise integriert: Aktionsmodul wird in `jamesui-next-preview.js` nicht registriert und nicht gestartet. Aufgabenbearbeitung somit blockiert** |
| Haus-Quickinfos | Widget `widget.house-quick`, Provider für Lighting/Heating/Energy/Devices, Schemas für Zone und Energie-Schwellen | **Teilweise integriert: Katalog fügt nur `{buttons: []}` ein; keine Hausstatus-Einstellungen und Datenquellenverwaltung in der UI** |
| Dynamische Buttons | Definitionen, HA-Service-/Szenenaktionen, Zustandsprovider, Dialog, Widgetinstanzen, Status-/Warntexte, CI inklusive simulierter HA-Aktionen | **Weitgehend integriert; reale HA- und Tablet-Abnahme offen; nicht jede erweiterte Definitionseigenschaft in der UI editierbar** |
| Oberfläche/Navigation | Shell, feste Navigationsstruktur und Dashboard-Route | **Dashboard vorhanden; nicht implementierte Haus/Klima/Medien/Tür-Seiten werden noch als beschriftete Platzhalter gerendert. Für Release klar deaktivieren/kennzeichnen** |
| Lösch- und Wiederherstellungsprozesse | Dashboard-Editiersitzung besitzt Add, Move, Resize, Undo, Save und `configureWidget` | **Lücke: kein nachgewiesener Löschbefehl für ganze Widgets/Elemente im Editor; Wiederherstellung/Migration nicht praktisch abgenommen** |
| Tests und Installation | JavaScript/Python CI, Importgrenzen, Asset-SHA, HA-Adapter und dynamische Buttons mit simulierten HA-Serviceaufrufen | **Automatisierte Teiltests grün; reale HA-Installation, echte Status-/Reload-/Reconnect-Szenarien und Fully Kiosk offen** |

## Tatsächliche priorisierte Blocker vor erstem Tablet-Release-Kandidaten

**P0 – funktionale Integrationslücken, im Code belegt**
1. `action.task-update` aus `modules/action.task-update/` beim Bootstrap registrieren und starten, danach Agenda-Bearbeiten/Erledigen/Undo über die Action Registry testen.
2. Haus-Quickinfo-Konfiguration mit den bereits implementierten Hausprovidern über den Dashboard-Editor zugänglich machen; echte Datenquellen, Heizzonen, Licht/Geräte und Energie-Schwellen.
3. Ganze Dashboard-Elemente/Widgets im Editor entfernen können, einschließlich konsistenter Instanzverwaltung und Undo. Alle relevanten sichtbaren Einstellungen müssen erreichbar sein.
4. Nicht implementierte Navigation sichtbar als nicht verfügbar kennzeichnen oder deaktivieren, statt funktionierende Unterseiten zu suggerieren.

**P1 – prüfbare Qualität vor Freigabe**
5. Zentrale HA-Integration vollständig mit Simulator-/Backend-Tests für ConfigFlow, Berechtigungen, Storage und Reload/Recovery belegen; jeden verbleibenden Browser-/Pointer-Interaktionsfehler gezielt beheben.
6. Eigene HACS-Testinstallation neben r11, echte HA-Wetter-/Kalender-/Todo-/Haus-/Button-Entitäten prüfen und Rückroll-/Backupverhalten nachweisen.
7. OnePlus Pad 2 / Fully Kiosk: Portrait, Hintergründe, Touch-Long-Press, Resize, Fixed/Scroll, Reconnect, Neustart und Performance durch Nutzer abnehmen.

## Nicht erneut bauen
Core, acht Alpenbilder, Wetter/Sonnen/Mond-Logik, Grid-System, Kalender-/Aufgabenprovider, Hausstatus-Provider/Modelle, Dynamic Buttons und zentrale Registries **existieren**. Sie benötigen teils letzte Verdrahtung, UI-Konfiguration oder echte Abnahme, nicht Neuentwicklung.

## Test- und Freigabegrenze
Die letzte vor dem Audit geprüfte `Validate JamesUINext`-CI war erfolgreich; eine grüne CI erklärt **nicht** das Dashboard zur Tablet-fertigen Version. Ohne Live-HA-Zugriff keine Behauptung einer Geräteabnahme. Auch eine technische Testinstallation darf früher erfolgen, sie ist aber ausdrücklich noch keine Freigabe.

## Hinweis auf veraltete Statusdokumentation
`docs/DASHBOARD_1_0_RELEASE_GATE.md` nennt unter „bereits bekannte Blocker“ noch fehlende acht WebP-Dateien. Diese Aussage ist überholt; die vollständige Übernahme wird bereits in `PROJECT_STATUS.md` und `docs/ARCHITECTURE_AUDIT.md` bestätigt.

## Umsetzung P0 Nr. 1–3 (2026-10-09)

1. **Aufgabenaktionen im Bootstrap angeschlossen:** `action.task-update` ist nun im Modulregister erfasst, wird vor den Dashboard-Providern geladen und gemountet und bei Fehler oder Abbau entladen. Die bereits vorhandene Agenda-Bearbeitung kann damit die registrierte `task.update`-Aktion aufrufen. Echtes HA-Todo-Update noch praktisch prüfen.
2. **Haus-Quickinfo-Konfiguration angeschlossen:** Das Zahnrad für `widget.house-quick` öffnet einen Einstellungsdialog für die Widget-Buttons und alle vier Hausprovider. Die Eingaben werden mit den bereits vorhandenen Modul-Schemas geprüft, inklusive Zuordnung von Heizzonen/Energiequellen und Energieschwellen. Widget und Provider-Einstellungen werden transaktional über die Editiersitzung mit Undo gespeichert; der Provider-Updater erhält die neuen Werte. **UX-Einschränkung:** Der Dialog bietet zunächst technische, validierte JSON-Felder, keine komfortablen feldweisen Formularassistenten.
3. **Ganze Elemente entfernen:** Im Dashboard-Bearbeitungsmodus gibt es pro Element eine Entfernen-Schaltfläche. Das Entfernen ist rückgängig zu machen, wird erst mit „Fertig“ gespeichert und bereinigt Widgetinstanzen nur, wenn sie weder auf anderen Seiten noch als Hero verwendet werden. Globale Button-Definitionen werden nicht versehentlich gelöscht. Eine Regression hat einen Fehler bei der Prüfung seitenübergreifender Verwendungen aufgedeckt; korrigiert.
4. **Tests:** Neue Editor-Tests für Entfernen, Undo, Hausstatus-Transaktion und Schema-/Schwellenvalidierung in GitHub Actions grün. Die erfolgreiche CI ist keine Tablet-Abnahme.

**Rest:** P0 Nr. 4 (Navigation von nicht implementierten Seiten) bleibt offen. Danach Installations-/End-to-End-/Tablet-Abnahme. Die obenstehende P0-Liste dokumentiert den ursprünglichen Auditzustand; dieser Abschnitt enthält den aktuellen Umsetzungsnachweis.
