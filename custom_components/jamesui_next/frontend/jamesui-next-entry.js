(() => {
  const tag = "jamesui-next-panel";
  if (customElements.get(tag)) return;

  class NextPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.instance = null;
      this.hassValue = null;
      this.generation = 0;
      this.host = null;
      this.starting = false;
      this.started = false;
      this.startTimeout = null;
    }

    set hass(value) {
      this.hassValue = value;
      if (this.instance) this.instance.core.hass = value;
      // The HA panel may be attached before its first hass assignment.
      if (value && this.isConnected) void this.start();
    }

    async start() {
      if (!this.hassValue || !this.isConnected || !this.host || this.starting || this.started) return;
      const token = this.generation;
      this.starting = true;
      try {
        const { createJamesUINextPreview } = await import("/jamesui_next_static/jamesui-next-preview.js");
        if (token !== this.generation || !this.isConnected) return;
        const instance = createJamesUINextPreview({ document });
        this.instance = instance;
        instance.core.hass = this.hassValue;
        const status = document.createElement("p");
        status.textContent = "JamesUI Next: Dashboard wird geladen …";
        status.setAttribute("role", "status");
        this.host.replaceChildren(status);
        // Network/WS stalls must not leave users staring at a blank panel.
        let pending = instance.mount(this.host);
        if (typeof setTimeout === "function") {
          const deadline = new Promise((_, reject) => {
            this.startTimeout = setTimeout(
              () => reject(new Error("Zeitüberschreitung beim Dashboard-Start. Bitte Home-Assistant-Protokoll prüfen.")),
              15000,
            );
          });
          pending = Promise.race([pending, deadline]);
        }
        await pending;
        if (this.startTimeout !== null && typeof clearTimeout === "function") {
          clearTimeout(this.startTimeout);
          this.startTimeout = null;
        }
        status.remove?.();
        if (token !== this.generation || !this.isConnected) {
          instance.destroy();
          return;
        }
        this.started = true;
      } catch (error) {
        if (token !== this.generation || !this.isConnected) return;
        if (this.startTimeout !== null && typeof clearTimeout === "function") {
          clearTimeout(this.startTimeout);
          this.startTimeout = null;
        }
        try { this.instance?.destroy(); } catch { /* preserve diagnostic UI */ }
        this.instance = null;
        console.error("[JamesUINext] Start fehlgeschlagen", error);
        if (this.host) {
          this.host.replaceChildren();
          const errorSurface = document.createElement("div");
          errorSurface.setAttribute("role", "alert");
          errorSurface.setAttribute("data-jui-startup-error", "");
          errorSurface.style.padding = "24px";
          errorSurface.style.border = "1px solid #c98989";
          errorSurface.style.borderRadius = "12px";
          errorSurface.style.background = "#221b1c";
          errorSurface.style.color = "#ffffff";
          errorSurface.textContent = "JamesUI Next konnte nicht gestartet werden: "
            + String(error?.message || "Unbekannter Fehler");
          this.host.appendChild(errorSurface);
        }
      } finally {
        if (token === this.generation) this.starting = false;
      }
    }

    connectedCallback() {
      ++this.generation;
      this.started = false;
      this.starting = false;
      this.host = document.createElement("div");
      this.host.style.minHeight = "100dvh";
      this.host.style.display = "block";
      this.host.style.background = "#070809";
      this.host.style.color = "#f2eee7";
      this.host.style.fontFamily = "system-ui, sans-serif";
      this.host.style.fontSize = "16px";
      this.host.style.lineHeight = "1.4";
      this.shadowRoot.replaceChildren(this.host);
      const status = document.createElement("p");
      status.setAttribute("role", "status");
      status.style.padding = "24px";
      status.textContent = "JamesUI Next wartet auf Home Assistant …";
      this.host.appendChild(status);
      void this.start();
    }

    disconnectedCallback() {
      ++this.generation;
      if (this.startTimeout !== null && typeof clearTimeout === "function") {
        clearTimeout(this.startTimeout);
        this.startTimeout = null;
      }
      this.instance?.destroy();
      this.instance = null;
      this.host = null;
      this.starting = false;
      this.started = false;
    }
  }

  customElements.define(tag, NextPanel);
})();
