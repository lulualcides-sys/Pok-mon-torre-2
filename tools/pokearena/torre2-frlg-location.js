/* Original FireRed/LeafGreen town and route art as native 16px Phaser
 * GameObjects. A source sprite sheet can include adjacent interiors: crop
 * ONLY the world-map section before camera/pointer coordinates are computed.
 */
export const FRLG_LOCALE_NAMES=Object.freeze([
 'pallet','route1','viridian','route2','forest','pewter',
 'route3','mtmoon','route4','cerulean','route24','route25',
 'vermilion','ssanne','lavender','pokemontower',
 'celadon','rockethideout','fuchsia','safari','saffron','silph',
 'seafoam','cinnabar','victory','indigo','powerplant','rocketwarehouse'
]);
export const TILE_VIEW=Object.freeze({
 pallet:{cx:190,cy:181},
 route1:{cx:192,cy:315},
 viridian:{cx:472,cy:375},
 route2:{cx:195,cy:550},
 forest:{cx:395,cy:525},
 pewter:{cx:320,cy:298},
 route3:{cx:415,cy:180},
 mtmoon:{cx:312,cy:293},
 route4:{cx:345,cy:177},
 cerulean:{cx:400,cy:315},
 route24:{cx:197,cy:190},
 route25:{cx:425,cy:170},
 vermilion:{cx:395,cy:317},
 ssanne:{cx:252,cy:180},
 lavender:{cx:197,cy:153},
 pokemontower:{cx:197,cy:170},
 celadon:{cx:497,cy:365},
 rockethideout:{cx:247,cy:250},
 fuchsia:{cx:425,cy:335},
 safari:{cx:329,cy:230},
 saffron:{cx:437,cy:388},
 silph:{cx:252,cy:172},
 seafoam:{cx:305,cy:185},
 cinnabar:{cx:220,cy:164},
 victory:{cx:312,cy:194},
 indigo:{cx:200,cy:165},
 powerplant:{cx:360,cy:330},
 rocketwarehouse:{cx:245,cy:160}
});
const COMPOSITE_MAIN=Object.freeze({
 pallet:[384,320],route1:[400,640],viridian:[768,640],
 route2:[384,1256],forest:[864,1104],pewter:[768,640],
 route3:[1344,320],mtmoon:[674,560],route4:[1728,320],
 cerulean:[768,640],route24:[384,448],route25:[1140,320],
 vermilion:[768,640],ssanne:[1128,520],
 lavender:[384,320],pokemontower:[384,320],
 celadon:[840,560],rockethideout:[444,680],
 fuchsia:[768,640],safari:[648,460],
 saffron:[840,728],silph:[480,300],
 seafoam:[616,384],cinnabar:[384,320],
 victory:[768,360],indigo:[384,320],
 powerplant:[768,640],rocketwarehouse:[450,400]
});
export function locationForCampaign(region){
 if(!region)return null;
 const stage=Number(region.stage),p=Number(region.chapterPage??region.page??0);
 if(stage===0)return ['pallet','route1','viridian','forest','pewter'][Math.min(4,p)]||null;
 if(stage===1)return ['route3','mtmoon','route4','cerulean'][Math.min(3,p)]||null;
 if(stage===2)return ['route24',null,'ssanne','vermilion'][Math.min(3,p)]||null;
 if(stage===3)return [null,null,'pokemontower','celadon'][Math.min(3,p)]||null;
 if(stage===4)return ['rockethideout',null,null,'safari','fuchsia'][Math.min(4,p)]||null;
 if(stage===5)return [null,'saffron','silph','silph','saffron'][Math.min(4,p)]||null;
 if(stage===6)return [null,'seafoam',null,'cinnabar','cinnabar','cinnabar'][Math.min(5,p)]||null;
 if(stage===7)return ['pallet','viridian','viridian','viridian'][Math.min(3,p)]||null;
 if(stage===8)return ['victory','victory','indigo','indigo'][Math.min(3,p)]||null;
 if(stage>=9&&stage<=12)return 'indigo';
 return null;
}
// A full map-image sheet may include panels for Center, Mart, Gym etc.
// Select only its primary world section; tall background tiles are not an
// interior and must not be accidentally treated as an entrance.
export function getSourceMainBounds(id,sourceWidth,sourceHeight){
 const [expectedW,expectedH]=COMPOSITE_MAIN[id]||
  [sourceWidth,sourceHeight];
 const composite=sourceWidth>=expectedW+40&&sourceHeight>=expectedH;
 const marginX=composite?8:0,marginY=composite?24:0;
 return {x:marginX,y:marginY,
  w:Math.min(expectedW,sourceWidth-marginX),
  h:Math.min(expectedH,sourceHeight-marginY),
  composite};
}
export function getLocationViewport(id,sourceWidth,sourceHeight){
 if(!id||sourceWidth<176||sourceHeight<176)return null;
 const main=getSourceMainBounds(id,sourceWidth,sourceHeight);
 const size=16,cols=Math.min(23,Math.floor(main.w/size)),
  rows=Math.min(11,Math.floor(main.h/size));
 const left=21+Math.floor((23-cols)*size/2),
  top=90+Math.floor((11-rows)*size/2);
 const center=TILE_VIEW[id]||{cx:main.w/2,cy:main.h/2};
 const maxX=Math.max(0,main.w-cols*size);
 const maxY=Math.max(0,main.h-rows*size);
 const x0=main.x+Math.floor(Math.max(0,
  Math.min(maxX,center.cx-cols*size/2))/size)*size;
 const y0=main.y+Math.floor(Math.max(0,
  Math.min(maxY,center.cy-rows*size/2))/size)*size;
 return {id,main,cols,rows,size,left,top,x0,y0,
  sourceWidth,sourceHeight};
}
export function renderLocationTiles(scene,region){
 scene.__torre2FRLGView=null;
 const id=locationForCampaign(region),key=id&&'frlg-location-'+id;
 if(!key||!scene.textures.exists(key))return false;
 const texture=scene.textures.get(key),source=texture.source?.[0];
 if(!source)return false;
 const view=getLocationViewport(id,source.width,source.height);
 if(!view)return false;
 scene.__torre2FRLGView=view;
 if(typeof Phaser!=='undefined')
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 for(let row=0;row<view.rows;row++)for(let col=0;col<view.cols;col++){
  const sx=view.x0+col*view.size,sy=view.y0+row*view.size;
  if(sx+view.size>source.width||sy+view.size>source.height)continue;
  const name='frlg_'+sx+'_'+sy;
  if(!texture.has(name))texture.add(name,0,sx,sy,view.size,view.size);
  scene.add.image(view.left+col*view.size,
   view.top+row*view.size,key,name)
   .setOrigin(0,0).setDepth(1.35);
 }
 const border=scene.add.graphics().setDepth(1.49);
 border.lineStyle(2,0xc7e8bb);
 border.strokeRect(view.left-1,view.top-1,
  view.cols*view.size+2,view.rows*view.size+2);
 return true;
}
