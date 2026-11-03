/* T41: verified click targets placed on the four user-approved pixel-art scenes.
 * These are presentation coordinates, NOT battle/save progression checkpoints.
 * Backgrounds are 1280x720 and the renderer scales them uniformly.
 */
const v=(id,cx,cy,w,h)=>Object.freeze({id,cx,cy,w,h,validated:'visual'});
export const FIRST_APPROVED_HOTSPOTS=Object.freeze({
 'pewter-city':Object.freeze([
  v('center',.184,.385,.12,.14),
  v('mart',.183,.612,.12,.14),
  v('gym',.800,.288,.14,.15),
  v('route2',.460,.867,.16,.11),
  v('route3',.952,.453,.09,.14)
 ]),
 'gym-brock':Object.freeze([
  v('challenge',.502,.237,.19,.16),
  v('exit',.500,.921,.20,.11)
 ]),
 'cerulean-city':Object.freeze([
  v('center',.290,.369,.11,.14),
  v('mart',.495,.359,.10,.13),
  v('gym',.705,.355,.14,.16),
  v('route4',.057,.693,.10,.13),
  v('route24',.476,.072,.12,.12),
  v('route5',.505,.962,.14,.07),
  v('route9',.971,.500,.055,.16)
 ]),
 'gym-misty':Object.freeze([
  v('challenge',.505,.220,.20,.16),
  v('exit',.505,.918,.19,.13)
 ]),
 // Reviewed against the actual approved 1280×720 concept images.
 'vermilion-city':Object.freeze([
  v('center',.274,.300,.105,.110),
  v('mart',.654,.303,.105,.110),
  v('gym',.196,.686,.145,.120),
  v('ship',.598,.688,.160,.130),
  v('route6',.469,.085,.135,.145),
  v('route11',.946,.400,.095,.155)
 ]),
 'gym-surge':Object.freeze([
  v('challenge',.496,.227,.195,.160),
  v('exit',.501,.934,.170,.120)
 ]),
 // S.S. Anne: the only working exit leads to the painted VERMILION CITY door.
 // Captain/CUT, cabins and deck are NOT gameplay destinations yet. Never
 // grant HMs or invent battles from decorative text painted in the image.
 'ss-anne':Object.freeze([
  v('exit',.480,.910,.220,.120)
 ]),
 // Celadon 1280x720. Exact door/sign anchors, no scene repaint or zoom.
 'celadon-city':Object.freeze([
  v('center',.252,.526,.123,.120),
  v('mart',.500,.294,.142,.116),
  v('gym',.501,.825,.166,.126),
  v('game',.727,.318,.137,.125),
  v('route16',.070,.352,.119,.129),
  v('route7',.938,.353,.102,.130)
 ]),
 'gym-erika':Object.freeze([
  v('challenge',.503,.247,.182,.125),
  v('exit',.502,.946,.182,.100)
 ]),
 // Fuchsia: exactly the painted buildings/route signs, normalized from
 // the approved 1280x720 artwork. No movable overworld or forced HM.
 'fuchsia-city':Object.freeze([
  v('center',.501,.741,.133,.116),
  v('mart',.183,.311,.148,.128),
  v('gym',.197,.777,.147,.130),
  v('safari',.503,.144,.188,.120),
  v('route18',.058,.408,.106,.111),
  v('route15',.946,.405,.103,.111),
  v('route19',.500,.925,.147,.103)
 ]),
 'gym-koga':Object.freeze([
  v('challenge',.503,.236,.204,.140),
  v('exit',.501,.937,.175,.105)
 ])
});
export const FIRST_APPROVED_DESTINATIONS=Object.freeze({
 'pewter-city':Object.freeze({route2:'route-2',route3:'route-3',gym:'gym-brock'}),
 'gym-brock':Object.freeze({exit:'pewter-city'}),
 'cerulean-city':Object.freeze({route4:'route-4-east',route24:'route-24',
   route5:'route-5',route9:'routes-9-10',gym:'gym-misty'}),
 'gym-misty':Object.freeze({exit:'cerulean-city'}),
 'vermilion-city':Object.freeze({
  gym:'gym-surge',ship:'ss-anne',route6:'route-6',route11:'route-11'
 }),
 'gym-surge':Object.freeze({exit:'vermilion-city'}),
 'ss-anne':Object.freeze({exit:'vermilion-city'}),
 'celadon-city':Object.freeze({
  gym:'gym-erika',game:'rocket-hideout',
  route16:'routes-16-18',route7:'routes-7-8'
 }),
 'gym-erika':Object.freeze({exit:'celadon-city'}),
 'fuchsia-city':Object.freeze({
  gym:'gym-koga',safari:'safari-zone',
  route18:'routes-16-18',route15:'routes-12-15',
  route19:'routes-19-20'
 }),
 'gym-koga':Object.freeze({exit:'fuchsia-city'})
});
export function hasFirstApprovedHotspots(id){
 return Object.prototype.hasOwnProperty.call(FIRST_APPROVED_HOTSPOTS,id);
}
export function firstApprovedHotspots(entry){
 return FIRST_APPROVED_HOTSPOTS[entry?.id]||entry?.hotspots||[];
}
export function firstApprovedDestination(mapId,hotspotId){
 return FIRST_APPROVED_DESTINATIONS[mapId]?.[hotspotId]||null;
}

