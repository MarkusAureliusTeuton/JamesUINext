# JamesUINext – Startprompt für den nächsten Chat

Wir arbeiten am **eigenständigen GitHub-Repository `MarkusAureliusTeuton/JamesUINext`**, Branch `main`. Bearbeite **ausschließlich dieses Repository**. Antworte auf Deutsch, knapp und technisch präzise. Änderungen direkt in GitHub umsetzen und aktuelle CI-Ergebnisse prüfen; keine manuelle Copy/Paste-Arbeit verlangen, wenn du die Datei selbst ändern kannst.

**Vor jeder Weiterentwicklung zuerst diese aktuellen Dateien lesen:**
1. `PROJECT_STATUS.md`
2. `README.md`
3. `docs/DASHBOARD_1_0_RELEASE_GATE.md`
4. `docs/DASHBOARD_1_0_ACTUAL_STATUS_AUDIT.md`
5. Betroffene Architektur-/Quellcodedateien, Tests und die neuesten GitHub-Actions-Ergebnisse.

**Projektidentität:** HA-Integration `jamesui_next`, Panel `/jamesui-next`, Config Store `jamesui_next.config`. Der Core, das Startdashboard, Wetter, Kalender/Aufgaben, Haus-Quickinfos, dynamische Buttons und Dashboard-Editor sind bereits implementiert. Acht lokale Alpine-WebP-Bilder sind vorhanden. Der Browser-Smoke testet das Hochformat mit simuliertem HA. Weitere Funktionsseiten bleiben deaktiviert.

**Aktuelles Ziel:** Kontrollierte HACS-Beta installieren, Startseite am PC mit echten Home-Assistant-Daten prüfen, danach auf dem OnePlus Pad 2/Fully Kiosk. Nur konkrete Live-Probleme beheben und mit Tests absichern. Keine neuen Funktionsseiten, keine erneute vollständige Planung der vorhandenen Module, keine pauschalen Behauptungen über Live-Funktionalität.

**Zum Schluss jeder Arbeitsrunde:** Änderungen, grüner/fehlgeschlagener CI-Lauf, aktueller GitHub-Commit und die wirklich verbleibenden nächsten Schritte in `PROJECT_STATUS.md` aktualisieren. Kurze Zusammenfassung in der Antwort.

**Wichtig:** Für einen neuen Chat zuerst GitHub-HEAD prüfen; diese Datei ist eine Wegbeschreibung, nicht Ersatz für den tatsächlichen Code.

**Verifizierter Kandidat:** HACS-Beta `v1.0.0b3`, Release-Workflow [38211971308](https://github.com/MarkusAureliusTeuton/JamesUINext/actions/runs/38211971308) vollständig grün. Die UI/Editor-Layouts und Standard-Widgetgrößen sind überarbeitet; der Chromium-Smoke prüft Einrichten und Speichern von Agenda sowie dynamischem Button inklusive sichtbarer Darstellung und Reload. Reale HA-/KNX-/PC-/Tablet-Startprobleme bleiben offen. Keine Wiederholung abgeschlossener Grundlagen – beim nächsten Chat zuerst die tatsächlichen Live-Befunde prüfen.

**Neue Funktionen (23.10.2026):** Globale Einstellungen über Zahnrad rechts oben, Seitenverwaltung inklusive Papierkorb und endgültiger Löschung, dynamische Gleichverteilung/Wischslider der Navigation. Kalender, Hausstatus und Buttons lassen sich auch zunächst ohne Quellen platzieren; Daten anschließend pro Widget konfigurieren. Browser-/Unit-Prüfungen des vollständigen Ablaufs: [39944803466](https://github.com/MarkusAureliusTeuton/JamesUINext/actions/runs/39944803466). Release-Version und aktueller HEAD bei Beginn des Folgedialogs frisch prüfen.

**Veröffentlicht (23.10.2026):** [HACS-Testversion v1.0.0b4](https://github.com/MarkusAureliusTeuton/JamesUINext/releases/tag/v1.0.0b4), CI inklusive realem Chromium [39945299089](https://github.com/MarkusAureliusTeuton/JamesUINext/actions/runs/39945299089) vollständig erfolgreich. Dynamische Navigation und globales Seitenmenü einschließlich Papierkorb sind implementiert; zunächst unkonfigurierte Agenda-, Haus- und Buttonwidgets können hinzugefügt und gespeichert werden. Weiterhin nur kontrollierter Realgeräte-Test, keine Produktivabnahme.
