/* Data-driven interactions on the ACTUAL FireRed locality map.
 * Normalized world coordinates stay anchored to buildings as the camera
 * changes. No artificial PC/MART buildings, drawn roads or fullscreen hits.
 * Browser mouse: highlight on hover. Mobile: tap the building to enter.
 */
export const KANTO_INTERACTIONS=Object.freeze({
 pallet:[
  ['house','SUA CASA',.33,.31,.13,.14,'Casa do Red'],
  ['rival','CASA DO RIVAL',.70,.31,.13,.14,'Casa do rival'],
  ['lab','LAB. PROF. OAK',.71,.69,.17,.18,'Laboratório do Professor Oak']
 ],
 viridian:[
  ['gym','GINÁSIO VIRIDIAN',.77,.24,.20,.17,'Ginásio de Giovanni'],
  ['school','ACADEMIA POKÉMON',.56,.24,.16,.13,'Academia Pokémon'],
  ['center','CENTRO POKÉMON',.56,.64,.15,.15,'Curar Pokémon e acessar o PC'],
  ['mart','POKÉ MART',.78,.46,.14,.14,'Comprar Pokébolas, poções e TMs']
 ],
 pewter:[
  ['museum','MUSEU DE PEWTER',.37,.13,.33,.17,'Museu de ciência'],
  ['gym','GINÁSIO DO BROCK',.34,.41,.25,.17,'Líder Brock'],
  ['center','CENTRO POKÉMON',.38,.65,.15,.14,'Curar Pokémon'],
  ['mart','POKÉ MART',.59,.47,.14,.14,'Comprar itens']
 ],
 cerulean:[
  ['center','CENTRO POKÉMON',.47,.49,.14,.14,'Curar Pokémon'],
  ['mart','POKÉ MART',.66,.52,.15,.14,'Comprar itens'],
  ['gym','GINÁSIO DA MISTY',.59,.73,.18,.14,'Líder Misty'],
  ['bike','LOJA DE BICICLETAS',.32,.73,.17,.17,'Loja de bicicletas']
 ],
 vermilion:[
  ['center','CENTRO POKÉMON',.33,.17,.15,.12,'Curar Pokémon'],
  ['mart','POKÉ MART',.63,.43,.12,.11,'Comprar itens'],
  ['gym','GINÁSIO LT. SURGE',.31,.64,.20,.15,'Líder Lt. Surge'],
  ['harbor','PORTO / S.S. ANNE',.78,.77,.18,.14,'S.S. Anne']
 ],
 lavender:[
  ['center','CENTRO POKÉMON',.27,.17,.22,.19,'Curar Pokémon'],
  ['mart','POKÉ MART',.86,.76,.17,.15,'Comprar itens'],
  ['tower','TORRE POKÉMON',.78,.18,.28,.28,'Torre Pokémon · vários andares'],
  ['fuji','CASA DO MR. FUJI',.30,.81,.35,.16,'Casa do Mr. Fuji']
 ],
 celadon:[
  ['department','DEPARTMENT STORE',.23,.25,.22,.31,'Loja de departamentos'],
  ['center','CENTRO POKÉMON',.82,.25,.12,.13,'Curar Pokémon'],
  ['rocket','GAME CORNER / ROCKET',.60,.51,.22,.19,'Esconderijo da Equipe Rocket'],
  ['gym','GINÁSIO DA ERIKA',.77,.76,.18,.14,'Líder Erika']
 ],
 fuchsia:[
  ['safari','SAFARI ZONE',.56,.13,.18,.16,'Entrada da Safari Zone'],
  ['mart','POKÉ MART',.23,.38,.14,.11,'Comprar itens'],
  ['gym','GINÁSIO DO KOGA',.60,.20,.14,.15,'Líder Koga'],
  ['center','CENTRO POKÉMON',.56,.80,.12,.13,'Curar Pokémon']
 ],
 cinnabar:[
  ['gym','GINÁSIO DO BLAINE',.33,.27,.22,.16,'Líder Blaine'],
  ['lab','LABORATÓRIO',.39,.48,.26,.18,'Laboratório da Ilha Cinnabar'],
  ['center','CENTRO POKÉMON',.62,.69,.20,.18,'Curar Pokémon'],
  ['mart','POKÉ MART',.83,.69,.16,.18,'Comprar itens']
 ],
 route2:[
  ['gate','PORTÃO DA ROTA 2',.25,.20,.31,.12,'Passagem para a Floresta de Viridian'],
  ['house','CASA DA ROTA 2',.70,.31,.23,.12,'Casa na Rota 2']
 ],
 route25:[
  ['bill','CASA DO BILL',.71,.27,.19,.22,'Visitar a casa de Bill']
 ],
 pokemontower:[
  ['tower','TORRE POKÉMON',.50,.48,.63,.72,'Explorar os andares da Torre Pokémon']
 ],
 ssanne:[
  ['harbor','S.S. ANNE',.55,.52,.40,.38,'Explorar o navio S.S. Anne']
 ],
 indigo:[
  ['league','LIGA POKÉMON',.51,.26,.44,.40,'Entrar na Liga Pokémon']
 ],
 powerplant:[
  ['powerplant','USINA ELÉTRICA',.50,.53,.62,.62,'Explorar a usina elétrica']
 ],
 seafoam:[
  ['cave','ILHAS SEAFOAM',.50,.50,.62,.65,'Explorar a caverna gelada']
 ],
 rockethideout:[
  ['rocket','ESCONDERIJO ROCKET',.51,.50,.55,.63,'Explorar os pisos do esconderijo']
 ],
 silph:[
  ['silph','SILPH CO.',.52,.48,.58,.65,'Explorar os andares da Silph Co.']
 ],
 saffron:[
  ['silph','SILPH CO.',.55,.48,.23,.25,'Prédio Silph Co.'],
  ['center','CENTRO POKÉMON',.46,.71,.13,.11,'Curar Pokémon'],
  ['gym','GINÁSIO DA SABRINA',.81,.20,.12,.15,'Líder Sabrina'],
  ['dojo','DOJO DE LUTA',.76,.19,.15,.12,'Dojo de luta']
 ]
});
export function buildingInteractions(id){
 return (KANTO_INTERACTIONS[id]||[]).map(
  ([kind,title,cx,cy,w,h,description])=>({
   id:kind,title,cx,cy,w,h,description
  }));
}
export function visibleBuildingInteractions(view){
 if(!view?.id)return [];
 const {main,x0,y0,cols,rows,left,top,size}=view;
 const maxX=x0+cols*size,maxY=y0+rows*size;
 return buildingInteractions(view.id).flatMap(h=>{
  const wx=main.x+h.cx*main.w,wy=main.y+h.cy*main.h;
  const ww=Math.max(16,h.w*main.w),wh=Math.max(16,h.h*main.h);
  const x=wx-ww/2,y=wy-wh/2;
  if(wx<x0||wx>maxX||wy<y0||wy>maxY)return [];
  const startX=Math.max(x0,x),startY=Math.max(y0,y);
  const endX=Math.min(maxX,x+ww),endY=Math.min(maxY,y+wh);
  if(endX<=startX||endY<=startY)return [];
  const xx=left+(startX-x0),yy=top+(startY-y0);
  return [{...h,x:Math.round(xx),y:Math.round(yy),
   width:Math.max(20,Math.round(endX-startX)),
   height:Math.max(20,Math.round(endY-startY))}];
 });
}
export function attachBuildingInteractions(scene,view,onEnter){
 const hotspots=visibleBuildingInteractions(view);
 if(!hotspots.length)return [];
 const paint=scene.add.graphics().setDepth(18);
 const tooltip=scene.add.text(27,76,'',{
  fontFamily:'Pixelify Sans,monospace',fontSize:'11px',
  fontStyle:'bold',color:'#ffefaf',stroke:'#061b28',
  strokeThickness:3}).setDepth(19).setVisible(false);
 const shortNames={center:'CENTRO',mart:'LOJA',department:'LOJA',gym:'GINÁSIO',
  house:'CASA',rival:'RIVAL',lab:'LAB. OAK',school:'ESCOLA',museum:'MUSEU',
  bike:'BIKES',fuji:'MR. FUJI',dojo:'DOJO',safari:'SAFARI',
  silph:'SILPH',tower:'TORRE',rocket:'ROCKET',harbor:'PORTO',
  league:'LIGA',bill:'CASA DO BILL'};
 // Placas sobre os prédios reais. Não redesenhar casas nem tapar a fachada.
 for(const h of hotspots){
  const label=shortNames[h.id];
  if(!label)continue;
  const yy=Math.max(96,h.y-12);
  const w=Math.min(88,Math.max(39,label.length*5+13));
  const xx=Math.max(21+w/2,Math.min(389-w/2,h.x+h.width/2));
  const tag=scene.add.graphics().setDepth(16);
  tag.fillStyle(0x0c2a3c,.91);
  tag.fillRect(xx-w/2,yy-8,w,13);
  tag.lineStyle(1,0xffd47e,.88);
  tag.strokeRect(xx-w/2,yy-8,w,13);
  scene.add.text(xx,yy-6,label,{
   fontFamily:'Pixelify Sans,monospace',fontSize:'8px',
   color:'#fff4d4',fontStyle:'bold',stroke:'#0a2632',strokeThickness:1
  }).setOrigin(.5,0).setDepth(17);
 }
 const highlight=h=>{
  paint.clear();tooltip.setVisible(!!h);
  if(!h)return;
  // Highlight only the actual building being hovered/touched; never
  // obscure its sprite with a large overlay.
  paint.lineStyle(2,0xffda6c,.95);
  paint.strokeRect(h.x-2,h.y-2,h.width+4,h.height+4);
  paint.lineStyle(1,0xfff8c8,.95);
  paint.strokeRect(h.x-4,h.y-4,h.width+8,h.height+8);
  tooltip.setText('ENTRAR: '+h.title);
 };
 return hotspots.map(h=>{
  const zone=scene.add.zone(h.x+h.width/2,h.y+h.height/2,
   Math.max(h.width,26),Math.max(h.height,26))
   .setInteractive({useHandCursor:true}).setDepth(9)
   .setData('frlg-building',h.id);
  zone.on('pointerover',()=>highlight(h));
  zone.on('pointerout',()=>highlight(null));
  zone.on('pointermove',()=>highlight(h));
  zone.on('pointerdown',()=>{
   highlight(h);
   onEnter(h);
  });
  return zone;
 });
}
