# JamesUINext

Eigenständige, modulare JamesUI-1.0-Integration für Home Assistant. Sie läuft **parallel** zur bisherigen Integration `jamesui`, ohne deren Dateien, Panelpfad oder Konfigurationsspeicher zu überschreiben.

## Entwicklungsstand

Die modulare Basis umfasst Core, Designsystem, Wetter, Kalender, Hausstatus, Dynamic Buttons, Dashboard und Editor. Die Komponenten sind noch **nicht vollständig integriert und nicht zur Tablet-Abnahme freigegeben**. Es fehlen insbesondere Hintergrundbilder, vollständige Einstellungen sowie Live-/HA-Integrationstests. Freigabekriterien: [Dashboard 1.0 Release Gate](docs/DASHBOARD_1_0_RELEASE_GATE.md).

## Geplante Installation nach Dashboard-Freigabe

**Noch nicht installieren: Die folgenden Schritte sind erst für die freigegebene Dashboard-Version vorgesehen.**

1. In HACS das Repository `https://github.com/MarkusAureliusTeuton/JamesUINext` als **benutzerdefiniertes Repository** vom Typ **Integration** hinzufügen.
2. `JamesUI Next` über HACS herunterladen.
3. Home Assistant neu starten.
4. Unter **Einstellungen → Geräte & Dienste** die Integration **JamesUI Next** hinzufügen.
5. Das getrennte Dashboard über `/jamesui-next` öffnen (auf diesem Home Assistant z. B. `http://192.168.178.54/jamesui-next`).

Die r11-Installation unter `/jamesui` wird nicht verändert. Die Next-Integration nutzt `custom_components/jamesui_next`, den Bereich `/jamesui_next_static`, den Speicher `jamesui_next.config` und eigene WebSocket-Kommandos `jamesui_next/config/*`.

**Nicht für den Produktiveinsatz freigeben, bevor die vollständigen Integrationstests und die Tablet-Abnahme erfolgreich sind.**
