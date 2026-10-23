// Versioned dashboard pages stay inside the existing Next configuration.
// Trashing is reversible; no widget, layout or provider data is removed until
// an explicitly confirmed permanent deletion.
const BASE_LABELS = Object.freeze({home:"Start",house:"Haus",climate:"Klima",media:"Medien",door:"Tür"});
export function activeDashboardPages(config) {
  return Object.entries(config?.pages ?? {})
    .filter(([,p]) => p?.kind === "dashboard" && p.trashed !== true)
    .map(([id,p],idx) => ({
      id, label: p.title || BASE_LABELS[id] || id,
      order: Number.isFinite(p.order) ? p.order : idx,
    }))
    .sort((a,b) => a.order-b.order || a.id.localeCompare(b.id))
    .map(({id,label}) => ({id,label}));
}
function slug(label) {
  return String(label).normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50);
}
export function createDashboardPage(config, {title, layoutKind="fullscreen"}={}) {
  if (typeof title !== "string" || !title.trim()) throw new TypeError("Bitte einen Seitennamen eingeben");
  if (!["fullscreen","hero-deck"].includes(layoutKind)) throw new TypeError("Ungültiges Seitenlayout");
  const pages = config.pages ?? {};
  const base = slug(title) || "seite";
  let id = base, n = 2;
  while (id in pages || id === "home") id = base+"-"+n++;
  const layoutId = "page-layout-"+id;
  const page = {kind:"dashboard",layout_id:layoutId,title:title.trim().slice(0,72),elements:[],
    order:Math.max(0,...Object.values(pages).map(p=>Number.isFinite(p.order)?p.order:0))+1};
  if (layoutKind==="hero-deck") {
    const heroId=config.pages?.home?.hero_widget_id;
    if (!heroId || !config.widget_instances?.[heroId])
      throw new Error("Wetter-Hero ist noch nicht konfiguriert");
    page.hero_widget_id=heroId;
  }
  return {...config,pages:{...pages,[id]:page},layouts:{...config.layouts,
    [layoutId]:{kind:layoutKind,scroll:"fixed",...(layoutKind==="hero-deck"?{hero_ratio:0.42}:{})}}};
}
export function trashDashboardPage(config,id) {
  if (id==="home") throw new Error("Die Startseite kann nicht entfernt werden");
  if (!config.pages?.[id] || config.pages[id].trashed) throw new Error("Seite nicht gefunden");
  return {...config,pages:{...config.pages,[id]:{...config.pages[id],trashed:true}}};
}
export function restoreDashboardPage(config,id) {
  const page=config.pages?.[id];
  if (!page || page.trashed!==true) throw new Error("Seite nicht im Papierkorb");
  const {trashed,...active}=page;
  return {...config,pages:{...config.pages,[id]:active}};
}
export function permanentlyDeleteDashboardPage(config,id) {
  if(id==="home") throw new Error("Die Startseite kann nicht gelöscht werden");
  const page=config.pages?.[id];
  if(!page || page.trashed!==true) throw new Error("Zuerst in den Papierkorb verschieben");
  const pages={...config.pages};
  delete pages[id];
  const layouts={...config.layouts};
  if (!Object.values(pages).some(p=>p.layout_id===page.layout_id)) delete layouts[page.layout_id];
  const instances={...config.widget_instances};
  const used=new Set(Object.values(pages).flatMap(p=>[
    p.hero_widget_id,...(p.elements??[]).filter(x=>x.kind==="widget").map(x=>x.ref_id)
  ]));
  for(const item of page.elements??[]) {
    if(item.kind==="widget" && !used.has(item.ref_id)) delete instances[item.ref_id];
  }
  return {...config,pages,layouts,widget_instances:instances};
}
