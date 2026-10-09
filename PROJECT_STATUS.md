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

## Architektur-Audit: erste verbindliche Korrekturen (2026-10-09)

- CI validiert jetzt JavaScript-Importgrenzen und blockiert direkte Abhängigkeiten zu alten r11-Runtime-URLs/Dateipfaden über `scripts/check_frontend_boundaries.py`.
- Neue Installationen erhalten eine eigenständige, validierte `home`-Dashboardkonfiguration samt `widget.weather-today` als Hero und 42-%-Hero-Deck. Keine r11-Migration oder altes Storage beteiligt.
- Pure Python-Regressionsprüfung des Erststarts ist eingerichtet und CI-grün.
- Dies ist **keine** vollständige Freigabe: acht fotorealistische WebP-Bilder fehlen, reale Wetter-/Kalender-/Button-Konfiguration und Funktionsprüfung sowie HA-/Tablet-Integration weiterhin offen.

## Wettermodul – Konfiguration und sichere Bild-Fallbacks (2026-10-09)

- Wetter-Einstellungen über den Dashboard-Editor: weather-Entität sowie optionale Außentemperatur-, Mondphasen- und Helligkeitssensoren. Validierung vor Übernahme, Speicherung über kanonischen Config Service, aktiver Provider wird danach aktualisiert.
- Tests für gültige Einstellungen, ungültige Entitäten, Fehler beim Speichern und Abbrechen in CI.
- Fehlende Hintergrundbilder erzeugen jetzt einen sicheren CSS-Fallback statt einer defekten Bilddarstellung.
- **Blocker:** Die acht fotorealistischen WebP-Szenen fehlen weiterhin unter `frontend/assets/alpine/`. Die GitHub-Textanbindung kann alte Binärdateien nicht auslesen; dies muss vor Tablet-Freigabe gelöst und getestet werden.
- Weiter offen: alle Wetter- und Mondzustände in echten HA-Daten, Responsive-Design/Tablet und vollständige Abnahme.

## Wetter-Hero – Szenenauswahl und Regressionen

- Regressionstests für vollständige 8-Szenen-URL-Zuordnung im eigenen Next-Namensraum, Tag/Nacht-Auswahl über Atmosphären-Capability, Mondphasen-Icon und Offline-Platzhalter ergänzt.
- GitHub Actions für JS-Tests grün.
- **Achtung:** Die acht WebP-Dateien fehlen weiterhin und sind für die Dashboard-Freigabe zwingend. Der verwendete GitHub-Connector liefert Binär-Blobs des alten Repositories nicht als lesbare Daten. Die Tests prüfen die **Referenzen und Logik**, nicht die Präsenz der Bilddateien oder ihre Tablet-Darstellung.

## Vollständige Asset-Übernahme – 2026-10-09

- Kompletter Stand `frontend/assets/` aus der freigegebenen `JamesUI`-Entwicklungsbranch nach `custom_components/jamesui_next/frontend/assets/` übertragen: **38 Dateien**, darunter 28 SVG-Wettersymbole, acht WebP-Alpenhintergründe und zwei TXT-Begleitdateien.
- Der Kopierlauf `Import JamesUI weather assets` in GitHub Actions war erfolgreich; acht WebP-Dateien wurden mit Dateigröße und SHA-256 überprüft. Die `Validate JamesUINext`-CI prüft die Bildintegrität nun dauerhaft.
- **Der bisherige Blocker „8 Hintergrundbilder fehlen“ ist erledigt.** Die Wetterdarstellung muss dennoch noch mit echten HA-Daten und auf dem Tablet abgenommen werden.

## Wetterdarstellung – vollständige Szenenmatrix

- Nach Übernahme aller 38 Assets ist die Zuordnung sämtlicher unterstützter HA-Wetterzustände für Tag, Golden Hour, Dämmerung und Nacht durch neue Tests abgesichert.
- Der Wetter-Hero blendet das vorherige Bild beim Szenenwechsel aus, bis das neue geladen ist; dadurch bleiben keine veralteten Motive sichtbar.
- Stand der letzten CI: erfolgreich. Noch offen: tatsächliche HA-Live-Daten, visuelle Tablet-Abnahme sowie umfassende Interaktionstests für die Vorhersage.

## Wetterprovider und Prognose – Robustheit

- Der Wetterprovider behandelt nun auch synchron ausgelöste WebSocket-Fehler bei Forecast-Abonnements kontrolliert als Abonnementfehler, statt beim Modulstart ungeprüft abzubrechen.
- Fehlgeschlagene Forecast-Streams werden über den regulären 5-Minuten-Takt erneut abonniert; alte Abonnements werden beim Neuaufbau bereinigt.
- Neue automatisierte Tests prüfen die Darstellung stündlicher und täglicher Prognoseeinträge sowie die Entfernung veralteter Zeilen bei Datenverlust.
- Die zugehörige GitHub-CI ist grün. End-to-End mit echter HA-Verbindung und Tablet bleibt Pflicht vor Freigabe.