/* Native FireRed NPCs for the approved image-backed gym interiors.
 * Trainers REUSE the existing route/gym checkpoints for each stage.
 * They do not introduce a second save index or grant battle rewards.
 */
export const FIRST_APPROVED_GYM_LAYOUTS=Object.freeze({
 'gym-brock':Object.freeze({
  stage:0,leader:Object.freeze({kind:'brock',cx:.480,cy:.240}),
  ace:Object.freeze({dex:'0095',cx:.570,cy:.235}),
  trainers:Object.freeze([
   Object.freeze({kind:'hiker',cx:.27,cy:.54}),
   Object.freeze({kind:'youngster',cx:.73,cy:.54}),
   Object.freeze({kind:'hiker',cx:.50,cy:.72})
  ])
 }),
 'gym-misty':Object.freeze({
  stage:1,leader:Object.freeze({kind:'misty',cx:.470,cy:.230}),
  ace:Object.freeze({dex:'0121',cx:.570,cy:.225}),
  trainers:Object.freeze([
   Object.freeze({kind:'swimmer',cx:.27,cy:.465}),
   Object.freeze({kind:'lass',cx:.73,cy:.465}),
   Object.freeze({kind:'swimmer',cx:.27,cy:.695}),
   Object.freeze({kind:'lass',cx:.73,cy:.695})
  ])
 }),
 // The approved Surge image ALREADY contains leader, Pikachu and four NPCs.
 // Attach invisible Phaser actions over their positions, not duplicate them.
 'gym-surge':Object.freeze({
  stage:2,artworkOnly:true,
  leader:Object.freeze({kind:'surge',cx:.480,cy:.232}),
  ace:Object.freeze({dex:'0025',cx:.558,cy:.232}),
  trainers:Object.freeze([
   Object.freeze({kind:'youngster',cx:.169,cy:.394}),
   Object.freeze({kind:'rocker',cx:.841,cy:.395}),
   Object.freeze({kind:'lass',cx:.169,cy:.667}),
   Object.freeze({kind:'youngster',cx:.840,cy:.667})
  ])
 }),
 // Empty battle circles in the approved greenhouse: overlay real 16x32
 // FireRed sprites and reuse the last four saved battle checkpoints.
 'gym-erika':Object.freeze({
  stage:3,leader:Object.freeze({kind:'erika',cx:.493,cy:.248}),
  ace:Object.freeze({dex:'0045',cx:.592,cy:.245}),
  trainers:Object.freeze([
   Object.freeze({kind:'lass',cx:.174,cy:.350}),
   Object.freeze({kind:'bugcatcher',cx:.825,cy:.351}),
   Object.freeze({kind:'lass',cx:.153,cy:.718}),
   Object.freeze({kind:'bugcatcher',cx:.834,cy:.718})
  ])
 }),
 // Koga's four platforms have no painted trainer sprites: overlay original
 // 16x32 FireRed NPCs. They reuse the stage-4 route's saved battle indices.
 'gym-koga':Object.freeze({
  stage:4,leader:Object.freeze({kind:'koga',cx:.495,cy:.260}),
  ace:Object.freeze({dex:'0110',cx:.587,cy:.258}),
  trainers:Object.freeze([
   Object.freeze({kind:'biker',cx:.265,cy:.400}),
   Object.freeze({kind:'psychic',cx:.737,cy:.400}),
   Object.freeze({kind:'ace',cx:.267,cy:.763}),
   Object.freeze({kind:'biker',cx:.736,cy:.763})
  ])
 })
});
export function firstApprovedGymActors(id,total){
 const layout=FIRST_APPROVED_GYM_LAYOUTS[id];
 if(!layout)return null;
 if(!Number.isInteger(total)||total!==13+layout.stage*2)
  throw new RangeError('Unexpected native checkpoint total for gym stage');
 return {
  stage:layout.stage,leader:layout.leader,ace:layout.ace,
  artworkOnly:layout.artworkOnly===true,
  trainers:layout.trainers.map((marker,i)=>({...marker,index:total-layout.trainers.length+i}))
 };
}
