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
        await instance.mount(this.host);
        if (token !== this.generation || !this.isConnected) {
          instance.destroy();
          return;
        }
        this.started = true;
      } catch (error) {
        if (token !== this.generation || !this.isConnected) return;
        this.instance?.destroy();
        this.instance = null;
        if (this.host) this.host.textContent = "JamesUI Next: " + String(error?.message || "Start fehlgeschlagen");
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
      this.shadowRoot.replaceChildren(this.host);
      this.host.textContent = "JamesUI Next wartet auf Home Assistant …";
      void this.start();
    }

    disconnectedCallback() {
      ++this.generation;
      this.instance?.destroy();
      this.instance = null;
      this.host = null;
      this.starting = false;
      this.started = false;
    }
  }

  customElements.define(tag, NextPanel);
})();
