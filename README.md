# JamesUINext

Eigenständige, modulare JamesUI-1.0-Integration für Home Assistant. Sie läuft **parallel** zur bisherigen Integration `jamesui`, ohne deren Dateien, Panelpfad oder Konfigurationsspeicher zu überschreiben.

## Entwicklungsstand

Die neue Basis umfasst Core, Module, Designsystem, Wetter, Kalender, Hausstatus, Dynamic Buttons sowie Block-14-Dashboard und Layouteditor. Die Oberfläche ist weiterhin ein Entwicklungsstand. Die initiale Startseite ist absichtlich leer, bis Widget- und Button-Konfigurationen vollständig durchgängig unterstützt werden.

## Installation zum Testen

1. In HACS das Repository `https://github.com/MarkusAureliusTeuton/JamesUINext` als **benutzerdefiniertes Repository** vom Typ **Integration** hinzufügen.
2. `JamesUI Next` über HACS herunterladen.
3. Home Assistant neu starten.
4. Unter **Einstellungen → Geräte & Dienste** die Integration **JamesUI Next** hinzufügen.
5. Das getrennte Dashboard über `/jamesui-next` öffnen (auf diesem Home Assistant z. B. `http://192.168.178.54/jamesui-next`).

Die r11-Installation unter `/jamesui` wird nicht verändert. Die Next-Integration nutzt `custom_components/jamesui_next`, den Bereich `/jamesui_next_static`, den Speicher `jamesui_next.config` und eigene WebSocket-Kommandos `jamesui_next/config/*`.

**Nicht für den Produktiveinsatz freigeben, bevor die vollständigen Integrationstests und die Tablet-Abnahme erfolgreich sind.**
