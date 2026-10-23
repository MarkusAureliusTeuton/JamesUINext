import {activeDashboardPages,createDashboardPage,trashDashboardPage,
  restoreDashboardPage,permanentlyDeleteDashboardPage} from "./page-management.js";

// Global settings are kept outside page contents and survive route changes.
export function createPageSettingsPanel({document,configService,onNavigate}={}) {
  if(!document?.createElement || !configService?.update || !configService?.snapshot)
    throw new TypeError("Page settings require document and configuration storage");
  const root=document.createElement("section");
  root.setAttribute("data-jui-global-settings","");
  root.setAttribute("role","dialog");
  root.setAttribute("aria-label","JamesUI Einstellungen");
  root.hidden=true;
  const css=document.createElement("style");
  css.textContent=`
[data-jui-global-settings][hidden]{display:none!important}
[data-jui-global-settings]{position:absolute;inset:0;z-index:65;display:grid;
 place-items:center;padding:20px;background:rgba(0,0,0,.7);
 color:var(--jui-color-text-primary,#fff);font:inherit}
[data-jui-global-settings-card]{width:min(680px,100%);max-height:95%;overflow-y:auto;
 background:rgba(24,26,29,.99);border:1px solid var(--jui-color-border-strong,#48413c);
 border-radius:20px;padding:clamp(16px,3vw,30px);box-shadow:0 16px 50px #0009}
[data-jui-global-settings] h2{font-size:clamp(23px,2vw,29px);margin:0 0 4px}
[data-jui-global-settings] h3{font-size:19px;margin:24px 0 12px}
[data-jui-global-settings] p{line-height:1.5;color:var(--jui-color-text-secondary,#aaa)}
[data-jui-global-settings] button,[data-jui-global-settings] input,
[data-jui-global-settings] select{min-height:46px;border-radius:11px;
 border:1px solid var(--jui-color-border-strong,#514d49);padding:10px 14px;
 font:inherit;font-size:15px;color:inherit;background:#2c2a29}
[data-jui-global-settings] button{cursor:pointer}
[data-jui-global-settings] button:disabled{opacity:.45;cursor:default}
[data-jui-global-settings] input{width:100%;min-width:0}
[data-jui-global-settings-controls]{display:grid;grid-template-columns:minmax(0,1fr) 145px auto;gap:8px}
[data-jui-page-row]{display:flex;align-items:center;justify-content:space-between;
 gap:10px;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid #ffffff18}
[data-jui-page-row] strong{font-size:16px}
[data-jui-page-row] [data-jui-page-actions]{display:flex;flex-wrap:wrap;gap:7px}
[data-jui-settings-error]:not(:empty){color:#f5abab;padding:12px;background:#4c2222}
@media(max-width:650px){[data-jui-global-settings]{padding:8px}
 [data-jui-global-settings-controls]{grid-template-columns:1fr}
 [data-jui-page-row]{align-items:flex-start}
}
`;
  root.appendChild(css);
  const card=document.createElement("div");
  card.setAttribute("data-jui-global-settings-card","");
  const top=document.createElement("div");
  top.style.display="flex";top.style.justifyContent="space-between";
  top.style.alignItems="center";top.style.gap="12px";
  const title=document.createElement("h2");title.textContent="Einstellungen";
  const close=document.createElement("button");close.type="button";close.textContent="Schließen";
  close.setAttribute("data-jui-settings-close","");
  close.addEventListener("click",()=>{root.hidden=true;});
  top.appendChild(title);top.appendChild(close);card.appendChild(top);
  const subtitle=document.createElement("p");
  subtitle.textContent="Hier verwaltest du die Seiten deiner JamesUI. Weitere globale Einstellungen folgen.";
  card.appendChild(subtitle);
  const section=document.createElement("h3");section.textContent="Seiten";
  card.appendChild(section);
  const rows=document.createElement("div");rows.setAttribute("data-jui-settings-pages","");
  card.appendChild(rows);
  const section2=document.createElement("h3");section2.textContent="Neue Seite anlegen";
  card.appendChild(section2);
  const controls=document.createElement("div");
  controls.setAttribute("data-jui-global-settings-controls","");
  const input=document.createElement("input");input.type="text";input.maxLength=72;
  input.placeholder="Seitenname, z. B. Beleuchtung";input.setAttribute("aria-label","Neue Seite");
  const layout=document.createElement("select");layout.setAttribute("aria-label","Seitenlayout");
  for(const [value,label] of [["fullscreen","Normale Seite"],["hero-deck","Mit Wetterbild"]]){
    const opt=document.createElement("option");opt.value=value;opt.textContent=label;layout.appendChild(opt);
  }
  const add=document.createElement("button");add.type="button";add.textContent="Seite anlegen";
  add.setAttribute("data-jui-page-create","");
  controls.appendChild(input);controls.appendChild(layout);controls.appendChild(add);
  card.appendChild(controls);
  const trashTitle=document.createElement("h3");trashTitle.textContent="Papierkorb";
  card.appendChild(trashTitle);
  const trashRows=document.createElement("div");trashRows.setAttribute("data-jui-page-trash","");
  card.appendChild(trashRows);
  const error=document.createElement("p");error.setAttribute("role","alert");
  error.setAttribute("data-jui-settings-error","");
  card.appendChild(error);root.appendChild(card);
  let busy=false, confirmId=null;
  function actionButton(label,attr,fn){
    const button=document.createElement("button");button.type="button";
    button.textContent=label;button.setAttribute(attr,"");
    button.addEventListener("click",fn);return button;
  }
  async function mutate(make){
    if(busy)return;
    busy=true;error.textContent="";add.disabled=true;
    try{
      const next=await configService.update(make);
      if(next===null)throw new Error("Speichern fehlgeschlagen");
      render();
    }catch(e){error.textContent=String(e?.message??e);}
    finally{busy=false;add.disabled=false;}
  }
  function render(){
    const config=configService.snapshot();
    rows.replaceChildren();trashRows.replaceChildren();
    for(const page of activeDashboardPages(config)){
      const row=document.createElement("div");row.setAttribute("data-jui-page-row",page.id);
      const label=document.createElement("strong");label.textContent=page.label;
      const actions=document.createElement("div");actions.setAttribute("data-jui-page-actions","");
      actions.appendChild(actionButton("Öffnen","data-jui-page-open",()=>{
        root.hidden=true;onNavigate?.(page.id);
      }));
      if(page.id!=="home"){
        actions.appendChild(actionButton("Papierkorb","data-jui-page-trash-action",
          ()=>mutate(config=>trashDashboardPage(config,page.id))));
      }
      row.appendChild(label);row.appendChild(actions);rows.appendChild(row);
    }
    const discarded=Object.entries(config?.pages??{}).filter(([,p])=>p?.trashed===true);
    if(!discarded.length){const empty=document.createElement("p");empty.textContent="Papierkorb ist leer.";trashRows.appendChild(empty);}
    for(const [id,page] of discarded){
      const row=document.createElement("div");row.setAttribute("data-jui-page-row",id);
      const label=document.createElement("strong");label.textContent=page.title??id;
      const actions=document.createElement("div");actions.setAttribute("data-jui-page-actions","");
      actions.appendChild(actionButton("Wiederherstellen","data-jui-page-restore-action",()=>{
        confirmId=null;mutate(config=>restoreDashboardPage(config,id));
      }));
      actions.appendChild(actionButton(confirmId===id?"Löschen bestätigen":"Endgültig löschen",
        "data-jui-page-delete-action",()=>{
          if(confirmId!==id){confirmId=id;render();return;}
          confirmId=null;mutate(config=>permanentlyDeleteDashboardPage(config,id));
        }));
      row.appendChild(label);row.appendChild(actions);trashRows.appendChild(row);
    }
  }
  add.addEventListener("click",async()=>{
    const title=input.value.trim(),kind=layout.value;
    await mutate(config=>createDashboardPage(config,{title,layoutKind:kind}));
    if(!error.textContent)input.value="";
  });
  return Object.freeze({
    root,
    open(){confirmId=null;error.textContent="";render();root.hidden=false;},
    close(){root.hidden=true;},
    refresh(){if(!root.hidden)render();},
    destroy(){root.remove();}
  });
}
