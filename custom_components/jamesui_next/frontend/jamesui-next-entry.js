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
    }
    set hass(value) {
      this.hassValue = value;
      if (this.instance) this.instance.core.hass = value;
    }
    connectedCallback() {
      const generation = ++this.generation;
      const host = document.createElement("div");
      host.style.minHeight = "100dvh";
      this.shadowRoot.replaceChildren(host);
      import("./jamesui-next-preview.js").then(async ({ createJamesUINextPreview }) => {
        if (generation !== this.generation) return;
        const instance = createJamesUINextPreview({ document });
        this.instance = instance;
        if (this.hassValue) instance.core.hass = this.hassValue;
        try {
          await instance.mount(host);
        } catch (error) {
          if (generation !== this.generation) return;
          instance.destroy();
          this.instance = null;
          host.textContent = "JamesUI Next: " + String(error?.message || "Start fehlgeschlagen");
        }
      }).catch(() => {
        if (generation === this.generation) host.textContent = "JamesUI Next konnte nicht geladen werden";
      });
    }
    disconnectedCallback() {
      this.generation += 1;
      this.instance?.destroy();
      this.instance = null;
    }
  }
  customElements.define(tag, NextPanel);
})();