## Tablet-Readiness – HA-Panel-Startpfad abgesichert

- Das Next-Panel wartet beim ersten Anhängen auf die von Home Assistant übergebene `hass`-Instanz, statt einen verfrühten Config-WebSocket-Aufruf auszulösen.
- Async-Imports und verspätete Mounts werden bei Entfernung des Panels verworfen. Der Preview-Bootstrap bricht bei Modul-/Configfehlern sauber ab und räumt Provider, Shell und HA-Subscriptions auf.
- Regressionstests für verspätete HA-Kontextübergabe und vorzeitiges Schließen des Panels sind grün; CI erfolgreich.
- **Weiterhin keine Tablet-Freigabe:** Funktionsumfang des Dashboard-Editors, dynamische Buttons (Konfiguration und echte HA-Aktionen), HA-End-to-End-Tests und Tablet-Fully-Kiosk-Abnahme sind noch nicht vollständig nachgewiesen.

## Dynamic Buttons – Instanzintegration

- `widget.dynamic-buttons`-Instanzen erhalten beim Mounten nun korrekt aufgelöste Button-Definitionen aus `dynamic_buttons` (zuvor war diese Auflösung nur für direkte Grid-Button-Elemente vorhanden).
- Neue Regressionstests prüfen das Laden mit einer zentralen HA-Aktionsdefinition und die Behandlung fehlender Definitionen; CI erfolgreich.
- **Noch offen:** eine vollständige Oberfläche zum Erstellen/Bearbeiten zentraler Button-Definitionen und zur Zuordnung von Buttons zu Widgetinstanzen sowie echte HA-Aktions-/Status- und Tablet-Tests. Keine Tablet-Freigabe.

## Dynamic Buttons – Dashboard-Konfiguration (laufender Stand)

- Ein Dynamic-Buttons-Widget besitzt nun im Dashboard-Bearbeitungsmodus eine Einstellungsoberfläche für Button-ID, Anzeigename, HA-Entität und Modus (Aktion oder Ein/Aus-Status); mehrere Buttons je Instanz können hinzugefügt werden.
- Trigger-Aktionen verwenden `entity.toggle`; Toggle-Buttons erzeugen `homeassistant.turn_on/turn_off` und `provider.control-state`-Statuszuordnung für `on/off`.
- Buttondefinition, Control-State-Quelle und Widgetzuordnung werden **gemeinsam in der Dashboard-Editiersitzung** gespeichert: Undo und Abbrechen vor „Fertig“ sind dadurch möglich; parallele Änderungen an den betroffenen Bereichen werden erkannt.
- Neue Validierungs- und Widget-Host-Tests erfolgreich; weiterhin offen: vollständige freie HA-Aktionsauswahl, vorhandene Buttons gezielt auswählen/entfernen, individuelle Zustandsdarstellung und Bedien-/HA-End-to-End-Test. Diese Teilimplementierung erfüllt noch nicht sämtliche Block-13-Kriterien.

## Dynamic Buttons – Auswahldialog und einzelne Zuordnungen (2026-10-09)

- Bereits zugewiesene Buttons lassen sich im Dialog nun gezielt auswählen und bearbeiten; der Dialog kann ebenso neue Buttons anlegen.
- Ein Button kann einzeln aus der aktuellen Widgetinstanz entfernt werden. Gemeinsame Definitionen anderer Instanzen bleiben erhalten; Undo und das Speichern über „Fertig“ nutzen die Dashboard-Editiersitzung.
- Korrektur: Bei mehreren Buttons wird die Statusquelle anhand der tatsächlich bearbeiteten Button-ID statt anhand des letzten Listenelements geändert. Regressionstests für Entfernen, Bearbeiten und unabhängige Nachbarbuttons ergänzt.
- Offen bleiben universelle Aktionsauswahl, individuelle Status-/Darstellungsparameter, Entfernung unbenutzter globaler Definitionen und vollständige HA-/Tablet-Abnahme.

## Block 13 – Native Home-Assistant-Aktionsauswahl

