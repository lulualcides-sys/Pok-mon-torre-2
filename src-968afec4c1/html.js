import{FUENTE_CSS}from"./config.js";import{tr}from"./idioma.js";const CSS=`
.pa-boton{position:relative;overflow:hidden;border:1px solid #04102c;border-radius:6px;cursor:pointer;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 -2px 0 rgba(0,0,0,.22),0 2px 0 #04102c;
  transition:filter .12s,box-shadow .12s,transform .08s;}
.pa-boton::after{content:'';position:absolute;top:0;bottom:0;left:-50%;width:35%;pointer-events:none;opacity:0;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.4),transparent);transform:skewX(-20deg);}
@media (hover:hover){
  .pa-boton:not(:disabled):hover{filter:brightness(1.15);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 -2px 0 rgba(0,0,0,.22),0 2px 0 #04102c,0 0 0 2px rgba(143,208,255,.6);}
  .pa-boton:not(:disabled):hover::after{animation:pa-barrido .45s ease-out;}
}
.pa-boton:not(:disabled):active{transform:translateY(1px);filter:brightness(1.3);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 1px 0 #04102c;}
.pa-boton:disabled{cursor:default;box-shadow:0 2px 0 #04102c;}
@keyframes pa-barrido{from{left:-50%;opacity:1}to{left:120%;opacity:1}}
.pa-campo{border-radius:6px;transition:box-shadow .12s;}
.pa-campo:focus{box-shadow:0 0 0 2px rgba(143,208,255,.6);}
@media (prefers-reduced-motion:reduce){.pa-boton,.pa-campo{transition:none}.pa-boton::after{animation:none!important}}
`;function estilosHtml(){if(document.getElementById("pa-estilos"))return;const s=document.createElement("style");s.id="pa-estilos";s.textContent=CSS;document.head.appendChild(s)}const COLORES={oro:"background:#f8c448;color:#0c1d44;border-color:#fff2a0;",azul:"background:#225697;color:#fff;",apagado:"background:#16305a;color:#8fb3e6;"};function botonHtml(rotulo,fn,{estilo="",tipo="button",tam=11,alto=40,color="azul",apagado=false}={}){estilosHtml();const b=document.createElement("button");b.type=tipo;b.textContent=tr(rotulo);b.disabled=apagado;b.className="pa-boton";b.style.cssText=`font:600 ${tam}px ${FUENTE_CSS};min-height:${alto}px;padding:0 ${Math.round(alto/4)}px;${COLORES[apagado?"apagado":color]??""}${estilo}`;if(fn&&!apagado)b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();fn(b)});return b}const panelHtml=(borde="#79c4f7",grosor=2)=>`background:#0f2246;border:${grosor}px solid ${borde};border-radius:8px;box-shadow:0 3px 0 #04102c;`;export{botonHtml,estilosHtml,panelHtml};