- Trigger-Buttons können in der Dashboard-Oberfläche `entity.toggle`, `scene.activate` und `ha.service` auswählen. Für HA-Services werden Domain, Servicename und Ziel-Entität erfasst; Szenen müssen `scene.*` verwenden.
- Die Aktionstypen nutzen die bereits registrierten zentralen HA-Aktionsprovider. Eingaben werden vor der Übernahme validiert; Tests für gültige und ungültige Szenen-/Serviceaktionen ergänzen die vorhandenen Dynamic-Buttons-Tests. CI grün.
- **Nicht vollständig**: Freie Aktionen jenseits dieser drei nativen Typen, komplexe Service-Daten, Zustands-/Farbkonfiguration, gezieltes Löschen unbenutzter zentraler Definitionen und HA-/Tablet-End-to-End-Abnahme sind noch offen.

## Block 13 – Konfigurierbare Statusbeschriftungen

- Ein/Aus-Buttons können im Dashboard-Einstellungsdialog unterschiedliche Texte für aktive und inaktive Zustände erhalten; die bereits vorhandene Widget-Darstellung verwendet diese `presentation`-Werte.
- Bearbeiten vorhandener Buttons bewahrt Icons, Timeout, andere Präsentationseinstellungen und die gewählte Widget-Größe. Explizit geleerte Statusbeschriftungen entfernen nur den jeweiligen Text.
- Regressionstests ergänzt; GitHub Actions grün. Noch offen: konfigurierbare Warn-/Fehler-Zuordnungen, komplexere Action-Daten und echte Home-Assistant-/Tablet-Abnahme.

## Block 13 – Warnzustand für Dynamic Buttons (2026-10-09)

- Toggle-Buttons können im Einstellungsdialog einen HA-Wert als `warning`-Zwischenzustand sowie einen individuellen Warntext festlegen. Warnungen erhalten eine eigene, designsystembasierte Markierung; beliebige sonstige Zwischenzustände werden nicht pauschal hervorgehoben.
- Vorhandene Statuszuordnungen bleiben beim Bearbeiten bestehen; doppelt/überschneidend zugeordnete Zustandswerte werden durch die Control-State-Schemavalidierung abgelehnt.
- Buttonstatusmodell, Widget-Attribut, CSS, Dialog und Regressionstests wurden angepasst; letzter CI-Lauf erfolgreich.
- Offen: weitere individuelle Statusoptionen, strukturierte HA-Service-Daten, vollständige End-to-End-Tests mit echtem HA und Tablet.

## Block 13 – Strukturierte HA-Serviceparameter

- Trigger-Buttons vom Typ `ha.service` besitzen nun ein optionales Eingabefeld für JSON-Servicedaten. Der Editor validiert die JSON-Syntax und erwartet ein Objekt; beim erneuten Bearbeiten werden die bisherigen Parameter angezeigt.
- Leere Eingaben erzeugen keine zusätzliche `data`-Eigenschaft und bleiben zu bisherigen Aktionen kompatibel.
- Neue Regressionstests für strukturierte Parameter sowie fehlerhafte JSON-Werte; nach Korrektur des Kompatibilitätsfalls ist die CI wieder grün.
- Weiterhin offen: vollständige End-to-End-Tests mit Home Assistant, Dialog-/Tablet-Bedienabnahme und umfassender Block-13-Review.

## Block 13 – Integrationscheck Dashboard-Editiersitzung

- Integrationstests für den vollständigen Speicherpfad hinzugefügt: Widget hinzufügen, zentralen Toggle definieren, HA-Control-State-Quelle anlegen, Undo und eine einzige atomare Config-Service-Speicherung.
- Zusätzlich geprüft: Entfernen einer Widget-Button-Zuordnung lässt zentrale, eventuell anderweitig genutzte Button-Definitionen intakt.
- Automatisierte GitHub-CI für diese Tests erfolgreich. Reale Home-Assistant-Serviceaufrufe, Status-Livewechsel und Tablet-Touchbedienung sind weiterhin nicht als Ende-zu-Ende-Test nachgewiesen; kein Release-Gate bestanden.

## Block 13 – Simulierte Home-Assistant-End-to-End-Tests

- Neue Tests `tests/jamesui-next-button-ha-integration.test.js` verbinden das echte Dynamic-Buttons-Widget mit der Action Registry, HA-Aktionsprovidern und dem Home-Assistant-Adapter im simulierten HA-Kontext.
- Geprüft: `homeassistant.turn_on/turn_off` mit korrekter Ziel-Entität, Pending bis zu einem neueren bestätigenden Status, Fehlerfeedback bei zurückgewiesenem HA-Service, Unterdrückung von Doppelklicks während Pending und Fehler bei unerwartetem Terminalzustand.
- Shared Fake DOM um browserübliches `Element.remove()` erweitert; alle Tests und GitHub-CI nach dieser Korrektur erfolgreich (Run 37989288520).
- Die Tests ersetzen **keine** echten HA-/Tablet-Praxistests. Aktuelle Freigabe weiterhin offen.
